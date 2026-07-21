import { NextRequest, NextResponse } from 'next/server'
import { getAllSubscribers, addSubscriber, removeSubscriber, toggleSubscriber } from '@/lib/mockDb'
import { isAdminAuthenticated } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

/** GET /api/admin/subscribers — all subscribers. */
export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
  }
  return NextResponse.json({ subscribers: getAllSubscribers() })
}

/** POST /api/admin/subscribers — add subscriber. Body: { email, name? } */
export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
  }
  const { email, name } = await request.json().catch(() => ({}))
  if (!email) {
    return NextResponse.json({ error: 'Укажите email' }, { status: 400 })
  }
  const subscriber = addSubscriber(email, name, 'admin')
  return NextResponse.json({ ok: true, subscriber }, { status: 201 })
}

/** PUT /api/admin/subscribers — toggle subscriber. Body: { id, isActive? } */
export async function PUT(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
  }
  const { id, isActive } = await request.json().catch(() => ({}))
  if (!id) {
    return NextResponse.json({ error: 'Нужен id' }, { status: 400 })
  }
  const updated = toggleSubscriber(id, isActive ?? true)
  if (!updated) {
    return NextResponse.json({ error: 'Подписчик не найден' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, subscriber: updated })
}

/** DELETE /api/admin/subscribers?id=... — remove subscriber. */
export async function DELETE(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
  }
  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Нужен id' }, { status: 400 })
  }
  const ok = removeSubscriber(id)
  if (!ok) {
    return NextResponse.json({ error: 'Подписчик не найден' }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
