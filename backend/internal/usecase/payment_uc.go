package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"

	"sunstore/internal/domain"
)

// PaymentGateway abstracts T-Bank so Phase 3 can supply the concrete adapter.
type PaymentGateway interface {
	InitPayment(ctx context.Context, input PaymentInitRequest) (*PaymentInitResult, error)
}

// PaymentInitRequest is the gateway payload prepared from a validated order.
type PaymentInitRequest struct {
	TBankOrderID  string
	AmountKopecks int64
	Description   string
	CustomerName  string
	CustomerEmail string
	CustomerPhone string
	Items         []domain.OrderItem
}

// PaymentInitResult is the downstream acquiring response mapped into a stable shape.
type PaymentInitResult struct {
	PaymentURL string
	PaymentID  string
	Raw        json.RawMessage
}

// PaymentUseCase handles checkout validation, order persistence, and payment init.
type PaymentUseCase struct {
	products domain.ProductRepository
	orders   domain.OrderRepository
	gateway  PaymentGateway
}

// NewPaymentUseCase constructs a PaymentUseCase.
func NewPaymentUseCase(products domain.ProductRepository, orders domain.OrderRepository, gateway PaymentGateway) *PaymentUseCase {
	return &PaymentUseCase{
		products: products,
		orders:   orders,
		gateway:  gateway,
	}
}

// CheckoutInit validates the basket, persists the order, and starts payment initialization.
func (uc *PaymentUseCase) CheckoutInit(ctx context.Context, req domain.CheckoutRequest) (*domain.CheckoutResponse, error) {
	if err := validateCheckoutRequest(req); err != nil {
		return nil, err
	}

	mergedItems := mergeCheckoutItems(req.Items)
	productIDs := make([]int64, 0, len(mergedItems))
	for _, item := range mergedItems {
		productIDs = append(productIDs, item.ProductID)
	}

	products, err := uc.products.GetByIDs(ctx, productIDs, true)
	if err != nil {
		return nil, err
	}
	if len(products) != len(productIDs) {
		return nil, fmt.Errorf("%w: one or more products are unavailable", domain.ErrValidation)
	}

	productIndex := make(map[int64]domain.Product, len(products))
	for _, product := range products {
		productIndex[product.ID] = product
	}

	orderItems := make([]domain.OrderItemCreateInput, 0, len(mergedItems))
	paymentItems := make([]domain.OrderItem, 0, len(mergedItems))
	var total int64

	for _, item := range mergedItems {
		product, ok := productIndex[item.ProductID]
		if !ok {
			return nil, fmt.Errorf("%w: product %d not found", domain.ErrValidation, item.ProductID)
		}
		if item.Quantity > product.StockQuantity {
			return nil, fmt.Errorf("%w: insufficient stock for product %s", domain.ErrValidation, product.Slug)
		}

		lineAmount := product.PriceKopecks * int64(item.Quantity)
		total += lineAmount
		orderItems = append(orderItems, domain.OrderItemCreateInput{
			ProductID:              product.ID,
			Quantity:               item.Quantity,
			PriceAtPurchaseKopecks: product.PriceKopecks,
		})
		paymentItems = append(paymentItems, domain.OrderItem{
			ProductID:              &product.ID,
			ProductSlug:            product.Slug,
			ProductTitleRU:         product.TitleRU,
			Quantity:               item.Quantity,
			PriceAtPurchaseKopecks: product.PriceKopecks,
		})
	}

	order, err := uc.orders.Create(ctx, domain.CreateOrderInput{
		TBankOrderID:       buildTBankOrderID(),
		CustomerName:       strings.TrimSpace(req.CustomerName),
		CustomerEmail:      strings.TrimSpace(strings.ToLower(req.Email)),
		CustomerPhone:      strings.TrimSpace(req.Phone),
		TotalAmountKopecks: total,
		Status:             domain.OrderStatusNew,
		Items:              orderItems,
	})
	if err != nil {
		return nil, err
	}

	if uc.gateway == nil {
		return nil, fmt.Errorf("%w: payment gateway is not configured yet", domain.ErrUnavailable)
	}

	gatewayRes, err := uc.gateway.InitPayment(ctx, PaymentInitRequest{
		TBankOrderID:  order.TBankOrderID,
		AmountKopecks: total,
		Description:   fmt.Sprintf("Order %s", order.TBankOrderID),
		CustomerName:  order.CustomerName,
		CustomerEmail: order.CustomerEmail,
		CustomerPhone: order.CustomerPhone,
		Items:         paymentItems,
	})
	if err != nil {
		return nil, err
	}

	if err := uc.orders.AttachPaymentInit(ctx, order.ID, gatewayRes.PaymentID, domain.OrderStatusPending, gatewayRes.Raw); err != nil {
		return nil, err
	}

	return &domain.CheckoutResponse{
		Success:    true,
		PaymentURL: gatewayRes.PaymentURL,
		OrderID:    order.TBankOrderID,
	}, nil
}

func validateCheckoutRequest(req domain.CheckoutRequest) error {
	if strings.TrimSpace(req.CustomerName) == "" {
		return fmt.Errorf("%w: customer_name is required", domain.ErrValidation)
	}
	if strings.TrimSpace(req.Email) == "" {
		return fmt.Errorf("%w: email is required", domain.ErrValidation)
	}
	if strings.TrimSpace(req.Phone) == "" {
		return fmt.Errorf("%w: phone is required", domain.ErrValidation)
	}
	if len(req.Items) == 0 {
		return fmt.Errorf("%w: at least one item is required", domain.ErrValidation)
	}
	for _, item := range req.Items {
		if item.ProductID <= 0 {
			return fmt.Errorf("%w: product_id must be > 0", domain.ErrValidation)
		}
		if item.Quantity <= 0 {
			return fmt.Errorf("%w: quantity must be > 0", domain.ErrValidation)
		}
	}
	return nil
}

func mergeCheckoutItems(items []domain.CheckoutItemInput) []domain.CheckoutItemInput {
	counts := make(map[int64]int, len(items))
	for _, item := range items {
		counts[item.ProductID] += item.Quantity
	}
	ids := make([]int64, 0, len(counts))
	for id := range counts {
		ids = append(ids, id)
	}
	sort.Slice(ids, func(i, j int) bool { return ids[i] < ids[j] })

	out := make([]domain.CheckoutItemInput, 0, len(ids))
	for _, id := range ids {
		out = append(out, domain.CheckoutItemInput{
			ProductID: id,
			Quantity:  counts[id],
		})
	}
	return out
}

func buildTBankOrderID() string {
	now := time.Now().UTC().Format("20060102T150405")
	return "ORDER_" + now + "_" + strings.ToUpper(strings.ReplaceAll(uuid.NewString()[:8], "-", ""))
}
