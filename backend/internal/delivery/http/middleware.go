package httpdelivery

import (
	"errors"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"sunstore/internal/domain"
	"sunstore/internal/usecase"
)

const (
	adminClaimsContextKey = "admin_claims"
	defaultListLimit      = 24
)

func requestLogger(logger *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		logger.Info("http request",
			slog.String("method", c.Request.Method),
			slog.String("path", c.Request.URL.Path),
			slog.Int("status", c.Writer.Status()),
			slog.Duration("latency", time.Since(start)),
			slog.String("ip", c.ClientIP()),
		)
	}
}

func corsMiddleware(allowedOrigins []string) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(allowedOrigins))
	allowAll := false
	for _, origin := range allowedOrigins {
		trimmed := strings.TrimSpace(origin)
		if trimmed == "*" {
			allowAll = true
		}
		if trimmed != "" {
			allowed[trimmed] = struct{}{}
		}
	}

	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin != "" {
			if allowAll {
				c.Header("Access-Control-Allow-Origin", "*")
			} else if _, ok := allowed[origin]; ok {
				c.Header("Access-Control-Allow-Origin", origin)
				c.Header("Vary", "Origin")
			}
			c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type")
			c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			c.Header("Access-Control-Allow-Credentials", "true")
		}
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

func adminAuthMiddleware(admins *usecase.AdminUseCase) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := strings.TrimSpace(c.GetHeader("Authorization"))
		if !strings.HasPrefix(strings.ToLower(header), "bearer ") {
			writeError(c, http.StatusUnauthorized, "authorization bearer token is required")
			return
		}
		token := strings.TrimSpace(header[len("Bearer "):])
		claims, err := admins.ParseToken(token)
		if err != nil {
			writeDomainError(c, err)
			return
		}
		c.Set(adminClaimsContextKey, claims)
		c.Next()
	}
}

func writeError(c *gin.Context, status int, message string) {
	c.AbortWithStatusJSON(status, gin.H{
		"success": false,
		"error":   message,
	})
}

func writeDomainError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, domain.ErrValidation):
		writeError(c, http.StatusBadRequest, err.Error())
	case errors.Is(err, domain.ErrUnauthorized):
		writeError(c, http.StatusUnauthorized, err.Error())
	case errors.Is(err, domain.ErrNotFound):
		writeError(c, http.StatusNotFound, err.Error())
	case errors.Is(err, domain.ErrConflict):
		writeError(c, http.StatusConflict, err.Error())
	case errors.Is(err, domain.ErrUnavailable):
		writeError(c, http.StatusServiceUnavailable, err.Error())
	default:
		writeError(c, http.StatusInternalServerError, "internal server error")
	}
}

func parseIntQuery(c *gin.Context, key string, fallback int) int {
	value := strings.TrimSpace(c.Query(key))
	if value == "" {
		return fallback
	}
	n := 0
	for _, ch := range value {
		if ch < '0' || ch > '9' {
			return fallback
		}
		n = n*10 + int(ch-'0')
	}
	return n
}

func parseIDParam(c *gin.Context, key string) (int64, error) {
	value := strings.TrimSpace(c.Param(key))
	if value == "" {
		return 0, domain.ErrValidation
	}
	var n int64
	for _, ch := range value {
		if ch < '0' || ch > '9' {
			return 0, domain.ErrValidation
		}
		n = n*10 + int64(ch-'0')
	}
	if n <= 0 {
		return 0, domain.ErrValidation
	}
	return n, nil
}
