package usecase

import (
	"context"
	"fmt"

	"sunstore/internal/domain"
)

// OrderUseCase serves admin order views.
type OrderUseCase struct {
	repo domain.OrderRepository
}

// NewOrderUseCase constructs an OrderUseCase.
func NewOrderUseCase(repo domain.OrderRepository) *OrderUseCase {
	return &OrderUseCase{repo: repo}
}

// ListAdmin returns paginated orders for the admin portal.
func (uc *OrderUseCase) ListAdmin(ctx context.Context, filter domain.OrderListFilter) ([]domain.Order, int64, error) {
	if filter.Limit <= 0 {
		filter.Limit = defaultListLimit
	}
	if filter.Limit > maxListLimit {
		filter.Limit = maxListLimit
	}
	if filter.Offset < 0 {
		filter.Offset = 0
	}
	if filter.Status != "" {
		switch filter.Status {
		case domain.OrderStatusNew, domain.OrderStatusPending, domain.OrderStatusAuthorized, domain.OrderStatusConfirmed, domain.OrderStatusRejected, domain.OrderStatusRefunded:
		default:
			return nil, 0, fmt.Errorf("%w: invalid order status filter", domain.ErrValidation)
		}
	}
	return uc.repo.List(ctx, filter)
}
