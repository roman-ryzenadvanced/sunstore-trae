package httpdelivery

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"sunstore/internal/domain"
	"sunstore/internal/usecase"
)

// AdminHandler serves admin authentication routes.
type AdminHandler struct {
	admins *usecase.AdminUseCase
}

// NewAdminHandler constructs an AdminHandler.
func NewAdminHandler(admins *usecase.AdminUseCase) *AdminHandler {
	return &AdminHandler{admins: admins}
}

// Login handles POST /api/v1/admin/auth/login.
func (h *AdminHandler) Login(c *gin.Context) {
	var payload domain.AdminLoginRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		writeError(c, http.StatusBadRequest, "invalid JSON payload")
		return
	}
	response, err := h.admins.Login(c.Request.Context(), payload)
	if err != nil {
		writeDomainError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    response,
	})
}
