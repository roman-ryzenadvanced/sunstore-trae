import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, verifyPassword, hashPassword } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 })
    }

    if (user.role === 'super_admin') {
      const admin = await db.superAdmin.findUnique({ where: { id: user.sub } })
      if (!admin) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const valid = await verifyPassword(currentPassword, admin.password)
      if (!valid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }

      const hashed = await hashPassword(newPassword)
      await db.superAdmin.update({
        where: { id: user.sub },
        data: { password: hashed },
      })
    } else if (user.role === 'site_admin' && user.siteId) {
      const siteAdmin = await db.siteAdmin.findUnique({ where: { siteId: user.siteId } })
      if (!siteAdmin) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const valid = await verifyPassword(currentPassword, siteAdmin.password)
      if (!valid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }

      const hashed = await hashPassword(newPassword)
      await db.siteAdmin.update({
        where: { siteId: user.siteId },
        data: { password: hashed },
      })
    } else {
      return NextResponse.json({ error: 'Unknown role' }, { status: 401 })
    }

    return NextResponse.json({ message: 'Password updated successfully' })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}