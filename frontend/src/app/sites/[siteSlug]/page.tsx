"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ShoppingBag, Store, ArrowLeft, PackageOpen } from "lucide-react";

import { getSiteBySlug, CentralSite, listSiteProducts } from "@/lib/multi-site/api";
import { useCartStore } from "@/store/cart";
import { TEMPLATES } from "@/lib/templates/templates";
import { formatPrice } from "@/lib/format";
import { toast } from "@/components/toaster";
import { Skeleton } from "@/components/skeletons";
import type { Product } from "@/types/api";

import "./storefront.css";

export default function PerSiteStorefront() {
  const params = useParams();
  const slug = String(params?.siteSlug || "");
  const [site, setSite] = useState<CentralSite | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.open);
  const cartCount = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.quantity, 0)
  );

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([getSiteBySlug(slug), listSiteProducts(slug)])
      .then(([s, p]) => {
        setSite(s);
        // Hydrate products from localStorage if backend returned nothing.
        if ((!p || p.length === 0) && typeof window !== "undefined") {
          const raw = window.localStorage.getItem(`sunstore-site-products-${slug}`);
          if (raw) {
            try {
              setProducts(JSON.parse(raw));
              return;
            } catch {
              // ignore
            }
          }
        }
        setProducts(p || []);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const template = useMemo(
    () => TEMPLATES.find((t) => t.id === site?.template_id),
    [site]
  );

  // Inject template tokens as CSS variables on this subtree.
  const themeVars = useMemo(() => {
    if (!template) return {};
    const c = template.colors;
    const t = template.typography;
    const s = template.spacing;
    return {
      ["--site-bg" as string]: c.background,
      ["--site-surface" as string]: c.surface,
      ["--site-surface-alt" as string]: c.surfaceAlt,
      ["--site-text" as string]: c.text,
      ["--site-text-muted" as string]: c.textMuted,
      ["--site-accent" as string]: c.accent,
      ["--site-accent-text" as string]: c.accentText,
      ["--site-border" as string]: c.border,
      ["--site-success" as string]: c.success,
      ["--site-warning" as string]: c.warning,
      ["--site-danger" as string]: c.danger,
      ["--site-display-font" as string]: t.displayFont,
      ["--site-body-font" as string]: t.bodyFont,
      ["--site-display-weight" as string]: String(t.displayWeight),
      ["--site-shell" as string]: s.shellMaxWidth,
      ["--site-radius-card" as string]: s.cardRadius,
      ["--site-radius-button" as string]: s.buttonRadius
    } as React.CSSProperties;
  }, [template]);

  if (loading) {
    return (
      <main className="site-storefront site-storefront--loading">
        <div className="site-storefront__loading">
          <Skeleton style={{ height: 60, width: 200 }} />
          <Skeleton style={{ height: 30, width: "60%" }} />
          <Skeleton style={{ height: 200, width: "100%" }} />
        </div>
      </main>
    );
  }

  if (!site || !template) {
    return (
      <main className="site-storefront site-storefront--notfound">
        <div className="site-storefront__notfound">
          <PackageOpen size={48} aria-hidden="true" />
          <h1>Сайт не найден</h1>
          <p className="muted">Магазин с адресом /{slug} не существует.</p>
          <Link href="/central/setup" className="button button--primary">
            Создать магазин
          </Link>
        </div>
      </main>
    );
  }

  const c = template.colors;
  const t = template.typography;
  const b = template.branding;

  return (
    <main
      className="site-storefront"
      style={themeVars}
      data-template={template.id}
    >
      <header className="site-storefront__header">
        <Link href={`/sites/${slug}`} className="site-storefront__brand">
          <span
            className="site-storefront__logo"
            aria-hidden="true"
            style={{ color: c.accent }}
          >
            {b.logoMark}
          </span>
          <div>
            <p className="site-storefront__brand-name">{b.storeName}</p>
            <p className="site-storefront__brand-tagline">{b.tagline}</p>
          </div>
        </Link>
        <div className="site-storefront__actions">
          <button
            onClick={openCart}
            className="site-storefront__cart"
            aria-label={`Корзина, ${cartCount} товаров`}
          >
            <ShoppingBag size={16} aria-hidden="true" />
            <span>Корзина</span>
            <span className="site-storefront__cart-count">{cartCount}</span>
          </button>
          <Link
            href={`/sites/${slug}/admin`}
            className="site-storefront__admin-link"
          >
            <Store size={14} aria-hidden="true" /> Войти как админ
          </Link>
        </div>
      </header>

      <section className="site-storefront__hero">
        <p className="site-storefront__hero-eyebrow">
          {template.heroCopy.eyebrow}
        </p>
        <h1 className="site-storefront__hero-title">
          {template.heroCopy.headline}
        </h1>
        <p className="site-storefront__hero-subhead">
          {template.heroCopy.subhead}
        </p>
        <button
          onClick={() =>
            document
              .getElementById("site-products")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          className="site-storefront__cta"
        >
          {template.heroCopy.ctaPrimary}
        </button>
      </section>

      <section id="site-products" className="site-storefront__catalog">
        <h2 className="site-storefront__section-title">Каталог</h2>
        {products.length === 0 ? (
          <div className="site-storefront__empty">
            <PackageOpen size={32} aria-hidden="true" />
            <p>Пока нет товаров. Добавьте их через админ-панель.</p>
            <Link
              href={`/sites/${slug}/admin`}
              className="site-storefront__cta"
            >
              Открыть админ-панель
            </Link>
          </div>
        ) : (
          <div className="site-storefront__grid">
            {products.map((p) => {
              const outOfStock = p.stock_quantity <= 0;
              return (
                <article key={p.id} className="site-storefront__product">
                  <div className="site-storefront__product-media">
                    {p.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.images[0]}
                        alt={p.title_ru || p.slug}
                        loading="lazy"
                      />
                    ) : (
                      <div className="site-storefront__product-placeholder">
                        {b.logoMark}
                      </div>
                    )}
                    {outOfStock ? (
                      <span className="site-storefront__product-badge site-storefront__product-badge--out">
                        Нет в наличии
                      </span>
                    ) : null}
                  </div>
                  <div className="site-storefront__product-body">
                    <p className="site-storefront__product-title">
                      {p.title_ru || p.slug}
                    </p>
                    {p.description_ru ? (
                      <p className="site-storefront__product-desc">
                        {p.description_ru}
                      </p>
                    ) : null}
                    <div className="site-storefront__product-foot">
                      <span className="site-storefront__product-price">
                        {formatPrice(p.price_kopecks)}
                      </span>
                      <button
                        onClick={() => {
                          if (outOfStock) {
                            toast.warning("Нет в наличии");
                            return;
                          }
                          addItem(p);
                          toast.success("Добавлено в корзину", p.title_ru);
                        }}
                        disabled={outOfStock}
                        className="site-storefront__product-buy"
                        aria-label={`Добавить в корзину: ${p.title_ru}`}
                      >
                        {outOfStock ? "Нет" : "В корзину"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer className="site-storefront__footer">
        <div>
          <Link href={`/sites/${slug}`} className="site-storefront__footer-brand">
            {b.logoMark} {b.storeName}
          </Link>
          <p className="muted">{b.tagline}</p>
        </div>
        <p className="muted site-storefront__footer-powered">
          Powered by <Link href="/">Sun.store</Link> ·{" "}
          <Link href={`/sites/${slug}/admin`}>Админ-панель</Link>
        </p>
      </footer>
    </main>
  );
}
