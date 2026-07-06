'use client'

import { useEffect, useState, useMemo } from 'react'
import { Search, ChevronRight, Mail, Store, Shield, Truck, Package, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { ProductCard } from './product-card'
import { DealCard } from './deal-card'
import { TrustBar } from './trust-bar'
import { LoadingSkeleton } from './loading-skeleton'
import { StorefrontData } from './types'

interface Props {
  slug: string
  initialData: StorefrontData | null
  error: string | null
}

function darkenColor(hex: string, amount: number): string {
  const c = hex.replace('#', '')
  if (c.length !== 6) return '#111827'
  const r = Math.max(0, parseInt(c.slice(0, 2), 16) - amount)
  const g = Math.max(0, parseInt(c.slice(2, 4), 16) - amount)
  const b = Math.max(0, parseInt(c.slice(4, 6), 16) - amount)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
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
      if (res.ok) {
        setMsg('You have subscribed successfully!')
        setEmail('')
      } else {
        setMsg('Subscription error. Please try again.')
      }
    } catch {
      setMsg('Subscription error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="bg-gray-100 border-t border-b">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 text-center">
        <Mail className="size-8 mx-auto text-gray-400 mb-3" />
        <h2 className="text-lg font-bold text-gray-900">Subscribe to newsletter</h2>
        <p className="text-sm text-gray-500 mt-1 mb-5">
          Get notified about new products and special offers
        </p>
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <Input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white h-10"
            onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
          />
          <Button
            onClick={handleSubscribe}
            disabled={sending || !email.trim()}
            className="h-10 px-5 text-white border-0 whitespace-nowrap"
            style={{ backgroundColor: '#0f172a' }}
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <Mail className="size-4 mr-1.5" />
                Subscribe
              </>
            )}
          </Button>
        </div>
        {msg && <p className="text-sm mt-3 text-green-600 font-medium">{msg}</p>}
      </div>
    </section>
  )
}

export function StorefrontPreviewClient({ slug, initialData, error }: Props) {
  const [data, setData] = useState<StorefrontData | null>(initialData)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(error)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // If we have initial data from server, use it
    if (initialData) {
      setData(initialData)
      setLoading(false)
      return
    }

    // Otherwise fetch on client
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/storefront/${slug}`, { cache: 'no-store' })
        if (!res.ok) {
          setFetchError(`Store "${slug}" not found. Make sure the store exists and has status READY.`)
        } else {
          const json = await res.json()
          setData(json)
        }
      } catch {
        setFetchError('Failed to load store data. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [slug, initialData])

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

  const dealProducts = useMemo(
    () => (data?.products || []).filter((p) => p.oldPrice > 0 && p.oldPrice > p.price),
    [data?.products]
  )

  const color = data?.site?.primaryColor || '#0f172a'
  const darkColor = darkenColor(color, 50)

  const hasError = error || fetchError

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-20 bg-gray-50">
        <Package className="size-16 text-gray-300 mb-4" />
        <h1 className="text-xl font-bold text-gray-600 mb-2">Store Not Found</h1>
        <p className="text-gray-400 text-sm mb-4">{hasError}</p>
        <p className="text-xs text-gray-400">URL: /preview/store/{slug}</p>
      </div>
    )
  }

  if (loading || !data) {
    return <LoadingSkeleton />
  }

  return (
    <div className="bg-white text-gray-900 font-sans">
      {/* ─── 1. Top Bar ───────────────────────────────────────── */}
      <div className="bg-gray-900 text-gray-300 text-xs px-4 sm:px-6 py-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-medium">🏪 SunStore Marketplace</span>
        <div className="flex items-center gap-4">
          <span className="hover:text-white transition-colors cursor-default">Help</span>
          <span className="hover:text-white transition-colors cursor-default">Sell on SunStore</span>
        </div>
      </div>

      {/* ─── 2. Store Header ──────────────────────────────────── */}
      <div style={{ backgroundColor: color }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-5">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center">{data.site.name}</h2>
          {data.site.tagline && (
            <p className="mt-1 text-white/70 text-sm text-center">{data.site.tagline}</p>
          )}
          {/* Search bar */}
          <div className="mt-5 max-w-xl mx-auto flex">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 h-10 rounded-r-none border-0 shadow-sm text-sm"
              />
            </div>
            <Button
              className="h-10 rounded-l-none px-5 text-white border-0 font-medium"
              style={{ backgroundColor: color }}
            >
              Search
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

      {/* ─── 3. Hero Banner ───────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${color}, ${darkColor})` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold text-white leading-tight">
            Best products at great prices
          </h2>
          <p className="mt-3 text-white/80 text-sm sm:text-base max-w-lg mx-auto">
            Discover a wide range of quality products with fast delivery and guarantee
          </p>
          <Button
            className="mt-6 px-8 h-11 text-white border-0 text-sm font-semibold shadow-md hover:opacity-90 transition-opacity"
            style={{ backgroundColor: color }}
          >
            Start Shopping <ChevronRight className="size-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* ─── 4. Trust Bar ─────────────────────────────────────── */}
      <TrustBar />

      {/* ─── 5. Category Navigation Tabs ──────────────────────── */}
      <div className="border-b bg-white z-10 sticky top-0 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex items-center gap-1 py-2">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`shrink-0 px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  categoryFilter === 'all' ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={categoryFilter === 'all' ? { backgroundColor: color } : undefined}
              >
                All
              </button>
              {data.categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`shrink-0 px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                    categoryFilter === cat ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
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

      {/* ─── 6. Deals Section ─────────────────────────────────── */}
      {dealProducts.length > 0 && categoryFilter === 'all' && !searchQuery && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-2">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🔥</span>
            <h2 className="text-lg font-bold text-gray-900">Hot Deals</h2>
            <Badge className="bg-red-100 text-red-600 border-0 text-xs font-semibold">
              {dealProducts.length} items
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

      {/* ─── 7. Product Grid ──────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} primaryColor={color} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Package className="size-12 mb-3" />
            <p className="text-sm">No products found</p>
            {categoryFilter !== 'all' && (
              <button
                onClick={() => setCategoryFilter('all')}
                className="mt-2 text-sm font-medium hover:underline"
                style={{ color }}
              >
                Show all products
              </button>
            )}
          </div>
        )}
      </section>

      {/* ─── 8. Newsletter ────────────────────────────────────── */}
      <NewsletterSection slug={data.site.slug} />

      {/* ─── 9. Footer ────────────────────────────────────────── */}
      <footer className="text-white" style={{ backgroundColor: darkColor }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <Store className="size-5" />
                <span className="font-bold text-lg">{data.site.name}</span>
              </div>
              {data.site.tagline && (
                <p className="text-white/60 text-sm">{data.site.tagline}</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3 text-white/90">Store</h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li><span className="hover:text-white transition-colors cursor-default">About</span></li>
                <li><span className="hover:text-white transition-colors cursor-default">Delivery &amp; Payment</span></li>
                <li><span className="hover:text-white transition-colors cursor-default">Returns</span></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3 text-white/90">Help</h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li><span className="hover:text-white transition-colors cursor-default">Contact Us</span></li>
                <li><span className="hover:text-white transition-colors cursor-default">FAQ</span></li>
                <li><span className="hover:text-white transition-colors cursor-default">Terms of Use</span></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3 text-white/90">Contact</h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li className="flex items-center gap-1.5"><Mail className="size-3.5" />info@example.com</li>
                <li className="flex items-center gap-1.5"><Truck className="size-3.5" />Worldwide Shipping</li>
                <li className="flex items-center gap-1.5"><Shield className="size-3.5" />Secure Payments</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40">
            <p>© {new Date().getFullYear()} {data.site.name}. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Powered by <span className="font-medium text-white/60">SunStore</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}