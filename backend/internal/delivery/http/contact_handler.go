// Package httpdelivery — public contact form + central-admin inbox endpoints.
package httpdelivery

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"sunstore/internal/domain"
	"sunstore/internal/repository/postgres"
)

// ContactHandler owns the public contact-form endpoint and the central-admin inbox.
type ContactHandler struct {
	db *postgres.DB
}

// NewContactHandler constructs a ContactHandler.
func NewContactHandler(db *postgres.DB) *ContactHandler { return &ContactHandler{db: db} }

// Submit handles POST /api/v1/contact.
// Public endpoint — anyone can submit. Rate limiting is handled at the edge.
func (h *ContactHandler) Submit(c *gin.Context) {
	var body struct {
		Name    string `json:"name" binding:"required"`
		Email   string `json:"email" binding:"required,email"`
		Phone   string `json:"phone"`
		Subject string `json:"subject"`
		Message string `json:"message" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeError(c, http.StatusBadRequest, "invalid_payload: "+err.Error())
		return
	}
	body.Name = strings.TrimSpace(body.Name)
	body.Email = strings.ToLower(strings.TrimSpace(body.Email))
	body.Phone = strings.TrimSpace(body.Phone)
	body.Subject = strings.TrimSpace(body.Subject)
	body.Message = strings.TrimSpace(body.Message)
	if len(body.Message) < 5 {
		writeError(c, http.StatusBadRequest, "message too short")
		return
	}
	if len(body.Message) > 8000 {
		writeError(c, http.StatusBadRequest, "message too long (8000 chars max)")
		return
	}

	sourceURL := strings.TrimSpace(c.Request.Header.Get("Referer"))
	if len(sourceURL) > 500 {
		sourceURL = sourceURL[:500]
	}
	ip := c.ClientIP()
	if len(ip) > 64 {
		ip = ip[:64]
	}
	ua := c.Request.Header.Get("User-Agent")
	if len(ua) > 500 {
		ua = ua[:500]
	}

	sub, err := h.db.CreateContactSubmission(c.Request.Context(), domain.ContactSubmissionCreateInput{
		Name: body.Name, Email: body.Email, Phone: body.Phone, Subject: body.Subject, Message: body.Message,
	}, sourceURL, ip, ua)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "save_failed"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"id":         sub.ID,
		"created_at": sub.CreatedAt,
		"ok":         true,
	})
}

// List handles GET /central/contacts (super-admin only).
func (h *ContactHandler) List(c *gin.Context) {
	onlyUnread := c.Query("unread") == "1" || c.Query("unread") == "true"
	limit := atoiDefault(c.Query("limit"), 100)
	items, err := h.db.ListContactSubmissions(c.Request.Context(), onlyUnread, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "list_failed"})
		return
	}
	unreadCount, _ := h.db.CountUnreadContactSubmissions(c.Request.Context())
	c.JSON(http.StatusOK, gin.H{
		"items":        items,
		"unread_count": unreadCount,
		"total":        len(items),
	})
}

// SetRead handles PATCH /central/contacts/:id (body: { is_read: bool }).
func (h *ContactHandler) SetRead(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_id"})
		return
	}
	var body struct {
		IsRead *bool `json:"is_read"`
	}
	_ = c.ShouldBindJSON(&body)
	isRead := true
	if body.IsRead != nil {
		isRead = *body.IsRead
	}
	if err := h.db.MarkContactRead(c.Request.Context(), id, isRead); err != nil {
		if errors.Is(err, postgres.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "not_found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update_failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// Delete handles DELETE /central/contacts/:id.
func (h *ContactHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_id"})
		return
	}
	if err := h.db.DeleteContactSubmission(c.Request.Context(), id); err != nil {
		if errors.Is(err, postgres.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "not_found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "delete_failed"})
		return
	}
	c.Status(http.StatusNoContent)
}
