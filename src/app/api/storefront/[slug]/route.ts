import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)

    const category = searchParams.get('category') || ''
    const search = searchParams.get('search') || ''

    const site = await db.site.findUnique({
      where: { slug },
    })

    if (!site || site.status !== 'READY') {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Build product query
    const where: Prisma.SiteProductWhereInput = {
      siteId: site.id,
      active: true,
    }

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const [products, categories] = await Promise.all([
      db.siteProduct.findMany({
        where,
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      }),
      // Extract unique categories from this site
      db.siteProduct.findMany({
        where: { siteId: site.id, active: true, category: { not: '' } },
        select: { category: true },
        distinct: ['category'],
      }),
    ])

    return NextResponse.json({
      site: {
        id: site.id,
        name: site.name,
        slug: site.slug,
        tagline: site.tagline,
        templateId: site.templateId,
        primaryColor: site.primaryColor,
        logoUrl: site.logoUrl,
      },
      categories: categories.map(c => c.category).filter(Boolean),
      products,
    })
  } catch (error) {
    console.error('Storefront error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}