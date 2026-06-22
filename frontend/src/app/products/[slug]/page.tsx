import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { SmartImage } from "@/components/smart-image";
import { getStorefrontProduct, listStorefrontProducts } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/format";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getStorefrontProduct(slug);
    return {
      title: product.title_ru,
      description: product.description_ru.slice(0, 160),
      openGraph: {
        title: product.title_ru,
        description: product.description_ru.slice(0, 160),
        images: product.images?.[0] ? [{ url: product.images[0] }] : undefined,
        type: "website"
      },
      alternates: { canonical: `/products/${product.slug}` }
    };
  } catch {
    return { title: "Товар не найден" };
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;

  let product: Awaited<ReturnType<typeof getStorefrontProduct>>;
  try {
    product = await getStorefrontProduct(slug);
  } catch {
    notFound();
  }

  const related = (
    await listStorefrontProducts({ category: product.category_slug ?? undefined })
  )
    .filter((entry) => entry.slug !== product.slug)
    .slice(0, 3);

  const outOfStock = product.stock_quantity <= 0;
  const lowStock = !outOfStock && product.stock_quantity <= 5;

  return (
    <div className="shell page-stack">
      <nav className="breadcrumbs" aria-label="Хлебные крошки">
        <Link href={"/" as Route}>Главная</Link>
        <span aria-hidden="true">/</span>
        <Link href={"/catalog" as Route}>Каталог</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.title_ru}</span>
      </nav>

      <section className="product-hero">
        <div className="product-hero__media">
          <SmartImage
            src={product.images?.[0]}
            alt={product.title_ru}
            aspectRatio="auto"
            priority
            sizes="(max-width: 720px) 100vw, 50vw"
          />
        </div>
        <div className="product-hero__copy">
          <p className="eyebrow">
            {product.category_name_ru ?? "Sun.store selection"}
          </p>
          <h1>{product.title_ru}</h1>
          <strong className="product-price">
            {formatPrice(product.price_kopecks)}
          </strong>
          <p>{product.description_ru}</p>

          {outOfStock ? (
            <p className="status-pill status-pill--rejected">Нет в наличии</p>
          ) : lowStock ? (
            <p className="status-pill status-pill--pending">
              Осталось: {product.stock_quantity} шт.
            </p>
          ) : (
            <p className="status-pill status-pill--confirmed">В наличии</p>
          )}

          <div className="detail-list">
            <div>
              <span>SKU</span>
              <strong>{product.sku}</strong>
            </div>
            <div>
              <span>Наличие</span>
              <strong>{product.stock_quantity} шт.</strong>
            </div>
            <div>
              <span>Обновлено</span>
              <strong>{formatDate(product.updated_at)}</strong>
            </div>
          </div>

          <div className="hero-actions">
            <AddToCartButton product={product} />
            <Link href={"/catalog" as Route} className="button button--ghost">
              Назад в каталог
            </Link>
          </div>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Похожие вещи</p>
              <h2>Вам может понравиться</h2>
            </div>
          </div>
          <div className="mini-grid">
            {related.map((entry) => (
              <Link
                key={entry.id}
                href={`/products/${entry.slug}`}
                className="mini-card"
              >
                <div
                  className="mini-card__media"
                  aria-hidden="true"
                  style={
                    entry.images?.[0]
                      ? { backgroundImage: `url(${entry.images[0]})` }
                      : undefined
                  }
                >
                  {!entry.images?.[0] ? <span>◐</span> : null}
                </div>
                <div className="mini-card__info">
                  <span>{entry.title_ru}</span>
                  <strong>{formatPrice(entry.price_kopecks)}</strong>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
