"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { useCurrency } from '@/hooks/useCurrency'

export default function Header() {
  const { cartCount } = useCart()
  const { currency, setCurrency } = useCurrency()
  const router = useRouter()

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency)
    localStorage.setItem('currency', newCurrency)
  }

  const goToCart = () => {
    router.push('/velocity')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--hairline)] bg-black/70 backdrop-blur-md">
      <div className="container-ss">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="brand-mark">
            <span className="brand-dot" />
            Sunstore
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link href="/" className="nav-link">Главная</Link>
            <Link href="/#catalog" className="nav-link">Магазин</Link>
            <Link href="/#support" className="nav-link">Поддержка</Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <select
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="select-ss text-xs"
                aria-label="Валюта"
              >
                <option value="RUB">₽ RUB</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
              </select>
            </div>

            <button
              onClick={goToCart}
              className="btn btn-ghost relative"
              aria-label="Корзина"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Корзина
              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[color:var(--accent)] px-1 text-[10px] font-semibold text-black">
                  {cartCount}
                </span>
              )}
            </button>

            <Link href="/admin" className="btn btn-quiet hidden sm:inline-flex">
              Войти
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
