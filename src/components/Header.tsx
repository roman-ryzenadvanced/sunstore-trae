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
    <header className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">ROMMARK</span>
            <span className="text-white">.DEV</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/array" className="text-slate-300 hover:text-orange-400 transition-colors">Каталог</Link>
            <Link href="/blueprint" className="text-slate-300 hover:text-orange-400 transition-colors">Системы</Link>
            <Link href="/checkout" className="text-slate-300 hover:text-orange-400 transition-colors">Оформление</Link>
            <Link href="/status" className="text-slate-300 hover:text-orange-400 transition-colors">Статус</Link>
          </nav>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <select
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="bg-slate-800/50 border border-slate-600/50 rounded-lg px-3 py-2 text-slate-50 text-sm focus:outline-none focus:border-orange-500/50 appearance-none cursor-pointer"
              >
                <option value="RUB" className="bg-slate-800">₽ RUB</option>
                <option value="USD" className="bg-slate-800">$ USD</option>
                <option value="EUR" className="bg-slate-800">€ EUR</option>
              </select>
              <svg className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </div>

            <button
              onClick={goToCart}
              className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 border border-orange-500/30 relative"
            >
              🛒 Корзина
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}