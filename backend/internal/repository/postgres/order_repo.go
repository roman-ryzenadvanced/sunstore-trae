package postgres

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sort"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"sunstore/internal/domain"
)

// OrderRepository is the PostgreSQL implementation of domain.OrderRepository.
type OrderRepository struct {
	db *DB
}

// NewOrderRepository constructs an OrderRepository.
func NewOrderRepository(db *DB) *OrderRepository {
	return &OrderRepository{db: db}
}

// Create inserts an order plus its line items in one transaction.
func (r *OrderRepository) Create(ctx context.Context, input domain.CreateOrderInput) (*domain.Order, error) {
	var order domain.Order

	err := r.db.WithTx(ctx, func(tx pgx.Tx) error {
		query := `
			INSERT INTO orders (
				tbank_order_id, customer_name, customer_email, customer_phone, total_amount_kopecks, status
			) VALUES ($1,$2,$3,$4,$5,$6)
			RETURNING id, tbank_order_id, tbank_payment_id, customer_name, customer_email, customer_phone, total_amount_kopecks, status, raw_tbank_response, created_at, updated_at
		`
		if err := tx.QueryRow(ctx, query,
			input.TBankOrderID,
			input.CustomerName,
			input.CustomerEmail,
			input.CustomerPhone,
			input.TotalAmountKopecks,
			input.Status,
		).Scan(
			&order.ID,
			&order.TBankOrderID,
			&order.TBankPaymentID,
			&order.CustomerName,
			&order.CustomerEmail,
			&order.CustomerPhone,
			&order.TotalAmountKopecks,
			&order.Status,
			&order.RawTBankResponse,
			&order.CreatedAt,
			&order.UpdatedAt,
		); err != nil {
			return mapWriteError("create order", err)
		}

		order.Items = make([]domain.OrderItem, 0, len(input.Items))
		for _, item := range input.Items {
			var orderItem domain.OrderItem
			insertItem := `
				INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase_kopecks)
				VALUES ($1,$2,$3,$4)
				RETURNING id, order_id, product_id, quantity, price_at_purchase_kopecks
			`
			if err := tx.QueryRow(ctx, insertItem,
				order.ID,
				item.ProductID,
				item.Quantity,
				item.PriceAtPurchaseKopecks,
			).Scan(
				&orderItem.ID,
				&orderItem.OrderID,
				&orderItem.ProductID,
				&orderItem.Quantity,
				&orderItem.PriceAtPurchaseKopecks,
			); err != nil {
				return fmt.Errorf("create order item: %w", err)
			}
			order.Items = append(order.Items, orderItem)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &order, nil
}

// List returns paginated admin orders and their line items.
func (r *OrderRepository) List(ctx context.Context, filter domain.OrderListFilter) ([]domain.Order, int64, error) {
	where := ""
	args := make([]any, 0, 3)
	if filter.Status != "" {
		args = append(args, filter.Status)
		where = ` WHERE o.status = $1`
	}

	countSQL := `SELECT COUNT(*) FROM orders o` + where
	var total int64
	if err := r.db.Pool.QueryRow(ctx, countSQL, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count orders: %w", err)
	}

	queryArgs := append(append([]any{}, args...), filter.Limit, filter.Offset)
	query := `
		SELECT
			o.id,
			o.tbank_order_id,
			o.tbank_payment_id,
			o.customer_name,
			o.customer_email,
			o.customer_phone,
			o.total_amount_kopecks,
			o.status,
			o.raw_tbank_response,
			o.created_at,
			o.updated_at
		FROM orders o
	` + where + `
		ORDER BY o.created_at DESC, o.id DESC
		LIMIT $` + itoa(len(args)+1) + ` OFFSET $` + itoa(len(args)+2)

	rows, err := r.db.Pool.Query(ctx, query, queryArgs...)
	if err != nil {
		return nil, 0, fmt.Errorf("list orders: %w", err)
	}
	defer rows.Close()

	orders := make([]domain.Order, 0, filter.Limit)
	orderIDs := make([]int64, 0, filter.Limit)
	for rows.Next() {
		order, err := scanOrder(rows)
		if err != nil {
			return nil, 0, err
		}
		orders = append(orders, order)
		orderIDs = append(orderIDs, order.ID)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("iterate orders: %w", err)
	}
	if len(orderIDs) == 0 {
		return orders, total, nil
	}

	itemsByOrderID, err := r.loadItemsByOrderIDs(ctx, orderIDs)
	if err != nil {
		return nil, 0, err
	}
	for i := range orders {
		orders[i].Items = itemsByOrderID[orders[i].ID]
	}
	return orders, total, nil
}

// GetByTBankOrderID loads one order plus its line items.
func (r *OrderRepository) GetByTBankOrderID(ctx context.Context, tbankOrderID string) (*domain.Order, error) {
	query := `
		SELECT
			o.id,
			o.tbank_order_id,
			o.tbank_payment_id,
			o.customer_name,
			o.customer_email,
			o.customer_phone,
			o.total_amount_kopecks,
			o.status,
			o.raw_tbank_response,
			o.created_at,
			o.updated_at
		FROM orders o
		WHERE o.tbank_order_id = $1
	`
	order, err := scanOrder(r.db.Pool.QueryRow(ctx, query, tbankOrderID))
	if err != nil {
		return nil, err
	}

	itemsByOrderID, err := r.loadItemsByOrderIDs(ctx, []int64{order.ID})
	if err != nil {
		return nil, err
	}
	order.Items = itemsByOrderID[order.ID]
	return &order, nil
}

// AttachPaymentInit stores the result of an acquiring init call.
func (r *OrderRepository) AttachPaymentInit(ctx context.Context, orderID int64, paymentID string, status domain.OrderStatus, raw json.RawMessage) error {
	tag, err := r.db.Pool.Exec(ctx, `
		UPDATE orders
		SET tbank_payment_id = $2, status = $3, raw_tbank_response = $4, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`, orderID, paymentID, status, raw)
	if err != nil {
		return fmt.Errorf("attach payment init: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

// UpdateStatusByTBankOrderID updates an order by the external T-Bank order ID.
func (r *OrderRepository) UpdateStatusByTBankOrderID(ctx context.Context, tbankOrderID string, paymentID *string, status domain.OrderStatus, raw json.RawMessage) error {
	tag, err := r.db.Pool.Exec(ctx, `
		UPDATE orders
		SET
			tbank_payment_id = COALESCE($2, tbank_payment_id),
			status = $3,
			raw_tbank_response = $4,
			updated_at = CURRENT_TIMESTAMP
		WHERE tbank_order_id = $1
	`, tbankOrderID, paymentID, status, raw)
	if err != nil {
		return fmt.Errorf("update order status by tbank order id: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *OrderRepository) loadItemsByOrderIDs(ctx context.Context, orderIDs []int64) (map[int64][]domain.OrderItem, error) {
	sort.Slice(orderIDs, func(i, j int) bool { return orderIDs[i] < orderIDs[j] })
	rows, err := r.db.Pool.Query(ctx, `
		SELECT
			oi.id,
			oi.order_id,
			oi.product_id,
			COALESCE(p.slug, ''),
			COALESCE(p.title_ru, ''),
			oi.quantity,
			oi.price_at_purchase_kopecks
		FROM order_items oi
		LEFT JOIN products p ON p.id = oi.product_id
		WHERE oi.order_id = ANY($1)
		ORDER BY oi.id ASC
	`, orderIDs)
	if err != nil {
		return nil, fmt.Errorf("load order items: %w", err)
	}
	defer rows.Close()

	itemsByOrderID := make(map[int64][]domain.OrderItem, len(orderIDs))
	for rows.Next() {
		var (
			item      domain.OrderItem
			productID pgtype.Int8
		)
		if err := rows.Scan(
			&item.ID,
			&item.OrderID,
			&productID,
			&item.ProductSlug,
			&item.ProductTitleRU,
			&item.Quantity,
			&item.PriceAtPurchaseKopecks,
		); err != nil {
			return nil, fmt.Errorf("scan order item: %w", err)
		}
		if productID.Valid {
			value := productID.Int64
			item.ProductID = &value
		}
		itemsByOrderID[item.OrderID] = append(itemsByOrderID[item.OrderID], item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate order items: %w", err)
	}
	return itemsByOrderID, nil
}

func scanOrder(row scanner) (domain.Order, error) {
	var order domain.Order
	err := row.Scan(
		&order.ID,
		&order.TBankOrderID,
		&order.TBankPaymentID,
		&order.CustomerName,
		&order.CustomerEmail,
		&order.CustomerPhone,
		&order.TotalAmountKopecks,
		&order.Status,
		&order.RawTBankResponse,
		&order.CreatedAt,
		&order.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Order{}, domain.ErrNotFound
		}
		return domain.Order{}, fmt.Errorf("scan order: %w", err)
	}
	return order, nil
}
