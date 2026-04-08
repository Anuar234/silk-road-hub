package deal

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

// --- Payment Plans ---

func (r *Repository) GetPaymentPlan(ctx context.Context, dealID string) (*PaymentPlan, error) {
	var p PaymentPlan
	err := r.pool.QueryRow(ctx,
		`SELECT id, deal_id, total_usd, created_at FROM payment_plans WHERE deal_id = $1`, dealID,
	).Scan(&p.ID, &p.DealID, &p.TotalUSD, &p.CreatedAt)
	if err != nil {
		return nil, err
	}

	stages, err := r.getPaymentStages(ctx, p.ID)
	if err != nil {
		return nil, err
	}
	p.Stages = stages
	return &p, nil
}

func (r *Repository) CreatePaymentPlan(ctx context.Context, p *PaymentPlan) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO payment_plans (id, deal_id, total_usd) VALUES ($1, $2, $3)`,
		p.ID, p.DealID, p.TotalUSD,
	)
	if err != nil {
		return fmt.Errorf("create payment plan: %w", err)
	}

	for i, s := range p.Stages {
		_, err := r.pool.Exec(ctx, `
			INSERT INTO payment_stages (id, plan_id, label, percentage, amount_usd, status, sort_order)
			VALUES ($1, $2, $3, $4, $5, $6, $7)`,
			s.ID, p.ID, s.Label, s.Percentage, s.AmountUSD, s.Status, i,
		)
		if err != nil {
			return fmt.Errorf("create payment stage: %w", err)
		}
	}
	return nil
}

func (r *Repository) UpdatePaymentStage(ctx context.Context, stageID string, status *string, dueDate *string, paidAt *string) error {
	if status != nil {
		if _, err := r.pool.Exec(ctx, `UPDATE payment_stages SET status = $1 WHERE id = $2`, *status, stageID); err != nil {
			return err
		}
	}
	if dueDate != nil {
		if _, err := r.pool.Exec(ctx, `UPDATE payment_stages SET due_date = $1 WHERE id = $2`, *dueDate, stageID); err != nil {
			return err
		}
	}
	if paidAt != nil {
		if _, err := r.pool.Exec(ctx, `UPDATE payment_stages SET paid_at = $1 WHERE id = $2`, *paidAt, stageID); err != nil {
			return err
		}
	}
	return nil
}

func (r *Repository) getPaymentStages(ctx context.Context, planID string) ([]PaymentStage, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, plan_id, label, percentage, amount_usd, status, due_date, paid_at, sort_order
		FROM payment_stages WHERE plan_id = $1 ORDER BY sort_order`, planID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stages []PaymentStage
	for rows.Next() {
		var s PaymentStage
		if err := rows.Scan(&s.ID, &s.PlanID, &s.Label, &s.Percentage, &s.AmountUSD,
			&s.Status, &s.DueDate, &s.PaidAt, &s.SortOrder); err != nil {
			return nil, fmt.Errorf("scan payment stage: %w", err)
		}
		stages = append(stages, s)
	}
	return stages, nil
}

// --- Guarantees ---

func (r *Repository) GetGuarantees(ctx context.Context, dealID string) ([]*Guarantee, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, deal_id, type, provider, enabled, notes FROM deal_guarantees WHERE deal_id = $1`, dealID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var guarantees []*Guarantee
	for rows.Next() {
		var g Guarantee
		if err := rows.Scan(&g.ID, &g.DealID, &g.Type, &g.Provider, &g.Enabled, &g.Notes); err != nil {
			return nil, fmt.Errorf("scan guarantee: %w", err)
		}
		guarantees = append(guarantees, &g)
	}
	return guarantees, nil
}

func (r *Repository) SetGuarantee(ctx context.Context, g *Guarantee) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO deal_guarantees (id, deal_id, type, provider, enabled, notes)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (deal_id, type) DO UPDATE SET enabled = $5, notes = $6`,
		g.ID, g.DealID, g.Type, g.Provider, g.Enabled, g.Notes,
	)
	return err
}
