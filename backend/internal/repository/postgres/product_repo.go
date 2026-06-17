package postgres

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"

	"sunstore/internal/domain"
)

// ProductRepository is the PostgreSQL implementation of domain.ProductRepository.
type ProductRepository struct {
	db DBTX
}

// NewProductRepository constructs a ProductRepository.
func NewProductRepository(db DBTX) *ProductRepository {
	return &ProductRepository{db: db}
}

// List returns paginated products for storefront or admin.
func (r *ProductRepository) List(ctx context.Context, filter domain.ProductListFilter) ([]domain.Product, int64, error) {
	where, args := buildProductWhere(filter)
	countSQL := `SELECT COUNT(*) FROM products p LEFT JOIN categories c ON c.id = p.category_id ` + where
	var total int64
	if err := r.db.QueryRow(ctx, countSQL, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count products: %w", err)
	}

	queryArgs := append(append([]any{}, args...), filter.Limit, filter.Offset)
	query := `
		SELECT
			p.id,
			p.category_id,
			c.slug,
			c.name_ru,
			p.slug,
			p.title_ru,
			p.description_ru,
			p.price_kopecks,
			p.sku,
			p.stock_quantity,
			p.images,
			p.is_active,
			p.created_at,
			p.updated_at
		FROM products p
		LEFT JOIN categories c ON c.id = p.category_id
	` + where + `
		ORDER BY ` + buildProductOrderBy(filter.Sort) + `
		LIMIT $` + itoa(len(args)+1) + ` OFFSET $` + itoa(len(args)+2)

	rows, err := r.db.Query(ctx, query, queryArgs...)
	if err != nil {
		return nil, 0, fmt.Errorf("list products: %w", err)
	}
	defer rows.Close()

	products := make([]domain.Product, 0, filter.Limit)
	for rows.Next() {
		product, err := scanProduct(rows)
		if err != nil {
			return nil, 0, err
		}
		products = append(products, product)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("iterate products: %w", err)
	}

	return products, total, nil
}

// GetBySlug returns one product by slug.
func (r *ProductRepository) GetBySlug(ctx context.Context, slug string, includeInactive bool) (*domain.Product, error) {
	query := `
		SELECT
			p.id,
			p.category_id,
			c.slug,
			c.name_ru,
			p.slug,
			p.title_ru,
			p.description_ru,
			p.price_kopecks,
			p.sku,
			p.stock_quantity,
			p.images,
			p.is_active,
			p.created_at,
			p.updated_at
		FROM products p
		LEFT JOIN categories c ON c.id = p.category_id
		WHERE p.slug = $1
	`
	args := []any{slug}
	if !includeInactive {
		query += ` AND p.is_active = TRUE`
	}

	product, err := scanProduct(r.db.QueryRow(ctx, query, args...))
	if err != nil {
		return nil, err
	}
	return &product, nil
}

// GetByID returns one product by numeric ID.
func (r *ProductRepository) GetByID(ctx context.Context, id int64) (*domain.Product, error) {
	query := `
		SELECT
			p.id,
			p.category_id,
			c.slug,
			c.name_ru,
			p.slug,
			p.title_ru,
			p.description_ru,
			p.price_kopecks,
			p.sku,
			p.stock_quantity,
			p.images,
			p.is_active,
			p.created_at,
			p.updated_at
		FROM products p
		LEFT JOIN categories c ON c.id = p.category_id
		WHERE p.id = $1
	`
	product, err := scanProduct(r.db.QueryRow(ctx, query, id))
	if err != nil {
		return nil, err
	}
	return &product, nil
}

// GetByIDs loads multiple products, optionally limited to active ones.
func (r *ProductRepository) GetByIDs(ctx context.Context, ids []int64, activeOnly bool) ([]domain.Product, error) {
	if len(ids) == 0 {
		return []domain.Product{}, nil
	}

	query := `
		SELECT
			p.id,
			p.category_id,
			c.slug,
			c.name_ru,
			p.slug,
			p.title_ru,
			p.description_ru,
			p.price_kopecks,
			p.sku,
			p.stock_quantity,
			p.images,
			p.is_active,
			p.created_at,
			p.updated_at
		FROM products p
		LEFT JOIN categories c ON c.id = p.category_id
		WHERE p.id = ANY($1)
	`
	if activeOnly {
		query += ` AND p.is_active = TRUE`
	}

	rows, err := r.db.Query(ctx, query, ids)
	if err != nil {
		return nil, fmt.Errorf("get products by ids: %w", err)
	}
	defer rows.Close()

	out := make([]domain.Product, 0, len(ids))
	for rows.Next() {
		product, err := scanProduct(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, product)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate products by ids: %w", err)
	}
	return out, nil
}

// Create inserts a product.
func (r *ProductRepository) Create(ctx context.Context, input domain.UpsertProductInput) (*domain.Product, error) {
	query := `
		INSERT INTO products (
			category_id, slug, title_ru, description_ru, price_kopecks, sku, stock_quantity, images, is_active
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
		RETURNING id
	`

	var id int64
	err := r.db.QueryRow(ctx, query,
		input.CategoryID,
		input.Slug,
		input.TitleRU,
		input.DescriptionRU,
		input.PriceKopecks,
		input.SKU,
		input.StockQuantity,
		input.Images,
		input.IsActive,
	).Scan(&id)
	if err != nil {
		return nil, mapWriteError("create product", err)
	}
	return r.GetByID(ctx, id)
}

// Update updates an existing product.
func (r *ProductRepository) Update(ctx context.Context, id int64, input domain.UpsertProductInput) (*domain.Product, error) {
	query := `
		UPDATE products
		SET
			category_id = $2,
			slug = $3,
			title_ru = $4,
			description_ru = $5,
			price_kopecks = $6,
			sku = $7,
			stock_quantity = $8,
			images = $9,
			is_active = $10
		WHERE id = $1
	`
	tag, err := r.db.Exec(ctx, query,
		id,
		input.CategoryID,
		input.Slug,
		input.TitleRU,
		input.DescriptionRU,
		input.PriceKopecks,
		input.SKU,
		input.StockQuantity,
		input.Images,
		input.IsActive,
	)
	if err != nil {
		return nil, mapWriteError("update product", err)
	}
	if tag.RowsAffected() == 0 {
		return nil, domain.ErrNotFound
	}
	return r.GetByID(ctx, id)
}

// Delete removes a product.
func (r *ProductRepository) Delete(ctx context.Context, id int64) error {
	tag, err := r.db.Exec(ctx, `DELETE FROM products WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete product: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func buildProductWhere(filter domain.ProductListFilter) (string, []any) {
	clauses := make([]string, 0, 4)
	args := make([]any, 0, 4)

	if !filter.IncludeInactive {
		clauses = append(clauses, "p.is_active = TRUE")
	}
	if filter.CategorySlug != "" {
		args = append(args, filter.CategorySlug)
		clauses = append(clauses, "c.slug = $"+itoa(len(args)))
	}
	if filter.Search != "" {
		args = append(args, "%"+strings.ToLower(filter.Search)+"%")
		clauses = append(clauses, "(LOWER(p.title_ru) LIKE $"+itoa(len(args))+" OR LOWER(p.slug) LIKE $"+itoa(len(args))+" OR LOWER(p.sku) LIKE $"+itoa(len(args))+")")
	}
	if len(clauses) == 0 {
		return "", args
	}
	return " WHERE " + strings.Join(clauses, " AND "), args
}

func buildProductOrderBy(sort domain.ProductSort) string {
	switch sort {
	case domain.ProductSortPriceAsc:
		return "p.price_kopecks ASC, p.id DESC"
	case domain.ProductSortPriceDesc:
		return "p.price_kopecks DESC, p.id DESC"
	case domain.ProductSortTitleAsc:
		return "p.title_ru ASC, p.id DESC"
	default:
		return "p.created_at DESC, p.id DESC"
	}
}

type scanner interface {
	Scan(dest ...any) error
}

func scanProduct(row scanner) (domain.Product, error) {
	var (
		product      domain.Product
		categoryID   pgtype.Int8
		categorySlug pgtype.Text
		categoryName pgtype.Text
	)
	err := row.Scan(
		&product.ID,
		&categoryID,
		&categorySlug,
		&categoryName,
		&product.Slug,
		&product.TitleRU,
		&product.DescriptionRU,
		&product.PriceKopecks,
		&product.SKU,
		&product.StockQuantity,
		&product.Images,
		&product.IsActive,
		&product.CreatedAt,
		&product.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Product{}, domain.ErrNotFound
		}
		return domain.Product{}, fmt.Errorf("scan product: %w", err)
	}
	if categoryID.Valid {
		value := categoryID.Int64
		product.CategoryID = &value
	}
	if categorySlug.Valid {
		value := categorySlug.String
		product.CategorySlug = &value
	}
	if categoryName.Valid {
		value := categoryName.String
		product.CategoryNameRU = &value
	}
	return product, nil
}

func mapWriteError(op string, err error) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		if pgErr.Code == "23505" {
			return fmt.Errorf("%w: %s", domain.ErrConflict, pgErr.ConstraintName)
		}
	}
	return fmt.Errorf("%s: %w", op, err)
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	buf := [20]byte{}
	i := len(buf)
	for n > 0 {
		i--
		buf[i] = byte('0' + n%10)
		n /= 10
	}
	return string(buf[i:])
}
