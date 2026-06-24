// Package postgres — CRM repository: support tickets, mailing-list
// subscribers, and the custom-domain lifecycle on sites.
package postgres

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"

	"sunstore/internal/domain"
)

// ===========================================================================
// Custom-domain lifecycle on sites
// ===========================================================================

// SetSiteDomain attaches (or replaces) a site's custom domain and resets the
// verification state to PENDING.
func (d *DB) SetSiteDomain(ctx context.Context, id int64, domainName string) error {
	tag, err := d.Pool.Exec(ctx,
		`UPDATE sites
		    SET custom_domain = $2,
		        custom_domain_status = 'PENDING',
		        custom_domain_verified_at = NULL
		  WHERE id = $1`,
		id, strings.TrimSpace(strings.ToLower(domainName)))
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// SetSiteDomainStatus records the verification outcome for a site's domain.
func (d *DB) SetSiteDomainStatus(ctx context.Context, id int64, status domain.DomainStatus) error {
	verifiedAt := (*time.Time)(nil)
	if status == domain.DomainStatusActive {
		now := time.Now().UTC()
		verifiedAt = &now
	}
	tag, err := d.Pool.Exec(ctx,
		`UPDATE sites SET custom_domain_status = $2, custom_domain_verified_at = $3 WHERE id = $1`,
		id, string(status), verifiedAt)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// ClearSiteDomain removes a site's custom domain entirely.
func (d *DB) ClearSiteDomain(ctx context.Context, id int64) error {
	tag, err := d.Pool.Exec(ctx,
		`UPDATE sites
		    SET custom_domain = NULL,
		        custom_domain_status = 'NONE',
		        custom_domain_verified_at = NULL
		  WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// ===========================================================================
// Support tickets
// ===========================================================================

// CreateSupportTicket inserts a contact/support request captured from a store.
func (d *DB) CreateSupportTicket(ctx context.Context, t *domain.SupportTicket) error {
	const q = `INSERT INTO support_tickets
	             (site_id, name, email, phone, subject, message, status, source, ip_address)
	           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
	           RETURNING id, created_at, updated_at`
	status := t.Status
	if status == "" {
		status = domain.TicketStatusNew
	}
	source := t.Source
	if source == "" {
		source = "contact_form"
	}
	return d.Pool.QueryRow(ctx, q,
		t.SiteID, t.Name, t.Email, t.Phone, t.Subject, t.Message, string(status), source, t.IPAddress,
	).Scan(&t.ID, &t.CreatedAt, &t.UpdatedAt)
}

// ListSiteSupportTickets returns tickets for a single store.
func (d *DB) ListSiteSupportTickets(ctx context.Context, siteID int64, limit, offset int) ([]*domain.SupportTicket, int, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}
	var total int
	if err := d.Pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM support_tickets WHERE site_id = $1`, siteID,
	).Scan(&total); err != nil {
		return nil, 0, err
	}
	q := `SELECT id, site_id, name, email, phone, subject, message, status, source,
	             ip_address, reply_subject, reply_body, replied_at, created_at, updated_at
	      FROM support_tickets WHERE site_id = $1
	      ORDER BY created_at DESC LIMIT $2 OFFSET $3`
	rows, err := d.Pool.Query(ctx, q, siteID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := make([]*domain.SupportTicket, 0, limit)
	for rows.Next() {
		t, err := scanTicket(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, t)
	}
	return out, total, rows.Err()
}

// ListAllSupportTickets returns tickets across every store, optionally narrowed
// by site/status/search. Each row carries the owning site's name + slug.
func (d *DB) ListAllSupportTickets(ctx context.Context, f domain.TicketListFilter) ([]*domain.SupportTicket, int, error) {
	if f.Limit <= 0 || f.Limit > 200 {
		f.Limit = 50
	}
	if f.Offset < 0 {
		f.Offset = 0
	}
	var total int
	if err := d.Pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM support_tickets t
		 WHERE ($1::bigint = 0 OR t.site_id = $1)
		   AND ($2::text = '' OR t.status = $2)
		   AND ($3::text = '' OR t.name ILIKE '%'||$3||'%' OR t.email ILIKE '%'||$3||'%' OR t.subject ILIKE '%'||$3||'%')`,
		f.SiteID, string(f.Status), f.Search,
	).Scan(&total); err != nil {
		return nil, 0, err
	}
	q := `SELECT t.id, t.site_id, t.name, t.email, t.phone, t.subject, t.message, t.status,
	             t.source, t.ip_address, t.reply_subject, t.reply_body, t.replied_at,
	             t.created_at, t.updated_at, s.name AS site_name, s.slug AS site_slug
	      FROM support_tickets t
	      JOIN sites s ON s.id = t.site_id
	      WHERE ($1::bigint = 0 OR t.site_id = $1)
	        AND ($2::text = '' OR t.status = $2)
	        AND ($3::text = '' OR t.name ILIKE '%'||$3||'%' OR t.email ILIKE '%'||$3||'%' OR t.subject ILIKE '%'||$3||'%')
	      ORDER BY t.created_at DESC LIMIT $4 OFFSET $5`
	rows, err := d.Pool.Query(ctx, q, f.SiteID, string(f.Status), f.Search, f.Limit, f.Offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := make([]*domain.SupportTicket, 0, f.Limit)
	for rows.Next() {
		t := &domain.SupportTicket{}
		if err := rows.Scan(&t.ID, &t.SiteID, &t.Name, &t.Email, &t.Phone, &t.Subject, &t.Message,
			&t.Status, &t.Source, &t.IPAddress, &t.ReplySubject, &t.ReplyBody, &t.RepliedAt,
			&t.CreatedAt, &t.UpdatedAt, &t.SiteName, &t.SiteSlug); err != nil {
			return nil, 0, err
		}
		out = append(out, t)
	}
	return out, total, rows.Err()
}

// UpdateSupportTicket patches a ticket's status and optional reply.
func (d *DB) UpdateSupportTicket(ctx context.Context, id int64, status domain.TicketStatus, replySubject, replyBody string) error {
	hasReply := strings.TrimSpace(replyBody) != ""
	tag, err := d.Pool.Exec(ctx,
		`UPDATE support_tickets
		    SET status = $2,
		        reply_subject = CASE WHEN $3::text != '' THEN $3 ELSE reply_subject END,
		        reply_body    = CASE WHEN $4::text != '' THEN $4 ELSE reply_body END,
		        replied_at    = CASE WHEN $5::boolean THEN CURRENT_TIMESTAMP ELSE replied_at END
		  WHERE id = $1`,
		id, string(status), replySubject, replyBody, hasReply)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// GetSupportTicket returns a single ticket by id.
func (d *DB) GetSupportTicket(ctx context.Context, id int64) (*domain.SupportTicket, error) {
	q := `SELECT id, site_id, name, email, phone, subject, message, status, source,
	             ip_address, reply_subject, reply_body, replied_at, created_at, updated_at
	      FROM support_tickets WHERE id = $1`
	t := &domain.SupportTicket{}
	err := d.Pool.QueryRow(ctx, q, id).Scan(
		&t.ID, &t.SiteID, &t.Name, &t.Email, &t.Phone, &t.Subject, &t.Message,
		&t.Status, &t.Source, &t.IPAddress, &t.ReplySubject, &t.ReplyBody, &t.RepliedAt,
		&t.CreatedAt, &t.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return t, err
}

func scanTicket(r pgx.Rows) (*domain.SupportTicket, error) {
	t := &domain.SupportTicket{}
	err := r.Scan(&t.ID, &t.SiteID, &t.Name, &t.Email, &t.Phone, &t.Subject, &t.Message,
		&t.Status, &t.Source, &t.IPAddress, &t.ReplySubject, &t.ReplyBody, &t.RepliedAt,
		&t.CreatedAt, &t.UpdatedAt)
	return t, err
}

// ===========================================================================
// Subscribers / mailing list
// ===========================================================================

// UpsertSubscriber inserts a new subscriber or re-subscribes an existing one.
// Returns the persisted row.
func (d *DB) UpsertSubscriber(ctx context.Context, s *domain.Subscriber) error {
	status := s.Status
	if status == "" {
		status = domain.SubscriberStatusSubscribed
	}
	source := s.Source
	if source == "" {
		source = "footer"
	}
	const q = `INSERT INTO subscribers (site_id, email, name, status, source)
	             VALUES ($1,$2,$3,$4,$5)
	           ON CONFLICT (site_id, email) DO UPDATE
	             SET status = 'SUBSCRIBED',
	                 name   = COALESCE(NULLIF(excluded.name, ''), subscribers.name),
	                 unsubscribed_at = NULL
	           RETURNING id, created_at, status`
	return d.Pool.QueryRow(ctx, q, s.SiteID, s.Email, s.Name, string(status), source).
		Scan(&s.ID, &s.CreatedAt, &s.Status)
}

// UnsubscribeSubscriber marks a subscriber as unsubscribed.
func (d *DB) UnsubscribeSubscriber(ctx context.Context, siteID int64, email string) error {
	tag, err := d.Pool.Exec(ctx,
		`UPDATE subscribers
		    SET status = 'UNSUBSCRIBED', unsubscribed_at = CURRENT_TIMESTAMP
		  WHERE site_id = $1 AND email = $2`,
		siteID, email)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// ListSiteSubscribers returns subscribers for a single store.
func (d *DB) ListSiteSubscribers(ctx context.Context, siteID int64, limit, offset int) ([]*domain.Subscriber, int, error) {
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}
	var total int
	if err := d.Pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM subscribers WHERE site_id = $1`, siteID,
	).Scan(&total); err != nil {
		return nil, 0, err
	}
	q := `SELECT id, site_id, email, name, status, source, unsubscribed_at, created_at
	      FROM subscribers WHERE site_id = $1
	      ORDER BY created_at DESC LIMIT $2 OFFSET $3`
	rows, err := d.Pool.Query(ctx, q, siteID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := make([]*domain.Subscriber, 0, limit)
	for rows.Next() {
		s, err := scanSubscriber(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, s)
	}
	return out, total, rows.Err()
}

// ListAllSubscribers returns subscribers across every store.
func (d *DB) ListAllSubscribers(ctx context.Context, f domain.SubscriberListFilter) ([]*domain.Subscriber, int, error) {
	if f.Limit <= 0 || f.Limit > 500 {
		f.Limit = 100
	}
	if f.Offset < 0 {
		f.Offset = 0
	}
	var total int
	if err := d.Pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM subscribers sub
		 WHERE ($1::bigint = 0 OR sub.site_id = $1)
		   AND ($2::text = '' OR sub.status = $2)
		   AND ($3::text = '' OR sub.email ILIKE '%'||$3||'%' OR sub.name ILIKE '%'||$3||'%')`,
		f.SiteID, string(f.Status), f.Search,
	).Scan(&total); err != nil {
		return nil, 0, err
	}
	q := `SELECT sub.id, sub.site_id, sub.email, sub.name, sub.status, sub.source,
	             sub.unsubscribed_at, sub.created_at, s.name AS site_name, s.slug AS site_slug
	      FROM subscribers sub
	      JOIN sites s ON s.id = sub.site_id
	      WHERE ($1::bigint = 0 OR sub.site_id = $1)
	        AND ($2::text = '' OR sub.status = $2)
	        AND ($3::text = '' OR sub.email ILIKE '%'||$3||'%' OR sub.name ILIKE '%'||$3||'%')
	      ORDER BY sub.created_at DESC LIMIT $4 OFFSET $5`
	rows, err := d.Pool.Query(ctx, q, f.SiteID, string(f.Status), f.Search, f.Limit, f.Offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := make([]*domain.Subscriber, 0, f.Limit)
	for rows.Next() {
		s := &domain.Subscriber{}
		if err := rows.Scan(&s.ID, &s.SiteID, &s.Email, &s.Name, &s.Status, &s.Source,
			&s.UnsubscribedAt, &s.CreatedAt, &s.SiteName, &s.SiteSlug); err != nil {
			return nil, 0, err
		}
		out = append(out, s)
	}
	return out, total, rows.Err()
}

// SubscriberEmails returns the active subscriber emails for a store (broadcast).
func (d *DB) SubscriberEmails(ctx context.Context, siteID int64) ([]string, error) {
	rows, err := d.Pool.Query(ctx,
		`SELECT email FROM subscribers WHERE site_id = $1 AND status = 'SUBSCRIBED' ORDER BY created_at`,
		siteID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []string{}
	for rows.Next() {
		var e string
		if err := rows.Scan(&e); err != nil {
			return nil, err
		}
		out = append(out, e)
	}
	return out, rows.Err()
}

func scanSubscriber(r pgx.Rows) (*domain.Subscriber, error) {
	s := &domain.Subscriber{}
	err := r.Scan(&s.ID, &s.SiteID, &s.Email, &s.Name, &s.Status, &s.Source, &s.UnsubscribedAt, &s.CreatedAt)
	return s, err
}

// ensure fmt is used (status formatting helper kept for future use).
var _ = fmt.Sprintf
