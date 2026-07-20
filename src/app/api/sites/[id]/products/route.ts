import { NextRequest, NextResponse } from 'next/server'
import { db, commitDb } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const skip = (page - 1) * limit

    const site = await db.site.findUnique({ where: { id } })
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    const where: Prisma.SiteProductWhereInput = { siteId: id }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }
    if (category) {
      where.category = category
    }

    const [products, total] = await Promise.all([
      db.siteProduct.findMany({
        where,
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
    console.error('List products error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const site = await db.site.findUnique({ where: { id } })
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Site admin can only create products for their own site
    if (user.role === 'site_admin' && user.siteId !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!body.title || body.price === undefined) {
      return NextResponse.json({ error: 'Title and price are required' }, { status: 400 })
    }

    const slug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]+/g, '-')
      .replace(/^-|-$/g, '')

    const product = await db.siteProduct.create({
      data: {
        siteId: id,
        title: body.title,
        slug,
        description: body.description || '',
        price: Number(body.price),
        oldPrice: body.oldPrice ? Number(body.oldPrice) : 0,
        stock: body.stock !== undefined ? Number(body.stock) : 0,
        images: body.images ? JSON.stringify(body.images) : '[]',
        specs: body.specs ? JSON.stringify(body.specs) : '{}',
        category: body.category || '',
        featured: body.featured || false,
        active: body.active !== undefined ? body.active : true,
      },
    })

    try { await commitDb() } catch (e) { console.error('DB commit failed:', e) }

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}