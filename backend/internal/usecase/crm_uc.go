// Package usecase — CRM business logic: custom-domain lifecycle, support
// inbox, and mailing-list management. All operations are authorized by the
// single super-admin token at the HTTP layer.
package usecase

import (
	"context"
	"errors"
	"fmt"
	"net"
	"strings"

	"sunstore/internal/domain"
	"sunstore/internal/repository/postgres"
)

// CRMUseCase governs the cross-store CRM surface.
type CRMUseCase struct {
	db *postgres.DB
}

// NewCRMUseCase constructs a CRMUseCase.
func NewCRMUseCase(db *postgres.DB) *CRMUseCase { return &CRMUseCase{db: db} }

// ===========================================================================
// Custom-domain lifecycle
// ===========================================================================

// AttachDomain validates + attaches a custom domain to a site and resets it
// to PENDING so the owner can configure nameservers.
func (uc *CRMUseCase) AttachDomain(ctx context.Context, siteID int64, host string) error {
	host = normalizeDomain(host)
	if err := validateDomain(host); err != nil {
		return err
	}
	return uc.db.SetSiteDomain(ctx, siteID, host)
}

// RemoveDomain strips a site's custom domain.
func (uc *CRMUseCase) RemoveDomain(ctx context.Context, siteID int64) error {
	return uc.db.ClearSiteDomain(ctx, siteID)
}

// VerifyDomain marks a domain ACTIVE (owner confirmed DNS) or FAILED.
func (uc *CRMUseCase) VerifyDomain(ctx context.Context, siteID int64, status domain.DomainStatus) error {
	switch status {
	case domain.DomainStatusActive, domain.DomainStatusFailed, domain.DomainStatusPending:
	default:
		return fmt.Errorf("invalid domain status: %s", status)
	}
	return uc.db.SetSiteDomainStatus(ctx, siteID, status)
}

// ===========================================================================
// Support inbox
// ===========================================================================

// SubmitContact captures a public contact-form submission for a store.
func (uc *CRMUseCase) SubmitContact(ctx context.Context, siteID int64, in domain.ContactFormInput, ip string) (*domain.SupportTicket, error) {
	if strings.TrimSpace(in.Name) == "" {
		return nil, errors.New("name is required")
	}
	if strings.TrimSpace(in.Email) == "" {
		return nil, errors.New("email is required")
	}
	if strings.TrimSpace(in.Message) == "" {
		return nil, errors.New("message is required")
	}
	subject := strings.TrimSpace(in.Subject)
	if subject == "" {
		subject = "Обращение с сайта"
	}
	source := strings.TrimSpace(in.Source)
	if source == "" {
		source = "contact_form"
	}
	t := &domain.SupportTicket{
		SiteID:    siteID,
		Name:      strings.TrimSpace(in.Name),
		Email:     strings.ToLower(strings.TrimSpace(in.Email)),
		Phone:     strings.TrimSpace(in.Phone),
		Subject:   subject,
		Message:   strings.TrimSpace(in.Message),
		Status:    domain.TicketStatusNew,
		Source:    source,
		IPAddress: ip,
	}
	if err := uc.db.CreateSupportTicket(ctx, t); err != nil {
		return nil, err
	}
	return t, nil
}

// ListTickets returns tickets across every store (super-admin view).
func (uc *CRMUseCase) ListTickets(ctx context.Context, f domain.TicketListFilter) ([]*domain.SupportTicket, int, error) {
	return uc.db.ListAllSupportTickets(ctx, f)
}

// ListSiteTickets returns tickets for one store.
func (uc *CRMUseCase) ListSiteTickets(ctx context.Context, siteID int64, limit, offset int) ([]*domain.SupportTicket, int, error) {
	return uc.db.ListSiteSupportTickets(ctx, siteID, limit, offset)
}

// UpdateTicket changes a ticket's status and records a reply if provided.
func (uc *CRMUseCase) UpdateTicket(ctx context.Context, id int64, status domain.TicketStatus, replySubject, replyBody string) error {
	return uc.db.UpdateSupportTicket(ctx, id, status, replySubject, replyBody)
}

// GetTicket returns a single support ticket by id.
func (uc *CRMUseCase) GetTicket(ctx context.Context, id int64) (*domain.SupportTicket, error) {
	return uc.db.GetSupportTicket(ctx, id)
}

// ===========================================================================
// Mailing list
// ===========================================================================

// Subscribe adds (or re-subscribes) an email to a store's mailing list.
func (uc *CRMUseCase) Subscribe(ctx context.Context, siteID int64, in domain.SubscribeInput) (*domain.Subscriber, error) {
	email := strings.ToLower(strings.TrimSpace(in.Email))
	if email == "" {
		return nil, errors.New("email is required")
	}
	if !strings.Contains(email, "@") || !strings.Contains(email, ".") {
		return nil, errors.New("invalid email")
	}
	source := strings.TrimSpace(in.Source)
	if source == "" {
		source = "footer"
	}
	s := &domain.Subscriber{
		SiteID: siteID,
		Email:  email,
		Name:   strings.TrimSpace(in.Name),
		Status: domain.SubscriberStatusSubscribed,
		Source: source,
	}
	if err := uc.db.UpsertSubscriber(ctx, s); err != nil {
		return nil, err
	}
	return s, nil
}

// Unsubscribe removes an email from a store's list.
func (uc *CRMUseCase) Unsubscribe(ctx context.Context, siteID int64, email string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" {
		return errors.New("email is required")
	}
	return uc.db.UnsubscribeSubscriber(ctx, siteID, email)
}

// ListSubscribers returns subscribers across every store (super-admin view).
func (uc *CRMUseCase) ListSubscribers(ctx context.Context, f domain.SubscriberListFilter) ([]*domain.Subscriber, int, error) {
	return uc.db.ListAllSubscribers(ctx, f)
}

// ListSiteSubscribers returns subscribers for one store.
func (uc *CRMUseCase) ListSiteSubscribers(ctx context.Context, siteID int64, limit, offset int) ([]*domain.Subscriber, int, error) {
	return uc.db.ListSiteSubscribers(ctx, siteID, limit, offset)
}

// SubscriberEmails returns active subscriber emails for a store (broadcast).
func (uc *CRMUseCase) SubscriberEmails(ctx context.Context, siteID int64) ([]string, error) {
	return uc.db.SubscriberEmails(ctx, siteID)
}

// ===========================================================================
// helpers
// ===========================================================================

func normalizeDomain(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = strings.TrimPrefix(s, "http://")
	s = strings.TrimPrefix(s, "https://")
	s = strings.TrimSuffix(s, "/")
	if i := strings.IndexAny(s, "/?#"); i >= 0 {
		s = s[:i]
	}
	// strip a leading "www." to normalize apex form
	s = strings.TrimPrefix(s, "www.")
	return s
}

func validateDomain(host string) error {
	if host == "" {
		return errors.New("domain is required")
	}
	if len(host) > 253 {
		return errors.New("domain too long")
	}
	// Reject anything that parses as an IP — we want hostnames only.
	if net.ParseIP(host) != nil {
		return errors.New("domain must be a hostname, not an IP")
	}
	labels := strings.Split(host, ".")
	if len(labels) < 2 {
		return errors.New("domain must include a TLD (e.g. example.com)")
	}
	for _, l := range labels {
		if l == "" || len(l) > 63 {
			return errors.New("invalid domain label")
		}
		for _, r := range l {
			if !(r == '-' || (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9')) {
				return fmt.Errorf("invalid character %q in domain", r)
			}
		}
	}
	return nil
}
