package httpdelivery

import (
	"bytes"
	"errors"
	"io"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"

	"sunstore/internal/domain"
	"sunstore/internal/repository/tbank"
	"sunstore/internal/usecase"
)

// WebhookHandler owns external-provider callbacks.
type WebhookHandler struct {
	logger        *slog.Logger
	notifications *usecase.PaymentNotificationUseCase
}

// NewWebhookHandler constructs a WebhookHandler.
func NewWebhookHandler(logger *slog.Logger, notifications *usecase.PaymentNotificationUseCase) *WebhookHandler {
	return &WebhookHandler{
		logger:        logger,
		notifications: notifications,
	}
}

// TBank handles POST /api/v1/webhooks/tbank.
func (h *WebhookHandler) TBank(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		writeError(c, http.StatusBadRequest, "unable to read request body")
		return
	}
	c.Request.Body = io.NopCloser(bytes.NewReader(body))

	var payload map[string]any
	if err := c.ShouldBindJSON(&payload); err != nil {
		writeError(c, http.StatusBadRequest, "invalid JSON payload")
		return
	}

	if err := h.notifications.HandleTBankNotification(c.Request.Context(), payload, body); err != nil {
		switch {
		case errors.Is(err, tbank.ErrInvalidNotificationToken):
			c.AbortWithStatus(http.StatusForbidden)
		case errors.Is(err, domain.ErrValidation):
			writeError(c, http.StatusBadRequest, err.Error())
		case errors.Is(err, domain.ErrNotFound):
			writeError(c, http.StatusNotFound, err.Error())
		default:
			h.logger.Error("tbank webhook processing failed", slog.String("err", err.Error()))
			writeError(c, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	c.String(http.StatusOK, "OK")
}
