package middleware

import (
	"crypto/subtle"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/silkroadhub/backend/internal/pkg/apierror"
)

func CSRF() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == http.MethodGet ||
			c.Request.Method == http.MethodHead ||
			c.Request.Method == http.MethodOptions {
			c.Next()
			return
		}

		cookieToken, err := c.Cookie("XSRF-TOKEN")
		if err != nil || cookieToken == "" {
			apierror.Forbidden(c, "missing CSRF cookie")
			c.Abort()
			return
		}

		headerToken := c.GetHeader("X-CSRF-Token")
		if headerToken == "" {
			apierror.Forbidden(c, "missing CSRF header")
			c.Abort()
			return
		}

		if subtle.ConstantTimeCompare([]byte(cookieToken), []byte(headerToken)) != 1 {
			apierror.Forbidden(c, "CSRF token mismatch")
			c.Abort()
			return
		}

		c.Next()
	}
}
