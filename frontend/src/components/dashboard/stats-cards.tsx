'use client'

import { useEffect, useState } from 'react'
import {
  Building2,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface DashboardStats {
  totalSites: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  readySites: number
}

interface RecentOrder {
  id: string
  orderNumber: string
  customerName: string
  siteName: string
  total: number
  status: string
  createdAt: string
}

export function StatsCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch {
        // fallback mock
      }
      try {
        const res = await fetch('/api/orders?limit=5')
        if (res.ok) {
          const data = await res.json()
          setRecentOrders(data.orders || data || [])
        }
      } catch {
        // fallback mock
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const cards = [
    {
      label: 'Total Stores',
      value: stats?.totalSites ?? 0,
      icon: Building2,
      trend: stats ? `${stats.readySites} ready` : '',
      trendUp: true,
    },
    {
      label: 'Total Products',
      value: stats?.totalProducts ?? 0,
      icon: Package,
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Total Orders',
      value: stats?.totalOrders ?? 0,
      icon: ShoppingCart,
      trend: '+8%',
      trendUp: true,
    },
    {
      label: 'Total Revenue',
      value: `₽${(stats?.totalRevenue ?? 0).toLocaleString()}`,
      icon: DollarSign,
      trend: '+24%',
      trendUp: true,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Overview of your SunStore platform
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <card.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{card.value}</div>
              )}
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                {card.trendUp ? (
                  <TrendingUp className="size-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="size-3 text-destructive" />
                )}
                {card.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No orders yet. Create a store to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden sm:table-cell">Store</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {order.siteName}
                    </TableCell>
                    <TableCell>₽{order.total.toLocaleString()}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                      {new Date(order.createdAt).toLocaleDateString()}
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

function OrderStatusBadge({ status }: { status: string }) {
  const variant =
    status === 'paid' || status === 'completed'
      ? 'default'
      : status === 'pending'
        ? 'secondary'
        : 'destructive'
  return <Badge variant={variant}>{status}</Badge>
}