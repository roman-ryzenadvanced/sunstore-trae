import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Site admins only see stats for their own site
    if (user.role === 'site_admin' && user.siteId) {
      const [
        totalProducts,
        totalOrdersResult,
        totalRevenueResult,
        recentOrders,
        ordersByStatusResult,
        totalQuotes,
      ] = await Promise.all([
        db.siteProduct.count({ where: { siteId: user.siteId } }),
        db.siteOrder.aggregate({ _sum: { totalAmount: true }, _count: true }),
        db.siteOrder.aggregate({
          _sum: { totalAmount: true },
          where: {
            status: { in: ['CONFIRMED', 'AUTHORIZED'] },
            siteId: user.siteId,
          },
        }),
        db.siteOrder.findMany({
          take: 5,
          where: { siteId: user.siteId },
          include: {
            site: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        db.siteOrder.groupBy({
          by: ['status'],
          _count: { status: true },
          where: { siteId: user.siteId },
        }),
        db.siteOrder.count({
          where: { status: 'QUOTE', siteId: user.siteId },
        }),
      ])

      const ordersByStatus: Record<string, number> = {}
      for (const item of ordersByStatusResult) {
        ordersByStatus[item.status] = item._count.status
      }

      return NextResponse.json({
        totalSites: 1,
        totalProducts,
        totalOrders: totalOrdersResult._count || 0,
        totalRevenue: totalRevenueResult._sum.totalAmount || 0,
        recentOrders,
        ordersByStatus,
        totalQuotes,
      })
    }

    // Super admin sees all stats
    const [
      totalSites,
      totalProducts,
      totalOrdersResult,
      totalRevenueResult,
      recentOrders,
      ordersByStatusResult,
      totalQuotes,
    ] = await Promise.all([
      db.site.count(),
      db.siteProduct.count(),
      db.siteOrder.aggregate({ _sum: { totalAmount: true }, _count: true }),
      db.siteOrder.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: { in: ['CONFIRMED', 'AUTHORIZED'] },
        },
      }),
      db.siteOrder.findMany({
        take: 5,
        include: {
          site: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.siteOrder.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      db.siteOrder.count({
        where: { status: 'QUOTE' },
      }),
    ])

    const ordersByStatus: Record<string, number> = {}
    for (const item of ordersByStatusResult) {
      ordersByStatus[item.status] = item._count.status
    }

    return NextResponse.json({
      totalSites,
      totalProducts,
      totalOrders: totalOrdersResult._count || 0,
      totalRevenue: totalRevenueResult._sum.totalAmount || 0,
      recentOrders,
      ordersByStatus,
      totalQuotes,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}