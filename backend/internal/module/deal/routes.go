package deal

import (
	"github.com/gin-gonic/gin"
	"github.com/silkroadhub/backend/internal/middleware"
	"github.com/silkroadhub/backend/internal/session"
)

func RegisterRoutes(api *gin.RouterGroup, svc *Service, store *session.Store) {
	h := NewHandler(svc)

	deals := api.Group("/deals", middleware.Auth(store))
	{
		deals.GET("/:id/payments", h.GetPayments)
		deals.POST("/:id/payments", h.CreatePaymentPlan)
		deals.PUT("/:id/payments", h.UpdatePaymentStage)
		deals.GET("/:id/guarantees", h.GetGuarantees)
		deals.PUT("/:id/guarantees", h.SetGuarantee)

		deals.GET("/:id/comments", h.ListComments)
		deals.POST("/:id/comments", h.CreateComment)
		deals.GET("/:id/documents", h.ListDocuments)
		deals.POST("/:id/documents", h.CreateDocument)
	}
}
