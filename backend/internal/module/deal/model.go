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
