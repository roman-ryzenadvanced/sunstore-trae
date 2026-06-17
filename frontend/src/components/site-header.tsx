"use client";

import { useEffect } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/format";
import { useCartStore } from "@/store/cart";

const links: Array<{ href: Route; label: string }> = [
  { href: "/" as Route, label: "Главная" },
  { href: "/catalog" as Route, label: "Каталог" },
  { href: "/checkout" as Route, label: "Оформление" },
  { href: "/admin/login" as Route, label: "Админ" }
];

export function SiteHeader() {
  const pathname = usePathname();
  const hydrate = useCartStore((state) => state.hydrate);
  const toggle = useCartStore((state) => state.toggle);
  const itemCount = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  );

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <header className="site-header">
      <div className="site-header__inner shell">
        <Link href={"/" as Route} className="brand-mark" aria-label="Sun.store home">
          <span className="brand-mark__sun" />
          <span>
            Sun.store
            <small>atelier selection</small>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Основная навигация">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "site-nav__link",
                pathname === link.href && "site-nav__link--active"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button type="button" className="cart-trigger" onClick={toggle}>
          Корзина
          <span>{itemCount}</span>
        </button>
      </div>
    </header>
  );
}
