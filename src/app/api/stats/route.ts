import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [totalSites, totalProducts, totalOrdersResult, totalRevenueResult, recentOrders, ordersByStatusResult] =
      await Promise.all([
        db.site.count(),
        db.siteProduct.count(),
        db.siteOrder.aggregate({ _sum: { totalAmount: true }, _count: true }),
        db.siteOrder.aggregate({
          _sum: {
            totalAmount: true,
          },
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
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}