package file

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

func (h *Handler) Upload(c *gin.Context) {
	sess := middleware.GetSession(c)
	if sess == nil {
		apierror.Unauthorized(c, "")
		return
	}

	header, err := c.FormFile("file")
	if err != nil {
		apierror.BadRequest(c, "file required")
		return
	}

	f, err := h.svc.Upload(c.Request.Context(), header, sess.UserID)
	if err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}

	apierror.OK(c, http.StatusCreated, f)
}

func (h *Handler) Download(c *gin.Context) {
	id := c.Param("id")

	f, err := h.svc.GetByID(c.Request.Context(), id)
	if err != nil {
		apierror.NotFound(c, "file not found")
		return
	}

	c.Header("Content-Disposition", "attachment; filename=\""+f.OriginalName+"\"")
	c.File(f.StoragePath)
}
