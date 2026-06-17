import type { Route } from "next";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell page-stack">
      <section className="status-card">
        <p className="eyebrow">404</p>
        <h1>Страница не найдена</h1>
        <p>Похоже, нужный объект исчез из витрины или slug указан неверно.</p>
        <Link href={"/catalog" as Route} className="button button--primary">
          Вернуться в каталог
        </Link>
      </section>
    </div>
  );
}
