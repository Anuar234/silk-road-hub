package investment

import (
	"context"
	"fmt"

	"github.com/google/uuid"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// Create persists a new investment project. Investors creating their own
// project always end up as 'private' (Частный инвестиционный проект, ТЗ §5.11);
// only admins (and Kazakh Invest curators acting through admin) can mark a
// project as 'kazakh_invest'.
func (s *Service) Create(ctx context.Context, in *CreateInput, role, ownerID string) (*Project, error) {
	source := coalesce(in.Source, "private")
	if role != "admin" && source == "kazakh_invest" {
		return nil, fmt.Errorf("only admins can create Kazakh Invest projects")
	}

	p := &Project{
		ID:           uuid.NewString(),
		Title:        in.Title,
		Description:  in.Description,
		Sector:       in.Sector,
		RegionCode:   in.RegionCode,
		VolumeUSD:    in.VolumeUSD,
		Stage:        coalesce(in.Stage, "concept"),
		Source:       source,
		Initiator:    in.Initiator,
		ContactEmail: in.ContactEmail,
		DocumentIDs:  coalesceSlice(in.DocumentIDs),
		Tags:         coalesceSlice(in.Tags),
	}
	if ownerID != "" {
		p.CreatedBy = &ownerID
	}
	if err := s.repo.Create(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *Service) GetByID(ctx context.Context, id string) (*Project, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) List(ctx context.Context) ([]*Project, error) {
	return s.repo.List(ctx)
}

func (s *Service) ListByOwner(ctx context.Context, ownerID string) ([]*Project, error) {
	return s.repo.ListByOwner(ctx, ownerID)
}

// Update applies partial changes to a project. Investors may only edit their
// own projects, and may not promote them to 'kazakh_invest'. Admins can edit
// any project including the source flag.
func (s *Service) Update(ctx context.Context, id string, in *UpdateInput, role, userID string) (*Project, error) {
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil || existing == nil {
		return nil, fmt.Errorf("project not found")
	}
	if role != "admin" {
		if existing.CreatedBy == nil || *existing.CreatedBy != userID {
			return nil, fmt.Errorf("forbidden")
		}
		if in.Source != nil && *in.Source == "kazakh_invest" {
			return nil, fmt.Errorf("only admins can set Kazakh Invest source")
		}
	}

	sets := make(map[string]any)
	if in.Title != nil {
		sets["title"] = *in.Title
	}
	if in.Description != nil {
		sets["description"] = *in.Description
	}
	if in.Sector != nil {
		sets["sector"] = *in.Sector
	}
	if in.RegionCode != nil {
		sets["region_code"] = *in.RegionCode
	}
	if in.VolumeUSD != nil {
		sets["volume_usd"] = *in.VolumeUSD
	}
	if in.Stage != nil {
		sets["stage"] = *in.Stage
	}
	if in.Source != nil {
		sets["source"] = *in.Source
	}
	if in.Initiator != nil {
		sets["initiator"] = *in.Initiator
	}
	if in.ContactEmail != nil {
		sets["contact_email"] = *in.ContactEmail
	}
	if in.DocumentIDs != nil {
		sets["document_ids"] = in.DocumentIDs
	}
	if in.Tags != nil {
		sets["tags"] = in.Tags
	}

	if err := s.repo.Update(ctx, id, sets); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, id)
}

func coalesce(s, def string) string {
	if s == "" {
		return def
	}
	return s
}

func coalesceSlice(s []string) []string {
	if s == nil {
		return []string{}
	}
	return s
}
