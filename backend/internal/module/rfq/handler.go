package rfq

import (
	"errors"
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
	sess := middleware.GetSession(c)
	status := c.Query("status")
	rfqs, err := h.svc.List(c.Request.Context(), sess.Role, sess.UserID, status)
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, rfqs)
}

func (h *Handler) Get(c *gin.Context) {
	sess := middleware.GetSession(c)
	r, err := h.svc.Get(c.Request.Context(), c.Param("id"))
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	if r == nil {
		apierror.NotFound(c, "rfq not found")
		return
	}
	if !canSee(sess.Role, sess.UserID, r) {
		apierror.NotFound(c, "rfq not found")
		return
	}
	apierror.OK(c, http.StatusOK, r)
}

func canSee(role, userID string, r *Rfq) bool {
	switch role {
	case "admin", "institutional":
		return true
	case "buyer":
		return r.BuyerID == userID
	case "seller":
		// Sellers browse all active RFQs as a marketplace; closed/fulfilled
		// rows are only visible to them if they were curated as a match.
		if r.Status != "fulfilled" && r.Status != "closed" {
			return true
		}
		for _, m := range r.Matches {
			if m.SellerID == userID {
				return true
			}
		}
		return false
	}
	return false
}

func (h *Handler) Create(c *gin.Context) {
	sess := middleware.GetSession(c)
	var in CreateInput
	if err := c.ShouldBindJSON(&in); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	r, err := h.svc.Create(c.Request.Context(), sess.UserID, &in)
	if err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusCreated, r)
}

func (h *Handler) Update(c *gin.Context) {
	sess := middleware.GetSession(c)
	var in UpdateInput
	if err := c.ShouldBindJSON(&in); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	r, err := h.svc.Update(c.Request.Context(), c.Param("id"), sess.Role, sess.UserID, &in)
	if err != nil {
		switch {
		case errors.Is(err, errors.New("forbidden")):
			apierror.Forbidden(c, err.Error())
		default:
			apierror.BadRequest(c, err.Error())
		}
		return
	}
	apierror.OK(c, http.StatusOK, r)
}

func (h *Handler) AddMatch(c *gin.Context) {
	sess := middleware.GetSession(c)
	var in AddMatchInput
	if err := c.ShouldBindJSON(&in); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	m, err := h.svc.AddMatch(c.Request.Context(), c.Param("id"), sess.UserID, &in)
	if err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusCreated, m)
}

func (h *Handler) DeleteMatch(c *gin.Context) {
	if err := h.svc.DeleteMatch(c.Request.Context(), c.Param("matchId")); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, gin.H{"ok": true})
}
