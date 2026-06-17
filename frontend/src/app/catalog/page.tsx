import type { Route } from "next";
import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { listStorefrontProducts } from "@/lib/api";

export default async function CatalogPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const category =
    typeof params.category === "string" ? params.category : undefined;
  const sort = typeof params.sort === "string" ? params.sort : "newest";
  const products = await listStorefrontProducts({
    category,
    sort: sort as "newest" | "price_asc" | "price_desc" | "title_asc"
  });

  return (
    <div className="shell page-stack">
      <section className="section-heading section-heading--page">
        <div>
          <p className="eyebrow">Sun.store / catalog</p>
          <h1>Каталог</h1>
        </div>
        <p className="muted">
          Отбор по категориям и сортировка готовы для query params backend API.
        </p>
      </section>

      <div className="filter-strip">
        <Link href={"/catalog" as Route} className="filter-chip">
          Все
        </Link>
        <Link href={"/catalog?category=signature" as Route} className="filter-chip">
          Signature
        </Link>
        <Link href={"/catalog?category=objects" as Route} className="filter-chip">
          Objects
        </Link>
        <Link href={"/catalog?category=fragrance" as Route} className="filter-chip">
          Fragrance
        </Link>
        <Link href={"/catalog?sort=price_asc" as Route} className="filter-chip">
          Сначала дешевле
        </Link>
        <Link href={"/catalog?sort=price_desc" as Route} className="filter-chip">
          Сначала дороже
        </Link>
      </div>

      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
