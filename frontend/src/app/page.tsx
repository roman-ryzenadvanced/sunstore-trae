import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { ProductGridSkeleton } from "@/components/skeletons";
import { listStorefrontProducts } from "@/lib/api";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Витрина Sun.store — тихая роскошь",
  description:
    "Тёплые материалы, редкие предметы и уверенная минималистичная подача.",
  alternates: { canonical: "/" }
};

// Revalidate storefront every 5 minutes so new products appear without a full rebuild.
export const revalidate = 300;

export default async function HomePage() {
  let products: Awaited<ReturnType<typeof listStorefrontProducts>> = [];
  let featured: Awaited<ReturnType<typeof listStorefrontProducts>>[number] | undefined;
  let usingMock = false;

  try {
    products = await listStorefrontProducts({ limit: 4, sort: "newest" });
    featured = products[0];
  } catch {
    usingMock = true;
  }

  if (products.length === 0) {
    return (
      <div className="shell home-stack">
        <section className="hero-panel">
          <div className="hero-copy">
            <p className="eyebrow">Sun.store / curated in Russian</p>
            <h1>Тихая роскошь для вещей, которые хочется рассматривать медленно.</h1>
            <p>
              Витрина вдохновлена Sun.store: светлая, коллекционная, с акцентом на
              редкие предметы, тёплые материалы и уверенную минималистичную подачу.
            </p>
            <div className="hero-actions">
              <Link href={"/catalog" as Route} className="button button--primary">
                Смотреть каталог
              </Link>
              <Link href={"/admin/products" as Route} className="button button--ghost">
                Открыть админ-панель
              </Link>
            </div>
          </div>
          <div className="hero-showcase">
            <article className="hero-object hero-object--empty">
              <div className="hero-object__caption">
                <span>Каталог скоро откроется</span>
                <strong>Добавьте первый товар</strong>
                <em>Войдите в админ-панель, чтобы создать витрину</em>
              </div>
            </article>
          </div>
        </section>
        <ProductGridSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="shell home-stack">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Sun.store / curated in Russian</p>
          <h1>Тихая роскошь для вещей, которые хочется рассматривать медленно.</h1>
          <p>
            Витрина вдохновлена Sun.store: светлая, коллекционная, с акцентом на
            редкие предметы, тёплые материалы и уверенную минималистичную подачу.
          </p>
          <div className="hero-actions">
            <Link href={"/catalog" as Route} className="button button--primary">
              Смотреть каталог
            </Link>
            <Link href={"/admin/products" as Route} className="button button--ghost">
              Открыть админ-панель
            </Link>
          </div>
        </div>

        <div className="hero-showcase">
          {featured ? (
            <article
              className="hero-object"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(18, 12, 7, 0.04), rgba(18, 12, 7, 0.4)), url(${featured.images[0]})`
              }}
            >
              <div className="hero-object__caption">
                <span>{featured.category_name_ru ?? "Featured"}</span>
                <strong>{featured.title_ru}</strong>
                <em>{formatPrice(featured.price_kopecks)}</em>
              </div>
            </article>
          ) : null}
        </div>
      </section>

      <section className="info-grid">
        <article className="info-card">
          <p className="eyebrow">API-ready storefront</p>
          <h3>GET /api/v1/products</h3>
          <p>
            Серверные страницы используют typed API client и автоматически падают на mock-данные.
          </p>
        </article>
        <article className="info-card">
          <p className="eyebrow">Client-side cart</p>
          <h3>Zustand store</h3>
          <p>
            Корзина живёт в localStorage, работает без backend и готова к checkout flow.
          </p>
        </article>
        <article className="info-card">
          <p className="eyebrow">Admin toolkit</p>
          <h3>RU back office</h3>
          <p>
            Есть вход, управление товарами и просмотр заказов в русском интерфейсе.
          </p>
        </article>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Свежие поступления</p>
            <h2>Новые предметы</h2>
          </div>
          <Link href={"/catalog" as Route} className="button button--ghost">
            Весь каталог
          </Link>
        </div>
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
