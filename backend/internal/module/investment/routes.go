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
		// "/mine" must be registered BEFORE "/:id" to win the matcher.
		inv.GET("/mine", middleware.Auth(store), middleware.RequireRole("investor", "admin"), h.ListMine)
		inv.GET("/:id", h.Get)
		// ТЗ §4.3 — investors place projects; admins (and Kazakh Invest curators
		// acting via admin) handle curated projects. Sellers do not create
		// investment projects, despite the legacy enum value.
		inv.POST("", middleware.Auth(store), middleware.RequireRole("investor", "admin"), h.Create)
		// Service-level ownership check ensures investors can only edit their
		// own projects; admins keep full access.
		inv.PUT("/:id", middleware.Auth(store), middleware.RequireRole("investor", "admin"), h.Update)
	}
}
