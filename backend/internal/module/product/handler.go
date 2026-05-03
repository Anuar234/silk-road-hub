package product

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
	sess := middleware.GetSession(c)
	f := ListFilter{}

	switch sess.Role {
	case "seller":
		f.SellerID = sess.UserID
	case "buyer":
		f.Status = "published"
	case "admin":
		if s := c.Query("status"); s != "" {
			f.Status = s
		}
	}

	if s := c.Query("sectorId"); s != "" {
		f.SectorID = s
	}

	products, err := h.svc.List(c.Request.Context(), f)
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, products)
}

func (h *Handler) Get(c *gin.Context) {
	p, err := h.svc.GetByID(c.Request.Context(), c.Param("id"))
	if err != nil || p == nil {
		apierror.NotFound(c, "product not found")
		return
	}

	sess := middleware.GetSession(c)
	if p.Status != "published" {
		if sess == nil {
			apierror.NotFound(c, "product not found")
			return
		}
		if sess.Role == "seller" && p.SellerID != sess.UserID {
			apierror.NotFound(c, "product not found")
			return
		}
		if sess.Role == "buyer" {
			apierror.NotFound(c, "product not found")
			return
		}
	}

	apierror.OK(c, http.StatusOK, p)
}

func (h *Handler) Create(c *gin.Context) {
	sess := middleware.GetSession(c)
	var in CreateInput
	if err := c.ShouldBindJSON(&in); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}

	p, err := h.svc.Create(c.Request.Context(), &in, sess.UserID)
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusCreated, p)
}

func (h *Handler) Update(c *gin.Context) {
	sess := middleware.GetSession(c)
	var in UpdateInput
	if err := c.ShouldBindJSON(&in); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}

	p, err := h.svc.Update(c.Request.Context(), c.Param("id"), &in, sess.Role, sess.UserID)
	if err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, p)
}

func (h *Handler) Delete(c *gin.Context) {
	sess := middleware.GetSession(c)
	if err := h.svc.Delete(c.Request.Context(), c.Param("id"), sess.Role, sess.UserID); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, nil)
}

func (h *Handler) Submit(c *gin.Context) {
	sess := middleware.GetSession(c)
	if err := h.svc.SubmitForModeration(c.Request.Context(), c.Param("id"), sess.UserID); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, nil)
}

func (h *Handler) Archive(c *gin.Context) {
	sess := middleware.GetSession(c)
	if err := h.svc.Archive(c.Request.Context(), c.Param("id"), sess.Role, sess.UserID); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, nil)
}

func (h *Handler) Unarchive(c *gin.Context) {
	sess := middleware.GetSession(c)
	if err := h.svc.Unarchive(c.Request.Context(), c.Param("id"), sess.Role, sess.UserID); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, nil)
}
