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
		// ТЗ §4.4 — institutional users (QazTrade and partners) need to read
		// the user list and approve/reject verification. Role changes remain
		// admin-only because they affect platform access scope.
		users.GET("", middleware.RequireRole("admin", "institutional"), h.List)
		users.PUT("/:id/verify", middleware.RequireRole("admin", "institutional"), h.Verify)
		users.PUT("/:id/role", middleware.RequireRole("admin"), h.UpdateRole)
		users.POST("/:id/docs", h.AttachDoc)
	}
}
