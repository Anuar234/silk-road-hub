package user

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

func (h *Handler) List(c *gin.Context) {
	users, err := h.svc.ListAll(c.Request.Context())
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, users)
}

func (h *Handler) UpdateRole(c *gin.Context) {
	id := c.Param("id")
	var body struct {
		Role string `json:"role" binding:"required,oneof=buyer seller investor institutional admin"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}

	u, err := h.svc.UpdateRole(c.Request.Context(), id, body.Role)
	if err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, u)
}

func (h *Handler) Verify(c *gin.Context) {
	id := c.Param("id")
	var body struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}

	u, err := h.svc.Verify(c.Request.Context(), id, body.Status)
	if err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}

	apierror.OK(c, http.StatusOK, u)
}

func (h *Handler) AttachDoc(c *gin.Context) {
	id := c.Param("id")

	sess := middleware.GetSession(c)
	if sess == nil {
		apierror.Unauthorized(c, "")
		return
	}
	if sess.Role != "admin" && sess.UserID != id {
		apierror.Forbidden(c, "can only attach docs to your own profile")
		return
	}

	var body struct {
		FileID string `json:"fileId" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}

	u, err := h.svc.AttachDoc(c.Request.Context(), id, body.FileID)
	if err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}

	apierror.OK(c, http.StatusOK, u)
}
