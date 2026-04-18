package news

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, authorID string, in *CreateInput) (*Article, error) {
	slug := strings.TrimSpace(in.Slug)
	if slug == "" {
		return nil, fmt.Errorf("slug required")
	}
	exists, err := s.repo.SlugExists(ctx, slug, "")
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, fmt.Errorf("slug already exists")
	}

	status := in.Status
	if status == "" {
		status = "draft"
	}
	var publishedAt *time.Time
	if status == "published" {
		now := time.Now().UTC()
		publishedAt = &now
	}
	tags := in.Tags
	if tags == nil {
		tags = []string{}
	}

	var author *string
	if authorID != "" {
		author = &authorID
	}

	a := &Article{
		Slug:        slug,
		Title:       in.Title,
		Summary:     in.Summary,
		Body:        in.Body,
		CoverFileID: in.CoverFileID,
		Status:      status,
		AuthorID:    author,
		Tags:        tags,
		PublishedAt: publishedAt,
	}
	if err := s.repo.Create(ctx, a); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, a.ID)
}

func (s *Service) GetByID(ctx context.Context, id string) (*Article, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) GetBySlug(ctx context.Context, slug string) (*Article, error) {
	return s.repo.GetBySlug(ctx, slug)
}

func (s *Service) List(ctx context.Context, f *ListFilter) ([]*Article, error) {
	return s.repo.List(ctx, f)
}

func (s *Service) Update(ctx context.Context, id string, in *UpdateInput) (*Article, error) {
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	sets := map[string]any{}
	if in.Title != nil {
		sets["title"] = *in.Title
	}
	if in.Summary != nil {
		sets["summary"] = *in.Summary
	}
	if in.Body != nil {
		sets["body"] = *in.Body
	}
	if in.CoverFileID != nil {
		sets["cover_file_id"] = in.CoverFileID
	}
	if in.Tags != nil {
		sets["tags"] = in.Tags
	}
	if in.Slug != nil {
		newSlug := strings.TrimSpace(*in.Slug)
		if newSlug == "" {
			return nil, fmt.Errorf("slug required")
		}
		if newSlug != existing.Slug {
			exists, err := s.repo.SlugExists(ctx, newSlug, id)
			if err != nil {
				return nil, err
			}
			if exists {
				return nil, fmt.Errorf("slug already exists")
			}
			sets["slug"] = newSlug
		}
	}
	if in.Status != nil {
		sets["status"] = *in.Status
		// First publish — set published_at.
		if *in.Status == "published" && existing.PublishedAt == nil {
			now := time.Now().UTC()
			sets["published_at"] = now
		}
	}

	if err := s.repo.Update(ctx, id, sets); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, id)
}

func (s *Service) Delete(ctx context.Context, id string) error {
	_, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			return err
		}
		return err
	}
	return s.repo.Delete(ctx, id)
}
