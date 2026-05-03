package rfq

import "time"

// Rfq is a buyer's request for sellers when no matching product is in the
// catalog (ТЗ §5.2 indirect). Admins broker the matching workflow.
type Rfq struct {
	ID             string     `json:"id" db:"id"`
	BuyerID        string     `json:"buyerId" db:"buyer_id"`
	Title          string     `json:"title" db:"title"`
	Description    string     `json:"description" db:"description"`
	SectorID       string     `json:"sectorId" db:"sector_id"`
	SubcategoryID  string     `json:"subcategoryId" db:"subcategory_id"`
	TargetCountry  string     `json:"targetCountry" db:"target_country"`
	Quantity       string     `json:"quantity" db:"quantity"`
	BudgetUSD      *int64     `json:"budgetUsd,omitempty" db:"budget_usd"`
	TargetDate     *time.Time `json:"targetDate,omitempty" db:"target_date"`
	Incoterms      string     `json:"incoterms" db:"incoterms"`
	Notes          string     `json:"notes" db:"notes"`
	Status         string     `json:"status" db:"status"`
	AdminNotes     string     `json:"adminNotes,omitempty" db:"admin_notes"`
	CreatedAt      time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt      time.Time  `json:"updatedAt" db:"updated_at"`

	// JOIN-populated display fields. Buyer name keeps the inbox / admin queue
	// readable without secondary lookups; matches are returned together with
	// the rfq when fetched by id.
	BuyerName string  `json:"buyerName,omitempty"`
	BuyerEmail string `json:"buyerEmail,omitempty"`
	Matches   []Match `json:"matches,omitempty"`
}

// Match is an admin-curated link from an RFQ to a candidate seller.
type Match struct {
	ID         string    `json:"id" db:"id"`
	RfqID      string    `json:"rfqId" db:"rfq_id"`
	SellerID   string    `json:"sellerId" db:"seller_id"`
	Note       string    `json:"note" db:"note"`
	ThreadID   *string   `json:"threadId,omitempty" db:"thread_id"`
	CreatedBy  *string   `json:"createdBy,omitempty" db:"created_by"`
	CreatedAt  time.Time `json:"createdAt" db:"created_at"`

	// Display joins
	SellerName    string `json:"sellerName,omitempty"`
	SellerCompany string `json:"sellerCompany,omitempty"`
	SellerEmail   string `json:"sellerEmail,omitempty"`
}

type CreateInput struct {
	Title         string  `json:"title" binding:"required,min=1,max=512"`
	Description   string  `json:"description" binding:"max=8000"`
	SectorID      string  `json:"sectorId"`
	SubcategoryID string  `json:"subcategoryId"`
	TargetCountry string  `json:"targetCountry"`
	Quantity      string  `json:"quantity"`
	BudgetUSD     *int64  `json:"budgetUsd"`
	// Accepted as YYYY-MM-DD; service parses it into time.Time.
	TargetDate string `json:"targetDate"`
	Incoterms  string `json:"incoterms"`
	Notes      string `json:"notes" binding:"max=8000"`
}

type UpdateInput struct {
	Title         *string `json:"title"`
	Description   *string `json:"description"`
	SectorID      *string `json:"sectorId"`
	SubcategoryID *string `json:"subcategoryId"`
	TargetCountry *string `json:"targetCountry"`
	Quantity      *string `json:"quantity"`
	BudgetUSD     *int64  `json:"budgetUsd"`
	TargetDate    *string `json:"targetDate"`
	Incoterms     *string `json:"incoterms"`
	Notes         *string `json:"notes"`
	Status        *string `json:"status"`
	AdminNotes    *string `json:"adminNotes"`
}

type AddMatchInput struct {
	SellerID string `json:"sellerId" binding:"required,uuid"`
	Note     string `json:"note" binding:"max=2000"`
}

const (
	StatusOpen      = "open"
	StatusInReview  = "in_review"
	StatusMatched   = "matched"
	StatusFulfilled = "fulfilled"
	StatusClosed    = "closed"
)

func validStatus(s string) bool {
	switch s {
	case StatusOpen, StatusInReview, StatusMatched, StatusFulfilled, StatusClosed:
		return true
	}
	return false
}
