package deal

import "time"

type PaymentPlan struct {
	ID        string         `json:"id" db:"id"`
	DealID    string         `json:"dealId" db:"deal_id"`
	TotalUSD  float64        `json:"totalUsd" db:"total_usd"`
	Stages    []PaymentStage `json:"stages"`
	CreatedAt time.Time      `json:"createdAt" db:"created_at"`
}

type PaymentStage struct {
	ID         string     `json:"id" db:"id"`
	PlanID     string     `json:"-" db:"plan_id"`
	Label      string     `json:"label" db:"label"`
	Percentage float64    `json:"percentage" db:"percentage"`
	AmountUSD  *float64   `json:"amountUsd,omitempty" db:"amount_usd"`
	Status     string     `json:"status" db:"status"`
	DueDate    *string    `json:"dueDate,omitempty" db:"due_date"`
	PaidAt     *time.Time `json:"paidAt,omitempty" db:"paid_at"`
	SortOrder  int        `json:"sortOrder" db:"sort_order"`
}

type Guarantee struct {
	ID      string `json:"id" db:"id"`
	DealID  string `json:"dealId" db:"deal_id"`
	Type    string `json:"type" db:"type"`
	Provider string `json:"provider" db:"provider"`
	Enabled bool   `json:"enabled" db:"enabled"`
	Notes   string `json:"notes" db:"notes"`
}

type CreatePaymentPlanInput struct {
	TotalUSD float64 `json:"totalUsd" binding:"required"`
	Stages   []struct {
		Label      string  `json:"label"`
		Percentage float64 `json:"percentage"`
	} `json:"stages"`
}

type UpdatePaymentStageInput struct {
	StageID string     `json:"stageId" binding:"required"`
	Status  *string    `json:"status"`
	DueDate *string    `json:"dueDate"`
	PaidAt  *time.Time `json:"paidAt"`
}

type SetGuaranteeInput struct {
	Type    string  `json:"type" binding:"required"`
	Enabled *bool   `json:"enabled"`
	Notes   *string `json:"notes"`
}

var DefaultPaymentStages = []struct {
	Label      string
	Percentage float64
}{
	{"Аванс", 30},
	{"При отгрузке", 40},
	{"Финальный расчёт", 30},
}

type Comment struct {
	ID         string    `json:"id" db:"id"`
	DealID     string    `json:"dealId" db:"deal_id"`
	Type       string    `json:"type" db:"type"`
	Visibility string    `json:"visibility" db:"visibility"`
	Author     string    `json:"author" db:"author"`
	AuthorRole string    `json:"authorRole" db:"author_role"`
	Body       string    `json:"body" db:"body"`
	CreatedAt  time.Time `json:"createdAt" db:"created_at"`
}

type CreateCommentInput struct {
	Type       string `json:"type" binding:"omitempty,oneof=internal_note buyer_request seller_request document_note status_note"`
	Visibility string `json:"visibility" binding:"omitempty,oneof=internal buyer seller all"`
	Body       string `json:"body" binding:"required,min=1,max=8000"`
}

type Document struct {
	ID               string     `json:"id" db:"id"`
	DealID           string     `json:"dealId" db:"deal_id"`
	Name             string     `json:"name" db:"name"`
	Type             string     `json:"type" db:"type"`
	Status           string     `json:"status" db:"status"`
	UploadedByRole   *string    `json:"uploadedByRole,omitempty" db:"uploaded_by_role"`
	UploadedAt       *time.Time `json:"uploadedAt,omitempty" db:"uploaded_at"`
	Note             *string    `json:"note,omitempty" db:"note"`
	SourceFileName   *string    `json:"sourceFileName,omitempty" db:"source_file_name"`
	SourceFileSize   *int64     `json:"sourceFileSize,omitempty" db:"source_file_size"`
	FileID           *string    `json:"fileId,omitempty" db:"file_id"`
}

type CreateDocumentInput struct {
	Name   string  `json:"name" binding:"required,min=1,max=512"`
	Type   string  `json:"type" binding:"required,oneof=invoice contract certificate shipping loi mou other"`
	FileID string  `json:"fileId" binding:"required,uuid"`
	Note   *string `json:"note"`
}
