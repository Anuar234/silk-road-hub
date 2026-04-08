package shipment

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

func (r *Repository) Create(ctx context.Context, s *Shipment) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO shipments (id, deal_id, origin, destination, route_name, stages, document_ids)
		VALUES ($1,$2,$3,$4,$5,$6,$7)`,
		s.ID, s.DealID, s.Origin, s.Destination, s.RouteName, s.Stages, s.DocumentIDs,
	)
	return err
}

func (r *Repository) GetByID(ctx context.Context, id string) (*Shipment, error) {
	var s Shipment
	err := r.pool.QueryRow(ctx, `SELECT * FROM shipments WHERE id = $1`, id).Scan(
		&s.ID, &s.DealID, &s.Origin, &s.Destination, &s.RouteName,
		&s.Stages, &s.DocumentIDs, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *Repository) ListByDeal(ctx context.Context, dealID string) ([]*Shipment, error) {
	return r.list(ctx, sq.Eq{"deal_id": dealID})
}

func (r *Repository) ListAll(ctx context.Context) ([]*Shipment, error) {
	return r.list(ctx, nil)
}

func (r *Repository) Update(ctx context.Context, id string, sets map[string]any) error {
	if len(sets) == 0 {
		return nil
	}
	sets["updated_at"] = sq.Expr("NOW()")

	q := psql.Update("shipments").SetMap(sets).Where(sq.Eq{"id": id})
	sql, args, err := q.ToSql()
	if err != nil {
		return err
	}
	_, err = r.pool.Exec(ctx, sql, args...)
	return err
}

func (r *Repository) GetRouteTemplate(ctx context.Context, id string) (*RouteTemplate, error) {
	var rt RouteTemplate
	err := r.pool.QueryRow(ctx,
		`SELECT id, name, origin, destination, stages FROM route_templates WHERE id = $1`, id,
	).Scan(&rt.ID, &rt.Name, &rt.Origin, &rt.Destination, &rt.Stages)
	if err != nil {
		return nil, err
	}
	return &rt, nil
}

func (r *Repository) list(ctx context.Context, where sq.Eq) ([]*Shipment, error) {
	q := psql.Select("*").From("shipments").OrderBy("created_at DESC")
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

	var shipments []*Shipment
	for rows.Next() {
		var s Shipment
		if err := rows.Scan(
			&s.ID, &s.DealID, &s.Origin, &s.Destination, &s.RouteName,
			&s.Stages, &s.DocumentIDs, &s.CreatedAt, &s.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan shipment: %w", err)
		}
		shipments = append(shipments, &s)
	}
	return shipments, nil
}
