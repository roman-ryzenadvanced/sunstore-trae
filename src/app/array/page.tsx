"use client"

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useCart } from '@/contexts/CartContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const categoryMeta: Record<string, { label: string }> = {
  panels: { label: 'Панели' },
  inverters: { label: 'Инверторы' },
  batteries: { label: 'Аккумуляторы' },
  controllers: { label: 'Контроллеры' },
  mounting: { label: 'Крепления' },
  systems: { label: 'Системы' }
}

const categoryLabel = (category: string) =>
  (categoryMeta[category] || { label: category }).label

function ArrayContent() {
  const [products, setProducts] = useState<any[]>([])
  const { currency, convertPrice, formatPrice: ctxFormatPrice } = useCurrency() as any
  const { addToCart } = useCart()
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 500000 })

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products')
        const data = await response.json()
        setProducts(data.products || [])
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const filteredProducts = products.filter((product: any) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    const productPrice = convertPrice(product.price)
    const matchesPriceRange = productPrice >= priceRange.min && productPrice <= priceRange.max
    return matchesSearch && matchesCategory && matchesPriceRange
  })

  const categories = [
    { value: 'all', label: 'Все категории', count: products.length },
    { value: 'panels', label: 'Солнечные панели', count: products.filter((p: any) => p.category === 'panels').length },
    { value: 'inverters', label: 'Инверторы', count: products.filter((p: any) => p.category === 'inverters').length },
    { value: 'batteries', label: 'Аккумуляторы', count: products.filter((p: any) => p.category === 'batteries').length },
    { value: 'controllers', label: 'Контроллеры', count: products.filter((p: any) => p.category === 'controllers').length },
    { value: 'mounting', label: 'Крепления', count: products.filter((p: any) => p.category === 'mounting').length },
    { value: 'systems', label: 'Готовые системы', count: products.filter((p: any) => p.category === 'systems').length }
  ]

  return (
    <div className="min-h-screen bg-black text-[color:var(--ink)]">
      <Header />

      {/* Hero */}
      <section className="section-pad">
        <div className="container-ss">
          <div className="max-w-2xl">
            <p className="eyebrow-ss mb-3">Каталог</p>
            <h1 className="h-display text-5xl md:text-6xl">Оборудование Sunstore</h1>
            <p className="lede-ss mt-4">
              Полный ассортимент солнечных энергетических систем для любых задач.
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-40 border-y border-[color:var(--hairline)] bg-black/70 backdrop-blur-md">
        <div className="container-ss py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Поиск товаров…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-ss"
              />
            </div>
            <div className="flex-1 lg:max-w-xs">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="select-ss"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label} ({category.count})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="От"
                value={priceRange.min}
                onChange={(e) => setPriceRange((prev) => ({ ...prev, min: Number(e.target.value) }))}
                className="input-ss w-28"
              />
              <span className="muted-ss">—</span>
              <input
                type="number"
                placeholder="До"
                value={priceRange.max}
                onChange={(e) => setPriceRange((prev) => ({ ...prev, max: Number(e.target.value) }))}
                className="input-ss w-28"
              />
            </div>
            <div className="muted-ss text-sm">
              Найдено: <span className="text-[color:var(--ink)]">{filteredProducts.length}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="section-pad">
        <div className="container-ss">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="spinner-ss" />
              <p className="muted-ss mt-4">Загрузка каталога…</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="card-ss mx-auto max-w-md p-12 text-center">
              <h3 className="text-xl font-semibold text-[color:var(--ink)]">Товары не найдены</h3>
              <p className="muted-ss mt-2">Попробуйте изменить критерии поиска или фильтрации.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product: any) => (
                <div key={product.id} className="card-ss card-ss-hover group flex flex-col overflow-hidden">
                  <div className="relative aspect-square overflow-hidden bg-[color:var(--surface-2)]">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : null}
                    <span className="badge-ss absolute left-3 top-3">{categoryLabel(product.category)}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-base font-semibold text-[color:var(--ink)]">{product.name}</h3>
                    <p className="muted-ss mt-1 line-clamp-2 text-sm">{product.description}</p>
                    <div className="mt-4">
                      <span className="price-ss text-lg">{ctxFormatPrice(product.price)}</span>
                    </div>
                    <div className="mt-auto pt-4 flex gap-2">
                      <button
                        onClick={() =>
                          addToCart({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            image: product.imageUrl || `/api/placeholder/product-${product.id}.png`,
                            quantity: 1,
                            category: product.category
                          })
                        }
                        className="btn btn-primary flex-1"
                      >
                        В корзину
                      </button>
                      <a href={`/product/${product.id}`} className="btn btn-ghost flex-1 text-center">
                        Подробнее
                      </a>
                    </div>
                  </div>
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

export default function ArrayPage() {
  return <ArrayContent />
}
