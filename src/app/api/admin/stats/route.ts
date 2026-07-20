import { NextRequest, NextResponse } from 'next/server'
import { getAllOrders, getAllProducts } from '@/lib/mockDb'
import { isAdminAuthenticated } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

/** GET /api/admin/stats — overview KPIs for the dashboard. */
export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
  }

  const orders = getAllOrders()
  const products = getAllProducts()

  const paid = orders.filter((o) => o.status === 'paid')
  const revenue = paid.reduce((sum, o) => sum + o.totalAmount, 0)
  const pending = orders.filter((o) => o.status === 'pending').length
  const activeProducts = products.filter((p) => p.isActive).length
  const lowStock = products.filter((p) => p.isActive && p.stock <= 20).length
  const avgOrder = paid.length ? Math.round(revenue / paid.length) : 0

  return NextResponse.json({
    revenue,
    ordersTotal: orders.length,
    ordersPaid: paid.length,
    ordersPending: pending,
    avgOrder,
    productsTotal: products.length,
    activeProducts,
    lowStock,
    recentOrders: orders.slice(0, 6)
  })
}
