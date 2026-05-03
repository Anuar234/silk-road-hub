package messaging

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
)

type Service struct {
	repo     *Repository
	userRepo userLookup
}

// userLookup is the minimal slice of the auth/user repos that messaging needs
// in order to validate counterpart existence and role. Defined locally so the
// service can be wired to either repo depending on how main.go composes it.
type userLookup interface {
	GetRole(ctx context.Context, userID string) (string, error)
}

func NewService(repo *Repository, users userLookup) *Service {
	return &Service{repo: repo, userRepo: users}
}

// FindOrCreateThread is idempotent: if a thread already exists for the
// (buyer, seller, product) triple, it is returned; otherwise a new one is
// created. The caller's session role determines which side they take. Both
// participants must currently exist in the users table.
func (s *Service) FindOrCreateThread(ctx context.Context, callerID, callerRole, counterpartID string, productID *string) (*Thread, error) {
	if callerID == counterpartID {
		return nil, errors.New("cannot open a thread with yourself")
	}

	counterpartRole, err := s.userRepo.GetRole(ctx, counterpartID)
	if err != nil {
		return nil, fmt.Errorf("counterpart not found")
	}

	var buyerID, sellerID string
	switch callerRole {
	case RoleBuyer:
		if counterpartRole != RoleSeller {
			return nil, errors.New("buyer can only message sellers")
		}
		buyerID, sellerID = callerID, counterpartID
	case RoleSeller:
		if counterpartRole != RoleBuyer {
			return nil, errors.New("seller can only message buyers")
		}
		buyerID, sellerID = counterpartID, callerID
	default:
		// Investors and admins cannot directly start buyer-seller threads;
		// admins can still post in existing threads through CreateMessage.
		return nil, errors.New("only buyers and sellers can open threads")
	}

	if existing, err := s.repo.FindThread(ctx, buyerID, sellerID, productID); err != nil {
		return nil, err
	} else if existing != nil {
		return existing, nil
	}

	t := &Thread{
		ID:        uuid.NewString(),
		BuyerID:   buyerID,
		SellerID:  sellerID,
		ProductID: productID,
	}
	if err := s.repo.CreateThread(ctx, t); err != nil {
		return nil, err
	}
	return t, nil
}

func (s *Service) GetThread(ctx context.Context, id string) (*Thread, error) {
	return s.repo.GetThread(ctx, id)
}

func (s *Service) ListMine(ctx context.Context, userID string) ([]*Thread, error) {
	return s.repo.ListForUser(ctx, userID)
}

// CanAccess returns true if the user is a participant in the thread or is an
// admin. Admins have read access to support the moderation surface (ТЗ §4.5)
// but do not show up as the buyer or seller in DB.
func (s *Service) CanAccess(t *Thread, userID, role string) bool {
	if role == RoleAdmin {
		return true
	}
	return t.BuyerID == userID || t.SellerID == userID
}

func (s *Service) ListMessages(ctx context.Context, threadID, userID, role string) ([]*Message, error) {
	t, err := s.repo.GetThread(ctx, threadID)
	if err != nil {
		return nil, err
	}
	if t == nil {
		return nil, errors.New("thread not found")
	}
	if !s.CanAccess(t, userID, role) {
		return nil, errors.New("forbidden")
	}
	return s.repo.ListMessages(ctx, threadID)
}

func (s *Service) AddMessage(ctx context.Context, threadID, senderID, senderRole, body string) (*Message, error) {
	t, err := s.repo.GetThread(ctx, threadID)
	if err != nil {
		return nil, err
	}
	if t == nil {
		return nil, errors.New("thread not found")
	}
	if !s.CanAccess(t, senderID, senderRole) {
		return nil, errors.New("forbidden")
	}
	role := senderRole
	if role == RoleAdmin {
		// Admin posts are still tracked under the admin role (so the buyer and
		// seller can tell who wrote which message).
	}
	m := &Message{
		ID:         uuid.NewString(),
		ThreadID:   threadID,
		SenderID:   &senderID,
		SenderRole: role,
		Body:       body,
	}
	if err := s.repo.AddMessage(ctx, m); err != nil {
		return nil, err
	}
	return m, nil
}

// AddSystemMessage is invoked by other modules (e.g. deal creation) to inject a
// system-authored notice into a thread. No participant check is performed here
// because the calling module is trusted; it just needs the thread ID.
func (s *Service) AddSystemMessage(ctx context.Context, threadID, body string) (*Message, error) {
	m := &Message{
		ID:              uuid.NewString(),
		ThreadID:        threadID,
		SenderID:        nil,
		SenderRole:      RoleSystem,
		Body:            body,
		IsSystemMessage: true,
	}
	if err := s.repo.AddMessage(ctx, m); err != nil {
		return nil, err
	}
	return m, nil
}

func (s *Service) MarkRead(ctx context.Context, threadID, userID, role string) error {
	t, err := s.repo.GetThread(ctx, threadID)
	if err != nil {
		return err
	}
	if t == nil {
		return errors.New("thread not found")
	}
	if !s.CanAccess(t, userID, role) {
		return errors.New("forbidden")
	}
	return s.repo.MarkRead(ctx, threadID, userID)
}
