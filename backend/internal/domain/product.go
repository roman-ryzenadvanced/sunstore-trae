package domain

import (
	"context"
	"time"
)

// ProductSort describes the supported storefront/admin sort modes.
type ProductSort string

const (
	ProductSortNewest    ProductSort = "newest"
	ProductSortPriceAsc  ProductSort = "price_asc"
	ProductSortPriceDesc ProductSort = "price_desc"
	ProductSortTitleAsc  ProductSort = "title_asc"
)

// Category is the catalog grouping entity.
type Category struct {
	ID        int64     `json:"id"`
	Slug      string    `json:"slug"`
	NameRU    string    `json:"name_ru"`
	CreatedAt time.Time `json:"created_at"`
}

// Product is the primary storefront/admin product model.
type Product struct {
	ID             int64     `json:"id"`
	CategoryID     *int64    `json:"category_id,omitempty"`
	CategorySlug   *string   `json:"category_slug,omitempty"`
	CategoryNameRU *string   `json:"category_name_ru,omitempty"`
	Slug           string    `json:"slug"`
	TitleRU        string    `json:"title_ru"`
	DescriptionRU  string    `json:"description_ru"`
	PriceKopecks   int64     `json:"price_kopecks"`
	SKU            string    `json:"sku"`
	StockQuantity  int       `json:"stock_quantity"`
	Images         []string  `json:"images"`
	IsActive       bool      `json:"is_active"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// ProductListFilter drives storefront/admin listing behavior.
type ProductListFilter struct {
	Limit           int
	Offset          int
	CategorySlug    string
	Search          string
	Sort            ProductSort
	IncludeInactive bool
}

// UpsertProductInput is the admin payload for create/update.
type UpsertProductInput struct {
	CategoryID    *int64   `json:"category_id"`
	Slug          string   `json:"slug"`
	TitleRU       string   `json:"title_ru"`
	DescriptionRU string   `json:"description_ru"`
	PriceKopecks  int64    `json:"price_kopecks"`
	SKU           string   `json:"sku"`
	StockQuantity int      `json:"stock_quantity"`
	Images        []string `json:"images"`
	IsActive      bool     `json:"is_active"`
}

// ProductRepository is the storage contract for products.
type ProductRepository interface {
	List(ctx context.Context, filter ProductListFilter) ([]Product, int64, error)
	GetBySlug(ctx context.Context, slug string, includeInactive bool) (*Product, error)
	GetByID(ctx context.Context, id int64) (*Product, error)
	GetByIDs(ctx context.Context, ids []int64, activeOnly bool) ([]Product, error)
	Create(ctx context.Context, input UpsertProductInput) (*Product, error)
	Update(ctx context.Context, id int64, input UpsertProductInput) (*Product, error)
	Delete(ctx context.Context, id int64) error
}
