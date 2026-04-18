package audit

import (
	"context"
	"log/slog"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/silkroadhub/backend/internal/middleware"
)

// Middleware writes a row to audit_log for every mutating request (POST/PUT/PATCH/DELETE).
// It runs after the handler, so it captures the final status code and the session
// that the Auth middleware populated (if any).
//
// The write is fire-and-forget: the HTTP response is not blocked by the audit
// insert, and the insert uses a fresh context with a short timeout so it isn't
// cancelled when the request context is cancelled.
func Middleware(svc *Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		method := c.Request.Method
		if method == "GET" || method == "HEAD" || method == "OPTIONS" {
			c.Next()
			return
		}

		start := time.Now()
		c.Next()

		entry := &Entry{
			Method:     method,
			Path:       c.Request.URL.Path,
			StatusCode: c.Writer.Status(),
			DurationMs: time.Since(start).Milliseconds(),
		}

		if sess := middleware.GetSession(c); sess != nil {
			entry.UserID = &sess.UserID
		}
		if ip := c.ClientIP(); ip != "" {
			entry.IPAddress = &ip
		}
		if ua := c.GetHeader("User-Agent"); ua != "" {
			entry.UserAgent = &ua
		}

		go func(e *Entry) {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			if err := svc.Record(ctx, e); err != nil {
				slog.Warn("audit log insert failed", "err", err, "path", e.Path)
			}
		}(entry)
	}
}
