package reference

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

func (h *Handler) ListCountries(c *gin.Context) {
	items, err := h.svc.ListCountries(c.Request.Context())
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, items)
}

func (h *Handler) ListRegions(c *gin.Context) {
	countryCode := c.Query("countryCode")
	items, err := h.svc.ListRegions(c.Request.Context(), countryCode)
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, items)
}

func (h *Handler) ListCategories(c *gin.Context) {
	items, err := h.svc.ListCategories(c.Request.Context())
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, items)
}
