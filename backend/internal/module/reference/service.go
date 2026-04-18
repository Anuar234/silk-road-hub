package reference

import "context"

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListCountries(ctx context.Context) ([]*Country, error) {
	return s.repo.ListCountries(ctx)
}

func (s *Service) ListRegions(ctx context.Context, countryCode string) ([]*Region, error) {
	return s.repo.ListRegions(ctx, countryCode)
}

func (s *Service) ListCategories(ctx context.Context) ([]*Category, error) {
	return s.repo.ListCategories(ctx)
}
