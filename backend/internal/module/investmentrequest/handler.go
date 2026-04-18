package investmentrequest

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/silkroadhub/backend/internal/middleware"
	"github.com/silkroadhub/backend/internal/pkg/apierror"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// POST /api/investments/:id/requests — investor sends a request against a project.
func (h *Handler) Create(c *gin.Context) {
	sess := middleware.GetSession(c)
	if sess == nil {
		apierror.Unauthorized(c, "")
		return
	}

	var in CreateInput
	if err := c.ShouldBindJSON(&in); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}

	req, err := h.svc.Create(c.Request.Context(), c.Param("id"), sess.UserID, &in)
	if err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusCreated, req)
}

// GET /api/me/investment-requests — list requests the caller has sent.
func (h *Handler) ListMine(c *gin.Context) {
	sess := middleware.GetSession(c)
	if sess == nil {
		apierror.Unauthorized(c, "")
		return
	}

	items, err := h.svc.ListByInvestor(c.Request.Context(), sess.UserID)
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	if items == nil {
		items = []*Request{}
	}
	apierror.OK(c, http.StatusOK, items)
}

// GET /api/investments/:id/requests — list all requests for a project (admin-only for now).
func (h *Handler) ListByProject(c *gin.Context) {
	items, err := h.svc.ListByProject(c.Request.Context(), c.Param("id"))
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	if items == nil {
		items = []*Request{}
	}
	apierror.OK(c, http.StatusOK, items)
}

// GET /api/investment-requests — admin view of everything.
func (h *Handler) ListAll(c *gin.Context) {
	items, err := h.svc.ListAll(c.Request.Context())
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	if items == nil {
		items = []*Request{}
	}
	apierror.OK(c, http.StatusOK, items)
}

// PUT /api/investment-requests/:id/status — admin updates status.
func (h *Handler) UpdateStatus(c *gin.Context) {
	var in UpdateStatusInput
	if err := c.ShouldBindJSON(&in); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	if err := h.svc.UpdateStatus(c.Request.Context(), c.Param("id"), in.Status); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, nil)
}
