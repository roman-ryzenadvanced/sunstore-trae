'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  Plus,
  Search,
  Pencil,
  Trash2,
  Send,
  Download,
  Loader2,
  Globe,
  Mail,
  Palette,
  Shield,
  Users,
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

// ---- Types ----
interface SiteInfo {
  id: string
  name: string
  slug: string
  status: string
  template: string
  tagline: string
  primaryColor: string
  categories: string[]
  domain: string
  createdAt: string
  productCount: number
  orderCount: number
  revenue: number
}

interface Product {
  id: string
  title: string
  price: number
  stock: number
  category: string
  status: string
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  total: number
  status: string
  createdAt: string
  items: OrderItem[]
}

interface OrderItem {
  id: string
  productTitle: string
  quantity: number
  price: number
}

interface Ticket {
  id: string
  subject: string
  fromEmail: string
  status: string
  createdAt: string
  replies: { id: string; body: string; createdAt: string }[]
}

interface Subscriber {
  id: string
  email: string
  status: string
  createdAt: string
}

export function SiteDetail() {
  const { selectedSiteId, selectedSiteSlug, navigate } = useAppStore()
  const [site, setSite] = useState<SiteInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSite = useCallback(async () => {
    if (!selectedSiteId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/sites/${selectedSiteId}`)
      if (res.ok) {
        const data = await res.json()
        setSite(data)
      }
    } catch {
      // empty
    } finally {
      setLoading(false)
    }
  }, [selectedSiteId])

  useEffect(() => {
    fetchSite()
  }, [fetchSite])

  if (!selectedSiteId) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">No store selected</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('sites')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{site?.name || 'Store'}</h1>
          <p className="text-sm text-muted-foreground">
            /{selectedSiteSlug}
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="w-full flex-wrap h-auto gap-1 bg-transparent p-0 border-b rounded-none">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            Overview
          </TabsTrigger>
          <TabsTrigger value="products" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            Products
          </TabsTrigger>
          <TabsTrigger value="orders" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            Orders
          </TabsTrigger>
          <TabsTrigger value="email" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            Email
          </TabsTrigger>
          <TabsTrigger value="domain" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            Domain
          </TabsTrigger>
          <TabsTrigger value="support" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            Support
          </TabsTrigger>
          <TabsTrigger value="subscribers" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            Subscribers
          </TabsTrigger>
          <TabsTrigger value="theme" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            Theme
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab site={site} onRefresh={fetchSite} />
        </TabsContent>
        <TabsContent value="products" className="mt-6">
          <ProductsTab siteId={selectedSiteId} />
        </TabsContent>
        <TabsContent value="orders" className="mt-6">
          <OrdersTab siteId={selectedSiteId} />
        </TabsContent>
        <TabsContent value="email" className="mt-6">
          <EmailTab siteId={selectedSiteId} />
        </TabsContent>
        <TabsContent value="domain" className="mt-6">
          <DomainTab siteId={selectedSiteId} site={site} onRefresh={fetchSite} />
        </TabsContent>
        <TabsContent value="support" className="mt-6">
          <SupportTab siteId={selectedSiteId} />
        </TabsContent>
        <TabsContent value="subscribers" className="mt-6">
          <SubscribersTab siteId={selectedSiteId} />
        </TabsContent>
        <TabsContent value="theme" className="mt-6">
          <ThemeTab siteId={selectedSiteId} site={site} onRefresh={fetchSite} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ===================== OVERVIEW TAB =====================
function OverviewTab({
  site,
  onRefresh,
}: {
  site: SiteInfo
  onRefresh: () => void
}) {
  const [toggling, setToggling] = useState(false)

  const handleToggle = async () => {
    setToggling(true)
    try {
      const newStatus = site.status === 'active' || site.status === 'ready' ? 'suspended' : 'ready'
      await fetch(`/api/sites/${site.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      onRefresh()
    } catch {
      // empty
    } finally {
      setToggling(false)
    }
  }

  const isActive = site.status === 'active' || site.status === 'ready'

  return (
    <div className="flex flex-col gap-6">
      {/* Info Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InfoCard label="Store Name" value={site.name} />
        <InfoCard label="Slug" value={`/${site.slug}`} />
        <InfoCard
          label="Status"
          value={
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                isActive
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  : 'bg-red-100 text-red-700 border-red-200'
              }`}
            >
              {site.status}
            </span>
          }
        />
        <InfoCard label="Template" value={site.template} />
        <InfoCard label="Domain" value={site.domain || '—'} />
        <InfoCard
          label="Created"
          value={new Date(site.createdAt).toLocaleDateString()}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{site.productCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{site.orderCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₽{site.revenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toggle */}
      <Card>
        <CardContent className="flex items-center justify-between pt-6">
          <div>
            <p className="font-medium">Store Status</p>
            <p className="text-sm text-muted-foreground">
              {isActive
                ? 'This store is active and accepting orders'
                : 'This store is suspended and not visible to customers'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {toggling && <Loader2 className="size-4 animate-spin" />}
            <Switch
              checked={isActive}
              onCheckedChange={handleToggle}
              disabled={toggling}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 font-medium">{value}</p>
      </CardContent>
    </Card>
  )
}

// ===================== PRODUCTS TAB =====================
function ProductsTab({ siteId }: { siteId: string }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)

  // Form
  const [formTitle, setFormTitle] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formStock, setFormStock] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ siteId, search })
      const res = await fetch(`/api/products?${params}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || data || [])
      }
    } catch {
      // empty
    } finally {
      setLoading(false)
    }
  }, [siteId, search])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const openCreate = () => {
    setEditProduct(null)
    setFormTitle('')
    setFormPrice('')
    setFormStock('')
    setFormCategory('')
    setDialogOpen(true)
  }

  const openEdit = (p: Product) => {
    setEditProduct(p)
    setFormTitle(p.title)
    setFormPrice(String(p.price))
    setFormStock(String(p.stock))
    setFormCategory(p.category)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const body = {
        title: formTitle,
        price: Number(formPrice),
        stock: Number(formStock),
        category: formCategory,
        siteId,
      }
      if (editProduct) {
        await fetch(`/api/products/${editProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }
      setDialogOpen(false)
      fetchProducts()
    } catch {
      // empty
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' })
      fetchProducts()
    } catch {
      // empty
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No products yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell>₽{p.price.toLocaleString()}</TableCell>
                    <TableCell>{p.stock}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.status === 'active' ? 'default' : 'secondary'
                        }
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive"
                          onClick={() => handleDelete(p.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editProduct ? 'Edit Product' : 'Add Product'}
            </DialogTitle>
            <DialogDescription>
              {editProduct
                ? 'Update the product details'
                : 'Fill in the product information'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Title</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Product name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Price (₽)</Label>
                <Input
                  type="number"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Stock</Label>
                <Input
                  type="number"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Category</Label>
              <Input
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="Category"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formTitle.trim()}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editProduct ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===================== ORDERS TAB =====================
function OrdersTab({ siteId }: { siteId: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ siteId, search })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/orders?${params}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || data || [])
      }
    } catch {
      // empty
    } finally {
      setLoading(false)
    }
  }, [siteId, search, statusFilter])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No orders yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow
                    key={o.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedOrder(o)}
                  >
                    <TableCell className="font-mono text-xs">
                      {o.orderNumber}
                    </TableCell>
                    <TableCell>{o.customerName}</TableCell>
                    <TableCell>₽{o.total.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          o.status === 'paid' || o.status === 'completed'
                            ? 'default'
                            : o.status === 'pending'
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>
              Customer: {selectedOrder?.customerName} ({selectedOrder?.customerEmail})
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(selectedOrder.items || []).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.productTitle}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>₽{item.price.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="flex justify-between pt-2 border-t">
            <span className="font-medium">Total</span>
            <span className="font-bold">
              ₽{selectedOrder?.total.toLocaleString()}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===================== EMAIL TAB =====================
function EmailTab({ siteId }: { siteId: string }) {
  const [provider, setProvider] = useState('smtp')
  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState('587')
  const [smtpUser, setSmtpUser] = useState('')
  const [smtpPass, setSmtpPass] = useState('')
  const [fromName, setFromName] = useState('')
  const [fromEmail, setFromEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [msg, setMsg] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch(`/api/sites/${siteId}/email`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          smtpHost,
          smtpPort: Number(smtpPort),
          smtpUser,
          smtpPass,
          fromName,
          fromEmail,
        }),
      })
      if (res.ok) setMsg('Email settings saved')
      else setMsg('Failed to save')
    } catch {
      setMsg('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setMsg('')
    try {
      const res = await fetch(`/api/sites/${siteId}/email/test`, {
        method: 'POST',
      })
      if (res.ok) setMsg('Test email sent successfully')
      else setMsg('Test email failed')
    } catch {
      setMsg('Test email failed')
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="size-5" />
          Email Configuration
        </CardTitle>
        <CardDescription>
          Configure email for order notifications and customer communication
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>Provider</Label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="smtp">SMTP</SelectItem>
              <SelectItem value="sendgrid">SendGrid</SelectItem>
              <SelectItem value="mailgun">Mailgun</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>SMTP Host</Label>
            <Input
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              placeholder="smtp.gmail.com"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>SMTP Port</Label>
            <Input
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
              placeholder="587"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>SMTP User</Label>
            <Input
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              placeholder="user@gmail.com"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>SMTP Password</Label>
            <Input
              type="password"
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        </div>
        <Separator />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>From Name</Label>
            <Input
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="Store Name"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>From Email</Label>
            <Input
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="noreply@store.com"
            />
          </div>
        </div>
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Save
          </Button>
          <Button variant="outline" onClick={handleTest} disabled={testing}>
            {testing && <Loader2 className="size-4 animate-spin" />}
            Send Test
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ===================== DOMAIN TAB =====================
function DomainTab({
  siteId,
  site,
  onRefresh,
}: {
  siteId: string
  site: SiteInfo | null
  onRefresh: () => void
}) {
  const [domain, setDomain] = useState(site?.domain || '')
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [msg, setMsg] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch(`/api/sites/${siteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      })
      if (res.ok) {
        setMsg('Domain saved')
        onRefresh()
      } else {
        setMsg('Failed to save domain')
      }
    } catch {
      setMsg('Failed to save domain')
    } finally {
      setSaving(false)
    }
  }

  const handleVerify = async () => {
    setVerifying(true)
    setMsg('')
    try {
      const res = await fetch(`/api/sites/${siteId}/domain/verify`, {
        method: 'POST',
      })
      if (res.ok) {
        const data = await res.json()
        setMsg(data.verified ? 'Domain verified!' : 'DNS not configured yet')
      } else {
        setMsg('Verification failed')
      }
    } catch {
      setMsg('Verification failed')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="size-5" />
          Custom Domain
        </CardTitle>
        <CardDescription>
          Connect your own domain to this store
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>Domain Name</Label>
          <Input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="store.example.com"
          />
        </div>

        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">DNS Configuration</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="mb-2">Add a CNAME record pointing to:</p>
            <code className="block rounded bg-background border p-2 text-xs font-mono">
              stores.sunstore.app
            </code>
          </CardContent>
        </Card>

        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving || !domain.trim()}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Save Domain
          </Button>
          <Button variant="outline" onClick={handleVerify} disabled={verifying}>
            {verifying && <Loader2 className="size-4 animate-spin" />}
            Verify DNS
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ===================== SUPPORT TAB =====================
function SupportTab({ siteId }: { siteId: string }) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tickets?siteId=${siteId}`)
      if (res.ok) {
        const data = await res.json()
        setTickets(data.tickets || data || [])
      }
    } catch {
      // empty
    } finally {
      setLoading(false)
    }
  }, [siteId])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const handleReply = async () => {
    if (!selectedTicket || !reply.trim()) return
    setSending(true)
    try {
      await fetch(`/api/tickets/${selectedTicket.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: reply }),
      })
      setReply('')
      fetchTickets()
    } catch {
      // empty
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No support tickets yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => (
                  <TableRow
                    key={t.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedTicket(t)}
                  >
                    <TableCell className="font-medium">{t.subject}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {t.fromEmail}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          t.status === 'open' ? 'default' : 'secondary'
                        }
                      >
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Ticket Reply Dialog */}
      <Dialog
        open={!!selectedTicket}
        onOpenChange={() => setSelectedTicket(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
            <DialogDescription>
              From: {selectedTicket?.fromEmail}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-60 overflow-y-auto space-y-3">
            {(selectedTicket?.replies || []).map((r) => (
              <div
                key={r.id}
                className="rounded-lg border p-3 text-sm"
              >
                <p className="text-xs text-muted-foreground mb-1">
                  {new Date(r.createdAt).toLocaleString()}
                </p>
                <p>{r.body}</p>
              </div>
            ))}
          </div>
          <Separator />
          <div className="flex flex-col gap-2">
            <Textarea
              placeholder="Type your reply..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
            <Button
              onClick={handleReply}
              disabled={sending || !reply.trim()}
              className="self-end"
            >
              {sending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Reply
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===================== SUBSCRIBERS TAB =====================
function SubscribersTab({ siteId }: { siteId: string }) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSubscribers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/subscribers?siteId=${siteId}`)
      if (res.ok) {
        const data = await res.json()
        setSubscribers(data.subscribers || data || [])
      }
    } catch {
      // empty
    } finally {
      setLoading(false)
    }
  }, [siteId])

  useEffect(() => {
    fetchSubscribers()
  }, [fetchSubscribers])

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/subscribers/export?siteId=${siteId}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'subscribers.csv'
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch {
      // empty
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Subscribers</h2>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : subscribers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No subscribers yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Subscribed
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          s.status === 'active' ? 'default' : 'secondary'
                        }
                      >
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ===================== THEME TAB =====================
function ThemeTab({
  siteId,
  site,
  onRefresh,
}: {
  siteId: string
  site: SiteInfo | null
  onRefresh: () => void
}) {
  const [primaryColor, setPrimaryColor] = useState(site?.primaryColor || '#000000')
  const [logoUrl, setLogoUrl] = useState('')
  const [tagline, setTagline] = useState(site?.tagline || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`/api/sites/${siteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryColor, logoUrl, tagline }),
      })
      onRefresh()
    } catch {
      // empty
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="size-5" />
          Branding
        </CardTitle>
        <CardDescription>
          Customize the appearance of your storefront
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>Primary Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="size-9 rounded border border-input cursor-pointer"
            />
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="max-w-32 font-mono text-sm"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Logo URL</Label>
          <Input
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Tagline</Label>
          <Input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Your store tagline"
          />
        </div>

        {/* Preview */}
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground mb-2">Preview</p>
          <div className="flex items-center gap-2">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="logo"
                className="size-8 rounded object-cover"
              />
            ) : (
              <div
                className="size-8 rounded flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: primaryColor }}
              >
                S
              </div>
            )}
            <span className="font-semibold">{site?.name || 'Store'}</span>
          </div>
          {tagline && (
            <p className="text-sm text-muted-foreground mt-1">{tagline}</p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              className="rounded-md px-3 py-1.5 text-sm text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Buy Now
            </button>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          Save Branding
        </Button>
      </CardContent>
    </Card>
  )
}