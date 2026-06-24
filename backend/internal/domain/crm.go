// Package domain — CRM entities: support tickets and mailing-list subscribers.
//
// Everything here is governed by the single super-admin token. Per-site rows
// (tickets, subscribers) are created by public storefront endpoints and read
// / managed from the unified super-admin CRM.
package domain

import "time"

// TicketStatus is the lifecycle of a support / contact request.
type TicketStatus string

const (
	TicketStatusNew     TicketStatus = "NEW"
	TicketStatusOpen    TicketStatus = "OPEN"
	TicketStatusReplied TicketStatus = "REPLIED"
	TicketStatusClosed  TicketStatus = "CLOSED"
)

// SupportTicket is one contact-form / support message captured from a store.
type SupportTicket struct {
	ID           int64      `json:"id"`
	SiteID       int64      `json:"site_id"`
	Name         string     `json:"name"`
	Email        string     `json:"email"`
	Phone        string     `json:"phone,omitempty"`
	Subject      string     `json:"subject"`
	Message      string     `json:"message"`
	Status       TicketStatus `json:"status"`
	Source       string     `json:"source"`
	IPAddress    string     `json:"ip_address,omitempty"`
	ReplySubject string     `json:"reply_subject,omitempty"`
	ReplyBody    string     `json:"reply_body,omitempty"`
	RepliedAt    *time.Time `json:"replied_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`

	// Populated only by cross-store queries (JOIN sites).
	SiteName string `json:"site_name,omitempty"`
	SiteSlug string `json:"site_slug,omitempty"`
}

// ContactFormInput is the public storefront payload for a contact submission.
type ContactFormInput struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Phone   string `json:"phone"`
	Subject string `json:"subject"`
	Message string `json:"message"`
	Source  string `json:"source"`
}

// TicketListFilter narrows the super-admin inbox listing. SiteID == 0 means
// "all stores".
type TicketListFilter struct {
	SiteID int64
	Status TicketStatus // empty = any status
	Search string       // name / email / subject
	Limit  int
	Offset int
}

// SubscriberStatus is the mailing-list lifecycle.
type SubscriberStatus string

const (
	SubscriberStatusSubscribed   SubscriberStatus = "SUBSCRIBED"
	SubscriberStatusUnsubscribed SubscriberStatus = "UNSUBSCRIBED"
)

// Subscriber is one mailing-list entry for a store.
type Subscriber struct {
	ID            int64            `json:"id"`
	SiteID        int64            `json:"site_id"`
	Email         string           `json:"email"`
	Name          string           `json:"name,omitempty"`
	Status        SubscriberStatus `json:"status"`
	Source        string           `json:"source"`
	UnsubscribedAt *time.Time      `json:"unsubscribed_at,omitempty"`
	CreatedAt     time.Time        `json:"created_at"`

	// Populated only by cross-store queries (JOIN sites).
	SiteName string `json:"site_name,omitempty"`
	SiteSlug string `json:"site_slug,omitempty"`
}

// SubscribeInput is the public storefront payload for joining a mailing list.
type SubscribeInput struct {
	Email  string `json:"email"`
	Name   string `json:"name"`
	Source string `json:"source"`
}

// SubscriberListFilter narrows the super-admin subscriber listing.
// SiteID == 0 means "all stores".
type SubscriberListFilter struct {
	SiteID int64
	Status SubscriberStatus // empty = any status
	Search string           // email / name
	Limit  int
	Offset int
}

// DomainStatus is the custom-domain lifecycle on a site.
type DomainStatus string

const (
	DomainStatusNone    DomainStatus = "NONE"
	DomainStatusPending DomainStatus = "PENDING"
	DomainStatusActive  DomainStatus = "ACTIVE"
	DomainStatusFailed  DomainStatus = "FAILED"
)

// DomainInstructions is the DNS guidance handed to a store owner so they can
// point their registrar (Namecheap, GoDaddy, …) at the platform.
type DomainInstructions struct {
	Nameservers []string `json:"nameservers"`
	ApexIP      string   `json:"apex_ip"`
	PreviewURL  string   `json:"preview_url"` // the platform preview base (e.g. vercel)
	Record      string   `json:"record"`      // human description
}
