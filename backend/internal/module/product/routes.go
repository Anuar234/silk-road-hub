package product

import (
	"github.com/gin-gonic/gin"
	"github.com/silkroadhub/backend/internal/middleware"
	"github.com/silkroadhub/backend/internal/session"
)

func RegisterRoutes(api *gin.RouterGroup, svc *Service, store *session.Store) {
	h := NewHandler(svc)

	products := api.Group("/products")
	{
		products.GET("", middleware.Auth(store), h.List)
		products.POST("", middleware.Auth(store), middleware.RequireRole("seller"), h.Create)
		products.GET("/:id", middleware.OptionalAuth(store), h.Get)
		products.PUT("/:id", middleware.Auth(store), middleware.RequireRole("seller", "admin"), h.Update)
		products.DELETE("/:id", middleware.Auth(store), middleware.RequireRole("seller", "admin"), h.Delete)
		products.POST("/:id/submit", middleware.Auth(store), middleware.RequireRole("seller"), h.Submit)
	}
}
