package messaging

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

// threadSelect is the canonical SELECT clause for a thread row including the
// JOIN'd display fields used by the inbox UI.
const threadSelect = `
	SELECT t.id, t.buyer_id, t.seller_id, t.product_id, t.related_deal_id,
	       t.created_at, t.updated_at,
	       buyer.display_name, seller.display_name,
	       prod.name, prod.slug
	FROM message_threads t
	LEFT JOIN users buyer ON buyer.id = t.buyer_id
	LEFT JOIN users seller ON seller.id = t.seller_id
	LEFT JOIN products prod ON prod.id = t.product_id
`

func scanThreadRow(row interface{ Scan(dest ...any) error }, t *Thread) error {
	return row.Scan(
		&t.ID, &t.BuyerID, &t.SellerID, &t.ProductID, &t.RelatedDealID,
		&t.CreatedAt, &t.UpdatedAt,
		&t.BuyerName, &t.SellerName,
		&t.ProductName, &t.ProductSlug,
	)
}

// FindThread looks up an existing thread for the given (buyer, seller, product)
// triple. product_id may be nil, in which case the product-less thread for the
// pair is returned. Returns (nil, nil) when no thread exists.
func (r *Repository) FindThread(ctx context.Context, buyerID, sellerID string, productID *string) (*Thread, error) {
	var t Thread
	var sql string
	var args []any
	if productID == nil {
		sql = threadSelect + ` WHERE t.buyer_id = $1 AND t.seller_id = $2 AND t.product_id IS NULL`
		args = []any{buyerID, sellerID}
	} else {
		sql = threadSelect + ` WHERE t.buyer_id = $1 AND t.seller_id = $2 AND t.product_id = $3`
		args = []any{buyerID, sellerID, *productID}
	}
	row := r.pool.QueryRow(ctx, sql, args...)
	if err := scanThreadRow(row, &t); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("find thread: %w", err)
	}
	return &t, nil
}

func (r *Repository) GetThread(ctx context.Context, id string) (*Thread, error) {
	var t Thread
	row := r.pool.QueryRow(ctx, threadSelect+` WHERE t.id = $1`, id)
	if err := scanThreadRow(row, &t); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get thread: %w", err)
	}
	return &t, nil
}

func (r *Repository) CreateThread(ctx context.Context, t *Thread) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO message_threads (id, buyer_id, seller_id, product_id, related_deal_id)
		VALUES ($1, $2, $3, $4, $5)`,
		t.ID, t.BuyerID, t.SellerID, t.ProductID, t.RelatedDealID,
	)
	if err != nil {
		return fmt.Errorf("create thread: %w", err)
	}
	return nil
}

// ListForUser returns threads where the user is buyer or seller, with denormalised
// last-message preview and unread count relative to thread_reads.last_read_at.
func (r *Repository) ListForUser(ctx context.Context, userID string) ([]*Thread, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT t.id, t.buyer_id, t.seller_id, t.product_id, t.related_deal_id,
		       t.created_at, t.updated_at,
		       buyer.display_name, seller.display_name,
		       prod.name, prod.slug,
		       last_msg.body, last_msg.created_at, last_msg.sender_role,
		       COALESCE((
		           SELECT COUNT(*) FROM messages m
		           WHERE m.thread_id = t.id
		             AND (m.sender_id IS NULL OR m.sender_id <> $1)
		             AND (tr.last_read_at IS NULL OR m.created_at > tr.last_read_at)
		       ), 0) AS unread
		FROM message_threads t
		LEFT JOIN users buyer ON buyer.id = t.buyer_id
		LEFT JOIN users seller ON seller.id = t.seller_id
		LEFT JOIN products prod ON prod.id = t.product_id
		LEFT JOIN LATERAL (
		    SELECT body, created_at, sender_role
		    FROM messages
		    WHERE thread_id = t.id
		    ORDER BY created_at DESC LIMIT 1
		) last_msg ON TRUE
		LEFT JOIN thread_reads tr ON tr.thread_id = t.id AND tr.user_id = $1
		WHERE t.buyer_id = $1 OR t.seller_id = $1
		ORDER BY t.updated_at DESC`, userID,
	)
	if err != nil {
		return nil, fmt.Errorf("list threads: %w", err)
	}
	defer rows.Close()

	threads := make([]*Thread, 0)
	for rows.Next() {
		var t Thread
		var bodyPtr *string
		var createdAtPtr *string
		var rolePtr *string
		if err := rows.Scan(
			&t.ID, &t.BuyerID, &t.SellerID, &t.ProductID, &t.RelatedDealID,
			&t.CreatedAt, &t.UpdatedAt,
			&t.BuyerName, &t.SellerName,
			&t.ProductName, &t.ProductSlug,
			&bodyPtr, &createdAtPtr, &rolePtr,
			&t.UnreadCount,
		); err != nil {
			return nil, fmt.Errorf("scan thread: %w", err)
		}
		t.LastMessageBody = bodyPtr
		t.LastMessageAt = createdAtPtr
		t.LastMessageRole = rolePtr
		threads = append(threads, &t)
	}
	return threads, nil
}

func (r *Repository) ListMessages(ctx context.Context, threadID string) ([]*Message, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, thread_id, sender_id, sender_role, body, is_system_message, created_at
		FROM messages
		WHERE thread_id = $1
		ORDER BY created_at ASC`, threadID,
	)
	if err != nil {
		return nil, fmt.Errorf("list messages: %w", err)
	}
	defer rows.Close()

	messages := make([]*Message, 0)
	for rows.Next() {
		var m Message
		if err := rows.Scan(
			&m.ID, &m.ThreadID, &m.SenderID, &m.SenderRole, &m.Body, &m.IsSystemMessage, &m.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan message: %w", err)
		}
		messages = append(messages, &m)
	}
	return messages, nil
}

func (r *Repository) AddMessage(ctx context.Context, m *Message) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `
		INSERT INTO messages (id, thread_id, sender_id, sender_role, body, is_system_message)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		m.ID, m.ThreadID, m.SenderID, m.SenderRole, m.Body, m.IsSystemMessage,
	); err != nil {
		return fmt.Errorf("insert message: %w", err)
	}

	// Bump the thread's updated_at so the inbox sort order reflects the new
	// activity even if the caller forgets to refresh the thread row.
	if _, err := tx.Exec(ctx,
		`UPDATE message_threads SET updated_at = NOW() WHERE id = $1`, m.ThreadID,
	); err != nil {
		return fmt.Errorf("bump thread: %w", err)
	}

	return tx.Commit(ctx)
}

// MarkRead upserts the (thread_id, user_id) read receipt to NOW(). Idempotent.
func (r *Repository) MarkRead(ctx context.Context, threadID, userID string) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO thread_reads (thread_id, user_id, last_read_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT (thread_id, user_id) DO UPDATE SET last_read_at = NOW()`,
		threadID, userID,
	)
	if err != nil {
		return fmt.Errorf("mark read: %w", err)
	}
	return nil
}
