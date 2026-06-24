import Link from "next/link";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { SmartImage } from "@/components/smart-image";
import { WatchButton } from "@/components/watch-button";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/api";

export function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stock_quantity <= 0;
  const lowStock = !outOfStock && product.stock_quantity <= 5;

  return (
    <article
      className="product-card"
      data-stock={outOfStock ? "out" : lowStock ? "low" : "ok"}
    >
      <div className="product-card__media">
        <Link
          href={`/products/${product.slug}`}
          aria-label={`Открыть: ${product.title_ru}`}
        >
          <SmartImage
            src={product.images?.[0]}
            alt={product.title_ru}
            aspectRatio="1 / 1"
            priority={false}
          />
        </Link>
        {product.category_name_ru ? (
          <span className="product-card__cat">{product.category_name_ru}</span>
        ) : null}
        <span className="product-card__watch">
          <WatchButton productId={product.id} label="" />
        </span>
        {outOfStock ? (
          <span className="product-card__flag product-card__flag--out">
            Нет в наличии
          </span>
        ) : lowStock ? (
          <span className="product-card__flag product-card__flag--low">
            Осталось {product.stock_quantity} шт
          </span>
        ) : null}
      </div>

      <div className="product-card__body">
        <Link href={`/products/${product.slug}`} className="product-card__title">
          <h3>{product.title_ru}</h3>
        </Link>

        <p className="product-card__desc">{product.description_ru}</p>

        <div className="product-card__price-row">
          <div className="product-card__price-block">
            <strong className="product-card__price">
              {formatPrice(product.price_kopecks)}
            </strong>
            <span className="product-card__ship">Бесплатная доставка</span>
          </div>
          <span className="product-card__bin">Купить сейчас</span>
        </div>

        <div className="product-card__actions">
          <Link
            href={`/products/${product.slug}`}
            className="button button--ghost button--compact"
          >
            Подробнее
          </Link>
          <AddToCartButton product={product} variant="compact" />
        </div>
      </div>
    </article>
  );
}
