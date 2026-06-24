// Package httpdelivery — CRM handler consolidating custom-domain management,
// the unified support inbox, and mailing-list management under the super-admin
// token. Also exposes the public storefront contact + subscribe endpoints.
package httpdelivery

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"sunstore/internal/config"
	"sunstore/internal/domain"
	"sunstore/internal/usecase"
)

// CRMHandler exposes the consolidated CRM API surface.
type CRMHandler struct {
	crm     *usecase.CRMUseCase
	sites   *usecase.SiteService
	email   *usecase.EmailUseCase
	platCfg config.PlatformConfig
}

// NewCRMHandler constructs a CRMHandler.
func NewCRMHandler(crm *usecase.CRMUseCase, sites *usecase.SiteService, email *usecase.EmailUseCase, plat config.PlatformConfig) *CRMHandler {
	return &CRMHandler{crm: crm, sites: sites, email: email, platCfg: plat}
}

// ===========================================================================
// Platform DNS instructions (super-admin + onboarding)
// ===========================================================================

// PlatformDNS returns the nameservers + apex IP a store owner must configure
// at their registrar (e.g. Namecheap) to point a custom domain at the platform.
func (h *CRMHandler) PlatformDNS(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"platform":       h.platCfg.Name,
		"nameservers":    h.platCfg.Nameservers,
		"apex_ip":        h.platCfg.ApexIP,
		"preview_base":   h.platCfg.PreviewBaseURL,
		"instructions":   buildDNSInstructions(h.platCfg),
	})
}

func buildDNSInstructions(p config.PlatformConfig) []string {
	ns := strings.Join(p.Nameservers, ", ")
	return []string{
		"1. Войдите в панель управления регистратором домена (Namecheap, GoDaddy и т.п.).",
		"2. Откройте раздел DNS / Nameservers и выберите «Custom nameservers» / «Использовать свои NS».",
		"3. Укажите следующие nameservers: " + ns + ".",
		"4. (Альтернатива) Если регистратор не поддерживает custom NS — создайте A-запись для apex-домена (и www), указывающую на " + p.ApexIP + ", и CNAME www → крайний слэш не нужен.",
		"5. Распространение DNS может занимать от нескольких минут до 48 часов.",
		"6. Вернитесь в CRM и нажмите «Проверить» — домен перейдёт в статус ACTIVE.",
	}
}

// ===========================================================================
// Custom-domain lifecycle (per shop)
// ===========================================================================

// AttachDomain attaches a custom domain to a shop.
func (h *CRMHandler) AttachDomain(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_id"})
		return
	}
	var body struct {
		Domain string `json:"domain"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload"})
		return
	}
	if err := h.crm.AttachDomain(c.Request.Context(), id, body.Domain); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "attach_failed", "detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"domain":        normalizeDomainEcho(body.Domain),
		"status":        string(domain.DomainStatusPending),
		"nameservers":   h.platCfg.Nameservers,
		"apex_ip":       h.platCfg.ApexIP,
		"instructions":  buildDNSInstructions(h.platCfg),
	})
}

// RemoveDomain strips a custom domain from a shop.
func (h *CRMHandler) RemoveDomain(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_id"})
		return
	}
	if err := h.crm.RemoveDomain(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not_found"})
		return
	}
	c.Status(http.StatusNoContent)
}

// VerifyDomain marks a shop's domain ACTIVE or FAILED.
func (h *CRMHandler) VerifyDomain(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_id"})
		return
	}
	var body struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		// default to ACTIVE when called without a body
		body.Status = string(domain.DomainStatusActive)
	}
	status := domain.DomainStatus(body.Status)
	if status == "" {
		status = domain.DomainStatusActive
	}
	if err := h.crm.VerifyDomain(c.Request.Context(), id, status); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "verify_failed", "detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": string(status)})
}

// ===========================================================================
// Support inbox (super-admin)
// ===========================================================================

// ListAllTickets returns contact/support tickets across every store.
func (h *CRMHandler) ListAllTickets(c *gin.Context) {
	f := domain.TicketListFilter{
		SiteID: int64(atoiDefault(c.Query("site_id"), 0)),
		Status: domain.TicketStatus(c.Query("status")),
		Search: c.Query("q"),
		Limit:  atoiDefault(c.Query("limit"), 50),
		Offset: atoiDefault(c.Query("offset"), 0),
	}
	tickets, total, err := h.crm.ListTickets(c.Request.Context(), f)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "list_failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"items": tickets, "total": total, "limit": f.Limit, "offset": f.Offset,
	})
}

// ListShopTickets returns tickets for one store.
func (h *CRMHandler) ListShopTickets(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_id"})
		return
	}
	limit := atoiDefault(c.Query("limit"), 50)
	offset := atoiDefault(c.Query("offset"), 0)
	tickets, total, err := h.crm.ListSiteTickets(c.Request.Context(), id, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "list_failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"items": tickets, "total": total, "limit": limit, "offset": offset,
	})
}

// UpdateTicket changes a ticket's status and, optionally, sends an email reply
// to the requester and records it on the ticket.
func (h *CRMHandler) UpdateTicket(c *gin.Context) {
	ticketID, err := strconv.ParseInt(c.Param("ticketId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_ticket_id"})
		return
	}
	var body struct {
		Status       string `json:"status"`
		ReplySubject string `json:"reply_subject"`
		ReplyBody    string `json:"reply_body"`
		SendEmail    bool   `json:"send_email"`
	}
	_ = c.ShouldBindJSON(&body)

	status := domain.TicketStatus(body.Status)
	if status == "" {
		status = domain.TicketStatusReplied
	}

	// Persist reply + status first.
	if err := h.crm.UpdateTicket(c.Request.Context(), ticketID, status, body.ReplySubject, body.ReplyBody); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not_found"})
		return
	}

	// Optionally email the reply to the requester.
	if body.SendEmail && strings.TrimSpace(body.ReplyBody) != "" {
		h.sendTicketReply(c, ticketID, body.ReplySubject, body.ReplyBody)
	}
	c.JSON(http.StatusOK, gin.H{"ok": true, "status": string(status)})
}

// sendTicketReply looks up the ticket and its site, then emails the reply.
func (h *CRMHandler) sendTicketReply(c *gin.Context, ticketID int64, subject, body string) {
	ctx := c.Request.Context()
	t, err := h.crm.GetTicket(ctx, ticketID)
	if err != nil || t == nil {
		return
	}
	subj := strings.TrimSpace(subject)
	if subj == "" {
		subj = "Re: " + t.Subject
	}
	siteID := t.SiteID
	_ = h.email.Send(ctx, usecase.SendInput{
		SiteID:   &siteID,
		To:       t.Email,
		Subject:  subj,
		BodyHTML: "<pre style=\"font-family:Arial,sans-serif;font-size:14px;line-height:1.5\">" + escapeForHTML(body) + "</pre>",
	})
}

func escapeForHTML(s string) string {
	s = strings.ReplaceAll(s, "&", "&amp;")
	s = strings.ReplaceAll(s, "<", "&lt;")
	s = strings.ReplaceAll(s, ">", "&gt;")
	return s
}

// ===========================================================================
// Subscribers / mailing list (super-admin)
// ===========================================================================

// ListAllSubscribers returns subscribers across every store.
func (h *CRMHandler) ListAllSubscribers(c *gin.Context) {
	f := domain.SubscriberListFilter{
		SiteID: int64(atoiDefault(c.Query("site_id"), 0)),
		Status: domain.SubscriberStatus(c.Query("status")),
		Search: c.Query("q"),
		Limit:  atoiDefault(c.Query("limit"), 100),
		Offset: atoiDefault(c.Query("offset"), 0),
	}
	subs, total, err := h.crm.ListSubscribers(c.Request.Context(), f)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "list_failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"items": subs, "total": total, "limit": f.Limit, "offset": f.Offset,
	})
}

// ListShopSubscribers returns subscribers for one store.
func (h *CRMHandler) ListShopSubscribers(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_id"})
		return
	}
	limit := atoiDefault(c.Query("limit"), 100)
	offset := atoiDefault(c.Query("offset"), 0)
	subs, total, err := h.crm.ListSiteSubscribers(c.Request.Context(), id, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "list_failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"items": subs, "total": total, "limit": limit, "offset": offset,
	})
}

// RemoveSubscriber removes an email from a store's list.
func (h *CRMHandler) RemoveSubscriber(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_id"})
		return
	}
	var body struct {
		Email string `json:"email"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload"})
		return
	}
	if err := h.crm.Unsubscribe(c.Request.Context(), id, body.Email); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not_found"})
		return
	}
	c.Status(http.StatusNoContent)
}

// Broadcast sends an email to every active subscriber of a store.
func (h *CRMHandler) Broadcast(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_id"})
		return
	}
	var body struct {
		Subject  string `json:"subject" binding:"required"`
		BodyHTML string `json:"body_html" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload", "detail": err.Error()})
		return
	}
	emails, err := h.crm.SubscriberEmails(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "list_failed"})
		return
	}
	sent, failed := 0, 0
	for _, e := range emails {
		siteID := id
		err := h.email.Send(c.Request.Context(), usecase.SendInput{
			SiteID:   &siteID,
			To:       e,
			Subject:  body.Subject,
			BodyHTML: body.BodyHTML,
		})
		if err != nil {
			failed++
		} else {
			sent++
		}
	}
	c.JSON(http.StatusOK, gin.H{
		"ok":     true,
		"sent":   sent,
		"failed": failed,
		"total":  len(emails),
	})
}

// ===========================================================================
// Public storefront endpoints (no auth — keyed by :siteSlug)
// ===========================================================================

// PublicContact captures a contact-form submission from a storefront.
func (h *CRMHandler) PublicContact(c *gin.Context) {
	site, err := h.resolveSite(c)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "site_not_found"})
		return
	}
	var in domain.ContactFormInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload", "detail": err.Error()})
		return
	}
	ip := c.ClientIP()
	t, err := h.crm.SubmitContact(c.Request.Context(), site.ID, in, ip)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "submit_failed", "detail": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"ok": true, "ticket_id": t.ID})
}

// PublicSubscribe adds an email to a storefront's mailing list.
func (h *CRMHandler) PublicSubscribe(c *gin.Context) {
	site, err := h.resolveSite(c)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "site_not_found"})
		return
	}
	var in domain.SubscribeInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload"})
		return
	}
	s, err := h.crm.Subscribe(c.Request.Context(), site.ID, in)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "subscribe_failed", "detail": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"ok": true, "subscriber_id": s.ID})
}

// PublicUnsubscribe removes an email from a storefront's list.
func (h *CRMHandler) PublicUnsubscribe(c *gin.Context) {
	site, err := h.resolveSite(c)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "site_not_found"})
		return
	}
	var body struct {
		Email string `json:"email"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload"})
		return
	}
	if err := h.crm.Unsubscribe(c.Request.Context(), site.ID, body.Email); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not_found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// resolveSite turns the URL :siteSlug into a *domain.Site.
func (h *CRMHandler) resolveSite(c *gin.Context) (*domain.Site, error) {
	slug := strings.ToLower(strings.TrimSpace(c.Param("siteSlug")))
	if slug == "" {
		return nil, errEmptySlug
	}
	return h.sites.GetBySlug(c.Request.Context(), slug)
}

var errEmptySlug = errEmptySlugErr{}

type errEmptySlugErr struct{}

func (errEmptySlugErr) Error() string { return "site slug is required" }

func normalizeDomainEcho(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = strings.TrimPrefix(s, "http://")
	s = strings.TrimPrefix(s, "https://")
	s = strings.TrimSuffix(s, "/")
	s = strings.TrimPrefix(s, "www.")
	return s
}
