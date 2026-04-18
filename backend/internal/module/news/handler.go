package news

import (
	"errors"
	"net/http"
	"strconv"

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

// GET /api/news — public, только published.
func (h *Handler) ListPublic(c *gin.Context) {
	f := &ListFilter{Status: "published", Tag: c.Query("tag")}
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
	items, err := h.svc.List(c.Request.Context(), f)
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, items)
}

// GET /api/news/:slug — public, только published.
func (h *Handler) GetPublic(c *gin.Context) {
	a, err := h.svc.GetBySlug(c.Request.Context(), c.Param("slug"))
	if err != nil || a == nil || a.Status != "published" {
		apierror.NotFound(c, "article not found")
		return
	}
	apierror.OK(c, http.StatusOK, a)
}

// GET /api/admin/news — admin, все статусы.
func (h *Handler) ListAdmin(c *gin.Context) {
	f := &ListFilter{Status: c.Query("status"), Tag: c.Query("tag")}
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
	items, err := h.svc.List(c.Request.Context(), f)
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, items)
}

// GET /api/admin/news/:id — admin, любой статус.
func (h *Handler) GetAdmin(c *gin.Context) {
	a, err := h.svc.GetByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			apierror.NotFound(c, "article not found")
			return
		}
		apierror.Internal(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, a)
}

// POST /api/admin/news — admin.
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
	a, err := h.svc.Create(c.Request.Context(), sess.UserID, &in)
	if err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusCreated, a)
}

// PUT /api/admin/news/:id — admin.
func (h *Handler) Update(c *gin.Context) {
	var in UpdateInput
	if err := c.ShouldBindJSON(&in); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	a, err := h.svc.Update(c.Request.Context(), c.Param("id"), &in)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			apierror.NotFound(c, "article not found")
			return
		}
		apierror.BadRequest(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, a)
}

// DELETE /api/admin/news/:id — admin.
func (h *Handler) Delete(c *gin.Context) {
	if err := h.svc.Delete(c.Request.Context(), c.Param("id")); err != nil {
		if errors.Is(err, ErrNotFound) {
			apierror.NotFound(c, "article not found")
			return
		}
		apierror.Internal(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, nil)
}
