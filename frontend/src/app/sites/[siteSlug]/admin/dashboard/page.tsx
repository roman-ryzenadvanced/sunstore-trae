"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSiteSessionStore } from "@/lib/multi-site/store";

interface SiteProduct {
  id: number;
  slug: string;
  title: string;
  description: string;
  price_kopecks: number;
  stock_quantity: number;
  is_active: boolean;
  images: string[];
}

const KEY = (slug: string) => `sunstore-site-products-${slug}`;

export default function SiteAdminDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const slug = String(params?.siteSlug || "");
  const session = useSiteSessionStore((s) => s.get(slug));
  const clear = useSiteSessionStore((s) => s.clear);

  const [products, setProducts] = useState<SiteProduct[]>([]);
  const [editing, setEditing] = useState<SiteProduct | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!session) {
      router.push(`/sites/${slug}/admin`);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, session?.token]);

  function load() {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(KEY(slug));
    setProducts(raw ? JSON.parse(raw) : []);
  }

  function save(next: SiteProduct[]) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEY(slug), JSON.stringify(next));
    setProducts(next);
  }

  function upsert(p: SiteProduct) {
    const exists = products.find((x) => x.id === p.id);
    if (exists) {
      save(products.map((x) => (x.id === p.id ? p : x)));
    } else {
      save([p, ...products]);
    }
    setShowForm(false);
    setEditing(null);
  }

  function remove(id: number) {
    if (!confirm("Удалить товар?")) return;
    save(products.filter((p) => p.id !== id));
  }

  function rub(k: number) {
    return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(k / 100);
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0A0A0A", color: "#fff", fontFamily: "'Manrope', system-ui, sans-serif" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 32px", borderBottom: "1px solid #222" }}>
        <div>
          <p style={{ fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "#888", margin: 0 }}>Site Admin</p>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: "4px 0 0" }}>{slug} — панель</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={`/sites/${slug}`} target="_blank" style={{ padding: "8px 12px", borderRadius: 6, background: "transparent", color: "#888", border: "1px solid #333", textDecoration: "none", fontSize: 12 }}>
            Открыть витрину
          </Link>
          <button onClick={() => { clear(slug); router.push(`/sites/${slug}/admin`); }} style={{ padding: "8px 12px", borderRadius: 6, background: "transparent", color: "#aaa", border: "1px solid #333", cursor: "pointer", fontSize: 12 }}>
            Выйти
          </button>
        </div>
      </header>

      <section style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <Card label="Товаров" value={products.length} />
        <Card label="Активных" value={products.filter((p) => p.is_active).length} />
        <Card label="Общая стоимость" value={rub(products.reduce((a, p) => a + p.price_kopecks * p.stock_quantity, 0))} />
      </section>

      <section style={{ padding: "0 24px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, margin: 0 }}>Каталог товаров</h2>
          <button onClick={() => { setEditing(null); setShowForm(true); }} style={{ padding: "8px 14px", borderRadius: 6, background: "#00FF88", color: "#000", border: "none", fontWeight: 600, cursor: "pointer" }}>
            + Новый товар
          </button>
        </div>

        {showForm && (
          <ProductForm
            initial={editing}
            onCancel={() => { setShowForm(false); setEditing(null); }}
            onSubmit={upsert}
          />
        )}

        {products.length === 0 ? (
          <p style={{ color: "#888", padding: 24, textAlign: "center" }}>Нет товаров. Нажмите «Новый товар».</p>
        ) : (
          <div style={{ background: "#111", border: "1px solid #222", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#1a1a1a", color: "#888", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>
                  <th style={{ padding: 12, textAlign: "left" }}>Товар</th>
                  <th style={{ padding: 12, textAlign: "left" }}>Цена</th>
                  <th style={{ padding: 12, textAlign: "left" }}>Запас</th>
                  <th style={{ padding: 12, textAlign: "left" }}>Активен</th>
                  <th style={{ padding: 12, textAlign: "right" }}></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} style={{ borderTop: "1px solid #1a1a1a" }}>
                    <td style={{ padding: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 40, height: 40, background: "#1f1f1f", borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
                          {p.images?.[0] && <img src={p.images[0]} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 14 }}>{p.title}</p>
                          <p style={{ margin: 0, fontSize: 11, color: "#888" }}>{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: 12, fontSize: 14 }}>{rub(p.price_kopecks)}</td>
                    <td style={{ padding: 12, fontSize: 14 }}>{p.stock_quantity}</td>
                    <td style={{ padding: 12, fontSize: 14 }}>{p.is_active ? "✅" : "—"}</td>
                    <td style={{ padding: 12, textAlign: "right" }}>
                      <button onClick={() => { setEditing(p); setShowForm(true); }} style={{ padding: "4px 8px", borderRadius: 4, background: "transparent", color: "#FFB400", border: "1px solid #FFB400", cursor: "pointer", fontSize: 11, marginRight: 6 }}>
                        Edit
                      </button>
                      <button onClick={() => remove(p.id)} style={{ padding: "4px 8px", borderRadius: 4, background: "transparent", color: "#FF5252", border: "1px solid #FF5252", cursor: "pointer", fontSize: 11 }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function Card({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: 16 }}>
      <p style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 2, margin: 0 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, margin: "8px 0 0" }}>{value}</p>
    </div>
  );
}

function ProductForm({ initial, onSubmit, onCancel }: { initial: SiteProduct | null; onSubmit: (p: SiteProduct) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [price, setPrice] = useState(((initial?.price_kopecks || 0) / 100).toString());
  const [stock, setStock] = useState((initial?.stock_quantity || 0).toString());
  const [image, setImage] = useState(initial?.images?.[0] || "");
  const [active, setActive] = useState(initial?.is_active ?? true);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const product: SiteProduct = {
      id: initial?.id || Date.now(),
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title,
      description,
      price_kopecks: Math.round(parseFloat(price || "0") * 100),
      stock_quantity: parseInt(stock || "0", 10),
      is_active: active,
      images: image ? [image] : [],
    };
    onSubmit(product);
  }

  return (
    <form onSubmit={submit} style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: 20, marginBottom: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Название" value={title} onChange={setTitle} />
        <Field label="Slug" value={slug} onChange={setSlug} />
        <Field label="Описание" value={description} onChange={setDescription} />
        <Field label="URL изображения" value={image} onChange={setImage} />
        <Field label="Цена (RUB)" value={price} onChange={setPrice} type="number" />
        <Field label="Запас" value={stock} onChange={setStock} type="number" />
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, color: "#aaa", fontSize: 12 }}>
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Активен
        </label>
      </div>
      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button type="submit" style={{ padding: "8px 14px", borderRadius: 6, background: "#00FF88", color: "#000", border: "none", fontWeight: 600, cursor: "pointer" }}>
          Сохранить
        </button>
        <button type="button" onClick={onCancel} style={{ padding: "8px 14px", borderRadius: 6, background: "transparent", color: "#888", border: "1px solid #333", cursor: "pointer" }}>
          Отмена
        </button>
      </div>
    </form>
  );
}

function Field({ label, value, onChange, type }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ fontSize: 12, color: "#aaa" }}>{label}</span>
      <input type={type || "text"} value={value} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, background: "#000", color: "#fff", border: "1px solid #333", marginTop: 4 }} />
    </label>
  );
}
