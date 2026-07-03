'use client'

import { useCallback, useEffect, useState } from 'react'
import { Search, Plus, Eye, ExternalLink } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface Site {
  id: string
  name: string
  slug: string
  template: string
  status: string
  productCount: number
  orderCount: number
  createdAt: string
}

const statusTabs = ['all', 'ready', 'suspended', 'provisioning'] as const

export function SitesList() {
  const navigate = useAppStore((s) => s.navigate)
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const fetchSites = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/sites?${params}`)
      if (res.ok) {
        const data = await res.json()
        setSites(data.sites || data || [])
      }
    } catch {
      // empty
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    fetchSites()
  }, [fetchSites])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stores</h1>
          <p className="text-muted-foreground text-sm">
            Manage your storefronts
          </p>
        </div>
        <Button onClick={() => navigate('site-create')}>
          <Plus className="size-4" />
          Create New Store
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search stores..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        {statusTabs.map((tab) => (
          <Button
            key={tab}
            variant={statusFilter === tab ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(tab)}
            className="capitalize"
          >
            {tab}
          </Button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : sites.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BuildingIcon className="size-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-sm">
              {search || statusFilter !== 'all'
                ? 'No stores match your filters'
                : 'No stores yet. Create your first store to get started.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sites.map((site) => (
            <Card
              key={site.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => navigate('site-detail', site.id, site.slug)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base truncate">
                    {site.name}
                  </CardTitle>
                  <StatusPill status={site.status} />
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  /{site.slug}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-xs">
                    {site.template}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{site.productCount} products</span>
                  <span>{site.orderCount} orders</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate('site-detail', site.id, site.slug)
                    }}
                  >
                    <Eye className="size-3.5" />
                    Manage
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate('storefront-preview', site.id, site.slug)
                    }}
                  >
                    <ExternalLink className="size-3.5" />
                    Storefront
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    ready: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    suspended: 'bg-red-100 text-red-700 border-red-200',
    provisioning: 'bg-amber-100 text-amber-700 border-amber-200',
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
        colorMap[status] || 'bg-muted text-muted-foreground border-border'
      }`}
    >
      {status}
    </span>
  )
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
      />
    </svg>
  )
}