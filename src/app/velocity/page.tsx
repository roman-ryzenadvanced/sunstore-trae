'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function VelocityPage() {
  const [mounted, setMounted] = useState(false)
  const { cartItems, updateQuantity, removeFromCart, isLoading } = useCart()
  const { formatPrice } = useCurrency()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-[color:var(--ink-3)]">
        Загрузка…
      </div>
    )
  }

  const subtotal = cartItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
  const shippingCost = subtotal >= 50000 ? 0 : 3500
  const orderTotal = subtotal + shippingCost

  return (
    <div className="min-h-screen bg-black text-[color:var(--ink)]">
      <Header />

      <section className="section-pad">
        <div className="container-ss">
          <div className="mb-12 max-w-2xl">
            <p className="eyebrow-ss mb-3">Корзина</p>
            <h1 className="h-display text-5xl md:text-6xl">Ваша корзина</h1>
            <p className="lede-ss mt-4">
              Солнечное оборудование Sunstore готово к оформлению.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
            <div className="flex flex-col gap-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <span className="spinner-ss" />
                  <p className="muted-ss mt-4">Загрузка корзины…</p>
                </div>
              ) : cartItems.length > 0 ? (
                cartItems.map((item: any) => (
                  <article key={item.id} className="card-ss flex items-center gap-4 p-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[var(--r-md)] bg-[color:var(--surface-2)]">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-[color:var(--ink-3)]">
                          {item.category}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-[color:var(--ink)]">{item.name}</h3>
                      <p className="muted-ss text-sm">{item.category}</p>
                      <p className="price-ss mt-1">{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className="flex items-center overflow-hidden rounded-full border border-[color:var(--hairline-strong)]">
                        <button
                          className="flex h-9 w-9 items-center justify-center text-[color:var(--ink-2)] transition-colors hover:bg-white/[0.06] disabled:opacity-40"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          className="w-12 bg-transparent text-center text-sm outline-none"
                          value={item.quantity}
                          min="1"
                          max="10"
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                        />
                        <button
                          className="flex h-9 w-9 items-center justify-center text-[color:var(--ink-2)] transition-colors hover:bg-white/[0.06] disabled:opacity-40"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= 10}
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="text-sm text-[color:var(--ink-3)] transition-colors hover:text-[color:var(--danger)]"
                        onClick={() => removeFromCart(item.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="card-ss mx-auto max-w-md p-12 text-center">
                  <div className="mb-4 text-4xl opacity-50">🛒</div>
                  <h2 className="text-xl font-semibold text-[color:var(--ink)]">Ваша корзина пуста</h2>
                  <p className="muted-ss mt-2">Похоже, вы ещё не добавили солнечные компоненты.</p>
                  <Link href="/array" className="btn btn-primary mt-6">Перейти к покупкам</Link>
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <aside className="h-fit lg:sticky lg:top-24">
                <div className="card-ss p-6">
                  <h2 className="mb-5 text-lg font-semibold">Итог заказа</h2>
                  <div className="flex justify-between text-sm">
                    <span className="muted-ss">Подытог</span>
                    <span className="price-ss">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="mt-3 flex justify-between text-sm">
                    <span className="muted-ss">Доставка</span>
                    <span className="price-ss">
                      {shippingCost === 0 ? 'БЕСПЛАТНО' : formatPrice(shippingCost)}
                    </span>
                  </div>
                  <div className="divider-ss my-4" />
                  <div className="flex justify-between">
                    <span className="font-semibold">Итого</span>
                    <span className="price-ss text-lg text-[color:var(--accent)]">{formatPrice(orderTotal)}</span>
                  </div>

                  <div className="mt-6 rounded-[var(--r-md)] bg-[color:var(--surface-2)] p-4">
                    <p className="text-sm text-[color:var(--ink-2)]">Бесплатная доставка</p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--hairline)]">
                      <div
                        className="h-full rounded-full bg-[color:var(--accent)] transition-all"
                        style={{ width: `${Math.min(100, (subtotal / 50000) * 100)}%` }}
                      />
                    </div>
                    <p className="muted-ss mt-2 text-xs">
                      {subtotal >= 50000
                        ? 'Бесплатная доставка разблокирована!'
                        : `${formatPrice(50000 - subtotal)} до бесплатной доставки`}
                    </p>
                  </div>

                  <Link
                    href="/checkout"
                    className="btn btn-primary mt-6 w-full"
                    style={{ opacity: cartItems.length === 0 ? 0.6 : 1 }}
                  >
                    Перейти к оформлению
                  </Link>
                  <Link href="/array" className="btn btn-ghost mt-3 w-full">
                    Продолжить покупки
                  </Link>
                </div>
              </aside>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
