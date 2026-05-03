package rfq

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// MessagingHooks is a tiny dependency surface that rfq uses to spin up a buyer
// ↔ seller conversation when an admin matches a seller to an RFQ. main.go
// wires it as closures around messaging.Service, so rfq itself doesn't need to
// import the messaging package.
type MessagingHooks struct {
	// FindOrCreateThread returns the thread id for the buyer/seller pair.
	FindOrCreateThread func(ctx context.Context, buyerID, sellerID string) (string, error)
	// PostSystemMessage drops a system-authored message into the thread.
	PostSystemMessage func(ctx context.Context, threadID, body string) error
}

type Service struct {
	repo      *Repository
	messaging MessagingHooks
}

func NewService(repo *Repository, messaging MessagingHooks) *Service {
	return &Service{repo: repo, messaging: messaging}
}

// Create stores a fresh RFQ in 'open' status.
func (s *Service) Create(ctx context.Context, buyerID string, in *CreateInput) (*Rfq, error) {
	r := &Rfq{
		ID:            uuid.NewString(),
		BuyerID:       buyerID,
		Title:         in.Title,
		Description:   in.Description,
		SectorID:      in.SectorID,
		SubcategoryID: in.SubcategoryID,
		TargetCountry: in.TargetCountry,
		Quantity:      in.Quantity,
		BudgetUSD:     in.BudgetUSD,
		Incoterms:     in.Incoterms,
		Notes:         in.Notes,
		Status:        StatusOpen,
	}
	if d := parseDate(in.TargetDate); d != nil {
		r.TargetDate = d
	}
	if err := s.repo.Create(ctx, r); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, r.ID)
}

func (s *Service) Get(ctx context.Context, id string) (*Rfq, error) {
	rfq, err := s.repo.GetByID(ctx, id)
	if err != nil || rfq == nil {
		return rfq, err
	}
	matches, err := s.repo.ListMatches(ctx, id)
	if err != nil {
		return nil, err
	}
	rfq.Matches = matches
	return rfq, nil
}

func (s *Service) List(ctx context.Context, role, userID, statusFilter string) ([]*Rfq, error) {
	f := ListFilter{Status: statusFilter}
	switch role {
	case "buyer":
		f.BuyerID = userID
	case "seller":
		f.SellerID = userID
	case "admin", "institutional":
		// No additional filter — admin/institutional see everything.
	default:
		return []*Rfq{}, nil
	}
	return s.repo.List(ctx, f)
}

// Update applies changes to an RFQ. Buyers may only edit their own open RFQs
// and may not touch admin-only fields. Admins may edit anything including
// status.
func (s *Service) Update(ctx context.Context, id, role, userID string, in *UpdateInput) (*Rfq, error) {
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil || existing == nil {
		return nil, errors.New("rfq not found")
	}

	isAdmin := role == "admin"
	if !isAdmin {
		if existing.BuyerID != userID {
			return nil, errors.New("forbidden")
		}
		if existing.Status != StatusOpen {
			return nil, errors.New("editing is only available while status is open")
		}
	}

	sets := map[string]any{}
	if in.Title != nil {
		sets["title"] = *in.Title
	}
	if in.Description != nil {
		sets["description"] = *in.Description
	}
	if in.SectorID != nil {
		sets["sector_id"] = *in.SectorID
	}
	if in.SubcategoryID != nil {
		sets["subcategory_id"] = *in.SubcategoryID
	}
	if in.TargetCountry != nil {
		sets["target_country"] = *in.TargetCountry
	}
	if in.Quantity != nil {
		sets["quantity"] = *in.Quantity
	}
	if in.BudgetUSD != nil {
		sets["budget_usd"] = *in.BudgetUSD
	}
	if in.TargetDate != nil {
		if d := parseDate(*in.TargetDate); d != nil {
			sets["target_date"] = *d
		} else {
			sets["target_date"] = nil
		}
	}
	if in.Incoterms != nil {
		sets["incoterms"] = *in.Incoterms
	}
	if in.Notes != nil {
		sets["notes"] = *in.Notes
	}
	// Admin-only fields
	if isAdmin {
		if in.Status != nil {
			if !validStatus(*in.Status) {
				return nil, fmt.Errorf("invalid status: %s", *in.Status)
			}
			sets["status"] = *in.Status
		}
		if in.AdminNotes != nil {
			sets["admin_notes"] = *in.AdminNotes
		}
	} else {
		// Buyer-allowed shortcut: close their own open RFQ.
		if in.Status != nil && *in.Status == StatusClosed {
			sets["status"] = StatusClosed
		}
	}

	if err := s.repo.Update(ctx, id, sets); err != nil {
		return nil, err
	}
	return s.Get(ctx, id)
}

// AddMatch links a seller to the RFQ. As a side effect, opens (or reuses) a
// messaging thread between buyer and seller and posts a system message about
// the RFQ. The thread id is stored on the match for downstream UI.
func (s *Service) AddMatch(ctx context.Context, rfqID, adminID string, in *AddMatchInput) (*Match, error) {
	rfq, err := s.repo.GetByID(ctx, rfqID)
	if err != nil || rfq == nil {
		return nil, errors.New("rfq not found")
	}
	if rfq.Status == StatusClosed || rfq.Status == StatusFulfilled {
		return nil, errors.New("cannot match a closed or fulfilled rfq")
	}

	match := &Match{
		ID:        uuid.NewString(),
		RfqID:     rfqID,
		SellerID:  in.SellerID,
		Note:      in.Note,
		CreatedBy: &adminID,
	}

	// Best-effort thread creation. Failure here doesn't block the match itself
	// — admin can manually open a thread later.
	if s.messaging.FindOrCreateThread != nil {
		threadID, err := s.messaging.FindOrCreateThread(ctx, rfq.BuyerID, in.SellerID)
		if err == nil && threadID != "" {
			match.ThreadID = &threadID
			body := fmt.Sprintf(
				"Администрация подобрала вас как поставщика по запросу #%s «%s».",
				rfq.ID, rfq.Title,
			)
			if in.Note != "" {
				body += "\n\nКомментарий: " + in.Note
			}
			if s.messaging.PostSystemMessage != nil {
				_ = s.messaging.PostSystemMessage(ctx, threadID, body)
			}
		}
	}

	if err := s.repo.AddMatch(ctx, match); err != nil {
		return nil, err
	}

	// First match auto-promotes the RFQ to 'matched' if it was still open or
	// in_review. Doesn't override admin-set fulfilled/closed.
	if rfq.Status == StatusOpen || rfq.Status == StatusInReview {
		_ = s.repo.Update(ctx, rfqID, map[string]any{"status": StatusMatched})
	}

	return match, nil
}

func (s *Service) DeleteMatch(ctx context.Context, matchID string) error {
	return s.repo.DeleteMatch(ctx, matchID)
}

func parseDate(s string) *time.Time {
	if s == "" {
		return nil
	}
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return nil
	}
	return &t
}
