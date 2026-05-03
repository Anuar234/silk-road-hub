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

// Explicit column lists keep us safe from accidental Scan misalignment when
// columns are added in future migrations (e.g. created_by added in 000021).
const investmentColumns = `id, title, description, sector, region_code, volume_usd,
	stage, source, initiator, contact_email, document_ids, tags,
	created_at, updated_at, created_by`

func scanProject(row interface {
	Scan(dest ...any) error
}) (*Project, error) {
	var p Project
	if err := row.Scan(
		&p.ID, &p.Title, &p.Description, &p.Sector, &p.RegionCode, &p.VolumeUSD,
		&p.Stage, &p.Source, &p.Initiator, &p.ContactEmail, &p.DocumentIDs, &p.Tags,
		&p.CreatedAt, &p.UpdatedAt, &p.CreatedBy,
	); err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *Repository) Create(ctx context.Context, p *Project) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO investment_projects (id, title, description, sector, region_code, volume_usd,
			stage, source, initiator, contact_email, document_ids, tags, created_by)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
		p.ID, p.Title, p.Description, p.Sector, p.RegionCode, p.VolumeUSD,
		p.Stage, p.Source, p.Initiator, p.ContactEmail, p.DocumentIDs, p.Tags,
		p.CreatedBy,
	)
	return err
}

func (r *Repository) GetByID(ctx context.Context, id string) (*Project, error) {
	row := r.pool.QueryRow(ctx, `SELECT `+investmentColumns+` FROM investment_projects WHERE id = $1`, id)
	return scanProject(row)
}

func (r *Repository) List(ctx context.Context) ([]*Project, error) {
	return r.queryProjects(ctx, `SELECT `+investmentColumns+` FROM investment_projects ORDER BY created_at DESC`)
}

// ListByOwner returns only projects created by the given user (used by the
// investor cabinet). Admin views still go through List.
func (r *Repository) ListByOwner(ctx context.Context, ownerID string) ([]*Project, error) {
	return r.queryProjects(ctx,
		`SELECT `+investmentColumns+` FROM investment_projects WHERE created_by = $1 ORDER BY created_at DESC`,
		ownerID,
	)
}

func (r *Repository) queryProjects(ctx context.Context, sql string, args ...any) ([]*Project, error) {
	rows, err := r.pool.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	projects := make([]*Project, 0)
	for rows.Next() {
		p, err := scanProject(rows)
		if err != nil {
			return nil, fmt.Errorf("scan investment: %w", err)
		}
		projects = append(projects, p)
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
