// Package postgres — contact_submissions persistence.
package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"

	"sunstore/internal/domain"
)

// CreateContactSubmission inserts a new contact submission.
func (d *DB) CreateContactSubmission(ctx context.Context, in domain.ContactSubmissionCreateInput, sourceURL, userIP, userAgent string) (*domain.ContactSubmission, error) {
	const q = `
		INSERT INTO contact_submissions (name, email, phone, subject, message, source_url, user_ip, user_agent)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at`
	c := &domain.ContactSubmission{
		Name:      in.Name,
		Email:     in.Email,
		Phone:     in.Phone,
		Subject:   in.Subject,
		Message:   in.Message,
		SourceURL: sourceURL,
		UserIP:    userIP,
		UserAgent: userAgent,
	}
	err := d.Pool.QueryRow(ctx, q,
		in.Name, in.Email, in.Phone, in.Subject, in.Message, sourceURL, userIP, userAgent,
	).Scan(&c.ID, &c.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("insert contact submission: %w", err)
	}
	return c, nil
}

// ListContactSubmissions returns most-recent-first submissions (unread first if onlyUnread).
func (d *DB) ListContactSubmissions(ctx context.Context, onlyUnread bool, limit int) ([]*domain.ContactSubmission, error) {
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	q := `SELECT id, name, email, phone, subject, message, source_url, user_ip, user_agent, is_read, handled_at, created_at
	      FROM contact_submissions`
	if onlyUnread {
		q += " WHERE is_read = FALSE"
	}
	q += " ORDER BY is_read ASC, created_at DESC LIMIT $1"
	rows, err := d.Pool.Query(ctx, q, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]*domain.ContactSubmission, 0, limit)
	for rows.Next() {
		c := &domain.ContactSubmission{}
		if err := rows.Scan(&c.ID, &c.Name, &c.Email, &c.Phone, &c.Subject, &c.Message, &c.SourceURL, &c.UserIP, &c.UserAgent, &c.IsRead, &c.HandledAt, &c.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

// MarkContactRead flags a submission as read (or unread).
func (d *DB) MarkContactRead(ctx context.Context, id int64, isRead bool) error {
	tag, err := d.Pool.Exec(ctx, `UPDATE contact_submissions SET is_read = $1, handled_at = CASE WHEN $1 THEN COALESCE(handled_at, CURRENT_TIMESTAMP) ELSE NULL END WHERE id = $2`, isRead, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// DeleteContactSubmission removes a submission.
func (d *DB) DeleteContactSubmission(ctx context.Context, id int64) error {
	tag, err := d.Pool.Exec(ctx, `DELETE FROM contact_submissions WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// CountUnreadContactSubmissions returns the count of unread submissions (for badge).
func (d *DB) CountUnreadContactSubmissions(ctx context.Context) (int64, error) {
	var n int64
	err := d.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM contact_submissions WHERE is_read = FALSE`).Scan(&n)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, nil
	}
	return n, err
}
