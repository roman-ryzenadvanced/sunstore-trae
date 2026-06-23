import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { ProductGridSkeleton } from "@/components/skeletons";
import { listStorefrontProducts } from "@/lib/api";
import type { ProductSort } from "@/types/api";

export const metadata: Metadata = {
  title: "Каталог",
  description:
    "Полный каталог Sun Panels Store: солнечные панели, инверторы, аккумуляторы и монтажные комплекты.",
  alternates: { canonical: "/catalog" }
};

export const revalidate = 300;

const CATEGORIES: Array<{ slug: string; label: string }> = [
  { slug: "panels", label: "Панели" },
  { slug: "inverters", label: "Инверторы" },
  { slug: "batteries", label: "Аккумуляторы" },
  { slug: "mounting", label: "Монтаж" },
  { slug: "services", label: "Услуги" }
];

const SORTS: Array<{ slug: ProductSort; label: string }> = [
  { slug: "newest", label: "Сначала новые" },
  { slug: "price_asc", label: "Сначала дешевле" },
  { slug: "price_desc", label: "Сначала дороже" },
  { slug: "title_asc", label: "По названию" }
];

export default async function CatalogPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const activeCategory =
    typeof params.category === "string" ? params.category : "";
  const activeSort =
    (typeof params.sort === "string" ? params.sort : "newest") as ProductSort;
  const activeQuery =
    typeof params.q === "string" ? params.q.trim() : "";

  let products: Awaited<ReturnType<typeof listStorefrontProducts>> = [];
  try {
    products = await listStorefrontProducts({
      category: activeCategory || undefined,
      search: activeQuery || undefined,
      sort: activeSort
    });
  } catch {
    // ignore — show empty state
  }

  const buildHref = (
    overrides: Partial<{ category: string; sort: ProductSort; q: string }>
  ) => {
    const search = new URLSearchParams();
    const category = overrides.category ?? activeCategory;
    const sort = overrides.sort ?? activeSort;
    const q = overrides.q ?? activeQuery;
    if (q) search.set("q", q);
    if (category) search.set("category", category);
    if (sort && sort !== "newest") search.set("sort", sort);
    const s = search.toString();
    return `/catalog${s ? `?${s}` : ""}` as Route;
  };

  return (
    <div className="shell page-stack">
      <section className="section-heading section-heading--page">
        <div>
          <p className="eyebrow">Sun Panels Store / каталог</p>
          <h1>{activeQuery ? `«${activeQuery}»` : "Все категории"}</h1>
          <p className="muted">
            Найдено товаров: <strong>{products.length}</strong>
            {activeCategory
              ? ` · категория: ${CATEGORIES.find((c) => c.slug === activeCategory)?.label ?? activeCategory}`
              : ""}
          </p>
        </div>
      </section>

      <div className="filter-strip" role="toolbar" aria-label="Фильтры каталога">
        <Link
          href={buildHref({ category: "" })}
          className={`filter-chip ${!activeCategory ? "filter-chip--active" : ""}`}
          aria-current={activeCategory ? undefined : "true"}
        >
          Все
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={buildHref({ category: c.slug })}
            className={`filter-chip ${
              activeCategory === c.slug ? "filter-chip--active" : ""
            }`}
            aria-current={activeCategory === c.slug ? "true" : undefined}
          >
            {c.label}
          </Link>
        ))}
        <span className="filter-strip__divider" aria-hidden="true">
          ·
        </span>
        {SORTS.map((s) => (
          <Link
            key={s.slug}
            href={buildHref({ sort: s.slug })}
            className={`filter-chip ${
              activeSort === s.slug ? "filter-chip--active" : ""
            }`}
            aria-current={activeSort === s.slug ? "true" : undefined}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        activeQuery ? (
          <div className="empty-state">
            <h2>Ничего не найдено</h2>
            <p className="muted">
              По запросу «{activeQuery}» ничего нет. Попробуйте изменить запрос
              или сбросить фильтры.
            </p>
            <Link href={buildHref({ q: "", category: "" })} className="button button--ghost">
              Сбросить
            </Link>
          </div>
        ) : (
          <ProductGridSkeleton count={4} />
        )
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
