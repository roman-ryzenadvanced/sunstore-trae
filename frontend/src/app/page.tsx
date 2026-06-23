import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { ProductGridSkeleton } from "@/components/skeletons";
import { listStorefrontProducts } from "@/lib/api";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Sun Panels Store — curated solar panel showcase",
  description:
    "Premium solar panels, minimalist design, and elegant presentation.",
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
            <p className="eyebrow">Sun Panels Store / premium solar solutions</p>
            <h1>Элегантные солнечные панели для современного дома.</h1>
            <p>
              Витрина вдохновлена Sun Panels Store: светлая, высококачественная, с акцентом на
              эффективные солнечные решения и современный дизайн.
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
            <p className="eyebrow">Sun Panels Store / premium solar solutions</p>
            <h1>Элегантные солнечные панели для современного дома.</h1>
            <p>
              Витрина вдохновлена Sun Panels Store: светлая, высококачественная, с акцентом на
              эффективные солнечные решения и современный дизайн.
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
                backgroundImage: `linear-gradient(180deg, rgba(12, 20, 16, 0.06), rgba(12, 20, 16, 0.52)), url(${featured.images[0]})`
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
          <p className="eyebrow">Высокая эффективность</p>
          <h3>До 22% КПД</h3>
          <p>
            Монокристаллические панели последнего поколения с максимальной отдачей энергии.
          </p>
        </article>
        <article className="info-card">
          <p className="eyebrow">Гарантия качества</p>
          <h3>25 лет гарантии</h3>
          <p>
            Каждая панель проходит многоступенчатый контроль и сертифицирована по международным стандартам.
          </p>
        </article>
        <article className="info-card">
          <p className="eyebrow">Умное управление</p>
          <h3>Мониторинг онлайн</h3>
          <p>
            Отслеживайте выработку энергии в реальном времени через личный кабинет.
          </p>
        </article>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Свежие поступления</p>
            <h2>Новые панели</h2>
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
