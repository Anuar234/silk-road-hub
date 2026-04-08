package file

import (
	"github.com/gin-gonic/gin"
	"github.com/silkroadhub/backend/internal/middleware"
	"github.com/silkroadhub/backend/internal/session"
)

func RegisterRoutes(api *gin.RouterGroup, svc *Service, store *session.Store) {
	h := NewHandler(svc)

	files := api.Group("/files", middleware.Auth(store))
	{
		files.POST("", h.Upload)
		files.GET("/:id", h.Download)
	}
}
