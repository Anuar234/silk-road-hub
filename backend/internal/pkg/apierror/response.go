package apierror

import (
	"github.com/gin-gonic/gin"
)

// OK wraps data in {ok: true, data: T} envelope expected by frontend
func OK(c *gin.Context, status int, data any) {
	c.JSON(status, gin.H{"ok": true, "data": data})
}
