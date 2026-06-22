import type { Route } from "next";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell site-footer__inner">
        <div>
          <p className="eyebrow">Sun.store · Москва</p>
          <h3>Редкие вещи с тёплым характером и boutique-настроением.</h3>
        </div>
        <div className="site-footer__meta">
          <p>Новая русская витрина для спокойной роскоши.</p>
          <nav className="site-footer__nav" aria-label="Подвал">
            <Link href={"/catalog" as Route}>Каталог</Link>
            <Link href={"/admin/login" as Route}>Админ-панель</Link>
            <Link href={"/central/login" as Route}>Центральная платформа</Link>
          </nav>
          <p className="site-footer__copyright">
            © {new Date().getFullYear()} Sun.store
          </p>
        </div>
      </div>
    </footer>
  );
}
