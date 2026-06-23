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

  let products: Awaited<ReturnType<typeof listStorefrontProducts>> = [];
  try {
    products = await listStorefrontProducts({
      category: activeCategory || undefined,
      sort: activeSort
    });
  } catch {
    // ignore — show empty state
  }

  const buildHref = (
    overrides: Partial<{ category: string; sort: ProductSort }>
  ) => {
    const search = new URLSearchParams();
    const category = overrides.category ?? activeCategory;
    const sort = overrides.sort ?? activeSort;
    if (category) search.set("category", category);
    if (sort && sort !== "newest") search.set("sort", sort);
    const q = search.toString();
    return `/catalog${q ? `?${q}` : ""}` as Route;
  };

  return (
    <div className="shell page-stack">
      <section className="section-heading section-heading--page">
        <div>
          <p className="eyebrow">Sun Panels Store / catalog</p>
          <h1>Каталог</h1>
        </div>
        <p className="muted">
          Отбор по категориям и сортировка — параметры передаются в backend API.
        </p>
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
        <ProductGridSkeleton count={4} />
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
