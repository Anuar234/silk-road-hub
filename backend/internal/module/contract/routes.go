package contract

import (
	"github.com/gin-gonic/gin"
	"github.com/silkroadhub/backend/internal/middleware"
	"github.com/silkroadhub/backend/internal/session"
)

func RegisterRoutes(api *gin.RouterGroup, svc *Service, store *session.Store) {
	h := NewHandler(svc)

	contracts := api.Group("/contracts", middleware.Auth(store))
	{
		contracts.GET("", h.List)
		contracts.GET("/:id", h.Get)
		contracts.POST("", middleware.RequireRole("seller", "buyer", "admin"), h.Create)
		contracts.PUT("/:id", h.Update)
	}
}
