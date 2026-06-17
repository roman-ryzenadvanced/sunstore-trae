package httpdelivery

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"sunstore/internal/domain"
	"sunstore/internal/usecase"
)

// ProductHandler serves storefront and admin product routes.
type ProductHandler struct {
	products *usecase.ProductUseCase
}

// NewProductHandler constructs a ProductHandler.
func NewProductHandler(products *usecase.ProductUseCase) *ProductHandler {
	return &ProductHandler{products: products}
}

// ListStorefront handles GET /api/v1/products.
func (h *ProductHandler) ListStorefront(c *gin.Context) {
	products, total, err := h.products.ListStorefront(c.Request.Context(), domain.ProductListFilter{
		Limit:        parseIntQuery(c, "limit", defaultListLimit),
		Offset:       parseIntQuery(c, "offset", 0),
		CategorySlug: strings.TrimSpace(c.Query("category")),
		Sort:         domain.ProductSort(strings.TrimSpace(c.DefaultQuery("sort", string(domain.ProductSortNewest)))),
	})
	if err != nil {
		writeDomainError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    products,
		"meta": gin.H{
			"total":  total,
			"limit":  parseIntQuery(c, "limit", defaultListLimit),
			"offset": parseIntQuery(c, "offset", 0),
		},
	})
}

// GetStorefrontBySlug handles GET /api/v1/products/:slug.
func (h *ProductHandler) GetStorefrontBySlug(c *gin.Context) {
	product, err := h.products.GetStorefrontBySlug(c.Request.Context(), c.Param("slug"))
	if err != nil {
		writeDomainError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    product,
	})
}

// ListAdmin handles GET /api/v1/admin/products.
func (h *ProductHandler) ListAdmin(c *gin.Context) {
	products, total, err := h.products.ListAdmin(c.Request.Context(), domain.ProductListFilter{
		Limit:           parseIntQuery(c, "limit", defaultListLimit),
		Offset:          parseIntQuery(c, "offset", 0),
		CategorySlug:    strings.TrimSpace(c.Query("category")),
		Search:          strings.TrimSpace(c.Query("search")),
		Sort:            domain.ProductSort(strings.TrimSpace(c.DefaultQuery("sort", string(domain.ProductSortNewest)))),
		IncludeInactive: true,
	})
	if err != nil {
		writeDomainError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    products,
		"meta": gin.H{
			"total":  total,
			"limit":  parseIntQuery(c, "limit", defaultListLimit),
			"offset": parseIntQuery(c, "offset", 0),
		},
	})
}

// CreateAdmin handles POST /api/v1/admin/products.
func (h *ProductHandler) CreateAdmin(c *gin.Context) {
	var payload domain.UpsertProductInput
	if err := c.ShouldBindJSON(&payload); err != nil {
		writeError(c, http.StatusBadRequest, "invalid JSON payload")
		return
	}
	product, err := h.products.Create(c.Request.Context(), payload)
	if err != nil {
		writeDomainError(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    product,
	})
}

// UpdateAdmin handles PUT /api/v1/admin/products/:id.
func (h *ProductHandler) UpdateAdmin(c *gin.Context) {
	id, err := parseIDParam(c, "id")
	if err != nil {
		writeError(c, http.StatusBadRequest, "invalid product id")
		return
	}
	var payload domain.UpsertProductInput
	if err := c.ShouldBindJSON(&payload); err != nil {
		writeError(c, http.StatusBadRequest, "invalid JSON payload")
		return
	}
	product, err := h.products.Update(c.Request.Context(), id, payload)
	if err != nil {
		writeDomainError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    product,
	})
}

// DeleteAdmin handles DELETE /api/v1/admin/products/:id.
func (h *ProductHandler) DeleteAdmin(c *gin.Context) {
	id, err := parseIDParam(c, "id")
	if err != nil {
		writeError(c, http.StatusBadRequest, "invalid product id")
		return
	}
	if err := h.products.Delete(c.Request.Context(), id); err != nil {
		writeDomainError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
	})
}
