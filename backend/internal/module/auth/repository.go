package auth

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) Create(ctx context.Context, u *User) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO users (id, email, password_hash, display_name, role, verified, email_verified,
			company_name, bin, position, phone, verification_status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
		u.ID, u.Email, u.PasswordHash, u.DisplayName, u.Role, u.Verified, u.EmailVerified,
		u.CompanyName, u.BIN, u.Position, u.Phone, u.VerificationStatus,
	)
	if err != nil {
		return fmt.Errorf("create user: %w", err)
	}
	return nil
}

func (r *Repository) GetByEmail(ctx context.Context, email string) (*User, error) {
	return r.scanOne(ctx, `SELECT * FROM users WHERE email = $1`, email)
}

func (r *Repository) GetByID(ctx context.Context, id string) (*User, error) {
	return r.scanOne(ctx, `SELECT * FROM users WHERE id = $1`, id)
}

func (r *Repository) List(ctx context.Context) ([]*User, error) {
	rows, err := r.pool.Query(ctx, `SELECT * FROM users ORDER BY created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("list users: %w", err)
	}
	defer rows.Close()

	var users []*User
	for rows.Next() {
		u, err := scanUser(rows)
		if err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

func (r *Repository) UpdateProfile(ctx context.Context, id string, updates *ProfileUpdates) error {
	sets := []string{}
	args := []any{}
	i := 1
	if updates.DisplayName != nil {
		sets = append(sets, fmt.Sprintf("display_name = $%d", i))
		args = append(args, *updates.DisplayName)
		i++
	}
	if updates.Phone != nil {
		sets = append(sets, fmt.Sprintf("phone = $%d", i))
		args = append(args, *updates.Phone)
		i++
	}
	if updates.CompanyName != nil {
		sets = append(sets, fmt.Sprintf("company_name = $%d", i))
		args = append(args, *updates.CompanyName)
		i++
	}
	if updates.BIN != nil {
		sets = append(sets, fmt.Sprintf("bin = $%d", i))
		args = append(args, *updates.BIN)
		i++
	}
	if updates.Position != nil {
		sets = append(sets, fmt.Sprintf("position = $%d", i))
		args = append(args, *updates.Position)
		i++
	}
	if len(sets) == 0 {
		return nil
	}
	sets = append(sets, "updated_at = NOW()")
	query := fmt.Sprintf("UPDATE users SET %s WHERE id = $%d", strings.Join(sets, ", "), i)
	args = append(args, id)
	if _, err := r.pool.Exec(ctx, query, args...); err != nil {
		return fmt.Errorf("update profile: %w", err)
	}
	return nil
}

// CreateEmailVerificationToken stores a freshly minted token. Caller is
// expected to invalidate any prior tokens for the same user separately when
// re-issuing on resend.
func (r *Repository) CreateEmailVerificationToken(ctx context.Context, token, userID string, expiresAt time.Time) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO email_verification_tokens (token, user_id, expires_at)
		VALUES ($1, $2, $3)`,
		token, userID, expiresAt,
	)
	if err != nil {
		return fmt.Errorf("create email verification token: %w", err)
	}
	return nil
}

// FindEmailVerificationToken returns the token row only if it exists, has not
// been consumed, and has not expired.
func (r *Repository) FindEmailVerificationToken(ctx context.Context, token string) (string, error) {
	var userID string
	err := r.pool.QueryRow(ctx, `
		SELECT user_id FROM email_verification_tokens
		WHERE token = $1
		  AND consumed_at IS NULL
		  AND expires_at > NOW()`,
		token,
	).Scan(&userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return "", nil
		}
		return "", fmt.Errorf("find email verification token: %w", err)
	}
	return userID, nil
}

// ConsumeEmailVerificationTokenAndVerify atomically marks the token used and
// flips the user's email_verified flag. Done in a transaction so a partial
// failure cannot leave a token consumed without the user being verified.
func (r *Repository) ConsumeEmailVerificationTokenAndVerify(ctx context.Context, token string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var userID string
	err = tx.QueryRow(ctx, `
		UPDATE email_verification_tokens SET consumed_at = NOW()
		WHERE token = $1 AND consumed_at IS NULL AND expires_at > NOW()
		RETURNING user_id`,
		token,
	).Scan(&userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return fmt.Errorf("token invalid or expired")
		}
		return fmt.Errorf("consume token: %w", err)
	}

	if _, err := tx.Exec(ctx, `
		UPDATE users SET email_verified = TRUE, updated_at = NOW()
		WHERE id = $1`, userID,
	); err != nil {
		return fmt.Errorf("mark email verified: %w", err)
	}

	return tx.Commit(ctx)
}

// InvalidateUserVerificationTokens marks every outstanding token for the user
// as consumed; called before re-issuing so only the latest token is usable.
func (r *Repository) InvalidateUserVerificationTokens(ctx context.Context, userID string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE email_verification_tokens SET consumed_at = NOW()
		WHERE user_id = $1 AND consumed_at IS NULL`, userID,
	)
	if err != nil {
		return fmt.Errorf("invalidate verification tokens: %w", err)
	}
	return nil
}

func (r *Repository) UpdateVerification(ctx context.Context, id string, status string) error {
	verified := status == "verified"
	_, err := r.pool.Exec(ctx, `
		UPDATE users SET verification_status = $1, verified = $2, updated_at = NOW()
		WHERE id = $3`, status, verified, id)
	if err != nil {
		return fmt.Errorf("update verification: %w", err)
	}
	return nil
}

// GetRole returns the role of a user by ID. Used by other modules (e.g.
// messaging) that need to validate a counterpart's role without pulling the
// full user record. Returns ("", error) if no row exists.
func (r *Repository) GetRole(ctx context.Context, userID string) (string, error) {
	var role string
	err := r.pool.QueryRow(ctx, `SELECT role FROM users WHERE id = $1`, userID).Scan(&role)
	if err != nil {
		return "", fmt.Errorf("get role: %w", err)
	}
	return role, nil
}

func (r *Repository) EmailExists(ctx context.Context, email string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`, email).Scan(&exists)
	return exists, err
}

func (r *Repository) GetCompanyDocs(ctx context.Context, userID string) ([]string, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT file_id::text FROM user_company_docs
		WHERE user_id = $1 ORDER BY attached_at`, userID)
	if err != nil {
		return nil, fmt.Errorf("query company docs: %w", err)
	}
	defer rows.Close()

	docs := []string{}
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, fmt.Errorf("scan company doc: %w", err)
		}
		docs = append(docs, id)
	}
	return docs, nil
}

func (r *Repository) scanOne(ctx context.Context, sql string, args ...any) (*User, error) {
	row, err := r.pool.Query(ctx, sql, args...)
	if err != nil {
		return nil, fmt.Errorf("query user: %w", err)
	}
	defer row.Close()

	if !row.Next() {
		return nil, nil
	}
	return scanUser(row)
}

func scanUser(row pgx.Row) (*User, error) {
	var u User
	err := row.Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.DisplayName, &u.Role,
		&u.Verified, &u.EmailVerified, &u.CompanyName, &u.BIN,
		&u.Position, &u.Phone, &u.VerificationStatus,
		&u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("scan user: %w", err)
	}
	return &u, nil
}
