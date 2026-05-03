package investment

import "time"

type Project struct {
	ID           string    `json:"id" db:"id"`
	Title        string    `json:"title" db:"title"`
	Description  string    `json:"description" db:"description"`
	Sector       string    `json:"sector" db:"sector"`
	RegionCode   string    `json:"regionCode" db:"region_code"`
	VolumeUSD    int64     `json:"volumeUsd" db:"volume_usd"`
	Stage        string    `json:"stage" db:"stage"`
	Source       string    `json:"source" db:"source"`
	Initiator    string    `json:"initiator" db:"initiator"`
	ContactEmail string    `json:"contactEmail" db:"contact_email"`
	DocumentIDs  []string  `json:"documentIds" db:"document_ids"`
	Tags         []string  `json:"tags" db:"tags"`
	CreatedAt    time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt    time.Time `json:"updatedAt" db:"updated_at"`
	CreatedBy    *string   `json:"createdBy,omitempty" db:"created_by"`
}

type CreateInput struct {
	Title        string   `json:"title" binding:"required"`
	Description  string   `json:"description"`
	Sector       string   `json:"sector" binding:"required"`
	RegionCode   string   `json:"regionCode" binding:"required"`
	VolumeUSD    int64    `json:"volumeUsd"`
	Stage        string   `json:"stage"`
	Source       string   `json:"source"`
	Initiator    string   `json:"initiator"`
	ContactEmail string   `json:"contactEmail"`
	DocumentIDs  []string `json:"documentIds"`
	Tags         []string `json:"tags"`
}

type UpdateInput struct {
	Title        *string  `json:"title"`
	Description  *string  `json:"description"`
	Sector       *string  `json:"sector"`
	RegionCode   *string  `json:"regionCode"`
	VolumeUSD    *int64   `json:"volumeUsd"`
	Stage        *string  `json:"stage"`
	Source       *string  `json:"source"`
	Initiator    *string  `json:"initiator"`
	ContactEmail *string  `json:"contactEmail"`
	DocumentIDs  []string `json:"documentIds"`
	Tags         []string `json:"tags"`
}
