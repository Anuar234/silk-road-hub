package shipment

import (
	"encoding/json"
	"time"
)

type Shipment struct {
	ID          string          `json:"id" db:"id"`
	DealID      string          `json:"dealId" db:"deal_id"`
	Origin      string          `json:"origin" db:"origin"`
	Destination string          `json:"destination" db:"destination"`
	RouteName   string          `json:"routeName" db:"route_name"`
	Stages      json.RawMessage `json:"stages" db:"stages"`
	DocumentIDs []string        `json:"documentIds" db:"document_ids"`
	CreatedAt   time.Time       `json:"createdAt" db:"created_at"`
	UpdatedAt   time.Time       `json:"updatedAt" db:"updated_at"`
}

type CreateInput struct {
	DealID          string `json:"dealId" binding:"required"`
	RouteTemplateID string `json:"routeTemplateId"`
	Origin          string `json:"origin"`
	Destination     string `json:"destination"`
}

type UpdateInput struct {
	StageID       string  `json:"stageId"`
	StageStatus   *string `json:"stageStatus"`
	StageLocation *string `json:"stageLocation"`
	StageDate     *string `json:"stageDate"`
	StageNotes    *string `json:"stageNotes"`
	AddDocFileID  *string `json:"addDocumentFileId"`
}

type RouteTemplate struct {
	ID          string   `json:"id" db:"id"`
	Name        string   `json:"name" db:"name"`
	Origin      string   `json:"origin" db:"origin"`
	Destination string   `json:"destination" db:"destination"`
	Stages      []string `json:"stages" db:"stages"`
}
