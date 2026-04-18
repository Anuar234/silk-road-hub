package auth

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Register(ctx context.Context, in *RegisterInput) (*User, error) {
	exists, err := s.repo.EmailExists(ctx, in.Email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, fmt.Errorf("email already registered")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	u := &User{
		ID:                 uuid.NewString(),
		Email:              in.Email,
		PasswordHash:       string(hash),
		DisplayName:        in.DisplayName,
		Role:               in.Role,
		Verified:           false,
		EmailVerified:      false,
		CompanyName:        in.CompanyName,
		BIN:                in.BIN,
		Position:           in.Position,
		Phone:              in.Phone,
		VerificationStatus: "pending",
	}

	if err := s.repo.Create(ctx, u); err != nil {
		return nil, err
	}
	return u, nil
}

func (s *Service) Authenticate(ctx context.Context, email, password string) (*User, error) {
	u, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	if u == nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)); err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}
	return u, nil
}

func (s *Service) GetByID(ctx context.Context, id string) (*User, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) GetCompanyDocs(ctx context.Context, userID string) ([]string, error) {
	return s.repo.GetCompanyDocs(ctx, userID)
}

func (s *Service) UpdateProfile(ctx context.Context, id string, updates *ProfileUpdates) (*User, error) {
	if err := s.repo.UpdateProfile(ctx, id, updates); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, id)
}
