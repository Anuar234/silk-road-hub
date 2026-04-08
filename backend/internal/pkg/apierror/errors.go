package apierror

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type ErrorResponse struct {
	Error   string `json:"error"`
	Details string `json:"details,omitempty"`
}

func BadRequest(c *gin.Context, msg string) {
	c.JSON(http.StatusBadRequest, ErrorResponse{Error: msg})
}

func Unauthorized(c *gin.Context, msg string) {
	if msg == "" {
		msg = "unauthorized"
	}
	c.JSON(http.StatusUnauthorized, ErrorResponse{Error: msg})
}

func Forbidden(c *gin.Context, msg string) {
	if msg == "" {
		msg = "forbidden"
	}
	c.JSON(http.StatusForbidden, ErrorResponse{Error: msg})
}

func NotFound(c *gin.Context, msg string) {
	if msg == "" {
		msg = "not found"
	}
	c.JSON(http.StatusNotFound, ErrorResponse{Error: msg})
}

func Internal(c *gin.Context, msg string) {
	if msg == "" {
		msg = "internal server error"
	}
	c.JSON(http.StatusInternalServerError, ErrorResponse{Error: msg})
}

func Conflict(c *gin.Context, msg string) {
	c.JSON(http.StatusConflict, ErrorResponse{Error: msg})
}
