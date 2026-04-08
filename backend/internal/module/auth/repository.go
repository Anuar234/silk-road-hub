package auth

import (
	"context"
	"fmt"

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

func (r *Repository) EmailExists(ctx context.Context, email string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`, email).Scan(&exists)
	return exists, err
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
