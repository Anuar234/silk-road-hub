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
	ID                 string `json:"id"`
	Email              string `json:"email"`
	DisplayName        string `json:"displayName"`
	Role               string `json:"role"`
	Verified           bool   `json:"verified"`
	CompanyName        string `json:"companyName,omitempty"`
	BIN                string `json:"bin,omitempty"`
	Phone              string `json:"phone,omitempty"`
	VerificationStatus string `json:"verificationStatus"`
}

func (r *Repository) ListAll(ctx context.Context) ([]*UserRow, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, email, display_name, role, verified, company_name, bin, phone, verification_status
		FROM users ORDER BY created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("list users: %w", err)
	}
	defer rows.Close()

	var users []*UserRow
	for rows.Next() {
		var u UserRow
		if err := rows.Scan(&u.ID, &u.Email, &u.DisplayName, &u.Role, &u.Verified,
			&u.CompanyName, &u.BIN, &u.Phone, &u.VerificationStatus); err != nil {
			return nil, fmt.Errorf("scan user: %w", err)
		}
		users = append(users, &u)
	}
	return users, nil
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
