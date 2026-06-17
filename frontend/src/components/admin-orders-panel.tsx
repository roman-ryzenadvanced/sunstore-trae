"use client";

import { useEffect, useState } from "react";

import { AdminAuthGate } from "@/components/admin-auth-gate";
import { listAdminOrders } from "@/lib/api";
import { formatDateTime, formatPrice } from "@/lib/format";
import type { Order, OrderStatus } from "@/types/api";

const statuses: Array<OrderStatus | ""> = [
  "",
  "NEW",
  "PENDING",
  "AUTHORIZED",
  "CONFIRMED",
  "REJECTED",
  "REFUNDED"
];

export function AdminOrdersPanel() {
  return (
    <AdminAuthGate>
      {(session) => <AdminOrdersContent token={session.token} />}
    </AdminAuthGate>
  );
}

function AdminOrdersContent({ token }: { token: string }) {
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    listAdminOrders(token, status || undefined)
      .then((response) => {
        if (mounted) {
          setOrders(response);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [status, token]);

  return (
    <section className="admin-panel">
      <div className="admin-panel__header">
        <div>
          <p className="eyebrow">Orders overview</p>
          <h1>Заказы</h1>
        </div>
        <label className="field field--compact">
          <span>Статус</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as OrderStatus | "")}>
            {statuses.map((entry) => (
              <option key={entry || "all"} value={entry}>
                {entry || "Все"}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="admin-empty">Загрузка заказов...</div>
      ) : (
        <div className="orders-stack">
          {orders.map((order) => (
            <article key={order.id} className="order-card">
              <div className="order-card__header">
                <div>
                  <p className="eyebrow">{order.tbank_order_id}</p>
                  <h3>{order.customer_name}</h3>
                </div>
                <div className={`status-pill status-pill--${order.status.toLowerCase()}`}>
                  {order.status}
                </div>
              </div>

              <div className="order-card__meta">
                <p>{order.customer_email}</p>
                <p>{order.customer_phone}</p>
                <p>{formatDateTime(order.created_at)}</p>
              </div>

              <div className="order-card__items">
                {order.items.map((item) => (
                  <div key={item.id} className="order-card__item">
                    <span>{item.product_title_ru || item.product_slug}</span>
                    <span>x{item.quantity}</span>
                    <strong>{formatPrice(item.price_at_purchase_kopecks * item.quantity)}</strong>
                  </div>
                ))}
              </div>

              <div className="order-card__footer">
                <span>Всего</span>
                <strong>{formatPrice(order.total_amount_kopecks)}</strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
