'use client'

import { useCallback, useEffect, useState } from 'react'
import { Search, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Skeleton } from '@/components/ui/skeleton'

interface Order {
  id: string
  orderNumber: string
  siteName: string
  customerName: string
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

interface SiteOption {
  id: string
  name: string
}

export function AllOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [sites, setSites] = useState<SiteOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [siteFilter, setSiteFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        search,
        page: String(page),
        limit: '20',
      })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (siteFilter !== 'all') params.set('siteId', siteFilter)
      const res = await fetch(`/api/orders?${params}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || data || [])
        setTotalPages(data.totalPages || 1)
      }
    } catch {
      // empty
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, siteFilter, page])

  const fetchSites = useCallback(async () => {
    try {
      const res = await fetch('/api/sites')
      if (res.ok) {
        const data = await res.json()
        setSites(data.sites || data || [])
      }
    } catch {
      // empty
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    fetchSites()
  }, [fetchOrders, fetchSites])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">All Orders</h1>
        <p className="text-muted-foreground text-sm">
          View and manage orders across all stores
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by order # or customer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v)
            setPage(1)
          }}
        >
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
        <Select
          value={siteFilter}
          onValueChange={(v) => {
            setSiteFilter(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Stores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stores</SelectItem>
            {sites.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No orders found
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">
                      {o.orderNumber}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {o.siteName}
                    </TableCell>
                    <TableCell>{o.customerName}</TableCell>
                    <TableCell className="font-medium">
                      ₽{o.total.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => setSelectedOrder(o)}
                      >
                        <Eye className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>
              {selectedOrder?.siteName} &middot; {selectedOrder?.customerName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <OrderStatusBadge status={selectedOrder?.status || ''} />
              <span className="text-sm text-muted-foreground ml-auto">
                {selectedOrder?.createdAt &&
                  new Date(selectedOrder.createdAt).toLocaleString()}
              </span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(selectedOrder?.items || []).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.productTitle}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>₽{item.price.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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

function OrderStatusBadge({ status }: { status: string }) {
  const variant =
    status === 'paid' || status === 'completed'
      ? 'default'
      : status === 'pending'
        ? 'secondary'
        : 'destructive'
  return <Badge variant={variant}>{status}</Badge>
}