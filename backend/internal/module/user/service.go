package user

import (
	"context"
	"fmt"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListAll(ctx context.Context) ([]*UserRow, error) {
	return s.repo.ListAll(ctx)
}

func (s *Service) Verify(ctx context.Context, id string, status string) error {
	if status != "pending" && status != "verified" && status != "rejected" {
		return fmt.Errorf("invalid verification status: %s", status)
	}
	exists, err := s.repo.UserExists(ctx, id)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("user not found")
	}
	return s.repo.UpdateVerification(ctx, id, status)
}

func (s *Service) AttachDoc(ctx context.Context, userID, fileID string) error {
	exists, err := s.repo.UserExists(ctx, userID)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("user not found")
	}
	return s.repo.AddCompanyDoc(ctx, userID, fileID)
}
