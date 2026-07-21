"use client"

import { useState } from 'react'
import Link from 'next/link'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [subscribing, setSubscribing] = useState(false)

  const handleSubscribe = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return
    setSubscribing(true)
    try {
      await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      setSubscribed(true)
    } catch {
    } finally {
      setSubscribing(false)
    }
  }

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
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--ink-3)] mb-2">Рассылка</p>
              {subscribed ? (
                <p className="text-sm text-[color:var(--success)]">Вы подписаны</p>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="email"
                    className="input-ss flex-1 h-9 text-xs"
                    placeholder="Ваш email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                  />
                  <button
                    onClick={handleSubscribe}
                    disabled={subscribing}
                    className="btn btn-primary h-9 text-xs px-3"
                  >
                    OK
                  </button>
                </div>
              )}
            </div>
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
