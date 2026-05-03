package messaging

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

func (h *Handler) ListMine(c *gin.Context) {
	sess := middleware.GetSession(c)
	threads, err := h.svc.ListMine(c.Request.Context(), sess.UserID)
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, threads)
}

func (h *Handler) Create(c *gin.Context) {
	sess := middleware.GetSession(c)
	var in CreateThreadInput
	if err := c.ShouldBindJSON(&in); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	t, err := h.svc.FindOrCreateThread(c.Request.Context(), sess.UserID, sess.Role, in.CounterpartID, in.ProductID)
	if err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, t)
}

func (h *Handler) Get(c *gin.Context) {
	sess := middleware.GetSession(c)
	t, err := h.svc.GetThread(c.Request.Context(), c.Param("id"))
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	if t == nil || !h.svc.CanAccess(t, sess.UserID, sess.Role) {
		apierror.NotFound(c, "thread not found")
		return
	}
	apierror.OK(c, http.StatusOK, t)
}

func (h *Handler) ListMessages(c *gin.Context) {
	sess := middleware.GetSession(c)
	msgs, err := h.svc.ListMessages(c.Request.Context(), c.Param("id"), sess.UserID, sess.Role)
	if err != nil {
		apierror.NotFound(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, msgs)
}

func (h *Handler) PostMessage(c *gin.Context) {
	sess := middleware.GetSession(c)
	var in CreateMessageInput
	if err := c.ShouldBindJSON(&in); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	m, err := h.svc.AddMessage(c.Request.Context(), c.Param("id"), sess.UserID, sess.Role, in.Body)
	if err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusCreated, m)
}

func (h *Handler) MarkRead(c *gin.Context) {
	sess := middleware.GetSession(c)
	if err := h.svc.MarkRead(c.Request.Context(), c.Param("id"), sess.UserID, sess.Role); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
