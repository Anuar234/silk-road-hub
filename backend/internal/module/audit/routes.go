package audit

import (
	"github.com/gin-gonic/gin"
	"github.com/silkroadhub/backend/internal/middleware"
	"github.com/silkroadhub/backend/internal/session"
)

func RegisterRoutes(api *gin.RouterGroup, svc *Service, store *session.Store) {
	h := NewHandler(svc)

	admin := api.Group("/admin", middleware.Auth(store), middleware.RequireRole("admin"))
	{
		admin.GET("/audit-log", h.List)
	}
}
