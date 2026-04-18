package audit

import (
	"net/http"
	"strconv"
	"time"

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
	f := &ListFilters{}

	if v := c.Query("userId"); v != "" {
		f.UserID = &v
	}
	if v := c.Query("method"); v != "" {
		f.Method = &v
	}
	if v := c.Query("from"); v != "" {
		if t, err := time.Parse(time.RFC3339, v); err == nil {
			f.From = &t
		}
	}
	if v := c.Query("to"); v != "" {
		if t, err := time.Parse(time.RFC3339, v); err == nil {
			f.To = &t
		}
	}
	if v := c.Query("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			f.Limit = n
		}
	}
	if v := c.Query("offset"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n >= 0 {
			f.Offset = n
		}
	}

	entries, err := h.svc.List(c.Request.Context(), f)
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	if entries == nil {
		entries = []*Entry{}
	}
	apierror.OK(c, http.StatusOK, entries)
}
