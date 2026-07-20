"use client"

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useCurrency } from '@/hooks/useCurrency'
import { CartProvider, useCart } from '@/contexts/CartContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function ArrayPage() {
  const [products, setProducts] = useState([])
  const { currency, convertPrice, currencyConfig } = useCurrency()
  const { addToCart } = useCart()
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 500000 })

  // Initialize dark theme
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }, [])

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products')
        const data = await response.json()
        setProducts(data.products)
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Filter products based on search, category, and price range
  const filteredProducts = products.filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    const productPrice = convertPrice(product.price)
    const matchesPriceRange = productPrice >= priceRange.min && productPrice <= priceRange.max

    return matchesSearch && matchesCategory && matchesPriceRange
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(convertPrice(price))
  }

  const categories = [
    { value: 'all', label: 'Все категории', count: products.length },
    { value: 'panels', label: 'Солнечные панели', count: products.filter((p: any) => p.category === 'panels').length },
    { value: 'inverters', label: 'Инверторы', count: products.filter((p: any) => p.category === 'inverters').length },
    { value: 'batteries', label: 'Аккумуляторы', count: products.filter((p: any) => p.category === 'batteries').length },
    { value: 'controllers', label: 'Контроллеры', count: products.filter((p: any) => p.category === 'controllers').length },
    { value: 'mounting', label: 'Крепления', count: products.filter((p: any) => p.category === 'mounting').length },
    { value: 'systems', label: 'Готовые системы', count: products.filter((p: any) => p.category === 'systems').length }
  ]

  const categoryMeta: Record<string, { label: string; color: string }> = {
    panels: { label: 'ПАНЕЛИ', color: 'from-blue-500 to-cyan-500' },
    inverters: { label: 'ИНВЕРТОРЫ', color: 'from-violet-500 to-purple-500' },
    batteries: { label: 'АККУМУЛЯТОРЫ', color: 'from-emerald-500 to-green-500' },
    controllers: { label: 'КОНТРОЛЛЕРЫ', color: 'from-amber-500 to-orange-500' },
    mounting: { label: 'КРЕПЛЕНИЯ', color: 'from-slate-500 to-slate-600' },
    systems: { label: 'СИСТЕМА', color: 'from-orange-500 to-red-500' }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Загрузка каталога...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      <Header />

      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-br from-orange-900/20 via-slate-800 to-blue-900/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">Каталог</span>
              <span className="text-slate-200"> ТОВАРОВ</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Полноценный ассортимент солнечных энергетических систем для любых задач
            </p>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Поиск товаров..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-slate-50 placeholder-slate-400 focus:outline-none focus:border-orange-500/50 focus:bg-slate-700/80 transition-all"
                />
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex-1 max-w-xs">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-slate-50 focus:outline-none focus:border-orange-500/50 focus:bg-slate-700/80 transition-all"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value} className="bg-slate-800">
                    {category.label} ({category.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="flex-1 max-w-xs">
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="От"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                  className="w-20 bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-3 text-slate-50 text-sm focus:outline-none focus:border-orange-500/50 focus:bg-slate-700/80 transition-all"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="number"
                  placeholder="До"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                  className="w-20 bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-3 text-slate-50 text-sm focus:outline-none focus:border-orange-500/50 focus:bg-slate-700/80 transition-all"
                />
              </div>
            </div>

            {/* Results Count */}
            <div className="text-slate-400 text-sm">
              Найдено: <span className="text-orange-400 font-semibold">{filteredProducts.length}</span> товаров
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-4">Товары не найдены</h3>
              <p className="text-slate-400 max-w-md mx-auto">
                Попробуйте изменить критерии поиска или фильтрации
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product: any) => (
                <div key={product.id} className="group">
                  <Link href={`/blueprint?productId=${product.id}`} className="block">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700/50 hover:border-orange-500/50 transition-all duration-300 hover:transform hover:scale-105">
                      <div className="aspect-square bg-gradient-to-br from-slate-700 to-slate-800 relative overflow-hidden">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10"></div>
                        <div className="absolute top-3 left-3 z-20">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${(categoryMeta[product.category] || { color: 'from-green-500 to-emerald-500' }).color} text-white`}> 
                            {(categoryMeta[product.category] || { label: product.category }).label} 
                          </span>
                        </div>
                        <div className="absolute bottom-3 left-3 z-20 text-white font-bold text-lg drop-shadow-lg">
                          {product.name}
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-semibold mb-2 group-hover:text-orange-400 transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="text-2xl font-bold text-orange-400">
                              {formatPrice(product.price)}
                            </div>
                            <div className="text-xs text-slate-500">
                              {currencyConfig.symbol}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            addToCart({
                              id: product.id,
                              name: product.name,
                              price: product.price,
                              image: product.imageUrl || `/api/placeholder/product-${product.id}.png`,
                              quantity: 1,
                              energy: product.energy,
                              efficiency: product.efficiency,
                              category: product.category
                            })
                          }}
                          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-orange-500/25"
                        >
                          В корзину
                        </button>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}