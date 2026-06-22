"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Loader2, LogOut, PackageOpen, Plus, Save } from "lucide-react";

import { useSiteSessionStore } from "@/lib/multi-site/store";
import { toast } from "@/components/toaster";
import { formatPrice, slugify } from "@/lib/format";

import "../../../../central/central.css";

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
  const [saving, setSaving] = useState(false);

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
    try {
      setProducts(raw ? JSON.parse(raw) : []);
    } catch {
      setProducts([]);
    }
  }

  function save(next: SiteProduct[]) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEY(slug), JSON.stringify(next));
    setProducts(next);
  }

  function upsert(p: SiteProduct) {
    setSaving(true);
    // Simulate async save.
    setTimeout(() => {
      const exists = products.find((x) => x.id === p.id);
      if (exists) {
        save(products.map((x) => (x.id === p.id ? p : x)));
        toast.success("Товар обновлён", p.title);
      } else {
        save([p, ...products]);
        toast.success("Товар создан", p.title);
      }
      setShowForm(false);
      setEditing(null);
      setSaving(false);
    }, 300);
  }

  function remove(id: number) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    if (!confirm(`Удалить «${p.title}»? Действие необратимо.`)) return;
    save(products.filter((x) => x.id !== id));
    toast.success("Товар удалён", p.title);
    if (editing?.id === id) {
      setEditing(null);
      setShowForm(false);
    }
  }

  const totalValue = products.reduce(
    (a, p) => a + p.price_kopecks * p.stock_quantity,
    0
  );

  return (
    <main className="central-shell">
      <header className="central-header">
        <div>
          <p className="central-header__eyebrow">Site Admin</p>
          <h1 className="central-header__title">
            {slug} — панель управления
          </h1>
        </div>
        <div className="central-header__actions">
          <Link
            href={`/sites/${slug}`}
            target="_blank"
            className="central-btn central-btn--ghost"
          >
            Открыть витрину
          </Link>
          <button
            onClick={() => {
              clear(slug);
              toast.info("Сессия завершена");
              router.push(`/sites/${slug}/admin`);
            }}
            className="central-btn central-btn--ghost"
          >
            <LogOut size={14} /> Выйти
          </button>
        </div>
      </header>

      <section className="central-stats">
        <div className="central-stat">
          <p className="central-stat__label">Товаров</p>
          <p className="central-stat__value">{products.length}</p>
        </div>
        <div className="central-stat">
          <p className="central-stat__label">Активных</p>
          <p className="central-stat__value">
            {products.filter((p) => p.is_active).length}
          </p>
        </div>
        <div className="central-stat">
          <p className="central-stat__label">Стоимость склада</p>
          <p className="central-stat__value" style={{ fontSize: 20 }}>
            {formatPrice(totalValue)}
          </p>
        </div>
      </section>

      <section style={{ padding: "0 24px 24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
            flexWrap: "wrap",
            gap: 12
          }}
        >
          <h2 style={{ fontSize: 16, margin: 0 }}>Каталог товаров</h2>
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="central-btn central-btn--primary"
          >
            <Plus size={14} /> Новый товар
          </button>
        </div>

        {showForm && (
          <ProductForm
            initial={editing}
            saving={saving}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
            onSubmit={upsert}
          />
        )}

        {products.length === 0 ? (
          <div className="central-empty">
            <PackageOpen size={32} style={{ opacity: 0.4 }} />
            <p className="central-empty__text">
              Нет товаров. Нажмите «Новый товар».
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
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            background: "#1f1f1f",
                            borderRadius: 6,
                            overflow: "hidden",
                            flexShrink: 0
                          }}
                        >
                          {p.images?.[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.images[0]}
                              alt=""
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover"
                              }}
                            />
                          )}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 14 }}>{p.title}</p>
                          <p style={{ margin: 0, fontSize: 11, color: "#888" }}>
                            /{p.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: 12, fontSize: 14 }}>
                      {formatPrice(p.price_kopecks)}
                    </td>
                    <td style={{ padding: 12, fontSize: 14 }}>
                      {p.stock_quantity}
                    </td>
                    <td style={{ padding: 12, fontSize: 14 }}>
                      {p.is_active ? "✅" : "—"}
                    </td>
                    <td style={{ padding: 12, textAlign: "right" }}>
                      <button
                        onClick={() => {
                          setEditing(p);
                          setShowForm(true);
                        }}
                        className="central-btn central-btn--ghost"
                        style={{ fontSize: 11, padding: "4px 8px", marginRight: 6 }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(p.id)}
                        className="central-btn central-btn--danger"
                        style={{ fontSize: 11, padding: "4px 8px" }}
                      >
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

function ProductForm({
  initial,
  saving,
  onSubmit,
  onCancel
}: {
  initial: SiteProduct | null;
  saving: boolean;
  onSubmit: (p: SiteProduct) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [price, setPrice] = useState(
    ((initial?.price_kopecks || 0) / 100).toString()
  );
  const [stock, setStock] = useState(
    (initial?.stock_quantity || 0).toString()
  );
  const [image, setImage] = useState(initial?.images?.[0] || "");
  const [active, setActive] = useState(initial?.is_active ?? true);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Введите название");
      return;
    }
    const product: SiteProduct = {
      id: initial?.id || Date.now(),
      slug: slug || slugify(title),
      title: title.trim(),
      description: description.trim(),
      price_kopecks: Math.round(parseFloat(price || "0") * 100),
      stock_quantity: parseInt(stock || "0", 10),
      is_active: active,
      images: image ? [image] : []
    };
    onSubmit(product);
  }

  return (
    <form
      onSubmit={submit}
      style={{
        background: "#111",
        border: "1px solid #222",
        borderRadius: 12,
        padding: 20,
        marginBottom: 16
      }}
    >
      <div className="central-setup__fields">
        <Field label="Название" value={title} onChange={setTitle} />
        <Field label="Slug" value={slug} onChange={setSlug} />
        <Field label="Описание" value={description} onChange={setDescription} />
        <Field label="URL изображения" value={image} onChange={setImage} />
        <Field
          label="Цена (RUB)"
          value={price}
          onChange={setPrice}
          type="number"
        />
        <Field
          label="Запас"
          value={stock}
          onChange={setStock}
          type="number"
        />
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 16,
            color: "#aaa",
            fontSize: 12
          }}
        >
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />{" "}
          Активен
        </label>
      </div>
      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button
          type="submit"
          disabled={saving}
          className="central-btn central-btn--primary"
        >
          {saving ? (
            <>
              <Loader2 size={14} className="spin" /> Сохранение…
            </>
          ) : (
            <>
              <Save size={14} /> Сохранить
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="central-btn central-btn--ghost"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="central-setup__field">
      <span className="central-setup__field-label">{label}</span>
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="central-setup__field-input"
      />
    </label>
  );
}
