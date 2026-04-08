package analytics

import (
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/silkroadhub/backend/internal/middleware"
	"github.com/silkroadhub/backend/internal/session"
)

func RegisterRoutes(api *gin.RouterGroup, pool *pgxpool.Pool, store *session.Store) {
	svc := NewService(pool)
	h := NewHandler(svc)

	admin := api.Group("/admin", middleware.Auth(store), middleware.RequireRole("admin"))
	{
		admin.GET("/dashboard", h.Dashboard)
		admin.GET("/statistics", h.Statistics)
	}
}
