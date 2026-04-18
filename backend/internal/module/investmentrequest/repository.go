package investmentrequest

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) Create(ctx context.Context, req *Request) error {
	if req.ID == "" {
		req.ID = uuid.NewString()
	}
	_, err := r.pool.Exec(ctx, `
		INSERT INTO investment_requests (id, project_id, investor_id, amount_usd, message, status)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		req.ID, req.ProjectID, req.InvestorID, req.AmountUSD, req.Message, req.Status,
	)
	if err != nil {
		return fmt.Errorf("insert investment request: %w", err)
	}
	return nil
}

func (r *Repository) ListByInvestor(ctx context.Context, investorID string) ([]*Request, error) {
	return r.query(ctx, `
		SELECT id, project_id, investor_id, amount_usd, message, status, created_at, updated_at
		FROM investment_requests WHERE investor_id = $1 ORDER BY created_at DESC`, investorID)
}

func (r *Repository) ListByProject(ctx context.Context, projectID string) ([]*Request, error) {
	return r.query(ctx, `
		SELECT id, project_id, investor_id, amount_usd, message, status, created_at, updated_at
		FROM investment_requests WHERE project_id = $1 ORDER BY created_at DESC`, projectID)
}

func (r *Repository) ListAll(ctx context.Context) ([]*Request, error) {
	return r.query(ctx, `
		SELECT id, project_id, investor_id, amount_usd, message, status, created_at, updated_at
		FROM investment_requests ORDER BY created_at DESC LIMIT 500`)
}

func (r *Repository) UpdateStatus(ctx context.Context, id, status string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE investment_requests SET status = $1, updated_at = NOW()
		WHERE id = $2`, status, id)
	if err != nil {
		return fmt.Errorf("update investment request status: %w", err)
	}
	return nil
}

func (r *Repository) query(ctx context.Context, sql string, args ...any) ([]*Request, error) {
	rows, err := r.pool.Query(ctx, sql, args...)
	if err != nil {
		return nil, fmt.Errorf("query investment requests: %w", err)
	}
	defer rows.Close()

	out := []*Request{}
	for rows.Next() {
		var rq Request
		if err := rows.Scan(&rq.ID, &rq.ProjectID, &rq.InvestorID, &rq.AmountUSD,
			&rq.Message, &rq.Status, &rq.CreatedAt, &rq.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan investment request: %w", err)
		}
		out = append(out, &rq)
	}
	return out, nil
}
