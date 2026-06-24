"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut, RefreshCw, ShoppingBag } from "lucide-react";

import {
  listAllShopOrders,
  listCentralSites,
  ShopOrder,
  CentralSite
} from "@/lib/multi-site/api";
import { useCentralAuthStore } from "@/lib/multi-site/store";
import { formatPrice } from "@/lib/format";
import { toast } from "@/components/toaster";

import "../central.css";

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: "", label: "Все статусы" },
  { value: "NEW", label: "Новые" },
  { value: "CONFIRMED", label: "Подтверждённые" },
  { value: "AUTHORIZED", label: "Авторизованные" },
  { value: "REJECTED", label: "Отклонённые" },
  { value: "REFUNDED", label: "Возврат" }
];

export default function CentralOrdersPage() {
  const router = useRouter();
  const token = useCentralAuthStore((s) => s.token);
  const clear = useCentralAuthStore((s) => s.clear);

  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [sites, setSites] = useState<CentralSite[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [siteFilter, setSiteFilter] = useState<number | "">("");

  useEffect(() => {
    if (token === null) {
      router.push("/central/login");
      return;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function refresh() {
    if (!token) return;
    setLoading(true);
    try {
      const [ord, siteList] = await Promise.all([
        listAllShopOrders(token, {
          search: search.trim() || undefined,
          status: statusFilter || undefined,
          site_id: siteFilter === "" ? undefined : Number(siteFilter),
          limit: 200
        }),
        listCentralSites(token)
      ]);
      setOrders(ord.items);
      setTotal(ord.total);
      setSites(siteList);
    } catch (e: any) {
      toast.error("Ошибка", e?.message || "Не удалось загрузить заказы");
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const revenue = orders
      .filter((o) => o.status === "CONFIRMED" || o.status === "AUTHORIZED")
      .reduce((sum, o) => sum + o.total_amount_kopecks, 0);
    const byStatus = (s: string) => orders.filter((o) => o.status === s).length;
    return {
      total,
      shown: orders.length,
      revenue,
      newCount: byStatus("NEW"),
      confirmed: byStatus("CONFIRMED")
    };
  }, [orders, total]);

  return (
    <main className="central-shell">
      <header className="central-header">
        <div>
          <p className="central-header__eyebrow">Sun Panels Store Super Admin</p>
          <h1 className="central-header__title">Все заказы</h1>
          <p style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
            Заказы со всех магазинов в одной таблице.
          </p>
        </div>
        <div className="central-header__actions">
          <Link href="/central/dashboard" className="central-btn central-btn--ghost">
            <ArrowLeft size={14} /> К магазинам
          </Link>
          <Link href="/central/products" className="central-btn central-btn--ghost">
            Все товары
          </Link>
          <button
            onClick={() => {
              clear();
              toast.info("Сессия завершена");
              router.push("/central/login");
            }}
            className="central-btn central-btn--ghost"
          >
            <LogOut size={14} /> Выйти
          </button>
        </div>
      </header>

      <section className="central-stats">
        {[
          { label: "Всего заказов", v: stats.total },
          { label: "Выручка (подтв.)", v: formatPrice(stats.revenue) },
          { label: "Новые", v: stats.newCount },
          { label: "Подтверждённые", v: stats.confirmed }
        ].map((c) => (
          <div key={c.label} className="central-stat">
            <p className="central-stat__label">{c.label}</p>
            <p className="central-stat__value">{c.v}</p>
          </div>
        ))}
      </section>

      <section style={{ padding: "0 24px 24px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") refresh();
            }}
            placeholder="Поиск: имя, email, № заказа…"
            className="central-search"
            style={{ marginBottom: 0, flex: 1, minWidth: 200 }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="central-search"
            style={{ marginBottom: 0, width: "auto", cursor: "pointer" }}
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={siteFilter}
            onChange={(e) =>
              setSiteFilter(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="central-search"
            style={{ marginBottom: 0, width: "auto", cursor: "pointer" }}
          >
            <option value="">Все магазины</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            onClick={refresh}
            disabled={loading}
            className="central-btn central-btn--ghost"
            aria-label="Обновить"
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
          </button>
        </div>

        {loading ? (
          <p style={{ color: "#888", padding: 24 }}>Загрузка заказов…</p>
        ) : orders.length === 0 ? (
          <div className="central-empty">
            <ShoppingBag size={32} style={{ opacity: 0.4 }} />
            <p className="central-empty__text">
              Заказов не найдено. Измените фильтры или создайте заказ в одном из магазинов.
            </p>
          </div>
        ) : (
          <div
            style={{
              background: "#111",
              border: "1px solid #222",
              borderRadius: 12,
              overflow: "auto"
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
              <thead>
                <tr
                  style={{
                    background: "#1a1a1a",
                    color: "#888",
                    fontSize: 11,
                    letterSpacing: 1,
                    textTransform: "uppercase"
                  }}
                >
                  <th style={{ padding: 12, textAlign: "left" }}>#</th>
                  <th style={{ padding: 12, textAlign: "left" }}>Магазин</th>
                  <th style={{ padding: 12, textAlign: "left" }}>Клиент</th>
                  <th style={{ padding: 12, textAlign: "left" }}>Контакт</th>
                  <th style={{ padding: 12, textAlign: "right" }}>Сумма</th>
                  <th style={{ padding: 12, textAlign: "left" }}>Статус</th>
                  <th style={{ padding: 12, textAlign: "left" }}>Дата</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={`${o.site_id}-${o.id}`} style={{ borderTop: "1px solid #1a1a1a" }}>
                    <td style={{ padding: 12, fontSize: 12 }}>#{o.id}</td>
                    <td style={{ padding: 12, fontSize: 13 }}>
                      {o.site_name ? (
                        <Link
                          href={`/central/sites/${o.site_id}`}
                          style={{ color: "#00ff88", textDecoration: "none" }}
                        >
                          {o.site_name}
                        </Link>
                      ) : (
                        <span style={{ color: "#666" }}>#{o.site_id}</span>
                      )}
                    </td>
                    <td style={{ padding: 12, fontSize: 14 }}>{o.customer_name}</td>
                    <td style={{ padding: 12, fontSize: 12, color: "#aaa" }}>
                      {o.customer_email}
                      <br />
                      {o.customer_phone}
                    </td>
                    <td style={{ padding: 12, fontSize: 14, textAlign: "right" }}>
                      {formatPrice(o.total_amount_kopecks)}
                    </td>
                    <td style={{ padding: 12, fontSize: 12 }}>
                      <span
                        className={`central-status-pill central-status-pill--${String(
                          o.status || ""
                        ).toLowerCase()}`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td style={{ padding: 12, fontSize: 12, color: "#aaa" }}>
                      {new Date(o.created_at).toLocaleString("ru-RU")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ color: "#666", fontSize: 12, padding: "12px 16px", margin: 0 }}>
              Показано {stats.shown} из {stats.total}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
