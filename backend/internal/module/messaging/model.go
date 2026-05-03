package messaging

import "time"

type Thread struct {
	ID            string    `json:"id" db:"id"`
	BuyerID       string    `json:"buyerId" db:"buyer_id"`
	SellerID      string    `json:"sellerId" db:"seller_id"`
	ProductID     *string   `json:"productId,omitempty" db:"product_id"`
	RelatedDealID *string   `json:"relatedDealId,omitempty" db:"related_deal_id"`
	CreatedAt     time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt     time.Time `json:"updatedAt" db:"updated_at"`

	// JOIN-populated display fields. We embed display name + product name in the
	// thread payload so the inbox sidebar can render without secondary lookups.
	BuyerName    *string `json:"buyerName,omitempty"`
	SellerName   *string `json:"sellerName,omitempty"`
	ProductName  *string `json:"productName,omitempty"`
	ProductSlug  *string `json:"productSlug,omitempty"`

	// Computed fields populated by ListForUser to keep the inbox payload self-
	// contained: count of messages newer than the caller's last_read_at, and
	// a denormalised preview of the most recent message body and timestamp.
	UnreadCount     int     `json:"unreadCount"`
	LastMessageBody *string `json:"lastMessageBody,omitempty"`
	LastMessageAt   *string `json:"lastMessageAt,omitempty"`
	LastMessageRole *string `json:"lastMessageRole,omitempty"`
}

type Message struct {
	ID              string    `json:"id" db:"id"`
	ThreadID        string    `json:"threadId" db:"thread_id"`
	SenderID        *string   `json:"senderId,omitempty" db:"sender_id"`
	SenderRole      string    `json:"senderRole" db:"sender_role"`
	Body            string    `json:"body" db:"body"`
	IsSystemMessage bool      `json:"isSystemMessage" db:"is_system_message"`
	CreatedAt       time.Time `json:"createdAt" db:"created_at"`
}

type CreateThreadInput struct {
	// Either buyer_id or seller_id is set automatically from the session;
	// the caller passes the counterpart and (optionally) a product_id.
	CounterpartID string  `json:"counterpartId" binding:"required,uuid"`
	ProductID     *string `json:"productId" binding:"omitempty,uuid"`
}

type CreateMessageInput struct {
	Body string `json:"body" binding:"required,min=1,max=8000"`
}

const (
	RoleBuyer  = "buyer"
	RoleSeller = "seller"
	RoleAdmin  = "admin"
	RoleSystem = "system"
)
