package audit

import "context"

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Record(ctx context.Context, e *Entry) error {
	return s.repo.Insert(ctx, e)
}

func (s *Service) List(ctx context.Context, f *ListFilters) ([]*Entry, error) {
	return s.repo.List(ctx, f)
}
