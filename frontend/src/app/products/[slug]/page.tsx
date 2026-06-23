import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Shield,
  Truck,
  Clock,
  Zap,
  Award,
  CheckCircle,
  Sun,
  Wrench,
  Headphones,
  ArrowRight
} from "lucide-react";

import { BuyBox } from "@/components/buy-box";
import { ProductGallery } from "@/components/product-gallery";
import { SmartImage } from "@/components/smart-image";
import { WatchButton } from "@/components/watch-button";
import { getStorefrontProduct, listStorefrontProducts } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/format";
import { getProductSpecs, getProductHighlights } from "@/lib/product-specs";

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

const TRUST_BADGES = [
  { icon: Truck, label: "Доставка", value: "1–3 дня по РФ" },
  { icon: Shield, label: "Гарантия", value: "До 25 лет" },
  { icon: Clock, label: "Возврат", value: "14 дней" },
  { icon: Headphones, label: "Поддержка", value: "7 дней в неделю" }
];

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
  const specs = getProductSpecs(product);
  const highlights = getProductHighlights(product);

  return (
    <div className="shell page-stack">
      <nav className="breadcrumbs" aria-label="Хлебные крошки">
        <Link href={"/" as Route}>Главная</Link>
        <span aria-hidden="true">/</span>
        <Link href={"/catalog" as Route}>Каталог</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.title_ru}</span>
      </nav>

      <section className="product-hero product-hero--v2">
        <div className="product-hero__media">
          <ProductGallery title={product.title_ru} images={product.images} />
        </div>

        <div className="product-buy">
          <div className="product-buy__head">
            <p className="eyebrow">
              {product.category_name_ru ?? "Sun Panels Store selection"}
            </p>
            <div className="product-buy__title-row">
              <h1>{product.title_ru}</h1>
              <WatchButton productId={product.id} label="В список" />
            </div>
            <div className="product-buy__meta">
              <span className="product-buy__sku">Артикул: {product.sku}</span>
              {outOfStock ? (
                <span className="status-pill status-pill--rejected">Нет в наличии</span>
              ) : lowStock ? (
                <span className="status-pill status-pill--pending">
                  Осталось: {product.stock_quantity} шт.
                </span>
              ) : (
                <span className="status-pill status-pill--confirmed">
                  В наличии · {product.stock_quantity} шт.
                </span>
              )}
            </div>
          </div>

          <div className="product-buy__price">
            <strong className="product-price">
              {formatPrice(product.price_kopecks)}
            </strong>
            <span className="product-price-note">
              с НДС · бесплатная доставка
            </span>
          </div>

          <ul className="product-ebay-badges" aria-label="Условия покупки">
            <li>
              <Truck size={16} aria-hidden="true" />
              <span>
                <strong>Бесплатная доставка</strong>
                <small>1–3 дня по региону</small>
              </span>
            </li>
            <li>
              <Shield size={16} aria-hidden="true" />
              <span>
                <strong>Возврат 14 дней</strong>
                <small>Гарантия возврата средств</small>
              </span>
            </li>
          </ul>

          <p className="product-buy__desc">{product.description_ru}</p>

          <BuyBox product={product} />

          <ul className="product-trust">
            {TRUST_BADGES.map(({ icon: Icon, label, value }) => (
              <li key={label} className="trust-item">
                <Icon size={18} aria-hidden="true" />
                <span>
                  <strong>{value}</strong>
                  <small>{label}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-block product-details">
        <div className="product-details__grid">
          <div className="product-details__main">
            <div className="section-heading section-heading--page">
              <div>
                <p className="eyebrow">Технические характеристики</p>
                <h2>Спецификация</h2>
              </div>
            </div>

            {highlights.length > 0 ? (
              <ul className="spec-highlights">
                {highlights.map((line) => (
                  <li key={line}>
                    <CheckCircle size={16} aria-hidden="true" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <dl className="spec-table">
              {specs.map((spec) => (
                <div key={spec.label} className="spec-table__row">
                  <dt>{spec.label}</dt>
                  <dd>{spec.value}</dd>
                </div>
              ))}
              <div className="spec-table__row">
                <dt>Обновлено</dt>
                <dd>{formatDate(product.updated_at)}</dd>
              </div>
            </dl>
          </div>

          <aside className="product-details__aside">
            <article className="info-card perk-card">
              <span className="perk-card__icon" aria-hidden="true">
                <Zap size={20} />
              </span>
              <h3>Высокая эффективность</h3>
              <p>
                Монокристаллические модули последнего поколения с КПД до 21–22%.
              </p>
            </article>
            <article className="info-card perk-card">
              <span className="perk-card__icon" aria-hidden="true">
                <Shield size={20} />
              </span>
              <h3>Гарантия 25 лет</h3>
              <p>
                Сертификация по международным стандартам и официальная гарантия производителя.
              </p>
            </article>
            <article className="info-card perk-card">
              <span className="perk-card__icon" aria-hidden="true">
                <Wrench size={20} />
              </span>
              <h3>Монтаж под ключ</h3>
              <p>
                Проектирование, доставка и установка бригадой сертифицированных инженеров.
              </p>
            </article>
          </aside>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Похожие товары</p>
              <h2>Вам может понравиться</h2>
            </div>
            <Link href={"/catalog" as Route} className="button button--ghost">
              Смотреть все <ArrowRight size={16} aria-hidden="true" />
            </Link>
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
