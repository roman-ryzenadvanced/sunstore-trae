// Package domain — contact form submissions from the public storefront.
package domain

import "time"

// ContactSubmission is a single message sent via the public contact form
// on the storefront. It is stored centrally and visible only to the super-admin.
type ContactSubmission struct {
	ID        int64
	Name      string
	Email     string
	Phone     string // optional
	Subject   string // optional, free text
	Message   string
	SourceURL string // page the form was submitted from (for context)
	UserIP    string // best-effort, for spam triage
	UserAgent string
	IsRead    bool
	HandledAt *time.Time
	CreatedAt time.Time
}

// ContactSubmissionCreateInput is the validated payload accepted from the public API.
type ContactSubmissionCreateInput struct {
	Name    string
	Email   string
	Phone   string
	Subject string
	Message string
}
