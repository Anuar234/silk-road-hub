package contract

import (
	"context"
	"fmt"

	sq "github.com/Masterminds/squirrel"
	"github.com/jackc/pgx/v5/pgxpool"
)

var psql = sq.StatementBuilder.PlaceholderFormat(sq.Dollar)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) Create(ctx context.Context, c *Contract) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO contracts (id, deal_id, template_type, applicable_law, status, deadlines, notes)
		VALUES ($1,$2,$3,$4,$5,$6,$7)`,
		c.ID, c.DealID, c.TemplateType, c.ApplicableLaw, c.Status, c.Deadlines, c.Notes,
	)
	return err
}

func (r *Repository) GetByID(ctx context.Context, id string) (*Contract, error) {
	var c Contract
	err := r.pool.QueryRow(ctx, `SELECT * FROM contracts WHERE id = $1`, id).Scan(
		&c.ID, &c.DealID, &c.TemplateType, &c.ApplicableLaw, &c.Status,
		&c.SignedDocFileID, &c.Deadlines, &c.Notes, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *Repository) ListByDeal(ctx context.Context, dealID string) ([]*Contract, error) {
	return r.list(ctx, sq.Eq{"deal_id": dealID})
}

func (r *Repository) ListAll(ctx context.Context) ([]*Contract, error) {
	return r.list(ctx, nil)
}

func (r *Repository) Update(ctx context.Context, id string, sets map[string]any) error {
	if len(sets) == 0 {
		return nil
	}
	sets["updated_at"] = sq.Expr("NOW()")

	q := psql.Update("contracts").SetMap(sets).Where(sq.Eq{"id": id})
	sql, args, err := q.ToSql()
	if err != nil {
		return err
	}
	_, err = r.pool.Exec(ctx, sql, args...)
	return err
}

func (r *Repository) list(ctx context.Context, where sq.Eq) ([]*Contract, error) {
	q := psql.Select("*").From("contracts").OrderBy("created_at DESC")
	if where != nil {
		q = q.Where(where)
	}
	sql, args, err := q.ToSql()
	if err != nil {
		return nil, err
	}

	rows, err := r.pool.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var contracts []*Contract
	for rows.Next() {
		var c Contract
		if err := rows.Scan(
			&c.ID, &c.DealID, &c.TemplateType, &c.ApplicableLaw, &c.Status,
			&c.SignedDocFileID, &c.Deadlines, &c.Notes, &c.CreatedAt, &c.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan contract: %w", err)
		}
		contracts = append(contracts, &c)
	}
	return contracts, nil
}
