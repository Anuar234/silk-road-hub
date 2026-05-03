package dealintent

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

const intentColumns = `id, deal_id, kind, title, summary, file_id, status,
	signed_by_buyer, signed_by_seller, signed_at, cancelled_at,
	created_by, created_at, updated_at`

func scanIntent(row interface{ Scan(dest ...any) error }) (*Intent, error) {
	var i Intent
	if err := row.Scan(
		&i.ID, &i.DealID, &i.Kind, &i.Title, &i.Summary, &i.FileID, &i.Status,
		&i.SignedByBuyer, &i.SignedBySeller, &i.SignedAt, &i.CancelledAt,
		&i.CreatedBy, &i.CreatedAt, &i.UpdatedAt,
	); err != nil {
		return nil, err
	}
	return &i, nil
}

func (r *Repository) Create(ctx context.Context, in *Intent) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO deal_intents (id, deal_id, kind, title, summary, file_id, status,
			signed_by_buyer, signed_by_seller, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		in.ID, in.DealID, in.Kind, in.Title, in.Summary, in.FileID, in.Status,
		in.SignedByBuyer, in.SignedBySeller, in.CreatedBy,
	)
	if err != nil {
		return fmt.Errorf("create intent: %w", err)
	}
	return nil
}

func (r *Repository) Get(ctx context.Context, id string) (*Intent, error) {
	row := r.pool.QueryRow(ctx, `SELECT `+intentColumns+` FROM deal_intents WHERE id = $1`, id)
	intent, err := scanIntent(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get intent: %w", err)
	}
	return intent, nil
}

func (r *Repository) ListForDeal(ctx context.Context, dealID string) ([]*Intent, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT `+intentColumns+` FROM deal_intents WHERE deal_id = $1 ORDER BY created_at DESC`,
		dealID,
	)
	if err != nil {
		return nil, fmt.Errorf("list intents: %w", err)
	}
	defer rows.Close()

	intents := make([]*Intent, 0)
	for rows.Next() {
		i, err := scanIntent(rows)
		if err != nil {
			return nil, fmt.Errorf("scan intent: %w", err)
		}
		intents = append(intents, i)
	}
	return intents, nil
}

// MarkSigned flips the side flag for the caller and, if both sides have signed,
// promotes the intent to 'signed' and stamps signed_at. Returns the updated row
// so the caller can decide whether to advance the parent deal status.
func (r *Repository) MarkSigned(ctx context.Context, id, side string) (*Intent, error) {
	if side != "buyer" && side != "seller" {
		return nil, fmt.Errorf("invalid side: %s", side)
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	col := "signed_by_buyer"
	if side == "seller" {
		col = "signed_by_seller"
	}
	if _, err := tx.Exec(ctx,
		fmt.Sprintf(`UPDATE deal_intents SET %s = TRUE, updated_at = NOW()
		             WHERE id = $1 AND status = '%s'`, col, StatusDraft),
		id,
	); err != nil {
		return nil, fmt.Errorf("update side flag: %w", err)
	}

	// Promote to signed if both flags are now true.
	if _, err := tx.Exec(ctx, `
		UPDATE deal_intents
		SET status = $2, signed_at = NOW(), updated_at = NOW()
		WHERE id = $1 AND status = $3 AND signed_by_buyer = TRUE AND signed_by_seller = TRUE`,
		id, StatusSigned, StatusDraft,
	); err != nil {
		return nil, fmt.Errorf("promote to signed: %w", err)
	}

	row := tx.QueryRow(ctx, `SELECT `+intentColumns+` FROM deal_intents WHERE id = $1`, id)
	updated, err := scanIntent(row)
	if err != nil {
		return nil, fmt.Errorf("reload intent: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit: %w", err)
	}
	return updated, nil
}

func (r *Repository) Cancel(ctx context.Context, id string) (*Intent, error) {
	if _, err := r.pool.Exec(ctx, `
		UPDATE deal_intents SET status = $2, cancelled_at = NOW(), updated_at = NOW()
		WHERE id = $1 AND status = $3`,
		id, StatusCancelled, StatusDraft,
	); err != nil {
		return nil, fmt.Errorf("cancel intent: %w", err)
	}
	return r.Get(ctx, id)
}
