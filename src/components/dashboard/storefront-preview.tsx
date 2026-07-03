'use client'

import { useCallback, useEffect, useState } from 'react'
import { ShoppingCart, Send, Mail, Package, Loader2 } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface StorefrontSite {
  id: string
  name: string
  slug: string
}

interface StorefrontProduct {
  id: string
  title: string
  price: number
  category: string
  imageUrl?: string
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

export function StorefrontPreview() {
  const { selectedSiteSlug, selectedSiteId, navigate } = useAppStore()
  const [sites, setSites] = useState<StorefrontSite[]>([])
  const [currentSlug, setCurrentSlug] = useState(selectedSiteSlug || '')
  const [data, setData] = useState<StorefrontData | null>(null)
  const [loading, setLoading] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Newsletter
  const [nlEmail, setNlEmail] = useState('')
  const [nlSending, setNlSending] = useState(false)
  const [nlMsg, setNlMsg] = useState('')

  // Contact form
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [contactSending, setContactSending] = useState(false)
  const [contactMsg, setContactMsg] = useState('')

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
      const res = await fetch(`/api/storefront/${currentSlug}`)
      if (res.ok) {
        const d = await res.json()
        setData(d)
      }
    } catch {
      // empty
    } finally {
      setLoading(false)
    }
  }, [currentSlug])

  useEffect(() => {
    fetchSites()
  }, [fetchSites])

  useEffect(() => {
    fetchStorefront()
  }, [fetchStorefront])

  const filteredProducts = data?.products.filter(
    (p) => categoryFilter === 'all' || p.category === categoryFilter
  )

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
        setNlMsg('Subscribed successfully!')
        setNlEmail('')
      } else {
        setNlMsg('Failed to subscribe')
      }
    } catch {
      setNlMsg('Failed to subscribe')
    } finally {
      setNlSending(false)
    }
  }

  const handleContact = async () => {
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim())
      return
    setContactSending(true)
    setContactMsg('')
    try {
      const res = await fetch(`/api/storefront/${currentSlug}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          message: contactMessage,
        }),
      })
      if (res.ok) {
        setContactMsg('Message sent successfully!')
        setContactName('')
        setContactEmail('')
        setContactMessage('')
      } else {
        setContactMsg('Failed to send message')
      }
    } catch {
      setContactMsg('Failed to send message')
    } finally {
      setContactSending(false)
    }
  }

  const color = data?.site?.primaryColor || '#000000'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Storefront Preview</h1>
        <p className="text-muted-foreground text-sm">
          Preview how your store looks to customers
        </p>
      </div>

      {/* Site Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Store:</span>
        <select
          value={currentSlug}
          onChange={(e) => {
            setCurrentSlug(e.target.value)
            setCategoryFilter('all')
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

      {/* Preview Area */}
      <div className="rounded-xl border overflow-hidden">
        {loading ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-4 w-96" />
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-20" />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          </div>
        ) : !data ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Package className="size-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-sm">
              Select a store to preview
            </p>
          </div>
        ) : (
          <div className="bg-white text-gray-900">
            {/* Header */}
            <header
              className="px-6 py-8 text-center"
              style={{ backgroundColor: color }}
            >
              <h2 className="text-2xl font-bold text-white">
                {data.site.name}
              </h2>
              {data.site.tagline && (
                <p className="mt-1 text-white/80 text-sm">
                  {data.site.tagline}
                </p>
              )}
            </header>

            {/* Category Chips */}
            <div className="flex gap-2 flex-wrap px-6 py-4 border-b">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  categoryFilter === 'all'
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={
                  categoryFilter === 'all'
                    ? { backgroundColor: color }
                    : undefined
                }
              >
                All
              </button>
              {data.categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    categoryFilter === cat
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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

            {/* Product Grid */}
            <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {(filteredProducts || []).map((product) => (
                <div
                  key={product.id}
                  className="rounded-xl border bg-gray-50 overflow-hidden"
                >
                  <div
                    className="h-36 flex items-center justify-center"
                    style={{ backgroundColor: `${color}10` }}
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="size-full object-cover"
                      />
                    ) : (
                      <Package
                        className="size-10"
                        style={{ color: `${color}40` }}
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium truncate">
                      {product.title}
                    </h3>
                    <p className="text-sm font-bold mt-1">
                      ₽{product.price.toLocaleString()}
                    </p>
                    <button
                      className="mt-2 w-full rounded-md py-1.5 text-sm text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: color }}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {(filteredProducts || []).length === 0 && (
              <p className="text-center py-8 text-sm text-gray-500">
                No products in this category
              </p>
            )}

            {/* Contact Section */}
            <div className="border-t px-6 py-8">
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <div className="grid gap-3 max-w-md">
                <Input
                  placeholder="Your name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
                <Input
                  type="email"
                  placeholder="Your email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
                <Textarea
                  placeholder="Your message"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <Button onClick={handleContact} disabled={contactSending}>
                    {contactSending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    Send
                  </Button>
                  {contactMsg && (
                    <span className="text-sm text-muted-foreground">
                      {contactMsg}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Newsletter Section */}
            <div className="border-t px-6 py-8 bg-gray-50">
              <h3 className="text-lg font-semibold mb-1">Newsletter</h3>
              <p className="text-sm text-gray-500 mb-3">
                Subscribe to get updates on new products and offers
              </p>
              <div className="flex items-center gap-2 max-w-md">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={nlEmail}
                  onChange={(e) => setNlEmail(e.target.value)}
                  className="bg-white"
                />
                <Button onClick={handleSubscribe} disabled={nlSending}>
                  {nlSending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Mail className="size-4" />
                  )}
                  Subscribe
                </Button>
              </div>
              {nlMsg && (
                <p className="text-sm text-gray-500 mt-2">{nlMsg}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}