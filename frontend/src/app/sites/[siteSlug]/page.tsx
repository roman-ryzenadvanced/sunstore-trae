"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getSiteBySlug, CentralSite } from "@/lib/multi-site/api";
import { useCartStore } from "@/store/cart";
import { TEMPLATES } from "@/lib/templates/templates";

interface SiteProduct {
  id: number;
  slug: string;
  title: string;
  description: string;
  price_kopecks: number;
  images: string[];
  is_active: boolean;
  stock_quantity: number;
  category?: string;
}

function rub(k: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(k / 100);
}

export default function PerSiteStorefront() {
  const params = useParams();
  const slug = String(params?.siteSlug || "");
  const router = useRouter();
  const [site, setSite] = useState<CentralSite | null>(null);
  const [products, setProducts] = useState<SiteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.open);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([getSiteBySlug(slug), getMockProducts(slug)]).then(([s, p]) => {
      setSite(s);
      setProducts(p);
      setLoading(false);
    });
  }, [slug]);

  const template = useMemo(() => TEMPLATES.find((t) => t.id === site?.template_id), [site]);

  if (loading) {
    return <div style={{ padding: 32, color: "#888" }}>Загрузка…</div>;
  }
  if (!site || !template) {
    return (
      <main style={{ padding: 64, textAlign: "center" }}>
        <h1 style={{ fontSize: 24 }}>Сайт не найден</h1>
        <p style={{ color: "#888" }}>slug: {slug}</p>
        <Link href="/central/setup" style={{ display: "inline-block", marginTop: 16, padding: "10px 16px", borderRadius: 8, background: "#000", color: "#fff", textDecoration: "none" }}>
          Создать магазин
        </Link>
      </main>
    );
  }

  const c = template.colors;
  const t = template.typography;
  const b = template.branding;

  return (
    <main style={{ minHeight: "100vh", background: c.background, color: c.text, fontFamily: t.bodyFont }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: c.surface,
          borderBottom: `1px solid ${c.border}`,
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 26, color: c.accent }}>{b.logoMark}</span>
          <div>
            <p style={{ margin: 0, fontSize: 18, fontWeight: t.displayWeight, fontFamily: t.displayFont }}>{b.storeName}</p>
            <p style={{ margin: 0, fontSize: 11, color: c.textMuted }}>{b.tagline}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={openCart}
            style={{ padding: "8px 14px", borderRadius: template.spacing.buttonRadius, background: c.accent, color: c.accentText, border: "none", cursor: "pointer", fontWeight: 600 }}
          >
            Корзина
          </button>
          <Link
            href={`/sites/${slug}/admin`}
            style={{ padding: "8px 14px", borderRadius: template.spacing.buttonRadius, background: "transparent", color: c.text, border: `1px solid ${c.border}`, textDecoration: "none", fontSize: 13 }}
          >
            Войти как админ
          </Link>
        </div>
      </header>

      <section
        style={{
          padding: "80px 24px",
          textAlign: "center",
          background: `linear-gradient(135deg, ${c.surfaceAlt}, ${c.background})`,
        }}
      >
        <p style={{ fontSize: 12, letterSpacing: 4, textTransform: "uppercase", color: c.textMuted, margin: 0 }}>
          {template.heroCopy.eyebrow}
        </p>
        <h1 style={{ fontSize: 48, fontWeight: t.displayWeight, fontFamily: t.displayFont, margin: "12px auto", maxWidth: 800, lineHeight: 1.1 }}>
          {template.heroCopy.headline}
        </h1>
        <p style={{ fontSize: 16, color: c.textMuted, maxWidth: 600, margin: "0 auto 24px" }}>{template.heroCopy.subhead}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button
            onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
            style={{ padding: "12px 24px", borderRadius: template.spacing.buttonRadius, background: c.accent, color: c.accentText, border: "none", fontWeight: 600, cursor: "pointer" }}
          >
            {template.heroCopy.ctaPrimary}
          </button>
        </div>
      </section>

      <section id="products" style={{ padding: "60px 24px", maxWidth: template.spacing.shellMaxWidth, margin: "0 auto" }}>
        <h2 style={{ fontSize: 28, fontWeight: t.displayWeight, fontFamily: t.displayFont, margin: "0 0 24px" }}>Каталог</h2>
        {products.length === 0 ? (
          <p style={{ color: c.textMuted }}>Пока нет товаров. Добавьте их через админ панель.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
            {products.map((p) => (
              <article key={p.id} style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: template.spacing.cardRadius, overflow: "hidden" }}>
                <div style={{ aspectRatio: "1", background: c.surfaceAlt, overflow: "hidden" }}>
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: c.textMuted }}>{b.logoMark}</div>
                  )}
                </div>
                <div style={{ padding: 16 }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{p.title}</p>
                  <p style={{ margin: "4px 0 12px", fontSize: 12, color: c.textMuted }}>{p.description}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: c.accent }}>{rub(p.price_kopecks)}</span>
                    <button
                      onClick={() => {
                        addItem({
                          id: p.id,
                          slug: p.slug,
                          title: p.title,
                          description: p.description,
                          price_kopecks: p.price_kopecks,
                          images: p.images || [],
                          stock_quantity: p.stock_quantity,
                        } as any);
                      }}
                      style={{ padding: "8px 12px", borderRadius: template.spacing.buttonRadius, background: c.accent, color: c.accentText, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                    >
                      В корзину
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer style={{ padding: "40px 24px", borderTop: `1px solid ${c.border}`, textAlign: "center", color: c.textMuted, fontSize: 12 }}>
        © {new Date().getFullYear()} {b.storeName}. Powered by Sun.store.
      </footer>
    </main>
  );
}

async function getMockProducts(slug: string): Promise<SiteProduct[]> {
  // Try backend first, then fall back to local mock
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1"}/sites/${slug}/products`);
    if (res.ok) return await res.json();
  } catch {
    // fall through
  }
  // Persist local mock for this site
  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem(`sunstore-site-products-${slug}`);
    if (raw) return JSON.parse(raw);
  }
  return [];
}
