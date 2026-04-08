package investment

import (
	"github.com/gin-gonic/gin"
	"github.com/silkroadhub/backend/internal/middleware"
	"github.com/silkroadhub/backend/internal/session"
)

func RegisterRoutes(api *gin.RouterGroup, svc *Service, store *session.Store) {
	h := NewHandler(svc)

	inv := api.Group("/investments")
	{
		inv.GET("", h.List)
		inv.GET("/:id", h.Get)
		inv.POST("", middleware.Auth(store), middleware.RequireRole("seller", "admin"), h.Create)
		inv.PUT("/:id", middleware.Auth(store), middleware.RequireRole("admin"), h.Update)
	}
}
