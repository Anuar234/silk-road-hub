package news

import (
	"github.com/gin-gonic/gin"
	"github.com/silkroadhub/backend/internal/middleware"
	"github.com/silkroadhub/backend/internal/session"
)

func RegisterRoutes(api *gin.RouterGroup, svc *Service, store *session.Store) {
	h := NewHandler(svc)

	// Public endpoints — published articles only.
	api.GET("/news", h.ListPublic)
	api.GET("/news/:slug", h.GetPublic)

	// Admin endpoints — drafts, publication, tags, status workflow.
	admin := api.Group("/admin/news", middleware.Auth(store), middleware.RequireRole("admin"))
	{
		admin.GET("", h.ListAdmin)
		admin.POST("", h.Create)
		admin.GET("/:id", h.GetAdmin)
		admin.PUT("/:id", h.Update)
		admin.DELETE("/:id", h.Delete)
	}
}
