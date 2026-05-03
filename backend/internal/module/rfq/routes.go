package rfq

import (
	"github.com/gin-gonic/gin"
	"github.com/silkroadhub/backend/internal/middleware"
	"github.com/silkroadhub/backend/internal/session"
)

func RegisterRoutes(api *gin.RouterGroup, svc *Service, store *session.Store) {
	h := NewHandler(svc)

	g := api.Group("/rfqs", middleware.Auth(store))
	{
		// Reading: any authenticated role; service-level filtering decides what
		// each role actually sees (buyer = own, seller = matched, admin = all).
		g.GET("", h.List)
		g.GET("/:id", h.Get)

		// Creation: buyers only.
		g.POST("", middleware.RequireRole("buyer"), h.Create)

		// Update: buyer (own, while open) or admin. Service enforces details.
		g.PUT("/:id", middleware.RequireRole("buyer", "admin"), h.Update)

		// Match management: admin only.
		g.POST("/:id/matches", middleware.RequireRole("admin"), h.AddMatch)
		g.DELETE("/:id/matches/:matchId", middleware.RequireRole("admin"), h.DeleteMatch)
	}
}
