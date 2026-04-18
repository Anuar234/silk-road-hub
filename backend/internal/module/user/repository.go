package user

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

type UserRow struct {
	ID                 string   `json:"id"`
	Email              string   `json:"email"`
	DisplayName        string   `json:"displayName"`
	Role               string   `json:"role"`
	Verified           bool     `json:"verified"`
	EmailVerified      bool     `json:"emailVerified"`
	CompanyName        string   `json:"companyName,omitempty"`
	BIN                string   `json:"bin,omitempty"`
	Position           string   `json:"position,omitempty"`
	Phone              string   `json:"phone,omitempty"`
	VerificationStatus string   `json:"verificationStatus"`
	CompanyDocs        []string `json:"companyDocs"`
}

const userSelectColumns = `u.id, u.email, u.display_name, u.role, u.verified, u.email_verified,
		u.company_name, u.bin, u.position, u.phone, u.verification_status,
		COALESCE(
			(SELECT array_agg(file_id::text ORDER BY attached_at)
			 FROM user_company_docs WHERE user_id = u.id),
			'{}'::text[]
		) AS company_docs`

func scanUserRow(row interface{ Scan(dest ...any) error }, u *UserRow) error {
	return row.Scan(&u.ID, &u.Email, &u.DisplayName, &u.Role, &u.Verified, &u.EmailVerified,
		&u.CompanyName, &u.BIN, &u.Position, &u.Phone, &u.VerificationStatus, &u.CompanyDocs)
}

func (r *Repository) ListAll(ctx context.Context) ([]*UserRow, error) {
	rows, err := r.pool.Query(ctx, `SELECT `+userSelectColumns+` FROM users u ORDER BY u.created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("list users: %w", err)
	}
	defer rows.Close()

	var users []*UserRow
	for rows.Next() {
		var u UserRow
		if err := scanUserRow(rows, &u); err != nil {
			return nil, fmt.Errorf("scan user: %w", err)
		}
		users = append(users, &u)
	}
	return users, nil
}

func (r *Repository) GetByID(ctx context.Context, id string) (*UserRow, error) {
	var u UserRow
	err := scanUserRow(r.pool.QueryRow(ctx, `SELECT `+userSelectColumns+` FROM users u WHERE u.id = $1`, id), &u)
	if err != nil {
		return nil, fmt.Errorf("get user by id: %w", err)
	}
	return &u, nil
}

func (r *Repository) UpdateRole(ctx context.Context, id, role string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE users SET role = $1, updated_at = NOW()
		WHERE id = $2`, role, id)
	if err != nil {
		return fmt.Errorf("update role: %w", err)
	}
	return nil
}

func (r *Repository) UpdateVerification(ctx context.Context, id string, status string) error {
	verified := status == "verified"
	_, err := r.pool.Exec(ctx, `
		UPDATE users SET verification_status = $1, verified = $2, updated_at = NOW()
		WHERE id = $3`, status, verified, id)
	return err
}

func (r *Repository) AddCompanyDoc(ctx context.Context, userID, fileID string) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO user_company_docs (user_id, file_id) VALUES ($1, $2)`, userID, fileID)
	return err
}

func (r *Repository) UserExists(ctx context.Context, id string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)`, id).Scan(&exists)
	return exists, err
}
