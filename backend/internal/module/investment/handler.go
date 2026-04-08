package investment

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
	projects, err := h.svc.List(c.Request.Context())
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, projects)
}

func (h *Handler) Get(c *gin.Context) {
	p, err := h.svc.GetByID(c.Request.Context(), c.Param("id"))
	if err != nil || p == nil {
		apierror.NotFound(c, "project not found")
		return
	}
	apierror.OK(c, http.StatusOK, p)
}

func (h *Handler) Create(c *gin.Context) {
	var in CreateInput
	if err := c.ShouldBindJSON(&in); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	p, err := h.svc.Create(c.Request.Context(), &in)
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusCreated, p)
}

func (h *Handler) Update(c *gin.Context) {
	var in UpdateInput
	if err := c.ShouldBindJSON(&in); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	p, err := h.svc.Update(c.Request.Context(), c.Param("id"), &in)
	if err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, p)
}
