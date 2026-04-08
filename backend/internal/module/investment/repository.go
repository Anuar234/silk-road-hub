package investment

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

func (r *Repository) Create(ctx context.Context, p *Project) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO investment_projects (id, title, description, sector, region_code, volume_usd,
			stage, source, initiator, contact_email, document_ids, tags)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
		p.ID, p.Title, p.Description, p.Sector, p.RegionCode, p.VolumeUSD,
		p.Stage, p.Source, p.Initiator, p.ContactEmail, p.DocumentIDs, p.Tags,
	)
	return err
}

func (r *Repository) GetByID(ctx context.Context, id string) (*Project, error) {
	var p Project
	err := r.pool.QueryRow(ctx, `SELECT * FROM investment_projects WHERE id = $1`, id).Scan(
		&p.ID, &p.Title, &p.Description, &p.Sector, &p.RegionCode, &p.VolumeUSD,
		&p.Stage, &p.Source, &p.Initiator, &p.ContactEmail, &p.DocumentIDs, &p.Tags,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *Repository) List(ctx context.Context) ([]*Project, error) {
	rows, err := r.pool.Query(ctx, `SELECT * FROM investment_projects ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []*Project
	for rows.Next() {
		var p Project
		if err := rows.Scan(
			&p.ID, &p.Title, &p.Description, &p.Sector, &p.RegionCode, &p.VolumeUSD,
			&p.Stage, &p.Source, &p.Initiator, &p.ContactEmail, &p.DocumentIDs, &p.Tags,
			&p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan investment: %w", err)
		}
		projects = append(projects, &p)
	}
	return projects, nil
}

func (r *Repository) Update(ctx context.Context, id string, sets map[string]any) error {
	if len(sets) == 0 {
		return nil
	}
	sets["updated_at"] = sq.Expr("NOW()")

	q := psql.Update("investment_projects").SetMap(sets).Where(sq.Eq{"id": id})
	sql, args, err := q.ToSql()
	if err != nil {
		return err
	}
	_, err = r.pool.Exec(ctx, sql, args...)
	return err
}
