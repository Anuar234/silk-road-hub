package dealintent

import (
	"context"
	"errors"

	"github.com/google/uuid"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// Create starts a new LOI/MOU draft. Either party in the deal can draft it;
// it becomes signed only after both sides call Sign.
func (s *Service) Create(ctx context.Context, dealID, callerID string, in *CreateInput) (*Intent, error) {
	if in.Kind != KindLOI && in.Kind != KindMOU {
		return nil, errors.New("kind must be loi or mou")
	}
	intent := &Intent{
		ID:      uuid.NewString(),
		DealID:  dealID,
		Kind:    in.Kind,
		Title:   in.Title,
		Summary: in.Summary,
		FileID:  in.FileID,
		Status:  StatusDraft,
	}
	if callerID != "" {
		intent.CreatedBy = &callerID
	}
	if err := s.repo.Create(ctx, intent); err != nil {
		return nil, err
	}
	return intent, nil
}

func (s *Service) ListForDeal(ctx context.Context, dealID string) ([]*Intent, error) {
	return s.repo.ListForDeal(ctx, dealID)
}

func (s *Service) Get(ctx context.Context, id string) (*Intent, error) {
	return s.repo.Get(ctx, id)
}

// Sign records the caller's side as signing. Caller's role determines the side
// (buyer or seller); admin may sign as either explicitly via the side arg.
func (s *Service) Sign(ctx context.Context, id, callerRole, sideOverride string) (*Intent, error) {
	side := callerRole
	if callerRole == "admin" && sideOverride != "" {
		side = sideOverride
	}
	if side != "buyer" && side != "seller" {
		return nil, errors.New("only buyer or seller can sign an intent")
	}
	return s.repo.MarkSigned(ctx, id, side)
}

func (s *Service) Cancel(ctx context.Context, id string) (*Intent, error) {
	return s.repo.Cancel(ctx, id)
}
