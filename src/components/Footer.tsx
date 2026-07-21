"use client"

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-[color:var(--hairline)] bg-black">
      <div className="container-ss py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="brand-mark mb-4">
              <span className="brand-dot" />
              Sunstore
            </Link>
            <p className="muted-ss mt-4 max-w-xs text-sm leading-relaxed">
              Солнечная энергия для дома и бизнеса. Панели, инверторы и готовые системы с доставкой по России.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--ink-3)]">
              Магазин
            </h4>
            <ul className="space-y-3 text-sm">
              <li><a href="/#catalog" className="nav-link">Панели</a></li>
              <li><a href="/#catalog" className="nav-link">Инверторы</a></li>
              <li><a href="/#catalog" className="nav-link">Аккумуляторы</a></li>
              <li><a href="/#catalog" className="nav-link">Системы</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--ink-3)]">
              Компания
            </h4>
            <ul className="space-y-3 text-sm">
              <li><a href="/#support" className="nav-link">О нас</a></li>
              <li><a href="/#support" className="nav-link">Доставка</a></li>
              <li><a href="/#support" className="nav-link">Гарантия</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--ink-3)]">
              Поддержка
            </h4>
            <ul className="space-y-3 text-sm">
              <li><a href="/#support" className="nav-link">Контакты</a></li>
              <li><a href="/#support" className="nav-link">Частые вопросы</a></li>
            </ul>
          </div>
        </div>

        <div className="divider-ss my-10" />

        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="muted-ss text-sm">
            © 2026 Sunstore. Все права защищены.
          </p>
          <p className="brand-mark text-sm">
            <span className="brand-dot" />
            Sunstore
          </p>
        </div>
      </div>
    </footer>
  )
}
