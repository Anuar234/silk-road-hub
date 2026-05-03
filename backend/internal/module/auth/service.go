package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// EmailVerificationTokenTTL is how long an emailed token stays valid. Long
// enough that a user can hit the link the next morning, short enough that a
// stale clipboard token cannot be replayed indefinitely.
const EmailVerificationTokenTTL = 24 * time.Hour

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// IssueEmailVerificationToken mints a fresh token for the user and persists it
// with a TTL. The token is logged at INFO level so an operator can deliver it
// out-of-band while pilot SMTP is not yet wired in. Returns the raw token so
// callers (Register, Resend) can return it to dev tooling if useful.
func (s *Service) IssueEmailVerificationToken(ctx context.Context, userID, email string) (string, error) {
	token, err := generateRandomToken(32)
	if err != nil {
		return "", fmt.Errorf("generate token: %w", err)
	}
	expiresAt := time.Now().Add(EmailVerificationTokenTTL)
	if err := s.repo.CreateEmailVerificationToken(ctx, token, userID, expiresAt); err != nil {
		return "", err
	}
	slog.Info("email verification token issued",
		"userId", userID,
		"email", email,
		"token", token,
		"expiresAt", expiresAt.Format(time.RFC3339),
	)
	return token, nil
}

// VerifyEmailToken consumes the token and flips the user's email_verified
// flag. Returns an error if the token is unknown, expired, or already used.
func (s *Service) VerifyEmailToken(ctx context.Context, token string) error {
	if token == "" {
		return fmt.Errorf("token is required")
	}
	return s.repo.ConsumeEmailVerificationTokenAndVerify(ctx, token)
}

// ResendEmailVerification invalidates outstanding tokens for the user and
// issues a new one. Idempotent: callers can invoke as often as they need.
func (s *Service) ResendEmailVerification(ctx context.Context, userID, email string) (string, error) {
	if err := s.repo.InvalidateUserVerificationTokens(ctx, userID); err != nil {
		return "", err
	}
	return s.IssueEmailVerificationToken(ctx, userID, email)
}

func generateRandomToken(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
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
