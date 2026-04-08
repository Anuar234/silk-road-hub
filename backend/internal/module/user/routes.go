package user

import (
	"github.com/gin-gonic/gin"
	"github.com/silkroadhub/backend/internal/middleware"
	"github.com/silkroadhub/backend/internal/session"
)

func RegisterRoutes(api *gin.RouterGroup, svc *Service, store *session.Store) {
	h := NewHandler(svc)

	users := api.Group("/users", middleware.Auth(store))
	{
		users.GET("", middleware.RequireRole("admin"), h.List)
		users.PUT("/:id/verify", middleware.RequireRole("admin"), h.Verify)
		users.POST("/:id/docs", h.AttachDoc)
	}
}
