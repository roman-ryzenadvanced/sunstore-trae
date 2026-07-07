import { NextRequest, NextResponse } from 'next/server'
import { db, commitDb } from '@/lib/db'
import { getAuthUser, hashPassword } from '@/lib/auth'
import { checkSiteAccess } from '@/lib/rbac'

// Super admin only routes for managing site admins

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')

    const query: Record<string, unknown> = siteId ? { siteId } : {}

    const admins = await db.siteAdmin.findMany({
      where: query,
      include: {
        site: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ admins })
  } catch (error) {
    console.error('List site admins error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { siteId, username, email, password, name } = body

    if (!siteId || !username || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const site = await db.site.findUnique({ where: { id: siteId } })
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Check if site admin already exists for this site
    const existing = await db.siteAdmin.findUnique({ where: { siteId } })
    if (existing) {
      return NextResponse.json({ error: 'Site admin already exists for this site. Use PATCH to reset password.' }, { status: 409 })
    }

    // Check username uniqueness
    const existingUsername = await db.siteAdmin.findFirst({ where: { username } })
    if (existingUsername) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)

    const admin = await db.siteAdmin.create({
      data: {
        siteId,
        username,
        email,
        password: hashedPassword,
        name: name || '',
      },
      include: {
        site: { select: { id: true, name: true, slug: true } },
      },
    })

    try { await commitDb() } catch (e) { console.error('DB commit failed:', e) }

    return NextResponse.json(admin, { status: 201 })
  } catch (error) {
    console.error('Create site admin error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { siteId } = await params

    await db.siteAdmin.deleteMany({ where: { siteId } })

    try { await commitDb() } catch (e) { console.error('DB commit failed:', e) }

    return NextResponse.json({ message: 'Site admin deleted' })
  } catch (error) {
    console.error('Delete site admin error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { siteId } = await params
    const body = await request.json()

    const admin = await db.siteAdmin.findUnique({ where: { siteId } })
    if (!admin) {
      return NextResponse.json({ error: 'Site admin not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (body.email !== undefined) data.email = body.email
    if (body.name !== undefined) data.name = body.name

    if (body.password) {
      data.password = await hashPassword(body.password)
    }

    const updated = await db.siteAdmin.update({
      where: { siteId },
      data,
      include: {
        site: { select: { id: true, name: true, slug: true } },
      },
    })

    try { await commitDb() } catch (e) { console.error('DB commit failed:', e) }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update site admin error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
