"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut, Package, RefreshCw } from "lucide-react";

import {
  listAllShopProducts,
  listCentralSites,
  ShopProduct,
  CentralSite
} from "@/lib/multi-site/api";
import { useCentralAuthStore } from "@/lib/multi-site/store";
import { formatPrice } from "@/lib/format";
import { toast } from "@/components/toaster";

import "../central.css";

export default function CentralProductsPage() {
  const router = useRouter();
  const token = useCentralAuthStore((s) => s.token);
  const clear = useCentralAuthStore((s) => s.clear);

  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [sites, setSites] = useState<CentralSite[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
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
      const [prod, siteList] = await Promise.all([
        listAllShopProducts(token, {
          search: search.trim() || undefined,
          active: activeOnly || undefined,
          site_id: siteFilter === "" ? undefined : Number(siteFilter),
          limit: 200
        }),
        listCentralSites(token)
      ]);
      setProducts(prod.items);
      setTotal(prod.total);
      setSites(siteList);
    } catch (e: any) {
      toast.error("Ошибка", e?.message || "Не удалось загрузить товары");
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const inventoryValue = products.reduce(
      (sum, p) => sum + p.price_kopecks * p.stock_quantity,
      0
    );
    const active = products.filter((p) => p.is_active).length;
    const lowStock = products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 5).length;
    const outOfStock = products.filter((p) => p.stock_quantity === 0).length;
    return { total, shown: products.length, inventoryValue, active, lowStock, outOfStock };
  }, [products, total]);

  return (
    <main className="central-shell">
      <header className="central-header">
        <div>
          <p className="central-header__eyebrow">Sun Panels Store Super Admin</p>
          <h1 className="central-header__title">Все товары</h1>
          <p style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
            Товары со всех магазинов в одной таблице.
          </p>
        </div>
        <div className="central-header__actions">
          <Link href="/central/dashboard" className="central-btn central-btn--ghost">
            <ArrowLeft size={14} /> К магазинам
          </Link>
          <Link href="/central/orders" className="central-btn central-btn--ghost">
            Все заказы
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
          { label: "Всего SKU", v: stats.total },
          { label: "Стоимость склада", v: formatPrice(stats.inventoryValue) },
          { label: "Активных", v: stats.active },
          { label: "Заканчиваются / нет", v: `${stats.lowStock} / ${stats.outOfStock}` }
        ].map((c) => (
          <div key={c.label} className="central-stat">
            <p className="central-stat__label">{c.label}</p>
            <p className="central-stat__value">{c.v}</p>
          </div>
        ))}
      </section>

      <section style={{ padding: "0 24px 24px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") refresh();
            }}
            placeholder="Поиск: название, артикул…"
            className="central-search"
            style={{ marginBottom: 0, flex: 1, minWidth: 200 }}
          />
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
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "#aaa",
              fontSize: 13,
              cursor: "pointer",
              userSelect: "none"
            }}
          >
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            Только активные
          </label>
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
          <p style={{ color: "#888", padding: 24 }}>Загрузка товаров…</p>
        ) : products.length === 0 ? (
          <div className="central-empty">
            <Package size={32} style={{ opacity: 0.4 }} />
            <p className="central-empty__text">
              Товаров не найдено. Измените фильтры или добавьте товар в одном из магазинов.
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
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
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
                  <th style={{ padding: 12, textAlign: "left" }}>Товар</th>
                  <th style={{ padding: 12, textAlign: "left" }}>Магазин</th>
                  <th style={{ padding: 12, textAlign: "left" }}>Артикул</th>
                  <th style={{ padding: 12, textAlign: "left" }}>Категория</th>
                  <th style={{ padding: 12, textAlign: "right" }}>Цена</th>
                  <th style={{ padding: 12, textAlign: "right" }}>Запас</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={`${p.site_id}-${p.id}`} style={{ borderTop: "1px solid #1a1a1a" }}>
                    <td style={{ padding: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {p.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.images[0]}
                            alt=""
                            width={40}
                            height={40}
                            style={{
                              borderRadius: 6,
                              objectFit: "cover",
                              border: "1px solid #222"
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 6,
                              background: "#1a1a1a",
                              border: "1px solid #222",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#444"
                            }}
                          >
                            <Package size={16} />
                          </div>
                        )}
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: 14 }}>{p.title}</span>
                          <span style={{ fontSize: 11, color: "#666" }}>/{p.slug}</span>
                          {!p.is_active && (
                            <span style={{ fontSize: 10, color: "#ffb400", marginTop: 2 }}>
                              скрыт
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: 12, fontSize: 13 }}>
                      {p.site_name ? (
                        <Link
                          href={`/central/sites/${p.site_id}`}
                          style={{ color: "#00ff88", textDecoration: "none" }}
                        >
                          {p.site_name}
                        </Link>
                      ) : (
                        <span style={{ color: "#666" }}>#{p.site_id}</span>
                      )}
                    </td>
                    <td style={{ padding: 12, fontSize: 12, color: "#aaa" }}>{p.sku}</td>
                    <td style={{ padding: 12, fontSize: 12, color: "#aaa" }}>{p.category}</td>
                    <td style={{ padding: 12, fontSize: 14, textAlign: "right" }}>
                      {formatPrice(p.price_kopecks)}
                    </td>
                    <td style={{ padding: 12, fontSize: 14, textAlign: "right" }}>
                      <span
                        style={{
                          color:
                            p.stock_quantity === 0
                              ? "#ff5252"
                              : p.stock_quantity <= 5
                              ? "#ffb400"
                              : "#fff"
                        }}
                      >
                        {p.stock_quantity}
                      </span>
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
