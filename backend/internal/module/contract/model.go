package contract

import "time"

type Contract struct {
	ID               string    `json:"id" db:"id"`
	DealID           string    `json:"dealId" db:"deal_id"`
	TemplateType     string    `json:"templateType" db:"template_type"`
	ApplicableLaw    string    `json:"applicableLaw" db:"applicable_law"`
	Status           string    `json:"status" db:"status"`
	SignedDocFileID  *string   `json:"signedDocFileId,omitempty" db:"signed_doc_file_id"`
	Deadlines        []byte    `json:"deadlines" db:"deadlines"`
	Notes            string    `json:"notes" db:"notes"`
	CreatedAt        time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt        time.Time `json:"updatedAt" db:"updated_at"`
}

type CreateInput struct {
	DealID        string `json:"dealId" binding:"required"`
	TemplateType  string `json:"templateType" binding:"required,oneof=export investment framework"`
	ApplicableLaw string `json:"applicableLaw" binding:"required,oneof=KZ EN UNCITRAL ICC"`
	Deadlines     []byte `json:"deadlines"`
	Notes         string `json:"notes"`
}

type UpdateInput struct {
	Status          *string `json:"status"`
	SignedDocFileID  *string `json:"signedDocFileId"`
	Deadlines       []byte  `json:"deadlines"`
	Notes           *string `json:"notes"`
}
