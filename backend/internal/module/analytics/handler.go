package analytics

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/silkroadhub/backend/internal/pkg/apierror"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Dashboard(c *gin.Context) {
	stats, err := h.svc.GetDashboard(c.Request.Context())
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": stats})
}

func (h *Handler) Statistics(c *gin.Context) {
	stats, err := h.svc.GetStatistics(c.Request.Context())
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": stats})
}
