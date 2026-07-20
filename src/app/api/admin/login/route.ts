import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_PASSWORD, ADMIN_COOKIE, ADMIN_TOKEN_VALUE, adminCookieOptions } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const { password } = await request.json().catch(() => ({}))

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: 'Неверный пароль' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, ADMIN_TOKEN_VALUE, adminCookieOptions())
  return res
}
