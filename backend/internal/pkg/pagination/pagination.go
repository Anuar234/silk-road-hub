package pagination

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

type Params struct {
	Limit  int
	Offset int
}

func Parse(c *gin.Context, defaultLimit int) Params {
	limit := defaultLimit
	offset := 0

	if v := c.Query("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 && n <= 100 {
			limit = n
		}
	}
	if v := c.Query("offset"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n >= 0 {
			offset = n
		}
	}

	return Params{Limit: limit, Offset: offset}
}
