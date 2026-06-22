/**
 * Lightweight skeleton placeholders for loading states.
 * Uses CSS shimmer animation defined in globals.css.
 */
import type { CSSProperties } from "react";

export function Skeleton({
  className,
  style
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`skeleton ${className ?? ""}`}
      style={style}
      aria-hidden="true"
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <article className="product-card" aria-hidden="true">
      <Skeleton className="product-card__media" />
      <div className="product-card__body">
        <Skeleton className="skeleton--text" style={{ width: "30%" }} />
        <Skeleton className="skeleton--text skeleton--text-lg" style={{ width: "70%" }} />
        <Skeleton className="skeleton--text" style={{ width: "100%" }} />
        <Skeleton className="skeleton--text" style={{ width: "85%" }} />
        <div className="product-card__actions">
          <Skeleton className="skeleton--button" />
          <Skeleton className="skeleton--button" />
        </div>
      </div>
    </article>
  );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function AdminRowSkeleton() {
  return (
    <div className="admin-table__row" aria-hidden="true">
      <div>
        <Skeleton className="skeleton--text" style={{ width: "30%", marginBottom: 6 }} />
        <Skeleton className="skeleton--text skeleton--text-lg" style={{ width: "70%" }} />
      </div>
      <Skeleton className="skeleton--text" />
      <Skeleton className="skeleton--text" />
      <Skeleton className="skeleton--text" />
      <Skeleton className="skeleton--button" />
    </div>
  );
}
