package rfq

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var psql = sq.StatementBuilder.PlaceholderFormat(sq.Dollar)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

const rfqSelect = `
	SELECT r.id, r.buyer_id, r.title, r.description, r.sector_id, r.subcategory_id,
	       r.target_country, r.quantity, r.budget_usd, r.target_date, r.incoterms,
	       r.notes, r.status, r.admin_notes, r.created_at, r.updated_at,
	       buyer.display_name, buyer.email
	FROM rfqs r
	LEFT JOIN users buyer ON buyer.id = r.buyer_id
`

func scanRfq(row interface{ Scan(dest ...any) error }) (*Rfq, error) {
	var r Rfq
	var targetDate *time.Time
	if err := row.Scan(
		&r.ID, &r.BuyerID, &r.Title, &r.Description, &r.SectorID, &r.SubcategoryID,
		&r.TargetCountry, &r.Quantity, &r.BudgetUSD, &targetDate, &r.Incoterms,
		&r.Notes, &r.Status, &r.AdminNotes, &r.CreatedAt, &r.UpdatedAt,
		&r.BuyerName, &r.BuyerEmail,
	); err != nil {
		return nil, err
	}
	r.TargetDate = targetDate
	return &r, nil
}

func (r *Repository) Create(ctx context.Context, in *Rfq) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO rfqs (id, buyer_id, title, description, sector_id, subcategory_id,
			target_country, quantity, budget_usd, target_date, incoterms, notes, status, admin_notes)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
		in.ID, in.BuyerID, in.Title, in.Description, in.SectorID, in.SubcategoryID,
		in.TargetCountry, in.Quantity, in.BudgetUSD, in.TargetDate, in.Incoterms,
		in.Notes, in.Status, in.AdminNotes,
	)
	if err != nil {
		return fmt.Errorf("create rfq: %w", err)
	}
	return nil
}

func (r *Repository) GetByID(ctx context.Context, id string) (*Rfq, error) {
	row := r.pool.QueryRow(ctx, rfqSelect+` WHERE r.id = $1`, id)
	rfq, err := scanRfq(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get rfq: %w", err)
	}
	return rfq, nil
}

// ListFilter narrows the listing. BuyerID and SellerID are mutually exclusive
// at the call site: the service decides which to apply based on caller role.
type ListFilter struct {
	BuyerID  string
	SellerID string // when set, return only RFQs the seller is matched to
	Status   string // optional
}

func (r *Repository) List(ctx context.Context, f ListFilter) ([]*Rfq, error) {
	query := psql.Select(`r.id, r.buyer_id, r.title, r.description, r.sector_id, r.subcategory_id,
		r.target_country, r.quantity, r.budget_usd, r.target_date, r.incoterms,
		r.notes, r.status, r.admin_notes, r.created_at, r.updated_at,
		buyer.display_name, buyer.email`).
		From("rfqs r").
		LeftJoin("users buyer ON buyer.id = r.buyer_id").
		OrderBy("r.created_at DESC")

	if f.BuyerID != "" {
		query = query.Where(sq.Eq{"r.buyer_id": f.BuyerID})
	}
	if f.SellerID != "" {
		query = query.
			Join("rfq_matches m ON m.rfq_id = r.id").
			Where(sq.Eq{"m.seller_id": f.SellerID})
	}
	if f.Status != "" {
		query = query.Where(sq.Eq{"r.status": f.Status})
	}

	sql, args, err := query.ToSql()
	if err != nil {
		return nil, err
	}

	rows, err := r.pool.Query(ctx, sql, args...)
	if err != nil {
		return nil, fmt.Errorf("list rfqs: %w", err)
	}
	defer rows.Close()

	out := make([]*Rfq, 0)
	for rows.Next() {
		rfq, err := scanRfq(rows)
		if err != nil {
			return nil, fmt.Errorf("scan rfq: %w", err)
		}
		out = append(out, rfq)
	}
	return out, nil
}

func (r *Repository) Update(ctx context.Context, id string, sets map[string]any) error {
	if len(sets) == 0 {
		return nil
	}
	sets["updated_at"] = sq.Expr("NOW()")
	query := psql.Update("rfqs").SetMap(sets).Where(sq.Eq{"id": id})
	sql, args, err := query.ToSql()
	if err != nil {
		return err
	}
	if _, err := r.pool.Exec(ctx, sql, args...); err != nil {
		return fmt.Errorf("update rfq: %w", err)
	}
	return nil
}

const matchSelect = `
	SELECT m.id, m.rfq_id, m.seller_id, m.note, m.thread_id, m.created_by, m.created_at,
	       seller.display_name, seller.company_name, seller.email
	FROM rfq_matches m
	LEFT JOIN users seller ON seller.id = m.seller_id
`

func scanMatch(row interface{ Scan(dest ...any) error }) (*Match, error) {
	var m Match
	if err := row.Scan(
		&m.ID, &m.RfqID, &m.SellerID, &m.Note, &m.ThreadID, &m.CreatedBy, &m.CreatedAt,
		&m.SellerName, &m.SellerCompany, &m.SellerEmail,
	); err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *Repository) ListMatches(ctx context.Context, rfqID string) ([]Match, error) {
	rows, err := r.pool.Query(ctx, matchSelect+` WHERE m.rfq_id = $1 ORDER BY m.created_at DESC`, rfqID)
	if err != nil {
		return nil, fmt.Errorf("list matches: %w", err)
	}
	defer rows.Close()

	out := make([]Match, 0)
	for rows.Next() {
		m, err := scanMatch(rows)
		if err != nil {
			return nil, fmt.Errorf("scan match: %w", err)
		}
		out = append(out, *m)
	}
	return out, nil
}

func (r *Repository) AddMatch(ctx context.Context, m *Match) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO rfq_matches (id, rfq_id, seller_id, note, thread_id, created_by)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		m.ID, m.RfqID, m.SellerID, m.Note, m.ThreadID, m.CreatedBy,
	)
	if err != nil {
		// 23505 = unique_violation — same seller already matched to this RFQ
		if strings.Contains(err.Error(), "rfq_matches_rfq_id_seller_id_key") {
			return errors.New("этот продавец уже подобран к запросу")
		}
		return fmt.Errorf("add match: %w", err)
	}
	return nil
}

func (r *Repository) DeleteMatch(ctx context.Context, matchID string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM rfq_matches WHERE id = $1`, matchID)
	if err != nil {
		return fmt.Errorf("delete match: %w", err)
	}
	return nil
}

func (r *Repository) GetMatch(ctx context.Context, matchID string) (*Match, error) {
	row := r.pool.QueryRow(ctx, matchSelect+` WHERE m.id = $1`, matchID)
	m, err := scanMatch(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get match: %w", err)
	}
	return m, nil
}
