package auth

import (
	"github.com/gin-gonic/gin"
	"github.com/silkroadhub/backend/internal/config"
	"github.com/silkroadhub/backend/internal/middleware"
	"github.com/silkroadhub/backend/internal/session"
)

func RegisterRoutes(api *gin.RouterGroup, svc *Service, store *session.Store, cfg *config.Config) {
	h := NewHandler(svc, store, cfg)

	auth := api.Group("/auth")
	{
		auth.GET("/csrf", h.GetCSRF)
		auth.POST("/register", h.Register)
		auth.POST("/login", h.Login)
		auth.POST("/logout", middleware.Auth(store), h.Logout)
		auth.GET("/me", middleware.Auth(store), h.Me)
		auth.PUT("/profile", middleware.Auth(store), h.UpdateProfile)
		auth.POST("/verify-email", h.VerifyEmail)
		auth.POST("/resend-verification", middleware.Auth(store), h.ResendVerification)
	}
}
