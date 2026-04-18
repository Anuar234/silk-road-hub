package investmentrequest

import (
	"context"
	"fmt"
	"strings"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, projectID, investorID string, in *CreateInput) (*Request, error) {
	if strings.TrimSpace(projectID) == "" {
		return nil, fmt.Errorf("project id is required")
	}
	if in.AmountUSD < 0 {
		return nil, fmt.Errorf("amount must be non-negative")
	}

	req := &Request{
		ProjectID:  projectID,
		InvestorID: investorID,
		AmountUSD:  in.AmountUSD,
		Message:    in.Message,
		Status:     "new",
	}
	if err := s.repo.Create(ctx, req); err != nil {
		return nil, err
	}
	return req, nil
}

func (s *Service) ListByInvestor(ctx context.Context, investorID string) ([]*Request, error) {
	return s.repo.ListByInvestor(ctx, investorID)
}

func (s *Service) ListByProject(ctx context.Context, projectID string) ([]*Request, error) {
	return s.repo.ListByProject(ctx, projectID)
}

func (s *Service) ListAll(ctx context.Context) ([]*Request, error) {
	return s.repo.ListAll(ctx)
}

func (s *Service) UpdateStatus(ctx context.Context, id, status string) error {
	return s.repo.UpdateStatus(ctx, id, status)
}
