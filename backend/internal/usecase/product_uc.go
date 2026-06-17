package usecase

import (
	"context"
	"fmt"
	"strings"

	"sunstore/internal/domain"
)

const (
	defaultListLimit = 24
	maxListLimit     = 100
)

// ProductUseCase orchestrates storefront/admin product behavior.
type ProductUseCase struct {
	repo domain.ProductRepository
}

// NewProductUseCase constructs a ProductUseCase.
func NewProductUseCase(repo domain.ProductRepository) *ProductUseCase {
	return &ProductUseCase{repo: repo}
}

// ListStorefront returns active products only.
func (uc *ProductUseCase) ListStorefront(ctx context.Context, filter domain.ProductListFilter) ([]domain.Product, int64, error) {
	filter = normalizeListFilter(filter)
	filter.IncludeInactive = false
	return uc.repo.List(ctx, filter)
}

// GetStorefrontBySlug loads a single active product by slug.
func (uc *ProductUseCase) GetStorefrontBySlug(ctx context.Context, slug string) (*domain.Product, error) {
	slug = strings.TrimSpace(slug)
	if slug == "" {
		return nil, fmt.Errorf("%w: slug is required", domain.ErrValidation)
	}
	return uc.repo.GetBySlug(ctx, slug, false)
}

// ListAdmin returns products for the admin panel.
func (uc *ProductUseCase) ListAdmin(ctx context.Context, filter domain.ProductListFilter) ([]domain.Product, int64, error) {
	filter = normalizeListFilter(filter)
	filter.IncludeInactive = true
	return uc.repo.List(ctx, filter)
}

// Create creates a product from admin input.
func (uc *ProductUseCase) Create(ctx context.Context, input domain.UpsertProductInput) (*domain.Product, error) {
	if err := validateUpsertProduct(input); err != nil {
		return nil, err
	}
	return uc.repo.Create(ctx, normalizeUpsertProduct(input))
}

// Update updates an existing product.
func (uc *ProductUseCase) Update(ctx context.Context, id int64, input domain.UpsertProductInput) (*domain.Product, error) {
	if id <= 0 {
		return nil, fmt.Errorf("%w: invalid product id", domain.ErrValidation)
	}
	if err := validateUpsertProduct(input); err != nil {
		return nil, err
	}
	return uc.repo.Update(ctx, id, normalizeUpsertProduct(input))
}

// Delete removes a product record.
func (uc *ProductUseCase) Delete(ctx context.Context, id int64) error {
	if id <= 0 {
		return fmt.Errorf("%w: invalid product id", domain.ErrValidation)
	}
	return uc.repo.Delete(ctx, id)
}

func normalizeListFilter(filter domain.ProductListFilter) domain.ProductListFilter {
	if filter.Limit <= 0 {
		filter.Limit = defaultListLimit
	}
	if filter.Limit > maxListLimit {
		filter.Limit = maxListLimit
	}
	if filter.Offset < 0 {
		filter.Offset = 0
	}
	filter.CategorySlug = strings.TrimSpace(filter.CategorySlug)
	filter.Search = strings.TrimSpace(filter.Search)
	switch filter.Sort {
	case domain.ProductSortNewest, domain.ProductSortPriceAsc, domain.ProductSortPriceDesc, domain.ProductSortTitleAsc:
	default:
		filter.Sort = domain.ProductSortNewest
	}
	return filter
}

func normalizeUpsertProduct(input domain.UpsertProductInput) domain.UpsertProductInput {
	input.Slug = strings.TrimSpace(strings.ToLower(input.Slug))
	input.TitleRU = strings.TrimSpace(input.TitleRU)
	input.DescriptionRU = strings.TrimSpace(input.DescriptionRU)
	input.SKU = strings.TrimSpace(strings.ToUpper(input.SKU))
	normalizedImages := make([]string, 0, len(input.Images))
	for _, img := range input.Images {
		if trimmed := strings.TrimSpace(img); trimmed != "" {
			normalizedImages = append(normalizedImages, trimmed)
		}
	}
	input.Images = normalizedImages
	return input
}

func validateUpsertProduct(input domain.UpsertProductInput) error {
	if strings.TrimSpace(input.Slug) == "" {
		return fmt.Errorf("%w: slug is required", domain.ErrValidation)
	}
	if strings.TrimSpace(input.TitleRU) == "" {
		return fmt.Errorf("%w: title_ru is required", domain.ErrValidation)
	}
	if strings.TrimSpace(input.DescriptionRU) == "" {
		return fmt.Errorf("%w: description_ru is required", domain.ErrValidation)
	}
	if input.PriceKopecks < 0 {
		return fmt.Errorf("%w: price_kopecks must be >= 0", domain.ErrValidation)
	}
	if strings.TrimSpace(input.SKU) == "" {
		return fmt.Errorf("%w: sku is required", domain.ErrValidation)
	}
	if input.StockQuantity < 0 {
		return fmt.Errorf("%w: stock_quantity must be >= 0", domain.ErrValidation)
	}
	if len(input.Images) == 0 {
		return fmt.Errorf("%w: at least one image is required", domain.ErrValidation)
	}
	return nil
}
