package auth

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/silkroadhub/backend/internal/config"
	"github.com/silkroadhub/backend/internal/middleware"
	"github.com/silkroadhub/backend/internal/pkg/apierror"
	"github.com/silkroadhub/backend/internal/session"
)

type Handler struct {
	svc       *Service
	sessStore *session.Store
	cfg       *config.Config
}

func NewHandler(svc *Service, sessStore *session.Store, cfg *config.Config) *Handler {
	return &Handler{svc: svc, sessStore: sessStore, cfg: cfg}
}

func (h *Handler) GetCSRF(c *gin.Context) {
	token := generateToken(32)
	c.SetCookie("XSRF-TOKEN", token, int(h.cfg.SessionTTL.Seconds()), "/", "", h.cfg.SecureCookies, false)
	c.JSON(http.StatusOK, gin.H{"csrfToken": token})
}

func (h *Handler) Register(c *gin.Context) {
	var in RegisterInput
	if err := c.ShouldBindJSON(&in); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}

	u, err := h.svc.Register(c.Request.Context(), &in)
	if err != nil {
		apierror.Conflict(c, err.Error())
		return
	}

	sid, err := h.createSession(c, u)
	if err != nil {
		apierror.Internal(c, "session error")
		return
	}
	h.setSessionCookie(c, sid)

	c.JSON(http.StatusCreated, gin.H{"ok": true, "data": u.ToPayload()})
}

func (h *Handler) Login(c *gin.Context) {
	var in LoginInput
	if err := c.ShouldBindJSON(&in); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}

	u, err := h.svc.Authenticate(c.Request.Context(), in.Email, in.Password)
	if err != nil {
		apierror.Unauthorized(c, "invalid credentials")
		return
	}

	sid, err := h.createSession(c, u)
	if err != nil {
		apierror.Internal(c, "session error")
		return
	}
	h.setSessionCookie(c, sid)

	c.JSON(http.StatusOK, gin.H{"user": u.ToPayload()})
}

func (h *Handler) Logout(c *gin.Context) {
	sid, _ := c.Get(middleware.CtxSID)
	if sid != nil {
		_ = h.sessStore.Delete(c.Request.Context(), sid.(string))
	}
	c.SetCookie("srh_session", "", -1, "/", "", h.cfg.SecureCookies, true)
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *Handler) Me(c *gin.Context) {
	sess := middleware.GetSession(c)
	if sess == nil {
		apierror.Unauthorized(c, "")
		return
	}

	u, err := h.svc.GetByID(c.Request.Context(), sess.UserID)
	if err != nil || u == nil {
		apierror.Unauthorized(c, "user not found")
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": u.ToPayload()})
}

func (h *Handler) createSession(c *gin.Context, u *User) (string, error) {
	csrfToken := generateToken(32)
	c.SetCookie("XSRF-TOKEN", csrfToken, int(h.cfg.SessionTTL.Seconds()), "/", "", h.cfg.SecureCookies, false)

	data := &session.Data{
		UserID:    u.ID,
		Email:     u.Email,
		Role:      u.Role,
		Name:      u.DisplayName,
		CSRFToken: csrfToken,
	}
	return h.sessStore.Create(c.Request.Context(), data)
}

func (h *Handler) setSessionCookie(c *gin.Context, sid string) {
	c.SetCookie("srh_session", sid, int(h.cfg.SessionTTL.Seconds()), "/", "", h.cfg.SecureCookies, true)
}

func generateToken(n int) string {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
