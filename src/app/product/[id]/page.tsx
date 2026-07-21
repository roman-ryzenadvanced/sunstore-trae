'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { useCurrency } from '@/contexts/CurrencyContext'
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

function ProductDetailContent() {
  const params = useParams()
  const id = params.id as string

  const [product, setProduct] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const { addToCart } = useCart()
  const { formatPrice } = useCurrency() as any

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${id}`)
        if (response.status === 404) {
          setNotFound(true)
          return
        }
        const data = await response.json()
        if (data.product) {
          setProduct(data.product)
        } else {
          setNotFound(true)
        }
      } catch (error) {
        console.error('Failed to fetch product:', error)
        setNotFound(true)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  const handleAddToCart = () => {
    if (!product) return
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.imageUrl || `/api/placeholder/product-${product.id}.png`,
      quantity: 1,
      category: product.category
    })
  }

  let specs: Record<string, string> = {}
  if (product?.specifications) {
    try {
      specs = JSON.parse(product.specifications)
    } catch {
      specs = {}
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-[color:var(--ink)]">
        <Header />
        <section className="section-pad">
          <div className="container-ss flex flex-col items-center justify-center py-24 text-center">
            <span className="spinner-ss" />
            <p className="muted-ss mt-4">Загрузка товара…</p>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-black text-[color:var(--ink)]">
        <Header />
        <section className="section-pad">
          <div className="container-ss flex flex-col items-center justify-center py-24 text-center">
            <h1 className="h-display text-4xl md:text-5xl">Товар не найден</h1>
            <p className="muted-ss mt-4">Запрашиваемый товар не существует или был удалён.</p>
            <a href="/array" className="btn btn-primary btn-lg mt-8">
              Вернуться в каталог
            </a>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-[color:var(--ink)]">
      <Header />

      <section className="section-pad">
        <div className="container-ss">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            {/* Left: Image (60% on desktop = 3 cols) */}
            <div className="lg:col-span-3">
              <div className="card-ss overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="aspect-square w-full object-cover lg:aspect-auto lg:h-full"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center bg-[color:var(--surface-2)] lg:aspect-auto lg:h-[500px]">
                    <span className="muted-ss text-sm">Нет изображения</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Details (40% on desktop = 2 cols) */}
            <div className="lg:col-span-2">
              <span className="badge-ss">{categoryLabel(product.category)}</span>
              <h1 className="h-display text-2xl mt-4">{product.name}</h1>
              <p className="price-ss text-3xl mt-3">
                {formatPrice(product.price)}
              </p>
              <p className="muted-ss mt-4 text-sm leading-relaxed">{product.description}</p>

              {/* Stock indicator */}
              <div className="mt-4">
                {product.stock > 0 ? (
                  <span className="badge-success">В наличии — {product.stock} шт</span>
                ) : (
                  <span className="badge-danger">Нет в наличии</span>
                )}
              </div>

              {/* Specifications */}
              {Object.keys(specs).length > 0 && (
                <div className="card-ss mt-6 p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--ink-3)] mb-4">
                    Характеристики
                  </h3>
                  <dl className="space-y-3">
                    {Object.entries(specs).map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-4">
                        <dt className="muted-ss text-sm shrink-0">{key}</dt>
                        <dd className="text-sm font-medium text-[color:var(--ink)] text-right">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Actions */}
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="btn btn-primary btn-lg w-full mt-6"
              >
                В корзину
              </button>
              <a href="/array" className="btn btn-ghost mt-3 w-full inline-block text-center">
                Вернуться в каталог
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default function ProductDetailPage() {
  return <ProductDetailContent />
}
