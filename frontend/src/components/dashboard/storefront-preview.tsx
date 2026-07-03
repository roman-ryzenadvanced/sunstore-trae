'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Search,
  ShoppingCart,
  Star,
  Truck,
  Shield,
  RotateCcw,
  Heart,
  ChevronRight,
  Mail,
  Package,
  Store,
  Loader2,
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

// ─── Types ───────────────────────────────────────────────────────────────────

interface StorefrontSite {
  id: string
  name: string
  slug: string
}

interface StorefrontProduct {
  id: string
  title: string
  price: number
  oldPrice: number
  category: string
  images: string
  stock: number
  featured: boolean
  createdAt: string
}

interface StorefrontData {
  site: {
    name: string
    tagline: string
    primaryColor: string
    slug: string
  }
  categories: string[]
  products: StorefrontProduct[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  return '₽' + Math.round(price).toLocaleString('ru-RU', { useGrouping: true })
}

function getDiscount(price: number, oldPrice: number): number {
  if (!oldPrice || oldPrice <= price) return 0
  return Math.round((1 - price / oldPrice) * 100)
}

function getStockInfo(stock: number) {
  if (stock <= 0) return { label: 'Нет в наличии', color: 'text-red-600' }
  if (stock <= 5) return { label: `Мало: ${stock} шт.`, color: 'text-amber-600' }
  return { label: `В наличии: ${stock} шт.`, color: 'text-green-600' }
}

function getFirstImage(imagesStr: string): string | null {
  try {
    const arr = JSON.parse(imagesStr)
    if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === 'string') return arr[0]
  } catch {
    // empty
  }
  return null
}

function getFeaturedBadge(product: StorefrontProduct): string | null {
  if (product.featured) {
    const age = Date.now() - new Date(product.createdAt).getTime()
    const daysOld = age / (1000 * 60 * 60 * 24)
    if (daysOld < 14) return 'Новинка'
    return 'Хит'
  }
  return null
}

function darkenColor(hex: string, amount: number): string {
  const c = hex.replace('#', '')
  if (c.length !== 6) return '#111827'
  const r = Math.max(0, parseInt(c.slice(0, 2), 16) - amount)
  const g = Math.max(0, parseInt(c.slice(2, 4), 16) - amount)
  const b = Math.max(0, parseInt(c.slice(4, 6), 16) - amount)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// ─── Star Rating ─────────────────────────────────────────────────────────────

function StarRating() {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className="size-3.5 fill-amber-400 text-amber-400"
        />
      ))}
      <span className="text-xs text-gray-500 ml-1">(12)</span>
    </div>
  )
}

// ─── Trust Badges ────────────────────────────────────────────────────────────

const TRUST_ITEMS = [
  { icon: '✓', label: 'Гарантия качества' },
  { icon: '🚚', label: 'Быстрая доставка' },
  { icon: '↩️', label: 'Возврат 14 дней' },
  { icon: '🔒', label: 'Безопасная оплата' },
]

function TrustBar() {
  return (
    <div className="bg-gray-50 border-b">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 px-4 py-4">
        {TRUST_ITEMS.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2.5 justify-center"
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="text-sm text-gray-700 font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Product Card ────────────────────────────────────────────────────────────

function ProductCard({
  product,
  primaryColor,
}: {
  product: StorefrontProduct
  primaryColor: string
}) {
  const [liked, setLiked] = useState(false)
  const imgUrl = getFirstImage(product.images)
  const discount = getDiscount(product.price, product.oldPrice)
  const featuredBadge = getFeaturedBadge(product)
  const stockInfo = getStockInfo(product.stock)

  return (
    <div className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col">
      {/* Image area */}
      <div className="relative h-44 bg-gray-100 flex items-center justify-center shrink-0">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={product.title}
            className="size-full object-cover"
          />
        ) : (
          <Package className="size-12 text-gray-300" />
        )}

        {/* Featured badge - top left */}
        {featuredBadge && (
          <Badge
            className="absolute top-2 left-2 z-10 text-[11px] px-1.5 py-0.5 border-0 font-semibold"
            style={{ backgroundColor: primaryColor, color: '#fff' }}
          >
            {featuredBadge}
          </Badge>
        )}

        {/* Discount badge - top right */}
        {discount > 0 && (
          <Badge className="absolute top-2 right-2 z-10 bg-red-500 text-white border-0 text-[11px] px-1.5 py-0.5 font-bold">
            -{discount}%
          </Badge>
        )}

        {/* Like button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setLiked(!liked)
          }}
          className="absolute bottom-2 right-2 z-10 size-8 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white"
        >
          <Heart
            className={`size-4 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        {/* Title */}
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[2.5rem] leading-snug">
          {product.title}
        </h3>

        {/* Rating */}
        <div className="mt-1.5">
          <StarRating />
        </div>

        {/* Price */}
        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          <span className="text-lg font-bold text-orange-600">
            {formatPrice(product.price)}
          </span>
          {discount > 0 && (
            <>
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(product.oldPrice)}
              </span>
              <Badge className="bg-red-50 text-red-600 border-0 text-[10px] px-1.5 py-0">
                -{discount}%
              </Badge>
            </>
          )}
        </div>

        {/* Stock */}
        <p className={`text-xs mt-1.5 font-medium ${stockInfo.color}`}>
          {stockInfo.label}
        </p>

        {/* Add to cart */}
        <Button
          className="mt-3 w-full text-sm font-medium border-0 text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: primaryColor }}
          disabled={product.stock <= 0}
        >
          <ShoppingCart className="size-4 mr-1.5" />
          В корзину
        </Button>
      </div>
    </div>
  )
}

// ─── Deal Card (compact) ────────────────────────────────────────────────────

function DealCard({
  product,
  primaryColor,
}: {
  product: StorefrontProduct
  primaryColor: string
}) {
  const discount = getDiscount(product.price, product.oldPrice)
  const imgUrl = getFirstImage(product.images)

  return (
    <div className="shrink-0 w-52 bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="relative h-32 bg-gray-100 flex items-center justify-center">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={product.title}
            className="size-full object-cover"
          />
        ) : (
          <Package className="size-10 text-gray-300" />
        )}
        <Badge className="absolute top-2 left-2 bg-red-500 text-white border-0 text-[11px] px-1.5 py-0.5 font-bold">
          Скидка {discount}%
        </Badge>
      </div>
      <div className="p-2.5">
        <p className="text-xs text-gray-900 font-medium line-clamp-2 leading-snug min-h-[2rem]">
          {product.title}
        </p>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-sm font-bold text-orange-600">
            {formatPrice(product.price)}
          </span>
          <span className="text-xs text-gray-400 line-through">
            {formatPrice(product.oldPrice)}
          </span>
        </div>
        <Button
          size="sm"
          className="mt-2 w-full text-xs border-0 text-white h-8"
          style={{ backgroundColor: primaryColor }}
        >
          <ShoppingCart className="size-3.5 mr-1" />
          В корзину
        </Button>
      </div>
    </div>
  )
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="bg-white text-gray-900">
      {/* Top bar */}
      <Skeleton className="h-8 w-full" />
      {/* Header */}
      <Skeleton className="h-44 w-full" />
      {/* Hero */}
      <Skeleton className="h-48 w-full" />
      {/* Trust bar */}
      <Skeleton className="h-20 w-full" />
      {/* Category tabs */}
      <div className="flex gap-2 px-6 py-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-44 w-full rounded-t-lg" />
            <Skeleton className="h-4 w-3/4 mx-2" />
            <Skeleton className="h-4 w-1/3 mx-2" />
            <Skeleton className="h-5 w-1/2 mx-2 mt-1" />
            <Skeleton className="h-9 w-full mx-2 mt-2 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function StorefrontPreview() {
  const { selectedSiteSlug } = useAppStore()
  const [sites, setSites] = useState<StorefrontSite[]>([])
  const [currentSlug, setCurrentSlug] = useState(selectedSiteSlug || '')
  const [data, setData] = useState<StorefrontData | null>(null)
  const [loading, setLoading] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Newsletter
  const [nlEmail, setNlEmail] = useState('')
  const [nlSending, setNlSending] = useState(false)
  const [nlMsg, setNlMsg] = useState('')

  // Sticky category tabs
  const categoryTabsRef = useRef<HTMLDivElement>(null)
  const [tabsSticky, setTabsSticky] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // ── Data fetching ───────────────────────────────────────────────────────

  const fetchSites = useCallback(async () => {
    try {
      const res = await fetch('/api/sites')
      if (res.ok) {
        const d = await res.json()
        const list = d.sites || d || []
        setSites(list)
        if (!currentSlug && list.length > 0) {
          setCurrentSlug(list[0].slug)
        }
      }
    } catch {
      // empty
    }
  }, [currentSlug])

  const fetchStorefront = useCallback(async () => {
    if (!currentSlug) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      const qs = params.toString() ? `?${params.toString()}` : ''
      const res = await fetch(`/api/storefront/${currentSlug}${qs}`)
      if (res.ok) {
        const d = await res.json()
        setData(d)
      }
    } catch {
      // empty
    } finally {
      setLoading(false)
    }
  }, [currentSlug, categoryFilter, searchQuery])

  useEffect(() => {
    fetchSites()
  }, [fetchSites])

  useEffect(() => {
    fetchStorefront()
  }, [fetchStorefront])

  // ── Intersection observer for sticky tabs ───────────────────────────────

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setTabsSticky(!entry.isIntersecting)
      },
      { threshold: 0, rootMargin: '-1px 0px 0px 0px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loading, data])

  // ── Derived data ────────────────────────────────────────────────────────

  const color = data?.site?.primaryColor || '#0f172a'
  const darkColor = darkenColor(color, 50)

  // Filter products client-side (server also filters, but this ensures consistency)
  const filteredProducts = useMemo(() => {
    if (!data?.products) return []
    return data.products.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return p.title.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      }
      return true
    })
  }, [data?.products, categoryFilter, searchQuery])

  // Products on sale for the deals section
  const dealProducts = useMemo(
    () =>
      (data?.products || []).filter(
        (p) => p.oldPrice > 0 && p.oldPrice > p.price
      ),
    [data?.products]
  )

  // ── Newsletter handler ─────────────────────────────────────────────────

  const handleSubscribe = async () => {
    if (!nlEmail.trim()) return
    setNlSending(true)
    setNlMsg('')
    try {
      const res = await fetch(`/api/storefront/${currentSlug}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: nlEmail }),
      })
      if (res.ok) {
        setNlMsg('Вы успешно подписались!')
        setNlEmail('')
      } else {
        setNlMsg('Ошибка подписки. Попробуйте снова.')
      }
    } catch {
      setNlMsg('Ошибка подписки. Попробуйте снова.')
    } finally {
      setNlSending(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Dashboard heading + site selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Предпросмотр витрины</h1>
          <p className="text-muted-foreground text-sm">
            Так ваш магазин будет выглядеть для покупателей
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Магазин:</span>
          <select
            value={currentSlug}
            onChange={(e) => {
              setCurrentSlug(e.target.value)
              setCategoryFilter('all')
              setSearchQuery('')
            }}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {sites.map((s) => (
              <option key={s.id} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Preview Frame ───────────────────────────────────────────────── */}
      <div className="rounded-xl border overflow-hidden shadow-sm">
        {loading ? (
          <LoadingSkeleton />
        ) : !data ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white">
            <Store className="size-14 text-gray-300 mb-4" />
            <p className="text-gray-400 text-sm">
              Выберите магазин для предпросмотра
            </p>
          </div>
        ) : (
          <div className="bg-white text-gray-900 font-sans">
            {/* ─── 1. Top Bar ─────────────────────────────────────────── */}
            <div className="bg-gray-900 text-gray-300 text-xs px-4 sm:px-6 py-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                🏪 SunStore Marketplace
              </span>
              <div className="flex items-center gap-4">
                <button className="hover:text-white transition-colors">Помощь</button>
                <button className="hover:text-white transition-colors">
                  Продавайте на SunStore
                </button>
              </div>
            </div>

            {/* ─── 2. Store Header ────────────────────────────────────── */}
            <div style={{ backgroundColor: color }}>
              <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-5">
                <h2 className="text-2xl sm:text-3xl font-bold text-white text-center">
                  {data.site.name}
                </h2>
                {data.site.tagline && (
                  <p className="mt-1 text-white/70 text-sm text-center">
                    {data.site.tagline}
                  </p>
                )}

                {/* Search bar */}
                <div className="mt-5 max-w-xl mx-auto flex">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      placeholder="Поиск товаров..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-3 h-10 rounded-r-none border-0 shadow-sm text-sm"
                    />
                  </div>
                  <Button
                    className="h-10 rounded-l-none px-5 text-white border-0 font-medium"
                    style={{ backgroundColor: color }}
                  >
                    Найти
                  </Button>
                </div>

                {/* Category links */}
                {data.categories.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-white/80 text-xs">
                    {data.categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className="hover:text-white transition-colors"
                      >
                        {cat}
                        <ChevronRight className="inline size-3 ml-0.5 opacity-60" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ─── 3. Hero Banner ─────────────────────────────────────── */}
            <div
              className="relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${color}, ${darkColor})`,
              }}
            >
              <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
                <h2 className="text-2xl sm:text-4xl font-bold text-white leading-tight">
                  Лучшие товары по выгодным ценам
                </h2>
                <p className="mt-3 text-white/80 text-sm sm:text-base max-w-lg mx-auto">
                  Откройте для себя широкий ассортимент качественных товаров с
                  быстрой доставкой и гарантией возврата
                </p>
                <Button
                  className="mt-6 px-8 h-11 text-white border-0 text-sm font-semibold shadow-md hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: color }}
                >
                  Перейти к покупкам
                  <ChevronRight className="size-4 ml-1" />
                </Button>
              </div>
            </div>

            {/* ─── 4. Trust Bar ───────────────────────────────────────── */}
            <TrustBar />

            {/* ─── 5. Category Navigation Tabs ────────────────────────── */}
            {/* Sentinel for sticky detection */}
            <div ref={sentinelRef} className="h-0" />

            <div
              ref={categoryTabsRef}
              className={`border-b bg-white z-10 ${
                tabsSticky
                  ? 'sticky top-0 shadow-sm'
                  : ''
              } transition-shadow duration-200`}
            >
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex items-center gap-1 py-2">
                    <button
                      onClick={() => setCategoryFilter('all')}
                      className={`shrink-0 px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                        categoryFilter === 'all'
                          ? 'text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      style={
                        categoryFilter === 'all'
                          ? { backgroundColor: color }
                          : undefined
                      }
                    >
                      Все
                    </button>
                    {data.categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`shrink-0 px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                          categoryFilter === cat
                            ? 'text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        style={
                          categoryFilter === cat
                            ? { backgroundColor: color }
                            : undefined
                        }
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            </div>

            {/* ─── 7. Deals Section (before product grid) ─────────────── */}
            {dealProducts.length > 0 && categoryFilter === 'all' && !searchQuery && (
              <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-2">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🔥</span>
                  <h2 className="text-lg font-bold text-gray-900">
                    Горячие предложения
                  </h2>
                  <Badge className="bg-red-100 text-red-600 border-0 text-xs font-semibold">
                    {dealProducts.length} товаров
                  </Badge>
                </div>
                <ScrollArea className="w-full">
                  <div className="flex gap-4 pb-3">
                    {dealProducts.map((p) => (
                      <DealCard key={p.id} product={p} primaryColor={color} />
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </section>
            )}

            {/* ─── 6. Product Grid ────────────────────────────────────── */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      primaryColor={color}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Package className="size-12 mb-3" />
                  <p className="text-sm">Товары не найдены</p>
                  {categoryFilter !== 'all' && (
                    <button
                      onClick={() => setCategoryFilter('all')}
                      className="mt-2 text-sm font-medium hover:underline"
                      style={{ color }}
                    >
                      Показать все товары
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* ─── 8. Newsletter Section ──────────────────────────────── */}
            <section className="bg-gray-100 border-t border-b">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 text-center">
                <Mail className="size-8 mx-auto text-gray-400 mb-3" />
                <h2 className="text-lg font-bold text-gray-900">
                  Подпишитесь на рассылку
                </h2>
                <p className="text-sm text-gray-500 mt-1 mb-5">
                  Получайте уведомления о новых товарах и специальных предложениях
                </p>
                <div className="flex items-center gap-2 max-w-md mx-auto">
                  <Input
                    type="email"
                    placeholder="Ваш email"
                    value={nlEmail}
                    onChange={(e) => setNlEmail(e.target.value)}
                    className="bg-white h-10"
                    onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                  />
                  <Button
                    onClick={handleSubscribe}
                    disabled={nlSending || !nlEmail.trim()}
                    className="h-10 px-5 text-white border-0 whitespace-nowrap"
                    style={{ backgroundColor: color }}
                  >
                    {nlSending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        <Mail className="size-4 mr-1.5" />
                        Подписаться
                      </>
                    )}
                  </Button>
                </div>
                {nlMsg && (
                  <p className="text-sm mt-3 text-green-600 font-medium">{nlMsg}</p>
                )}
              </div>
            </section>

            {/* ─── 9. Footer ─────────────────────────────────────────── */}
            <footer
              className="text-white"
              style={{ backgroundColor: darkColor }}
            >
              <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {/* Brand */}
                  <div className="sm:col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Store className="size-5" />
                      <span className="font-bold text-lg">{data.site.name}</span>
                    </div>
                    {data.site.tagline && (
                      <p className="text-white/60 text-sm">{data.site.tagline}</p>
                    )}
                  </div>

                  {/* Links columns */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-white/90">Магазин</h3>
                    <ul className="space-y-2 text-sm text-white/60">
                      <li>
                        <button className="hover:text-white transition-colors">
                          О магазине
                        </button>
                      </li>
                      <li>
                        <button className="hover:text-white transition-colors">
                          Доставка и оплата
                        </button>
                      </li>
                      <li>
                        <button className="hover:text-white transition-colors">
                          Возврат
                        </button>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-white/90">Помощь</h3>
                    <ul className="space-y-2 text-sm text-white/60">
                      <li>
                        <button className="hover:text-white transition-colors">
                          Связаться с нами
                        </button>
                      </li>
                      <li>
                        <button className="hover:text-white transition-colors">
                          Часто задаваемые вопросы
                        </button>
                      </li>
                      <li>
                        <button className="hover:text-white transition-colors">
                          Условия использования
                        </button>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-white/90">Контакты</h3>
                    <ul className="space-y-2 text-sm text-white/60">
                      <li className="flex items-center gap-1.5">
                        <Mail className="size-3.5" />
                        info@example.com
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Truck className="size-3.5" />
                        Доставка по всей России
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Shield className="size-3.5" />
                        Безопасные платежи
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="border-t border-white/10 mt-8 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40">
                  <p>© {new Date().getFullYear()} {data.site.name}. Все права защищены.</p>
                  <p className="flex items-center gap-1">
                    Работает на
                    <span className="font-medium text-white/60">SunStore</span>
                  </p>
                </div>
              </div>
            </footer>
          </div>
        )}
      </div>
    </div>
  )
}