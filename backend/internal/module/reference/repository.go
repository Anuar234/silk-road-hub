package reference

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

func (r *Repository) ListCountries(ctx context.Context) ([]*Country, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT code, name_ru, name_en, sort_order, is_active
		FROM countries WHERE is_active = TRUE ORDER BY sort_order, name_ru`)
	if err != nil {
		return nil, fmt.Errorf("list countries: %w", err)
	}
	defer rows.Close()

	out := []*Country{}
	for rows.Next() {
		var c Country
		if err := rows.Scan(&c.Code, &c.NameRU, &c.NameEN, &c.SortOrder, &c.IsActive); err != nil {
			return nil, fmt.Errorf("scan country: %w", err)
		}
		out = append(out, &c)
	}
	return out, nil
}

func (r *Repository) ListRegions(ctx context.Context, countryCode string) ([]*Region, error) {
	query := `SELECT code, country_code, name_ru, name_en, sort_order, is_active
		FROM regions WHERE is_active = TRUE`
	args := []any{}
	if countryCode != "" {
		query += ` AND country_code = $1`
		args = append(args, countryCode)
	}
	query += ` ORDER BY sort_order, name_ru`

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list regions: %w", err)
	}
	defer rows.Close()

	out := []*Region{}
	for rows.Next() {
		var rg Region
		if err := rows.Scan(&rg.Code, &rg.CountryCode, &rg.NameRU, &rg.NameEN, &rg.SortOrder, &rg.IsActive); err != nil {
			return nil, fmt.Errorf("scan region: %w", err)
		}
		out = append(out, &rg)
	}
	return out, nil
}

func (r *Repository) ListCategories(ctx context.Context) ([]*Category, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, name_ru, name_en, icon, sort_order, is_active
		FROM categories WHERE is_active = TRUE ORDER BY sort_order, name_ru`)
	if err != nil {
		return nil, fmt.Errorf("list categories: %w", err)
	}
	defer rows.Close()

	out := []*Category{}
	for rows.Next() {
		var c Category
		if err := rows.Scan(&c.ID, &c.NameRU, &c.NameEN, &c.Icon, &c.SortOrder, &c.IsActive); err != nil {
			return nil, fmt.Errorf("scan category: %w", err)
		}
		out = append(out, &c)
	}
	return out, nil
}
