import Link from "next/link";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/api";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <Link
        href={`/products/${product.slug}`}
        className="product-card__media"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(12, 10, 8, 0.05), rgba(12, 10, 8, 0.38)), url(${product.images[0]})`
        }}
      >
        <span className="product-card__badge">
          {product.category_name_ru ?? "Sun selection"}
        </span>
      </Link>
      <div className="product-card__body">
        <div className="product-card__head">
          <div>
            <p className="eyebrow">{product.sku}</p>
            <h3>{product.title_ru}</h3>
          </div>
          <strong>{formatPrice(product.price_kopecks)}</strong>
        </div>
        <p>{product.description_ru}</p>
        <div className="product-card__actions">
          <Link href={`/products/${product.slug}`} className="button button--ghost">
            Открыть
          </Link>
          <AddToCartButton product={product} />
        </div>
      </div>
    </article>
  );
}
