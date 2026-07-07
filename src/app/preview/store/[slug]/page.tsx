'use client'

import { useEffect, useState, useMemo } from 'react'
import { Search, ChevronRight, Mail, Store, Shield, Truck, Package, Loader2, ShoppingCart, Star, ArrowRight, Heart, Headphones, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { ProductCard } from '@/components/storefront/product-card'
import { DealCard } from '@/components/storefront/deal-card'
import { TrustBar } from '@/components/storefront/trust-bar'
import { LoadingSkeleton } from '@/components/storefront/loading-skeleton'
import { CartDrawer, CartFab } from '@/components/storefront/cart-drawer'
import { StorefrontData } from '@/components/storefront/types'
import { useCartStore } from '@/store/cart-store'

// ---- helpers ----
function darkenColor(hex: string, amount: number): string {
  const c = hex.replace('#', '')
  if (c.length !== 6) return '#111827'
  const r = Math.max(0, parseInt(c.slice(0, 2), 16) - amount)
  const g = Math.max(0, parseInt(c.slice(2, 4), 16) - amount)
  const b = Math.max(0, parseInt(c.slice(4, 6), 16) - amount)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function formatPrice(price: number): string {
  return '₽' + Math.round(price).toLocaleString('ru-RU', { useGrouping: true })
}

function getDiscount(price: number, oldPrice: number): number {
  if (!oldPrice || oldPrice <= price) return 0
  return Math.round((1 - price / oldPrice) * 100)
}

function NewsletterSection({ slug }: { slug: string }) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState('')

  const handleSubscribe = async () => {
    if (!email.trim()) return
    setSending(true)
    setMsg('')
    try {
      const res = await fetch(`/api/storefront/${slug}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setMsg(res.ok ? 'Вы успешно подписались!' : 'Ошибка подписки. Попробуйте снова.')
      if (res.ok) setEmail('')
    } catch {
      setMsg('Ошибка подписки. Попробуйте снова.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="bg-gradient-to-r from-gray-50 to-gray-100 border-t">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center max-w-md mx-auto">
          <Mail className="size-8 mx-auto text-gray-400 mb-3" />
          <h2 className="text-xl font-bold text-gray-900">Подпишитесь на новости</h2>
          <p className="text-sm text-gray-500 mt-2 mb-5">
            Получайте уведомления о новых товарах и специальных предложениях
          </p>
          <div className="flex items-center gap-2">
            <Input
              type="email"
              placeholder="Ваш email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white h-10 border-gray-300"
              onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
            />
            <Button
              onClick={handleSubscribe}
              disabled={sending || !email.trim()}
              className="h-10 px-5 text-white border-0 whitespace-nowrap font-medium"
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : (<><Mail className="size-4 mr-1.5" />Подписаться</>)}
            </Button>
          </div>
          {msg && <p className="text-sm mt-3 text-green-600 font-medium">{msg}</p>}
        </div>
      </div>
    </section>
  )
}

// ---- main client component ----
export default function StorefrontPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const [slug, setSlug] = useState<string>('')
  const [data, setData] = useState<StorefrontData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const initForStore = useCartStore((s) => s.initForStore)
  const cartCount = useCartStore((s) => s.count())
  const openCart = useCartStore((s) => s.openCart)

  useEffect(() => {
    params.then((p) => setSlug(p.slug))
  }, [params])

  useEffect(() => {
    if (slug) initForStore(slug)
  }, [slug, initForStore])

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/storefront/${slug}`, { cache: 'no-store' })
        if (!res.ok) {
          if (!cancelled) setError(`Магазин "${slug}" не найден.`)
        } else {
          const json = await res.json()
          if (!cancelled) setData(json)
        }
      } catch {
        if (!cancelled) setError('Не удалось загрузить данные. Попробуйте позже.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [slug])

  const filteredProducts = useMemo(() => {
    if (!data?.products) return []
    return data.products.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return p.title.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
      }
      return true
    })
  }, [data?.products, categoryFilter, searchQuery])

  const dealProducts = useMemo(
    () => (data?.products || []).filter((p) => p.oldPrice > 0 && p.oldPrice > p.price),
    [data?.products]
  )

  const color = data?.site?.primaryColor || '#0f172a'
  const darkColor = darkenColor(color, 50)
  const lightColor = darkenColor(color, 120)

  if (loading) return <LoadingSkeleton />

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-20 bg-gray-50">
        <Package className="size-16 text-gray-300 mb-4" />
        <h1 className="text-xl font-bold text-gray-600 mb-2">Магазин не найден</h1>
        <p className="text-gray-400 text-sm mb-4">{error || `Магазин "${slug}" не найден.`}</p>
        <p className="text-xs text-gray-400">URL: /preview/store/{slug}</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 text-gray-900 font-sans">
      {/* 1. Top Utility Bar */}
      <div className="bg-[#232f3e] text-gray-300 text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="hover:text-white transition-colors font-medium flex items-center gap-1">
              <Store className="size-3.5" /> SunStore
            </a>
            <span className="hidden sm:inline text-gray-500">|</span>
            <a href="#" className="hover:text-white transition-colors hidden sm:inline">Доставка</a>
            <a href="#" className="hover:text-white transition-colors hidden sm:inline">Помощь</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="/customer/login" className="hover:text-white transition-colors">Войти</a>
            <a href="/quote" className="hover:text-white transition-colors">Калькулятор солнечных панелей</a>
          </div>
        </div>
      </div>

      {/* 2. Store Header - Yandex/ebay style with store branding */}
      <div style={{ backgroundColor: color }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Store identity row */}
          <div className="pt-5 pb-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center text-2xl">
                {data.templateId === 'solar-panels' ? '⚡' : '🏪'}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">{data.site.name}</h1>
                <div className="flex items-center gap-2 text-white/70 text-xs sm:text-sm">
                  <div className="flex items-center">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="size-3 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="ml-1 font-medium">4.8</span>
                  </div>
                  <span>·</span>
                  <span>{data.products?.length || 0} товаров</span>
                </div>
              </div>
            </div>
            <div className="flex-1" />
            {/* Store badges */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-xs">
                <Shield className="size-3 mr-1" /> Проверенный продавец
              </Badge>
              <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-xs hidden sm:flex">
                <Truck className="size-3 mr-1" /> Доставка 1-3 дня
              </Badge>
            </div>
          </div>

          {/* Search bar - prominent like eBay/Yandex */}
          <div className="pb-4">
            <div className="flex">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                <Input
                  placeholder="Искать товары..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 h-11 rounded-l-none border-0 shadow-sm text-sm"
                />
              </div>
              <Button className="h-11 rounded-r-none px-6 font-semibold text-white border-0">
                Найти
              </Button>
              <button
                onClick={openCart}
                className="relative ml-2 flex h-11 w-12 items-center justify-center rounded-r-md bg-white/20 text-white transition-colors hover:bg-white/30"
                aria-label="Open cart"
              >
                <ShoppingCart className="size-5" />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Category quick links */}
          {data.categories.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 pb-3 text-white/90 text-sm">
              {data.categories.map((cat) => (
                <button key={cat} onClick={() => setCategoryFilter(cat)} className="hover:text-white transition-colors font-medium">
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Hero Banner - professional with gradient */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${color}, ${darkColor})` }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/20 -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/4" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-bold text-white leading-tight">
              {data.site.heroTitle || 'Лучшие товары по выгодным ценам'}
            </h2>
            {data.site.heroSubtitle && (
              <p className="mt-3 text-white/80 text-sm sm:text-base">
                {data.site.heroSubtitle}
              </p>
            )}
            <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
              <Button className="px-7 h-11 text-white border-0 text-sm font-semibold shadow-lg hover:opacity-90 transition-opacity" style={{ backgroundColor: '#f59e0b' }}>
                Смотреть каталог <ArrowRight className="size-4 ml-1" />
              </Button>
              {dealProducts.length > 0 && (
                <Button variant="outline" className="px-7 h-11 text-white border-white/30 hover:bg-white/10 text-sm font-semibold">
                  🔥 Акции ({dealProducts.length})
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Trust Bar - prominent, clean */}
      <TrustBar />

      {/* 5. Category Pills - sticky navigation */}
      <div className="border-b bg-white sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex items-center gap-2 py-3">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`shrink-0 px-5 py-2 text-sm font-semibold rounded-full transition-all ${categoryFilter === 'all' ? 'text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                style={categoryFilter === 'all' ? { backgroundColor: color } : undefined}
              >
                Все товары
              </button>
              {data.categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`shrink-0 px-5 py-2 text-sm font-semibold rounded-full transition-all ${categoryFilter === cat ? 'text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                  style={categoryFilter === cat ? { backgroundColor: color } : undefined}
                >
                  {cat}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>

      {/* 6. Deals Carousel - if applicable */}
      {dealProducts.length > 0 && categoryFilter === 'all' && !searchQuery && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5">
                <span>🔥</span> Акции
              </div>
              <Badge className="bg-red-50 text-red-600 border-0 text-xs font-semibold px-2.5 py-0.5">
                {dealProducts.length} товаров
              </Badge>
            </div>
            <Button variant="ghost" size="sm" className="text-sm text-gray-500 hover:text-gray-900">
              Смотреть все <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-3">
              {dealProducts.slice(0, 8).map((p) => <DealCard key={p.id} product={p} primaryColor={color} />)}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>
      )}

      {/* 7. Section Header + Product Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {categoryFilter === 'all' ? (searchQuery ? `Результаты поиска: "${searchQuery}"` : 'Все товары') : categoryFilter}
          </h2>
          <span className="text-sm text-gray-500">{filteredProducts.length} товаров</span>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => <ProductCard key={product.id} product={product} primaryColor={color} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-lg border">
            <Package className="size-16 mb-4" />
            <p className="text-lg font-medium text-gray-500">Товары не найдены</p>
            <p className="text-sm mt-1 text-gray-400">Попробуйте изменить параметры поиска</p>
            {categoryFilter !== 'all' && (
              <button onClick={() => setCategoryFilter('all')} className="mt-4 text-sm font-medium hover:underline" style={{ color }}>
                Показать все товары
              </button>
            )}
          </div>
        )}
      </section>

      {/* 8. Features Banner - Yandex-style trust section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Truck className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Быстрая доставка</p>
              <p className="text-xs text-gray-500">1-3 рабочих дня</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
              <Shield className="size-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Гарантия качества</p>
              <p className="text-xs text-gray-500">Официальная гарантия</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
              <RefreshCw className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Возврат 30 дней</p>
              <p className="text-xs text-gray-500">Без вопросов</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
              <Headphones className="size-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Поддержка 24/7</p>
              <p className="text-xs text-gray-500">Всегда на связи</p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Newsletter */}
      <NewsletterSection slug={data.site.slug} />

      {/* 10. Footer - professional dark */}
      <footer className="text-white" style={{ backgroundColor: darkColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
            <div className="col-span-2 sm:col-span-3 lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <Store className="size-5" />
                <span className="font-bold text-lg">{data.site.name}</span>
              </div>
              {data.site.tagline && <p className="text-white/60 text-sm mb-4 max-w-sm">{data.site.tagline}</p>}
              <div className="flex items-center gap-3">
                <a href="/quote" className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-1">
                  ⚡ Калькулятор энергии
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3 text-white/90">Магазин</h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li><span className="hover:text-white transition-colors cursor-pointer">О нас</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Доставка и оплата</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Возврат</span></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3 text-white/90">Помощь</h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li><span className="hover:text-white transition-colors cursor-pointer">Контакты</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">FAQ</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Политика конфиденциальности</span></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3 text-white/90">Контакты</h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li className="flex items-center gap-1.5"><Mail className="size-3.5" />info@sunvolt.energy</li>
                <li className="flex items-center gap-1.5"><Truck className="size-3.5" />Доставка по России</li>
                <li className="flex items-center gap-1.5"><Shield className="size-3.5" />Безопасная оплата</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
            <p>© {new Date().getFullYear()} {data.site.name}. Все права защищены.</p>
            <p className="flex items-center gap-1">Работает на <span className="font-medium text-white/60">SunStore</span></p>
          </div>
        </div>
      </footer>

      {/* Cart: floating button + slide-out drawer with checkout */}
      <CartFab primaryColor={color} />
      <CartDrawer storeSlug={data.site.slug} primaryColor={color} />
    </div>
  )
}
