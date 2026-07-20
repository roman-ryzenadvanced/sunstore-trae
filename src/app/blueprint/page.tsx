"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useCurrency } from '@/hooks/useCurrency'
import { CartProvider, useCart } from '@/contexts/CartContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function BlueprintPage() {
  const [product, setProduct] = useState<any>(null)
  const { currency, convertPrice, currencyConfig } = useCurrency()
  const { addToCart } = useCart()
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [energyOutput, setEnergyOutput] = useState(5000)
  const [efficiency, setEfficiency] = useState(18)

  // Initialize dark theme
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }, [])

  // Get product ID from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const productId = urlParams.get('productId')

    const fetchProduct = async () => {
      try {
        const response = await fetch('/api/products')
        const data = await response.json()
        const foundProduct = data.products.find((p: any) => p.id === productId)

        if (foundProduct) {
          setProduct(foundProduct)
          setEnergyOutput(foundProduct.energy || 5000)
          setEfficiency(foundProduct.efficiency || 18)
        } else {
          setProduct({
            id: 'prod_001',
            name: 'Профессиональная солнечная система',
            description: 'Элитная солнечная энергетическая система с квантовым отслеживанием',
            category: 'professional',
            price: 89900,
            energy: 8500,
            efficiency: 22,
            dimensions: '245x185x45 см',
            weight: '42 кг',
            warranty: '12 лет'
          })
        }
      } catch (error) {
        console.error('Failed to fetch product:', error)
        setProduct({
          id: 'prod_001',
          name: 'Профессиональная солнечная система',
          description: 'Элитная солнечная энергетическая система с квантовым отслеживанием',
          category: 'professional',
          price: 89900,
          energy: 8500,
          efficiency: 22,
          dimensions: '245x185x45 см',
          weight: '42 кг',
          warranty: '12 лет'
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProduct()
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(convertPrice(price))
  }

  const calculateTotalPrice = () => {
    return product ? product.price * quantity : 0
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'elite': return 'from-yellow-500 to-orange-500'
      case 'professional': return 'from-blue-500 to-cyan-500'
      case 'standard': return 'from-green-500 to-emerald-500'
      default: return 'from-slate-500 to-slate-600'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'elite': return 'ЭЛИТНЫЙ'
      case 'professional': return 'ПРОФЕССИОНАЛ'
      case 'standard': return 'СТАНДАРТ'
      default: return 'БАЗОВЫЙ'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Загрузка системы...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      <Header />

      {/* Navigation */}
      <nav className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50 py-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-slate-300 hover:text-orange-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Назад к каталогу
            </button>
            <div className="flex items-center gap-4">
              <button className="bg-slate-700/50 hover:bg-slate-600/50 px-4 py-2 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Product Hero */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Visual */}
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl overflow-hidden border border-slate-700/50 relative">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10"></div>
                <div className="absolute top-4 left-4 z-20">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r ${getCategoryColor(product.category)} text-white`}>
                    {getCategoryLabel(product.category)}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 z-20 text-white">
                  <div className="text-3xl font-bold mb-1 drop-shadow-lg">{product.name}</div>
                  <div className="text-slate-300">{product.dimensions}</div>
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-slate-50">{product.name}</h1>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">{product.description}</p>

              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 mb-8">
                <div className="flex items-baseline justify-between mb-4">
                  <div className="text-3xl font-bold text-orange-400">{formatPrice(product.price)}</div>
                  <div className="text-sm text-slate-400">{currencyConfig.symbol}</div>
                </div>

                {/* Energy Calculator */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Энергопотребление (Вт/день)
                    </label>
                    <input
                      type="range"
                      min="1000"
                      max="20000"
                      step="500"
                      value={energyOutput}
                      onChange={(e) => setEnergyOutput(Number(e.target.value))}
                      className="w-full accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>1,000 Вт</span>
                      <span className="text-orange-400 font-semibold">{energyOutput.toLocaleString()} Вт</span>
                      <span>20,000 Вт</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      КПД панели (%)
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="30"
                      step="1"
                      value={efficiency}
                      onChange={(e) => setEfficiency(Number(e.target.value))}
                      className="w-full accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>10%</span>
                      <span className="text-orange-400 font-semibold">{efficiency}%</span>
                      <span>30%</span>
                    </div>
                  </div>

                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-1">Рекомендуемое количество панелей</div>
                    <div className="text-2xl font-bold text-orange-400">
                      {Math.ceil((energyOutput * 365) / (product.energy * efficiency / 100 * 365))} шт.
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantity & Add to Cart */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center border border-slate-600/50 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center text-slate-300 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="w-16 text-center font-semibold text-slate-50">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center text-slate-300 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8l-8 8-8-8" />
                    </svg>
                  </button>
                </div>

                <button
                  onClick={() => addToCart({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.imageUrl || `/api/placeholder/product-${product.id}.png`,
                    quantity: quantity,
                    energy: product.energy,
                    efficiency: product.efficiency,
                    category: product.category
                  })}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-orange-500/25"
                >
                  В корзину — {formatPrice(calculateTotalPrice())}
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <div className="text-2xl mb-1">🛡️</div>
                  <div className="text-xs text-slate-400">Гарантия {product.warranty}</div>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <div className="text-2xl mb-1">⚡</div>
                  <div className="text-xs text-slate-400">{product.energy} Вт</div>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <div className="text-2xl mb-1">🌟</div>
                  <div className="text-xs text-slate-400">КПД {product.efficiency}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specifications */}
      <section className="py-16 px-6 bg-slate-800/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center text-slate-50">Технические характеристики</h2>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-700/50">
              <div className="bg-slate-800/50 p-6">
                <div className="text-sm text-slate-400 mb-1">Мощность</div>
                <div className="text-lg font-semibold text-slate-50">{product.energy} Вт</div>
              </div>
              <div className="bg-slate-800/50 p-6">
                <div className="text-sm text-slate-400 mb-1">КПД</div>
                <div className="text-lg font-semibold text-slate-50">{product.efficiency}%</div>
              </div>
              <div className="bg-slate-800/50 p-6">
                <div className="text-sm text-slate-400 mb-1">Габариты</div>
                <div className="text-lg font-semibold text-slate-50">{product.dimensions}</div>
              </div>
              <div className="bg-slate-800/50 p-6">
                <div className="text-sm text-slate-400 mb-1">Вес</div>
                <div className="text-lg font-semibold text-slate-50">{product.weight}</div>
              </div>
              <div className="bg-slate-800/50 p-6">
                <div className="text-sm text-slate-400 mb-1">Гарантия</div>
                <div className="text-lg font-semibold text-slate-50">{product.warranty}</div>
              </div>
              <div className="bg-slate-800/50 p-6">
                <div className="text-sm text-slate-400 mb-1">Категория</div>
                <div className="text-lg font-semibold text-slate-50">{getCategoryLabel(product.category)}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
