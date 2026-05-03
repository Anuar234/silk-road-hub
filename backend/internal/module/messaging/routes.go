package messaging

import (
	"github.com/gin-gonic/gin"
	"github.com/silkroadhub/backend/internal/middleware"
	"github.com/silkroadhub/backend/internal/session"
)

func RegisterRoutes(api *gin.RouterGroup, svc *Service, store *session.Store) {
	h := NewHandler(svc)

	g := api.Group("/messaging", middleware.Auth(store))
	{
		g.GET("/threads", h.ListMine)
		g.POST("/threads", h.Create)
		g.GET("/threads/:id", h.Get)
		g.GET("/threads/:id/messages", h.ListMessages)
		g.POST("/threads/:id/messages", h.PostMessage)
		g.POST("/threads/:id/read", h.MarkRead)
	}
}
