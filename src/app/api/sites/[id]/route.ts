import { NextRequest, NextResponse } from 'next/server'
import { db, commitDb } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { checkSiteAccess } from '@/lib/rbac'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const site = await db.site.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true, orders: true } },
        owner: { select: { id: true, name: true, email: true, username: true } },
      },
    })

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Site admins can only see their own site
    if (user.role === 'site_admin' && user.siteId && user.siteId !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(site)
  } catch (error) {
    console.error('Get site error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Only super_admin can update sites
    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: only super admin can update sites' }, { status: 403 })
    }

    const body = await request.json()
    const site = await db.site.findUnique({ where: { id } })
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    const allowedFields = ['name', 'tagline', 'primaryColor', 'status', 'logoUrl', 'customDomain']
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field]
      }
    }

    const updated = await db.site.update({
      where: { id },
      data,
      include: {
        owner: { select: { id: true, name: true, email: true, username: true } },
      },
    })

    try { await commitDb() } catch (e) { console.error('DB commit failed:', e) }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update site error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only super_admin can delete sites
    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: only super admin can delete sites' }, { status: 403 })
    }

    const { id } = await params

    const site = await db.site.findUnique({ where: { id } })
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Delete related records in order due to foreign key constraints
    await db.paymentTransaction.deleteMany({ where: { siteId: id } })
    await db.orderItem.deleteMany({
      where: { order: { siteId: id } },
    })
    await db.siteOrder.deleteMany({ where: { siteId: id } })
    await db.siteProduct.deleteMany({ where: { siteId: id } })
    await db.supportTicket.deleteMany({ where: { siteId: id } })
    await db.subscriber.deleteMany({ where: { siteId: id } })
    await db.siteEmailConfig.deleteMany({ where: { siteId: id } })
    await db.siteAdmin.deleteMany({ where: { siteId: id } })
    await db.site.delete({ where: { id } })

    try { await commitDb() } catch (e) { console.error('DB commit failed:', e) }

    return NextResponse.json({ message: 'Site deleted successfully' })
  } catch (error) {
    console.error('Delete site error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}