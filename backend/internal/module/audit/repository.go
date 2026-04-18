package audit

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) Insert(ctx context.Context, e *Entry) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO audit_log (user_id, method, path, status_code, ip_address, user_agent, duration_ms)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		e.UserID, e.Method, e.Path, e.StatusCode, e.IPAddress, e.UserAgent, e.DurationMs,
	)
	if err != nil {
		return fmt.Errorf("insert audit entry: %w", err)
	}
	return nil
}

func (r *Repository) List(ctx context.Context, f *ListFilters) ([]*Entry, error) {
	conds := []string{}
	args := []any{}
	i := 1
	if f.UserID != nil {
		conds = append(conds, fmt.Sprintf("user_id = $%d", i))
		args = append(args, *f.UserID)
		i++
	}
	if f.Method != nil {
		conds = append(conds, fmt.Sprintf("method = $%d", i))
		args = append(args, *f.Method)
		i++
	}
	if f.From != nil {
		conds = append(conds, fmt.Sprintf("created_at >= $%d", i))
		args = append(args, *f.From)
		i++
	}
	if f.To != nil {
		conds = append(conds, fmt.Sprintf("created_at <= $%d", i))
		args = append(args, *f.To)
		i++
	}

	where := ""
	if len(conds) > 0 {
		where = "WHERE " + strings.Join(conds, " AND ")
	}

	limit := f.Limit
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	args = append(args, limit, f.Offset)

	query := fmt.Sprintf(`
		SELECT id, user_id, method, path, status_code,
		       host(ip_address), user_agent, duration_ms, created_at
		FROM audit_log %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d`, where, i, i+1)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("query audit: %w", err)
	}
	defer rows.Close()

	var entries []*Entry
	for rows.Next() {
		var e Entry
		if err := rows.Scan(&e.ID, &e.UserID, &e.Method, &e.Path, &e.StatusCode,
			&e.IPAddress, &e.UserAgent, &e.DurationMs, &e.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan audit: %w", err)
		}
		entries = append(entries, &e)
	}
	return entries, nil
}
