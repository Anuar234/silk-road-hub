package shipment

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
)

type stageEntry struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Status   string `json:"status"`
	Location string `json:"location,omitempty"`
	Date     string `json:"date,omitempty"`
	Notes    string `json:"notes,omitempty"`
}

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, in *CreateInput) (*Shipment, error) {
	origin := in.Origin
	destination := in.Destination
	routeName := ""
	var stages []stageEntry

	if in.RouteTemplateID != "" {
		rt, err := s.repo.GetRouteTemplate(ctx, in.RouteTemplateID)
		if err != nil {
			return nil, fmt.Errorf("route template not found")
		}
		origin = rt.Origin
		destination = rt.Destination
		routeName = rt.Name
		for _, name := range rt.Stages {
			stages = append(stages, stageEntry{
				ID:     uuid.NewString(),
				Name:   name,
				Status: "pending",
			})
		}
	}

	stagesJSON, _ := json.Marshal(stages)

	sh := &Shipment{
		ID:          uuid.NewString(),
		DealID:      in.DealID,
		Origin:      origin,
		Destination: destination,
		RouteName:   routeName,
		Stages:      stagesJSON,
		DocumentIDs: []string{},
	}

	if err := s.repo.Create(ctx, sh); err != nil {
		return nil, err
	}
	return sh, nil
}

func (s *Service) GetByID(ctx context.Context, id string) (*Shipment, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) List(ctx context.Context, dealID string) ([]*Shipment, error) {
	if dealID != "" {
		return s.repo.ListByDeal(ctx, dealID)
	}
	return s.repo.ListAll(ctx)
}

func (s *Service) Update(ctx context.Context, id string, in *UpdateInput) (*Shipment, error) {
	sh, err := s.repo.GetByID(ctx, id)
	if err != nil || sh == nil {
		return nil, fmt.Errorf("shipment not found")
	}

	sets := make(map[string]any)

	if in.StageID != "" {
		var stages []stageEntry
		_ = json.Unmarshal(sh.Stages, &stages)

		for i, st := range stages {
			if st.ID == in.StageID {
				if in.StageStatus != nil {
					stages[i].Status = *in.StageStatus
				}
				if in.StageLocation != nil {
					stages[i].Location = *in.StageLocation
				}
				if in.StageDate != nil {
					stages[i].Date = *in.StageDate
				}
				if in.StageNotes != nil {
					stages[i].Notes = *in.StageNotes
				}
				break
			}
		}

		updated, _ := json.Marshal(stages)
		sets["stages"] = updated
	}

	if in.AddDocFileID != nil {
		sh.DocumentIDs = append(sh.DocumentIDs, *in.AddDocFileID)
		sets["document_ids"] = sh.DocumentIDs
	}

	if err := s.repo.Update(ctx, id, sets); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, id)
}
