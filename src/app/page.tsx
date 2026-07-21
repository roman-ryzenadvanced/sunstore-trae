"use client"

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useCart } from '@/contexts/CartContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const rubFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0
})

const formatPrice = (price: number) => rubFormatter.format(price)

const scrollTo = (id: string) => {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

function ProductCard({ product, onAdd }: { product: any; onAdd: (p: any) => void }) {
  return (
    <div className="card-ss card-ss-hover flex flex-col overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden bg-[color:var(--surface-2)]">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold text-[color:var(--ink)]">{product.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-[color:var(--ink-3)]">{product.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="price-ss text-lg">{formatPrice(product.price)}</span>
        </div>
        <div className="mt-auto pt-4 flex gap-2">
          <button onClick={() => onAdd(product)} className="btn btn-primary flex-1">
            В корзину
          </button>
          <a href={`/product/${product.id}`} className="btn btn-ghost flex-1 text-center">
            Подробнее
          </a>
        </div>
      </div>
    </div>
  )
}

function HomeContent() {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { addToCart } = useCart()

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

  const handleAdd = (product: any) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.imageUrl || `/api/placeholder/product-${product.id}.png`,
      quantity: 1,
      category: product.category
    })
  }

  const benefits = [
    { label: 'Гарантия', title: 'Гарантия до 30 лет', text: 'Официальная гарантия на панели и оборудование Sunstore.' },
    { label: 'Доставка', title: 'Доставка по РФ', text: 'Быстрая доставка в любой регион России и страны СНГ.' },
    { label: 'Оплата', title: 'Оплата любым способом', text: 'Карты, счета для юрлиц, рассрочка и онлайн-платежи.' }
  ]

  const faqs = [
    { q: 'Как подобрать систему под дом?', a: 'Используйте каталог или свяжитесь с поддержкой — поможем рассчитать мощность.' },
    { q: 'Сколько длится доставка?', a: 'От 2 до 7 дней в зависимости от региона. Крупные системы — по согласованию.' },
    { q: 'Есть ли гарантия?', a: 'Да, на панели — до 30 лет, на инверторы и аккумуляторы — от 2 до 10 лет.' }
  ]

  return (
    <div className="min-h-screen bg-black text-[color:var(--ink)]">
      <Header />

      {/* Hero */}
      <section className="section-pad">
        <div className="container-ss">
          <div className="mx-auto max-w-3xl text-center fade-up">
            <p className="eyebrow-ss mb-5">Солнечная энергия для дома и бизнеса</p>
            <h1 className="h-display text-6xl md:text-7xl">Sunstore</h1>
            <p className="lede-ss mx-auto mt-6 max-w-xl">
              Панели, инверторы и готовые системы с доставкой по России.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button onClick={() => scrollTo('catalog')} className="btn btn-primary btn-lg">
                Перейти в каталог
              </button>
              <button onClick={() => scrollTo('support')} className="btn btn-ghost btn-lg">
                Узнать больше
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section id="catalog" className="section-pad border-t border-[color:var(--hairline)]">
        <div className="container-ss">
          <div className="mb-12 text-center">
            <p className="eyebrow-ss mb-3">Каталог</p>
            <h2 className="h-display text-4xl md:text-5xl">Оборудование Sunstore</h2>
            <p className="lede-ss mx-auto mt-4 max-w-xl">
              Проверенные солнечные панели, инверторы и аккумуляторы для любых задач.
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="spinner-ss" />
              <p className="muted-ss mt-4">Загрузка каталога…</p>
            </div>
          ) : products.length === 0 ? (
            <p className="muted-ss text-center">Каталог временно пуст.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <div key={product.id} className="group">
                  <ProductCard product={product} onAdd={handleAdd} />
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link href="/array" className="btn btn-ghost btn-lg">Смотреть весь каталог</Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-pad border-t border-[color:var(--hairline)]">
        <div className="container-ss">
          <div className="mb-12 text-center">
            <p className="eyebrow-ss mb-3">Почему Sunstore</p>
            <h2 className="h-display text-4xl md:text-5xl">Спокойная покупка</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {benefits.map((b) => (
              <div key={b.label} className="card-ss p-7">
                <span className="badge-accent">{b.label}</span>
                <h3 className="mt-4 text-xl font-semibold text-[color:var(--ink)]">{b.title}</h3>
                <p className="muted-ss mt-2 text-sm leading-relaxed">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support */}
      <section id="support" className="section-pad border-t border-[color:var(--hairline)]">
        <div className="container-ss">
          <div className="mb-12 text-center">
            <p className="eyebrow-ss mb-3">Поддержка</p>
            <h2 className="h-display text-4xl md:text-5xl">Частые вопросы</h2>
          </div>
          <div className="mx-auto grid max-w-3xl gap-4">
            {faqs.map((f) => (
              <div key={f.q} className="card-ss p-6">
                <h3 className="text-base font-semibold text-[color:var(--ink)]">{f.q}</h3>
                <p className="muted-ss mt-2 text-sm leading-relaxed">{f.a}</p>
              </div>
            ))}
            <div className="card-ss mt-2 flex flex-col items-center justify-between gap-4 p-6 text-center sm:flex-row sm:text-left">
              <div>
                <h3 className="text-base font-semibold text-[color:var(--ink)]">Остались вопросы?</h3>
                <p className="muted-ss mt-1 text-sm">Напишите нам — ответим в течение дня.</p>
              </div>
              <a href="mailto:support@sunstore.ru" className="btn btn-primary">Связаться</a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default function HomePage() {
  return <HomeContent />
}
