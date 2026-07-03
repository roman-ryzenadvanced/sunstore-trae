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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const siteId = searchParams.get('siteId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const skip = (page - 1) * limit

    const where: Prisma.SiteProductWhereInput = {}
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }
    if (siteId) {
      where.siteId = siteId
    }

    const [products, total] = await Promise.all([
      db.siteProduct.findMany({
        where,
        include: {
          site: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.siteProduct.count({ where }),
    ])

    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('List all products error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}