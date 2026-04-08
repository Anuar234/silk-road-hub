package product

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

func (r *Repository) Create(ctx context.Context, p *Product) error {
	return r.pool.QueryRow(ctx, `
		INSERT INTO products (id, slug, name, category, hs_code, moq, incoterms, price,
			lead_time_days, packaging, description, image_urls, seller_id, country_code,
			region_code, sector_id, subcategory_id, tags, samples_available, private_label, status)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
		RETURNING created_at, updated_at`,
		p.ID, p.Slug, p.Name, p.Category, p.HSCode, p.MOQ, p.Incoterms, p.Price,
		p.LeadTimeDays, p.Packaging, p.Description, p.ImageURLs, p.SellerID, p.CountryCode,
		p.RegionCode, p.SectorID, p.SubcategoryID, p.Tags, p.SamplesAvailable, p.PrivateLabel, p.Status,
	).Scan(&p.CreatedAt, &p.UpdatedAt)
}

func (r *Repository) GetByID(ctx context.Context, id string) (*Product, error) {
	return r.queryOne(ctx, psql.Select("*").From("products").Where(sq.Eq{"id": id}))
}

func (r *Repository) List(ctx context.Context, f ListFilter) ([]*Product, error) {
	q := psql.Select("*").From("products").OrderBy("created_at DESC")

	if f.Status != "" {
		q = q.Where(sq.Eq{"status": f.Status})
	}
	if f.SellerID != "" {
		q = q.Where(sq.Eq{"seller_id": f.SellerID})
	}
	if f.SectorID != "" {
		q = q.Where(sq.Eq{"sector_id": f.SectorID})
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

	var products []*Product
	for rows.Next() {
		p, err := scanProduct(rows)
		if err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, nil
}

func (r *Repository) Update(ctx context.Context, id string, sets map[string]any) error {
	if len(sets) == 0 {
		return nil
	}
	sets["updated_at"] = sq.Expr("NOW()")

	q := psql.Update("products").SetMap(sets).Where(sq.Eq{"id": id})
	sql, args, err := q.ToSql()
	if err != nil {
		return err
	}

	_, err = r.pool.Exec(ctx, sql, args...)
	return err
}

func (r *Repository) Delete(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM products WHERE id = $1`, id)
	return err
}

func (r *Repository) queryOne(ctx context.Context, b sq.SelectBuilder) (*Product, error) {
	sql, args, err := b.ToSql()
	if err != nil {
		return nil, err
	}
	rows, err := r.pool.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	if !rows.Next() {
		return nil, nil
	}
	return scanProduct(rows)
}

func scanProduct(row interface{ Scan(dest ...any) error }) (*Product, error) {
	var p Product
	err := row.Scan(
		&p.ID, &p.Slug, &p.Name, &p.Category, &p.HSCode, &p.MOQ, &p.Incoterms, &p.Price,
		&p.LeadTimeDays, &p.Packaging, &p.Description, &p.ImageURLs, &p.SellerID, &p.CountryCode,
		&p.RegionCode, &p.SectorID, &p.SubcategoryID, &p.Tags, &p.SamplesAvailable, &p.PrivateLabel,
		&p.Status, &p.ModerationComment, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("scan product: %w", err)
	}
	return &p, nil
}
