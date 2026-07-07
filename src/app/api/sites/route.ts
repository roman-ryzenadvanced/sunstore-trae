import { NextRequest, NextResponse } from 'next/server'
import { db, commitDb } from '@/lib/db'
import { getAuthUser, hashPassword, signToken } from '@/lib/auth'
import { getTemplateProducts } from '@/lib/templates'
import { checkSiteAccess } from '@/lib/rbac'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where: Prisma.SiteWhereInput = search
      ? {
          OR: [
            { name: { contains: search } },
            { slug: { contains: search } },
            { tagline: { contains: search } },
          ],
        }
      : {}

    const sites = await db.site.findMany({
      where,
      include: {
        _count: { select: { products: true, orders: true } },
        owner: { select: { id: true, name: true, email: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Site admins can only see their own site
    if (user.role === 'site_admin' && user.siteId) {
      const filtered = sites.filter(s => s.id === user.siteId)
      const total = filtered.length
      const ready = filtered.filter(s => s.status === 'READY').length
      const suspended = filtered.filter(s => s.status === 'SUSPENDED').length
      const provisioning = filtered.filter(s => s.status === 'PROVISIONING').length

      return NextResponse.json({
        sites: filtered,
        stats: { total, ready, suspended, provisioning },
      })
    }

    const total = sites.length
    const ready = sites.filter(s => s.status === 'READY').length
    const suspended = sites.filter(s => s.status === 'SUSPENDED').length
    const provisioning = sites.filter(s => s.status === 'PROVISIONING').length

    return NextResponse.json({
      sites,
      stats: { total, ready, suspended, provisioning },
    })
  } catch (error) {
    console.error('List sites error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only super_admin can create sites
    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: only super admin can create sites' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      slug,
      tagline,
      templateId,
      primaryColor,
      categories,
      ownerName,
      ownerEmail,
      ownerUsername,
      ownerPassword,
    } = body

    if (!name || !slug || !ownerName || !ownerEmail || !ownerUsername || !ownerPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check slug uniqueness
    const existing = await db.site.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
    }

    // Check username uniqueness
    const existingAdmin = await db.siteAdmin.findFirst({ where: { username: ownerUsername } })
    if (existingAdmin) {
      return NextResponse.json({ error: 'Owner username already taken' }, { status: 409 })
    }

    const hashedPassword = await hashPassword(ownerPassword)

    // Get template products to seed
    const templateProducts = getTemplateProducts(templateId || 'general')
    const productData = templateProducts.map((p) => ({
      title: p.title,
      slug: p.slug,
      description: p.description,
      price: p.price,
      oldPrice: p.oldPrice,
      stock: p.stock,
      images: '[]',
      specs: JSON.stringify(p.specs),
      category: p.category,
      featured: p.featured,
      active: true,
    }))

    const site = await db.site.create({
      data: {
        name,
        slug,
        tagline: tagline || '',
        templateId: templateId || 'general',
        primaryColor: primaryColor || '#0f172a',
        categories: categories ? JSON.stringify(categories) : '[]',
        status: 'READY',
        owner: {
          create: {
            username: ownerUsername,
            email: ownerEmail,
            password: hashedPassword,
            name: ownerName,
          },
        },
        products: { createMany: { data: productData } },
      },
      include: {
        owner: { select: { id: true, name: true, email: true, username: true } },
      },
    }).catch((e) => {
      throw new Error(`Database error: ${e.message}`)
    })

    // Commit DB to GitHub — never throw, log and continue
    try {
      await commitDb()
    } catch (e: unknown) {
      console.error('DB commit failed (site creation):', e instanceof Error ? e.message : e)
    }

    return NextResponse.json(site, { status: 201 })
  } catch (error) {
    console.error('Create site error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Internal server error: ${msg}` }, { status: 500 })
  }
}