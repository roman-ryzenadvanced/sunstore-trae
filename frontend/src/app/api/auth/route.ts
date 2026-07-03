import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, verifyPassword, signToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    const admin = await db.superAdmin.findUnique({ where: { username } })
    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const valid = await verifyPassword(password, admin.password)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = signToken({ sub: admin.id, role: 'super_admin' })

    return NextResponse.json({
      token,
      username: admin.username,
      name: admin.name,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role === 'super_admin') {
      const admin = await db.superAdmin.findUnique({ where: { id: user.sub } })
      if (!admin) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      return NextResponse.json({
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: 'super_admin',
      })
    }

    if (user.role === 'site_admin' && user.siteId) {
      const siteAdmin = await db.siteAdmin.findUnique({
        where: { siteId: user.siteId },
        include: { site: true },
      })
      if (!siteAdmin) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      return NextResponse.json({
        id: siteAdmin.id,
        username: siteAdmin.username,
        name: siteAdmin.name,
        email: siteAdmin.email,
        role: 'site_admin',
        siteId: siteAdmin.siteId,
        siteName: siteAdmin.site.name,
      })
    }

    return NextResponse.json({ error: 'Unknown role' }, { status: 401 })
  } catch (error) {
    console.error('Auth validate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}