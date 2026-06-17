import type { Route } from "next";
import Link from "next/link";

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <p className="eyebrow">Sun.store / admin</p>
        <h2>Back office</h2>
        <nav className="admin-nav">
          <Link href={"/admin/login" as Route}>Вход</Link>
          <Link href={"/admin/products" as Route}>Товары</Link>
          <Link href={"/admin/orders" as Route}>Заказы</Link>
          <Link href={"/" as Route}>На витрину</Link>
        </nav>
      </aside>
      <div className="admin-content">{children}</div>
    </div>
  );
}
