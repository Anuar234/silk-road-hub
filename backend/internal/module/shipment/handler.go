package shipment

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

func (h *Handler) List(c *gin.Context) {
	dealID := c.Query("dealId")
	shipments, err := h.svc.List(c.Request.Context(), dealID)
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, shipments)
}

func (h *Handler) Get(c *gin.Context) {
	sh, err := h.svc.GetByID(c.Request.Context(), c.Param("id"))
	if err != nil || sh == nil {
		apierror.NotFound(c, "shipment not found")
		return
	}
	apierror.OK(c, http.StatusOK, sh)
}

func (h *Handler) Create(c *gin.Context) {
	var in CreateInput
	if err := c.ShouldBindJSON(&in); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	sh, err := h.svc.Create(c.Request.Context(), &in)
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusCreated, sh)
}

func (h *Handler) ListRouteTemplates(c *gin.Context) {
	items, err := h.svc.ListRouteTemplates(c.Request.Context())
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, items)
}

func (h *Handler) Update(c *gin.Context) {
	var in UpdateInput
	if err := c.ShouldBindJSON(&in); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	sh, err := h.svc.Update(c.Request.Context(), c.Param("id"), &in)
	if err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, sh)
}
