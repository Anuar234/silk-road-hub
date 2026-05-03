package product

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// Status values mirror the product_status enum in PostgreSQL. ТЗ §5.2 surfaces
// four of them (Черновик/Опубликовано/В переговорах/Архивировано); 'moderation'
// and 'rejected' are internal transitions used by the admin moderation flow.
var validStatuses = map[string]bool{
	"draft":          true,
	"moderation":     true,
	"published":      true,
	"rejected":       true,
	"in_negotiation": true,
	"archived":       true,
}

func IsValidStatus(s string) bool { return validStatuses[s] }

func (s *Service) Create(ctx context.Context, in *CreateInput, sellerID string) (*Product, error) {
	p := &Product{
		ID:               uuid.NewString(),
		Slug:             slugify(in.Name),
		Name:             in.Name,
		Category:         in.Category,
		HSCode:           in.HSCode,
		MOQ:              in.MOQ,
		Incoterms:        in.Incoterms,
		Price:            in.Price,
		LeadTimeDays:     in.LeadTimeDays,
		Packaging:        in.Packaging,
		Description:      in.Description,
		ImageURLs:        coalesce(in.ImageURLs),
		SellerID:         sellerID,
		CountryCode:      in.CountryCode,
		RegionCode:       strPtr(in.RegionCode),
		SectorID:         in.SectorID,
		SubcategoryID:    in.SubcategoryID,
		Tags:             coalesce(in.Tags),
		SamplesAvailable: in.SamplesAvailable,
		PrivateLabel:     in.PrivateLabel,
		Status:           "draft",
	}

	if err := s.repo.Create(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *Service) GetByID(ctx context.Context, id string) (*Product, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) List(ctx context.Context, f ListFilter) ([]*Product, error) {
	return s.repo.List(ctx, f)
}

func (s *Service) Update(ctx context.Context, id string, in *UpdateInput, role, userID string) (*Product, error) {
	p, err := s.repo.GetByID(ctx, id)
	if err != nil || p == nil {
		return nil, fmt.Errorf("product not found")
	}

	if role == "seller" && p.SellerID != userID {
		return nil, fmt.Errorf("forbidden")
	}

	sets := buildUpdateSets(in, role)
	if len(sets) == 0 {
		return p, nil
	}

	if err := s.repo.Update(ctx, id, sets); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, id)
}

func (s *Service) Delete(ctx context.Context, id, role, userID string) error {
	p, err := s.repo.GetByID(ctx, id)
	if err != nil || p == nil {
		return fmt.Errorf("product not found")
	}
	if role == "seller" && p.SellerID != userID {
		return fmt.Errorf("forbidden")
	}
	return s.repo.Delete(ctx, id)
}

func (s *Service) SubmitForModeration(ctx context.Context, id, userID string) error {
	p, err := s.repo.GetByID(ctx, id)
	if err != nil || p == nil {
		return fmt.Errorf("product not found")
	}
	if p.SellerID != userID {
		return fmt.Errorf("forbidden")
	}
	if p.Status != "draft" && p.Status != "rejected" {
		return fmt.Errorf("can only submit draft or rejected products")
	}
	return s.repo.Update(ctx, id, map[string]any{"status": "moderation"})
}

// Archive moves a product to 'archived'. Sellers may archive their own products
// from any non-archived state; admins may archive any product. ТЗ §5.2 requires
// archiving with the option to restore.
func (s *Service) Archive(ctx context.Context, id, role, userID string) error {
	p, err := s.repo.GetByID(ctx, id)
	if err != nil || p == nil {
		return fmt.Errorf("product not found")
	}
	if role != "admin" && p.SellerID != userID {
		return fmt.Errorf("forbidden")
	}
	if p.Status == "archived" {
		return fmt.Errorf("product already archived")
	}
	return s.repo.Update(ctx, id, map[string]any{"status": "archived"})
}

// Unarchive restores an archived product back to 'draft' so the seller can
// review it before resubmitting for moderation.
func (s *Service) Unarchive(ctx context.Context, id, role, userID string) error {
	p, err := s.repo.GetByID(ctx, id)
	if err != nil || p == nil {
		return fmt.Errorf("product not found")
	}
	if role != "admin" && p.SellerID != userID {
		return fmt.Errorf("forbidden")
	}
	if p.Status != "archived" {
		return fmt.Errorf("product is not archived")
	}
	return s.repo.Update(ctx, id, map[string]any{"status": "draft"})
}

// MarkInNegotiation flags a product as currently being negotiated. Intended to
// be invoked by the deal module when a deal opens against the product.
func (s *Service) MarkInNegotiation(ctx context.Context, id string) error {
	p, err := s.repo.GetByID(ctx, id)
	if err != nil || p == nil {
		return fmt.Errorf("product not found")
	}
	if p.Status == "archived" {
		return fmt.Errorf("cannot negotiate on archived product")
	}
	if p.Status == "in_negotiation" {
		return nil
	}
	return s.repo.Update(ctx, id, map[string]any{"status": "in_negotiation"})
}

func buildUpdateSets(in *UpdateInput, role string) map[string]any {
	sets := make(map[string]any)
	if in.Name != nil {
		sets["name"] = *in.Name
		sets["slug"] = slugify(*in.Name)
	}
	if in.Category != nil {
		sets["category"] = *in.Category
	}
	if in.HSCode != nil {
		sets["hs_code"] = *in.HSCode
	}
	if in.MOQ != nil {
		sets["moq"] = *in.MOQ
	}
	if in.Incoterms != nil {
		sets["incoterms"] = *in.Incoterms
	}
	if in.Price != nil {
		sets["price"] = *in.Price
	}
	if in.LeadTimeDays != nil {
		sets["lead_time_days"] = *in.LeadTimeDays
	}
	if in.Packaging != nil {
		sets["packaging"] = *in.Packaging
	}
	if in.Description != nil {
		sets["description"] = *in.Description
	}
	if in.ImageURLs != nil {
		sets["image_urls"] = in.ImageURLs
	}
	if in.CountryCode != nil {
		sets["country_code"] = *in.CountryCode
	}
	if in.RegionCode != nil {
		sets["region_code"] = *in.RegionCode
	}
	if in.SectorID != nil {
		sets["sector_id"] = *in.SectorID
	}
	if in.SubcategoryID != nil {
		sets["subcategory_id"] = *in.SubcategoryID
	}
	if in.Tags != nil {
		sets["tags"] = in.Tags
	}
	if in.SamplesAvailable != nil {
		sets["samples_available"] = *in.SamplesAvailable
	}
	if in.PrivateLabel != nil {
		sets["private_label"] = *in.PrivateLabel
	}
	// Only admin can change status and moderation comment. Status is validated
	// against the product_status enum to keep invalid values out of the DB.
	if role == "admin" {
		if in.Status != nil && validStatuses[*in.Status] {
			sets["status"] = *in.Status
		}
		if in.ModerationComment != nil {
			sets["moderation_comment"] = *in.ModerationComment
		}
	}
	return sets
}

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = strings.ReplaceAll(s, " ", "-")
	return s
}

func coalesce(s []string) []string {
	if s == nil {
		return []string{}
	}
	return s
}
