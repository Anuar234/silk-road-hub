package contract

import (
	"context"

	"github.com/google/uuid"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, in *CreateInput) (*Contract, error) {
	deadlines := in.Deadlines
	if deadlines == nil {
		deadlines = []byte("[]")
	}

	c := &Contract{
		ID:            uuid.NewString(),
		DealID:        in.DealID,
		TemplateType:  in.TemplateType,
		ApplicableLaw: in.ApplicableLaw,
		Status:        "draft",
		Deadlines:     deadlines,
		Notes:         in.Notes,
	}
	if err := s.repo.Create(ctx, c); err != nil {
		return nil, err
	}
	return c, nil
}

func (s *Service) GetByID(ctx context.Context, id string) (*Contract, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) List(ctx context.Context, dealID string) ([]*Contract, error) {
	if dealID != "" {
		return s.repo.ListByDeal(ctx, dealID)
	}
	return s.repo.ListAll(ctx)
}

func (s *Service) Update(ctx context.Context, id string, in *UpdateInput) (*Contract, error) {
	sets := make(map[string]any)
	if in.Status != nil {
		sets["status"] = *in.Status
	}
	if in.SignedDocFileID != nil {
		sets["signed_doc_file_id"] = *in.SignedDocFileID
	}
	if in.Deadlines != nil {
		sets["deadlines"] = in.Deadlines
	}
	if in.Notes != nil {
		sets["notes"] = *in.Notes
	}

	if err := s.repo.Update(ctx, id, sets); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, id)
}
