"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useCurrency } from '@/hooks/useCurrency'
import { useCart } from '@/contexts/CartContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const categoryLabel: Record<string, string> = {
  panels: 'Панели',
  inverters: 'Инверторы',
  batteries: 'Аккумуляторы',
  controllers: 'Контроллеры',
  mounting: 'Крепления',
  systems: 'Системы',
  elite: 'Элитный',
  professional: 'Профессионал',
  standard: 'Стандарт'
}

function BlueprintContent() {
  const [product, setProduct] = useState<any>(null)
  const { currency, convertPrice, currencyConfig } = useCurrency()
  const { addToCart } = useCart()
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [energyOutput, setEnergyOutput] = useState(5000)
  const [efficiency, setEfficiency] = useState(18)

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
            description: 'Элитная солнечная энергетическая система с отслеживанием производительности.',
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
          description: 'Элитная солнечная энергетическая система с отслеживанием производительности.',
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

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(convertPrice(price))

  const calculateTotalPrice = () => (product ? product.price * quantity : 0)

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-black text-[color:var(--ink)]">
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
          <span className="spinner-ss" />
          <p className="muted-ss mt-4">Загрузка системы…</p>
        </div>
      </div>
    )
  }

  const recommendedPanels = product.energy
    ? Math.ceil((energyOutput * 365) / (product.energy * (efficiency / 100) * 365))
    : 0

  return (
    <div className="min-h-screen bg-black text-[color:var(--ink)]">
      <Header />

      <section className="section-pad">
        <div className="container-ss">
          <button
            onClick={() => window.history.back()}
            className="btn btn-quiet mb-8"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Назад к каталогу
          </button>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Visual */}
            <div className="card-ss overflow-hidden">
              <div className="relative aspect-square overflow-hidden bg-[color:var(--surface-2)]">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                ) : null}
                <span className="badge-accent absolute left-4 top-4">
                  {categoryLabel[product.category] || product.category}
                </span>
              </div>
            </div>

            {/* Details */}
            <div>
              <h1 className="h-display text-4xl md:text-5xl">{product.name}</h1>
              <p className="lede-ss mt-4">{product.description}</p>

              <div className="card-ss mt-8 p-6">
                <div className="mb-6 flex items-baseline justify-between">
                  <span className="price-ss text-3xl">{formatPrice(product.price)}</span>
                  <span className="muted-ss text-sm">{currencyConfig.symbol}</span>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="label-ss">Энергопотребление (Вт/день)</label>
                    <input
                      type="range"
                      min="1000"
                      max="20000"
                      step="500"
                      value={energyOutput}
                      onChange={(e) => setEnergyOutput(Number(e.target.value))}
                      className="w-full accent-[color:var(--accent)]"
                    />
                    <div className="mt-1 flex justify-between text-xs text-[color:var(--ink-3)]">
                      <span>1 000 Вт</span>
                      <span className="font-semibold text-[color:var(--accent)]">{energyOutput.toLocaleString()} Вт</span>
                      <span>20 000 Вт</span>
                    </div>
                  </div>

                  <div>
                    <label className="label-ss">КПД панели (%)</label>
                    <input
                      type="range"
                      min="10"
                      max="30"
                      step="1"
                      value={efficiency}
                      onChange={(e) => setEfficiency(Number(e.target.value))}
                      className="w-full accent-[color:var(--accent)]"
                    />
                    <div className="mt-1 flex justify-between text-xs text-[color:var(--ink-3)]">
                      <span>10%</span>
                      <span className="font-semibold text-[color:var(--accent)]">{efficiency}%</span>
                      <span>30%</span>
                    </div>
                  </div>

                  <div className="rounded-[var(--r-md)] bg-[color:var(--accent-soft)] p-4">
                    <div className="text-sm text-[color:var(--ink-2)]">Рекомендуемое количество панелей</div>
                    <div className="price-ss text-2xl text-[color:var(--accent)]">{recommendedPanels} шт.</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-4">
                <div className="flex items-center overflow-hidden rounded-full border border-[color:var(--hairline-strong)]">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-12 w-12 items-center justify-center text-[color:var(--ink-2)] transition-colors hover:bg-white/[0.06]"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="w-16 text-center font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex h-12 w-12 items-center justify-center text-[color:var(--ink-2)] transition-colors hover:bg-white/[0.06]"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8l-8 8-8-8" />
                    </svg>
                  </button>
                </div>

                <button
                  onClick={() =>
                    addToCart({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      image: product.imageUrl || `/api/placeholder/product-${product.id}.png`,
                      quantity,
                      energy: product.energy,
                      efficiency: product.efficiency,
                      category: product.category
                    })
                  }
                  className="btn btn-primary flex-1"
                >
                  В корзину — {formatPrice(calculateTotalPrice())}
                </button>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div className="card-ss p-4">
                  <div className="price-ss text-[color:var(--accent)]">⚡</div>
                  <div className="muted-ss mt-1 text-xs">Гарантия {product.warranty}</div>
                </div>
                <div className="card-ss p-4">
                  <div className="price-ss text-[color:var(--accent)]">{product.energy} Вт</div>
                  <div className="muted-ss mt-1 text-xs">Мощность</div>
                </div>
                <div className="card-ss p-4">
                  <div className="price-ss text-[color:var(--accent)]">{product.efficiency}%</div>
                  <div className="muted-ss mt-1 text-xs">КПД</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specifications */}
      <section className="section-pad border-t border-[color:var(--hairline)]">
        <div className="container-ss">
          <h2 className="h-display mb-8 text-center text-3xl">Технические характеристики</h2>
          <div className="card-ss mx-auto max-w-4xl overflow-hidden">
            <div className="grid grid-cols-1 divide-y divide-[color:var(--hairline)] md:grid-cols-2 md:divide-y-0">
              <div className="p-6">
                <div className="text-sm text-[color:var(--ink-3)]">Мощность</div>
                <div className="mt-1 text-lg font-semibold">{product.energy} Вт</div>
              </div>
              <div className="p-6 md:border-l md:border-[color:var(--hairline)]">
                <div className="text-sm text-[color:var(--ink-3)]">КПД</div>
                <div className="mt-1 text-lg font-semibold">{product.efficiency}%</div>
              </div>
              <div className="p-6 md:border-t md:border-[color:var(--hairline)]">
                <div className="text-sm text-[color:var(--ink-3)]">Габариты</div>
                <div className="mt-1 text-lg font-semibold">{product.dimensions}</div>
              </div>
              <div className="p-6 md:border-l md:border-t md:border-[color:var(--hairline)]">
                <div className="text-sm text-[color:var(--ink-3)]">Вес</div>
                <div className="mt-1 text-lg font-semibold">{product.weight}</div>
              </div>
              <div className="p-6 md:border-t md:border-[color:var(--hairline)]">
                <div className="text-sm text-[color:var(--ink-3)]">Гарантия</div>
                <div className="mt-1 text-lg font-semibold">{product.warranty}</div>
              </div>
              <div className="p-6 md:border-l md:border-t md:border-[color:var(--hairline)]">
                <div className="text-sm text-[color:var(--ink-3)]">Категория</div>
                <div className="mt-1 text-lg font-semibold">{categoryLabel[product.category] || product.category}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default function BlueprintPage() {
  return <BlueprintContent />
}
