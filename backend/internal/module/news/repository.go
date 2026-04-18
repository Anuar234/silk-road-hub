package news

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrNotFound = errors.New("news article not found")

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) Create(ctx context.Context, a *Article) error {
	if a.ID == "" {
		a.ID = uuid.NewString()
	}
	_, err := r.pool.Exec(ctx, `
		INSERT INTO news (id, slug, title, summary, body, cover_file_id, status, author_id, tags, published_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
		a.ID, a.Slug, a.Title, a.Summary, a.Body, a.CoverFileID, a.Status, a.AuthorID, a.Tags, a.PublishedAt,
	)
	if err != nil {
		return fmt.Errorf("insert news: %w", err)
	}
	return nil
}

func (r *Repository) GetByID(ctx context.Context, id string) (*Article, error) {
	return r.one(ctx, `SELECT * FROM news WHERE id = $1`, id)
}

func (r *Repository) GetBySlug(ctx context.Context, slug string) (*Article, error) {
	return r.one(ctx, `SELECT * FROM news WHERE slug = $1`, slug)
}

func (r *Repository) SlugExists(ctx context.Context, slug string, excludeID string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM news WHERE slug = $1 AND ($2 = '' OR id::text <> $2))`, slug, excludeID,
	).Scan(&exists)
	return exists, err
}

func (r *Repository) List(ctx context.Context, f *ListFilter) ([]*Article, error) {
	conds := []string{}
	args := []any{}
	i := 1
	if f.Status != "" {
		conds = append(conds, fmt.Sprintf("status = $%d", i))
		args = append(args, f.Status)
		i++
	}
	if f.Tag != "" {
		conds = append(conds, fmt.Sprintf("$%d = ANY(tags)", i))
		args = append(args, f.Tag)
		i++
	}
	where := ""
	if len(conds) > 0 {
		where = "WHERE " + strings.Join(conds, " AND ")
	}
	limit := f.Limit
	if limit <= 0 || limit > 500 {
		limit = 50
	}
	args = append(args, limit, f.Offset)
	query := fmt.Sprintf(`
		SELECT * FROM news %s
		ORDER BY COALESCE(published_at, created_at) DESC
		LIMIT $%d OFFSET $%d`, where, i, i+1)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list news: %w", err)
	}
	defer rows.Close()

	out := []*Article{}
	for rows.Next() {
		a, err := scan(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, nil
}

func (r *Repository) Update(ctx context.Context, id string, sets map[string]any) error {
	if len(sets) == 0 {
		return nil
	}
	cols := []string{}
	args := []any{}
	i := 1
	for k, v := range sets {
		cols = append(cols, fmt.Sprintf("%s = $%d", k, i))
		args = append(args, v)
		i++
	}
	cols = append(cols, "updated_at = NOW()")
	args = append(args, id)
	query := fmt.Sprintf(`UPDATE news SET %s WHERE id = $%d`, strings.Join(cols, ", "), i)
	_, err := r.pool.Exec(ctx, query, args...)
	return err
}

func (r *Repository) Delete(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM news WHERE id = $1`, id)
	return err
}

func (r *Repository) one(ctx context.Context, sql string, args ...any) (*Article, error) {
	rows, err := r.pool.Query(ctx, sql, args...)
	if err != nil {
		return nil, fmt.Errorf("query news: %w", err)
	}
	defer rows.Close()
	if !rows.Next() {
		return nil, ErrNotFound
	}
	return scan(rows)
}

func scan(row pgx.Row) (*Article, error) {
	var a Article
	err := row.Scan(
		&a.ID, &a.Slug, &a.Title, &a.Summary, &a.Body,
		&a.CoverFileID, &a.Status, &a.AuthorID, &a.Tags,
		&a.PublishedAt, &a.CreatedAt, &a.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("scan news: %w", err)
	}
	return &a, nil
}
