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

var validRoles = map[string]bool{
	"buyer":         true,
	"seller":        true,
	"investor":      true,
	"institutional": true,
	"admin":         true,
}

func (s *Service) UpdateRole(ctx context.Context, id, role string) (*UserRow, error) {
	if !validRoles[role] {
		return nil, fmt.Errorf("invalid role: %s", role)
	}
	exists, err := s.repo.UserExists(ctx, id)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, fmt.Errorf("user not found")
	}
	if err := s.repo.UpdateRole(ctx, id, role); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, id)
}

func (s *Service) Verify(ctx context.Context, id string, status string) (*UserRow, error) {
	if status != "pending" && status != "verified" && status != "rejected" {
		return nil, fmt.Errorf("invalid verification status: %s", status)
	}
	exists, err := s.repo.UserExists(ctx, id)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, fmt.Errorf("user not found")
	}
	if err := s.repo.UpdateVerification(ctx, id, status); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, id)
}

func (s *Service) AttachDoc(ctx context.Context, userID, fileID string) (*UserRow, error) {
	exists, err := s.repo.UserExists(ctx, userID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, fmt.Errorf("user not found")
	}
	if err := s.repo.AddCompanyDoc(ctx, userID, fileID); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, userID)
}
