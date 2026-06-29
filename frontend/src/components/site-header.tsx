"use client";

import { Suspense, useEffect, useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle, Menu, Phone, ShoppingBag, X } from "lucide-react";

import { cn } from "@/lib/format";
import { useCartStore } from "@/store/cart";
import { SearchBar } from "@/components/search-bar";

const links: Array<{ href: Route; label: string }> = [
  { href: "/" as Route, label: "Главная" },
  { href: "/catalog" as Route, label: "Каталог" },
  { href: "/contacts" as Route, label: "Контакты" },
  { href: "/central/login" as Route, label: "Войти" }
];

const categories: Array<{ href: Route; label: string }> = [
  { href: "/catalog?category=panels" as Route, label: "Панели" },
  { href: "/catalog?category=inverters" as Route, label: "Инверторы" },
  { href: "/catalog?category=batteries" as Route, label: "Аккумуляторы" },
  { href: "/catalog?category=mounting" as Route, label: "Монтаж" },
  { href: "/catalog?category=services" as Route, label: "Услуги" }
];

export function SiteHeader() {
  const pathname = usePathname();
  const hydrate = useCartStore((state) => state.hydrate);
  const toggle = useCartStore((state) => state.toggle);
  const [hydrated, setHydrated] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const itemCount = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  );

  useEffect(() => {
    hydrate();
    setHydrated(true);
  }, [hydrate]);

  // Close mobile menu on route change.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu open.
  useEffect(() => {
    if (!mobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileOpen]);

  return (
    <header className="site-header">
      {/* Utility bar — Amazon-style top row */}
      <div className="site-header__utility">
        <div className="shell site-header__utility-inner">
          <div className="site-header__utility-left">
            <span>
              <strong>☀ Sun Store</strong> — маркетплейс солнечной энергетики
            </span>
          </div>
          <nav className="site-header__utility-nav" aria-label="Сервисная навигация">
            <Link href={"/contacts" as Route}>
              <Phone size={12} aria-hidden="true" /> +7 800 000-00-00
            </Link>
            <Link href={"/delivery" as Route}>Доставка</Link>
            <Link href={"/warranty" as Route}>Гарантия</Link>
            <Link href={"/contacts" as Route}>
              <HelpCircle size={12} aria-hidden="true" /> Помощь
            </Link>
          </nav>
        </div>
      </div>

      {/* Main row: logo + search + cart */}
      <div className="site-header__inner shell">
        <Link href={"/" as Route} className="brand-mark" aria-label="Sun Store — на главную">
          <span className="brand-mark__sun" aria-hidden="true" />
          <span>
            Sun Store
            <small>solar marketplace</small>
          </span>
        </Link>

        <div className="site-header__search">
          <Suspense fallback={null}>
            <SearchBar />
          </Suspense>
        </div>

        <div className="site-header__actions">
          <Link
            href={"/central/login" as Route}
            className="site-header__signin"
            aria-label="Войти или зарегистрироваться"
          >
            <span className="site-header__signin-hello">Здравствуйте, войдите</span>
            <span className="site-header__signin-acct">Аккаунт ⟩</span>
          </Link>
          <button
            type="button"
            className="cart-trigger"
            onClick={toggle}
            aria-label={`Открыть корзину, ${itemCount} товаров`}
          >
            <ShoppingBag size={18} aria-hidden="true" />
            <span aria-hidden="true">{hydrated ? itemCount : 0}</span>
          </button>
          <button
            type="button"
            className="icon-button site-header__menu-toggle"
            aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Category nav bar (second header row) */}
      <nav className="cat-nav shell" aria-label="Категории товаров">
        <Link href={"/catalog" as Route} className="cat-nav__link cat-nav__link--all">
          ☰ Все категории
        </Link>
        {categories.map((c) => (
          <Link key={c.href} href={c.href} className="cat-nav__link">
            {c.label}
          </Link>
        ))}
        <Link href={"/catalog?sort=price_asc" as Route} className="cat-nav__link cat-nav__link--deal">
          🔥 Deals
        </Link>
      </nav>

      {mobileOpen ? (
        <nav className="site-nav site-nav--mobile" aria-label="Мобильная навигация">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href as string);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "site-nav__link",
                  active && "site-nav__link--active"
                )}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </header>
  );
}
