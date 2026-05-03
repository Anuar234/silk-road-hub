package dealintent

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
	dealID := c.Param("id")
	intents, err := h.svc.ListForDeal(c.Request.Context(), dealID)
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, intents)
}

func (h *Handler) Create(c *gin.Context) {
	sess := middleware.GetSession(c)
	var in CreateInput
	if err := c.ShouldBindJSON(&in); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	intent, err := h.svc.Create(c.Request.Context(), c.Param("id"), sess.UserID, &in)
	if err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusCreated, intent)
}

func (h *Handler) Sign(c *gin.Context) {
	sess := middleware.GetSession(c)
	var body struct {
		Side string `json:"side"`
	}
	_ = c.ShouldBindJSON(&body)
	intent, err := h.svc.Sign(c.Request.Context(), c.Param("intentId"), sess.Role, body.Side)
	if err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, intent)
}

func (h *Handler) Cancel(c *gin.Context) {
	intent, err := h.svc.Cancel(c.Request.Context(), c.Param("intentId"))
	if err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, intent)
}
