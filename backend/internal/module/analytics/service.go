package analytics

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DashboardStats struct {
	TotalUsers      int              `json:"totalUsers"`
	TotalProducts   int              `json:"totalProducts"`
	TotalDeals      int              `json:"totalDeals"`
	TotalInvestments int             `json:"totalInvestments"`
	UsersByRole     []RoleCount      `json:"usersByRole"`
	ProductsByStatus []StatusCount   `json:"productsByStatus"`
	RecentUsers     int              `json:"recentUsers"`
}

type Statistics struct {
	DealsByStatus   []StatusCount    `json:"dealsByStatus"`
	DealsByCountry  []CountryCount   `json:"dealsByCountry"`
	ProductsBySector []SectorCount   `json:"productsBySector"`
	InvestByStage   []StatusCount    `json:"investmentsByStage"`
	InvestBySector  []SectorCount    `json:"investmentsBySector"`
	PendingVerifications int         `json:"pendingVerifications"`
}

type RoleCount struct {
	Role  string `json:"role"`
	Count int    `json:"count"`
}

type StatusCount struct {
	Status string `json:"status"`
	Count  int    `json:"count"`
}

type CountryCount struct {
	Country string `json:"country"`
	Count   int    `json:"count"`
}

type SectorCount struct {
	Sector string `json:"sector"`
	Count  int    `json:"count"`
}

type Service struct {
	pool *pgxpool.Pool
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool}
}

func (s *Service) GetDashboard(ctx context.Context) (*DashboardStats, error) {
	var stats DashboardStats

	s.pool.QueryRow(ctx, `SELECT COUNT(*) FROM users`).Scan(&stats.TotalUsers)
	s.pool.QueryRow(ctx, `SELECT COUNT(*) FROM products`).Scan(&stats.TotalProducts)
	s.pool.QueryRow(ctx, `SELECT COUNT(*) FROM deals`).Scan(&stats.TotalDeals)
	s.pool.QueryRow(ctx, `SELECT COUNT(*) FROM investment_projects`).Scan(&stats.TotalInvestments)
	s.pool.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days'`).Scan(&stats.RecentUsers)

	// Users by role
	rows, err := s.pool.Query(ctx, `SELECT role::text, COUNT(*) FROM users GROUP BY role`)
	if err != nil {
		return nil, fmt.Errorf("users by role: %w", err)
	}
	defer rows.Close()
	for rows.Next() {
		var rc RoleCount
		rows.Scan(&rc.Role, &rc.Count)
		stats.UsersByRole = append(stats.UsersByRole, rc)
	}

	// Products by status
	rows2, err := s.pool.Query(ctx, `SELECT status::text, COUNT(*) FROM products GROUP BY status`)
	if err != nil {
		return nil, fmt.Errorf("products by status: %w", err)
	}
	defer rows2.Close()
	for rows2.Next() {
		var sc StatusCount
		rows2.Scan(&sc.Status, &sc.Count)
		stats.ProductsByStatus = append(stats.ProductsByStatus, sc)
	}

	return &stats, nil
}

func (s *Service) GetStatistics(ctx context.Context) (*Statistics, error) {
	var stats Statistics

	s.pool.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE verification_status = 'pending'`).Scan(&stats.PendingVerifications)

	// Deals by status
	rows, _ := s.pool.Query(ctx, `SELECT status::text, COUNT(*) FROM deals GROUP BY status`)
	if rows != nil {
		defer rows.Close()
		for rows.Next() {
			var sc StatusCount
			rows.Scan(&sc.Status, &sc.Count)
			stats.DealsByStatus = append(stats.DealsByStatus, sc)
		}
	}

	// Deals by country
	rows2, _ := s.pool.Query(ctx, `SELECT destination_country, COUNT(*) FROM deals GROUP BY destination_country ORDER BY COUNT(*) DESC LIMIT 10`)
	if rows2 != nil {
		defer rows2.Close()
		for rows2.Next() {
			var cc CountryCount
			rows2.Scan(&cc.Country, &cc.Count)
			stats.DealsByCountry = append(stats.DealsByCountry, cc)
		}
	}

	// Products by sector
	rows3, _ := s.pool.Query(ctx, `SELECT sector_id, COUNT(*) FROM products GROUP BY sector_id ORDER BY COUNT(*) DESC`)
	if rows3 != nil {
		defer rows3.Close()
		for rows3.Next() {
			var sc SectorCount
			rows3.Scan(&sc.Sector, &sc.Count)
			stats.ProductsBySector = append(stats.ProductsBySector, sc)
		}
	}

	// Investments by stage
	rows4, _ := s.pool.Query(ctx, `SELECT stage::text, COUNT(*) FROM investment_projects GROUP BY stage`)
	if rows4 != nil {
		defer rows4.Close()
		for rows4.Next() {
			var sc StatusCount
			rows4.Scan(&sc.Status, &sc.Count)
			stats.InvestByStage = append(stats.InvestByStage, sc)
		}
	}

	// Investments by sector
	rows5, _ := s.pool.Query(ctx, `SELECT sector, COUNT(*) FROM investment_projects GROUP BY sector ORDER BY COUNT(*) DESC`)
	if rows5 != nil {
		defer rows5.Close()
		for rows5.Next() {
			var sc SectorCount
			rows5.Scan(&sc.Sector, &sc.Count)
			stats.InvestBySector = append(stats.InvestBySector, sc)
		}
	}

	return &stats, nil
}
