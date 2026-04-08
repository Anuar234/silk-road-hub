package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/silkroadhub/backend/internal/pkg/apierror"
	"github.com/silkroadhub/backend/internal/session"
)

const (
	CtxSession = "session"
	CtxSID     = "sessionId"
)

func Auth(store *session.Store) gin.HandlerFunc {
	return func(c *gin.Context) {
		sid, err := c.Cookie("srh_session")
		if err != nil || sid == "" {
			apierror.Unauthorized(c, "")
			c.Abort()
			return
		}

		data, err := store.Get(c.Request.Context(), sid)
		if err != nil || data == nil {
			apierror.Unauthorized(c, "")
			c.Abort()
			return
		}

		c.Set(CtxSession, data)
		c.Set(CtxSID, sid)

		_ = store.Touch(c.Request.Context(), sid)

		c.Next()
	}
}

func OptionalAuth(store *session.Store) gin.HandlerFunc {
	return func(c *gin.Context) {
		sid, err := c.Cookie("srh_session")
		if err != nil || sid == "" {
			c.Next()
			return
		}

		data, err := store.Get(c.Request.Context(), sid)
		if err == nil && data != nil {
			c.Set(CtxSession, data)
			c.Set(CtxSID, sid)
			_ = store.Touch(c.Request.Context(), sid)
		}

		c.Next()
	}
}

func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		raw, exists := c.Get(CtxSession)
		if !exists {
			apierror.Unauthorized(c, "")
			c.Abort()
			return
		}

		sess := raw.(*session.Data)
		for _, r := range roles {
			if sess.Role == r {
				c.Next()
				return
			}
		}

		apierror.Forbidden(c, "insufficient role")
		c.Abort()
	}
}

func GetSession(c *gin.Context) *session.Data {
	raw, exists := c.Get(CtxSession)
	if !exists {
		return nil
	}
	return raw.(*session.Data)
}
