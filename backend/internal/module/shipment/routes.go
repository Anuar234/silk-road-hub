package shipment

import (
	"github.com/gin-gonic/gin"
	"github.com/silkroadhub/backend/internal/middleware"
	"github.com/silkroadhub/backend/internal/session"
)

func RegisterRoutes(api *gin.RouterGroup, svc *Service, store *session.Store) {
	h := NewHandler(svc)

	shipments := api.Group("/shipments", middleware.Auth(store))
	{
		shipments.GET("", h.List)
		shipments.GET("/:id", h.Get)
		shipments.POST("", h.Create)
		shipments.PUT("/:id", h.Update)
	}
}
