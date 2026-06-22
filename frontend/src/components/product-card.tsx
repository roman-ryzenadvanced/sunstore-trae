import Link from "next/link";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { SmartImage } from "@/components/smart-image";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/api";

export function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stock_quantity <= 0;
  const lowStock = !outOfStock && product.stock_quantity <= 5;

  return (
    <article className="product-card" data-stock={outOfStock ? "out" : lowStock ? "low" : "ok"}>
      <Link
        href={`/products/${product.slug}`}
        className="product-card__media"
        aria-label={`Открыть: ${product.title_ru}`}
      >
        <SmartImage
          src={product.images?.[0]}
          alt={product.title_ru}
          aspectRatio="1 / 1"
          priority={false}
        />
        <span className="product-card__badge">
          {product.category_name_ru ?? "Sun selection"}
        </span>
        {outOfStock ? (
          <span className="product-card__stock product-card__stock--out">
            Нет в наличии
          </span>
        ) : lowStock ? (
          <span className="product-card__stock product-card__stock--low">
            Осталось: {product.stock_quantity} шт.
          </span>
        ) : null}
      </Link>
      <div className="product-card__body">
        <div className="product-card__head">
          <div>
            <p className="eyebrow">{product.sku}</p>
            <h3>{product.title_ru}</h3>
          </div>
          <strong className="product-card__price">
            {formatPrice(product.price_kopecks)}
          </strong>
        </div>
        <p className="product-card__desc">{product.description_ru}</p>
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
