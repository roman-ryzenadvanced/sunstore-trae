"use client"

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useCurrency } from '@/hooks/useCurrency'
import Image from 'next/image'
import { CartProvider, useCart } from '@/contexts/CartContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

// Force dark theme for full-screen immersive experience
const forceDarkMode = true

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [newProducts, setNewProducts] = useState([])
  const { currency, convertPrice, currencyConfig } = useCurrency()
  const { cartCount } = useCart()
  const [isLoading, setIsLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState({
    hours: 12,
    minutes: 30,
    seconds: 45
  })

  // Initialize design system with photonic architecture colors
  useEffect(() => {
    // Force dark theme by adding data-theme attribute to html element
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', 'dark')
      document.body.style.backgroundColor = '#0F0F11' // Obsidian Carbon
      document.body.style.color = '#FFFDF7' // Solar White
    }
  }, [])

  // Countdown timer for special offers
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev
        if (seconds > 0) {
          seconds--
        } else if (minutes > 0) {
          minutes--
          seconds = 59
        } else if (hours > 0) {
          hours--
          minutes = 59
          seconds = 59
        }
        return { hours, minutes, seconds }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products')
        const data = await response.json()
        const productsList = data.products || []
        setFeaturedProducts(productsList.slice(0, 6))
        setNewProducts(productsList.slice(6, 12))
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(convertPrice(price))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Загрузка солнечных батарей...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 overflow-hidden relative">
      {/* Kinetic energy background with energy pulses */}
      <div className="absolute inset-0 bg-gradient-radial from-orange-500/20 via-transparent to-transparent animate-pulse"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-transparent to-slate-900"></div>
      
      {/* Floating energy particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-orange-400 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 10 + 5}s`
            }}
          />
        ))}
      </div>

      <Header />
      
      {/* Hero Section - Photonic Architecture with energy flow */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/30 via-transparent to-blue-900/30"></div>
        
        {/* Energy flow lines */}
        <div className="absolute inset-0">
          <svg className="w-full h-full" viewBox="0 0 1200 800">
            <defs>
              <linearGradient id="energyFlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF9A00" stopOpacity="0.1"/>
                <stop offset="50%" stopColor="#FF6B00" stopOpacity="0.05"/>
                <stop offset="100%" stopColor="#FFA500" stopOpacity="0.1"/>
              </linearGradient>
            </defs>
            <path d="M0,400 Q300,200 600,400 T1200,400" fill="none" stroke="url(#energyFlow)" strokeWidth="2"/>
            <path d="M0,500 Q400,300 800,500 T1200,500" fill="none" stroke="url(#energyFlow)" strokeWidth="2"/>
            <circle cx="600" cy="400" r="20" fill="#FF9A00" className="animate-ping"/>
          </svg>
        </div>

        <div className="relative z-10 text-center max-w-6xl mx-auto px-6">
          <div className="mb-8">
            <h1 className="text-7xl md:text-9xl font-bold mb-6">
              <span className="bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-600 bg-clip-text text-transparent">
                ROMMARK
              </span>
              <br />
              <span className="text-slate-200">ENERGY</span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
                ENGINEERING
              </span>
            </h1>
            
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="bg-orange-500/20 backdrop-blur-sm rounded-full px-6 py-2 border border-orange-500/30">
                <span className="text-orange-400 font-mono text-sm">⚡ ROMMARK.DEV • ЭНЕРГИЯ • ИНЖЕНЕРИЯ</span>
              </div>
            </div>
          </div>

          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Инженерная энергетика нового поколения от <span className="text-orange-400 font-semibold">ROMMARK.DEV</span>.
              Умные системы и квантовые технологии фотоники для максимальной эффективности.
            </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-4xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-orange-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="text-3xl font-bold text-orange-400 mb-2">500+</div>
              <div className="text-slate-400">Продуктов</div>
              <div className="text-xs text-slate-500 mt-1">Энергетический баланс</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-orange-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="text-3xl font-bold text-orange-400 mb-2">3000+</div>
              <div className="text-slate-400">Довольных клиентов</div>
              <div className="text-xs text-slate-500 mt-1">Квантовый прогресс</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-orange-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="text-3xl font-bold text-orange-400 mb-2">24/7</div>
              <div className="text-slate-400">Поддержка</div>
              <div className="text-xs text-slate-500 mt-1">Энергетическая стабильность</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/blueprint" className="group relative overflow-hidden bg-gradient-to-r from-orange-500 to-orange-600 text-white px-10 py-4 rounded-full font-semibold text-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-orange-500/25">
              <span className="relative z-10">Выбрать систему</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </Link>
            <Link href="/array" className="group bg-slate-800/50 backdrop-blur-sm text-white px-10 py-4 rounded-full font-semibold text-lg border border-slate-600/50 hover:border-orange-500/50 hover:bg-orange-500/10 transition-all duration-300 transform hover:scale-105">
              Каталог товаров
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-slate-900 via-slate-800/20 to-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">
              <span className="text-orange-400">ВЫБРАННОЕ</span> 
              <span className="text-slate-200">ЭНЕРГИЯ</span>
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-orange-500 to-orange-600 mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product: any) => (
              <Link href={`/blueprint?productId=${product.id}`} key={product.id} className="group">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700/50 hover:border-orange-500/50 transition-all duration-300 hover:transform hover:scale-105">
                  <div className="aspect-video bg-gradient-to-br from-slate-700 to-slate-800 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10"></div>
                    <div className="absolute top-4 left-4 z-20">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${product.category === 'elite' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' : product.category === 'professional' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'}`}> 
                        {product.category === 'elite' ? 'ЭЛИТНЫЙ' : product.category === 'professional' ? 'ПРОФЕССИОНАЛ' : 'СТАНДАРТ'} 
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 z-20 text-white font-bold text-lg">
                      {product.name}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-orange-400 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-orange-400">
                          {formatPrice(product.price)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {currencyConfig.symbol} в зависимости от курса
                        </div>
                      </div>
                      <button className="bg-slate-700 hover:bg-orange-500/20 text-orange-400 p-3 rounded-full transition-all duration-300 transform group-hover:rotate-180">
                        <svg className="w-5 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8l-8 8-8-8"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/10 via-transparent to-blue-900/10"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">
              <span className="text-blue-400">НОВИНКИ</span> 
              <span className="text-slate-200">ТЕХНОЛОГИИ</span>
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {newProducts.map((product: any) => (
              <Link href={`/blueprint?productId=${product.id}`} key={product.id} className="group">
                <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700/30 hover:border-blue-500/50 transition-all duration-300 hover:transform hover:scale-105">
                  <div className="aspect-square bg-gradient-to-br from-slate-700 to-slate-800 relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10"></div>
                    <div className="absolute top-2 left-2 z-20">
                      <span className="bg-blue-500/20 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold text-blue-400 border border-blue-500/30">
                        НОВИНКА
                      </span>
                    </div>
                    <div className="absolute bottom-2 right-2 z-20 bg-blue-500/20 backdrop-blur-sm rounded-full p-2">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8l-8 8-8-8"/>
                      </svg>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm mb-1 group-hover:text-blue-400 transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <div className="text-lg font-bold text-blue-400">
                      {formatPrice(product.price)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Обновлено сегодня
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Special Offers Timer */}
      <section className="py-20 px-6 bg-gradient-to-r from-orange-900/20 via-slate-800 to-blue-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8">
            <span className="text-orange-400">СПЕЦИАЛЬНЫЕ</span> 
            <span className="text-slate-200">ПРЕДЛОЖЕНИЯ</span>
          </h2>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-8 border border-slate-700/50">
            <p className="text-lg text-slate-300 mb-8">
              Эксклюзивное предложение действует ограниченное время. 
              Не упустите возможность оптимизировать свою энергетическую систему.
            </p>
            
            <div className="flex justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-orange-400">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <div className="text-xs text-slate-500 uppercase">ЧАСЫ</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-orange-400">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <div className="text-xs text-slate-500 uppercase">МИНУТЫ</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-orange-400">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
                <div className="text-xs text-slate-500 uppercase">СЕКУНДЫ</div>
              </div>
            </div>
            
            <Link href="/checkout" className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 text-white px-12 py-4 rounded-full font-semibold text-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 shadow-2xl">
              Активировать
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
