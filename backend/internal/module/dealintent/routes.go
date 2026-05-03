package dealintent

import (
	"github.com/gin-gonic/gin"
	"github.com/silkroadhub/backend/internal/middleware"
	"github.com/silkroadhub/backend/internal/session"
)

func RegisterRoutes(api *gin.RouterGroup, svc *Service, store *session.Store) {
	h := NewHandler(svc)

	// Listed nested under /deals so the parent deal id is in the path. Sign /
	// cancel are top-level on /intents/:intentId so the URL stays short and
	// the same operation works regardless of which deal the intent belongs to.
	deals := api.Group("/deals", middleware.Auth(store))
	{
		deals.GET("/:id/intents", h.List)
		deals.POST("/:id/intents", middleware.RequireRole("buyer", "seller", "admin"), h.Create)
	}

	intents := api.Group("/intents", middleware.Auth(store))
	{
		intents.PUT("/:intentId/sign", middleware.RequireRole("buyer", "seller", "admin"), h.Sign)
		intents.PUT("/:intentId/cancel", middleware.RequireRole("buyer", "seller", "admin"), h.Cancel)
	}
}
