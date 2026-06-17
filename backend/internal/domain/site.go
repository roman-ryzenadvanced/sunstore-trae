// Package domain contains the multi-site core entities.
package domain

import (
	"time"
)

// SiteStatus is the lifecycle of a storefront site.
type SiteStatus string

const (
	SiteStatusProvisioning SiteStatus = "PROVISIONING"
	SiteStatusReady        SiteStatus = "READY"
	SiteStatusSuspended    SiteStatus = "SUSPENDED"
	SiteStatusArchived     SiteStatus = "ARCHIVED"
)

// Site is one storefront provisioned from a template.
type Site struct {
	ID           int64
	Slug         string
	Name         string
	Niche        string
	TemplateID   string
	Status       SiteStatus
	CustomDomain *string
	PrimaryColor *string
	LogoMark     *string
	Tagline      *string
	Description  *string
	Settings     map[string]any
	CreatedAt    time.Time
	UpdatedAt    time.Time
	LaunchedAt   *time.Time
}

// SiteAdmin is a per-site administrator.
type SiteAdmin struct {
	ID           int64
	SiteID       int64
	Username     string
	PasswordHash string
	Role         string
	IsActive     bool
	LastLoginAt  *time.Time
	CreatedAt    time.Time
}

// SuperAdmin is a central platform administrator.
type SuperAdmin struct {
	ID           int64
	Username     string
	PasswordHash string
	CreatedAt    time.Time
}

// SiteProduct is a product owned by a single site.
type SiteProduct struct {
	ID            int64
	SiteID        int64
	Slug          string
	Title         string
	Description   string
	PriceKopecks  int64
	SKU           string
	StockQuantity int
	Images        []string
	Category      string
	IsActive      bool
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

// SiteOrder is an order tied to a site.
type SiteOrder struct {
	ID                  int64
	SiteID              int64
	TBankOrderID        string
	TBankPaymentID      *string
	CustomerName        string
	CustomerEmail       string
	CustomerPhone       string
	TotalAmountKopecks  int64
	Status              OrderStatus
	RawTBankResponse    map[string]any
	CreatedAt           time.Time
	UpdatedAt           time.Time
	Items               []SiteOrderItem
}

// SiteOrderItem is a line item snapshot of a site order.
type SiteOrderItem struct {
	ID                    int64
	OrderID               int64
	ProductID             *int64
	Quantity              int
	PriceAtPurchaseKopeck int64
}

// SiteFilter narrows the result set when listing sites.
type SiteFilter struct {
	Status     SiteStatus
	Niche      string
	TemplateID string
	Search     string
	Limit      int
	Offset     int
}
