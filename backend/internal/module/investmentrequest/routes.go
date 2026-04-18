package investmentrequest

import (
	"github.com/gin-gonic/gin"
	"github.com/silkroadhub/backend/internal/middleware"
	"github.com/silkroadhub/backend/internal/session"
)

func RegisterRoutes(api *gin.RouterGroup, svc *Service, store *session.Store) {
	h := NewHandler(svc)

	// Any authenticated user can send a request, but only admins can read
	// cross-project data.
	api.POST("/investments/:id/requests", middleware.Auth(store), h.Create)
	api.GET("/investments/:id/requests", middleware.Auth(store), middleware.RequireRole("admin"), h.ListByProject)

	api.GET("/me/investment-requests", middleware.Auth(store), h.ListMine)

	adminGroup := api.Group("/investment-requests", middleware.Auth(store), middleware.RequireRole("admin"))
	{
		adminGroup.GET("", h.ListAll)
		adminGroup.PUT("/:id/status", h.UpdateStatus)
	}
}
