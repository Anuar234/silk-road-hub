package dealintent

import "time"

// Intent represents an LOI or MOU recorded against a deal. ТЗ §5.3 names these
// explicitly as part of «фиксация договорённостей» — each side's signature is
// tracked so the deal can advance to phase «Намерения зафиксированы».
type Intent struct {
	ID             string     `json:"id" db:"id"`
	DealID         string     `json:"dealId" db:"deal_id"`
	Kind           string     `json:"kind" db:"kind"`
	Title          string     `json:"title" db:"title"`
	Summary        string     `json:"summary" db:"summary"`
	FileID         *string    `json:"fileId,omitempty" db:"file_id"`
	Status         string     `json:"status" db:"status"`
	SignedByBuyer  bool       `json:"signedByBuyer" db:"signed_by_buyer"`
	SignedBySeller bool       `json:"signedBySeller" db:"signed_by_seller"`
	SignedAt       *time.Time `json:"signedAt,omitempty" db:"signed_at"`
	CancelledAt    *time.Time `json:"cancelledAt,omitempty" db:"cancelled_at"`
	CreatedBy      *string    `json:"createdBy,omitempty" db:"created_by"`
	CreatedAt      time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt      time.Time  `json:"updatedAt" db:"updated_at"`
}

type CreateInput struct {
	Kind    string  `json:"kind" binding:"required,oneof=loi mou"`
	Title   string  `json:"title" binding:"required,min=1,max=512"`
	Summary string  `json:"summary" binding:"max=8000"`
	FileID  *string `json:"fileId" binding:"omitempty,uuid"`
}

type SignInput struct {
	// Side is implied by the caller's role; this struct exists for parity with
	// other modules but is intentionally empty.
}

const (
	KindLOI = "loi"
	KindMOU = "mou"

	StatusDraft     = "draft"
	StatusSigned    = "signed"
	StatusCancelled = "cancelled"
)
