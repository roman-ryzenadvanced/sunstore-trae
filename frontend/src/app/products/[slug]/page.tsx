import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { getStorefrontProduct, listStorefrontProducts } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/format";

export default async function ProductPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const product = await getStorefrontProduct(slug);
    const related = (await listStorefrontProducts({ category: product.category_slug ?? undefined }))
      .filter((entry) => entry.slug !== product.slug)
      .slice(0, 3);

    return (
      <div className="shell page-stack">
        <section className="product-hero">
          <div
            className="product-hero__media"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(18, 12, 7, 0.06), rgba(18, 12, 7, 0.35)), url(${product.images[0]})`
            }}
          />
          <div className="product-hero__copy">
            <p className="eyebrow">{product.category_name_ru ?? "Sun.store selection"}</p>
            <h1>{product.title_ru}</h1>
            <strong className="product-price">{formatPrice(product.price_kopecks)}</strong>
            <p>{product.description_ru}</p>

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

        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Related</p>
              <h2>Похожие вещи</h2>
            </div>
          </div>
          <div className="mini-grid">
            {related.map((entry) => (
              <Link key={entry.id} href={`/products/${entry.slug}`} className="mini-card">
                <span>{entry.title_ru}</span>
                <strong>{formatPrice(entry.price_kopecks)}</strong>
              </Link>
            ))}
          </div>
        </section>
      </div>
    );
  } catch {
    notFound();
  }
}
