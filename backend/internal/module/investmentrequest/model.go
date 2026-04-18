package investmentrequest

import "time"

type Request struct {
	ID         string    `json:"id" db:"id"`
	ProjectID  string    `json:"projectId" db:"project_id"`
	InvestorID string    `json:"investorId" db:"investor_id"`
	AmountUSD  int64     `json:"amountUsd" db:"amount_usd"`
	Message    string    `json:"message" db:"message"`
	Status     string    `json:"status" db:"status"`
	CreatedAt  time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt  time.Time `json:"updatedAt" db:"updated_at"`
}

type CreateInput struct {
	AmountUSD int64  `json:"amountUsd"`
	Message   string `json:"message" binding:"required,min=1,max=4000"`
}

type UpdateStatusInput struct {
	Status string `json:"status" binding:"required,oneof=new reviewing accepted declined"`
}
