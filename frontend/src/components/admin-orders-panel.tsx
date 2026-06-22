"use client";

import { useEffect, useState } from "react";
import { PackageOpen, RefreshCw } from "lucide-react";

import { AdminAuthGate } from "@/components/admin-auth-gate";
import { listAdminOrders } from "@/lib/api";
import { formatDateTime, formatPrice } from "@/lib/format";
import { toast } from "@/components/toaster";
import { Skeleton } from "@/components/skeletons";
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

const STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "Новый",
  PENDING: "В ожидании",
  AUTHORIZED: "Авторизован",
  CONFIRMED: "Подтверждён",
  REJECTED: "Отклонён",
  REFUNDED: "Возврат"
};

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

  async function load() {
    setLoading(true);
    try {
      const response = await listAdminOrders(token, status || undefined);
      setOrders(response);
    } catch (e) {
      toast.error("Не удалось загрузить заказы");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, token]);

  const totalRevenue = orders
    .filter((o) => o.status === "CONFIRMED")
    .reduce((sum, o) => sum + o.total_amount_kopecks, 0);

  return (
    <section className="admin-panel">
      <div className="admin-panel__header">
        <div>
          <p className="eyebrow">Заказы</p>
          <h1>Все заказы</h1>
        </div>
        <div className="admin-stats">
          <div>
            <span>Всего</span>
            <strong>{orders.length}</strong>
          </div>
          <div>
            <span>Подтверждённая выручка</span>
            <strong>{formatPrice(totalRevenue)}</strong>
          </div>
          <label className="field field--compact">
            <span>Статус</span>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as OrderStatus | "")
              }
            >
              {statuses.map((entry) => (
                <option key={entry || "all"} value={entry}>
                  {entry ? STATUS_LABELS[entry] : "Все"}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="button button--ghost"
            onClick={load}
            disabled={loading}
            aria-label="Обновить список заказов"
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Обновить
          </button>
        </div>
      </div>

      {loading ? (
        <div className="orders-stack">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="skeleton--order" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="admin-empty">
          <PackageOpen size={32} aria-hidden="true" />
          <h3>Заказов нет</h3>
          <p className="muted">
            {status
              ? `Нет заказов со статусом «${STATUS_LABELS[status]}».`
              : "Как только покупатели оформят заказы, они появятся здесь."}
          </p>
        </div>
      ) : (
        <div className="orders-stack">
          {orders.map((order) => (
            <article key={order.id} className="order-card">
              <div className="order-card__header">
                <div>
                  <p className="eyebrow">
                    Заказ #{order.id} · {order.tbank_order_id}
                  </p>
                  <h3>{order.customer_name}</h3>
                </div>
                <div
                  className={`status-pill status-pill--${order.status.toLowerCase()}`}
                >
                  {STATUS_LABELS[order.status]}
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
                    <span>×{item.quantity}</span>
                    <strong>
                      {formatPrice(
                        item.price_at_purchase_kopecks * item.quantity
                      )}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="order-card__footer">
                <span>Итого</span>
                <strong>{formatPrice(order.total_amount_kopecks)}</strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
