import { NextRequest, NextResponse } from 'next/server'
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '@/lib/mockDb'
import { isAdminAuthenticated } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

/** GET /api/admin/categories — all categories incl. inactive. */
export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
  }
  return NextResponse.json({ categories: getAllCategories() })
}

/** POST /api/admin/categories — create a category. */
export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
  }
  const body = await request.json().catch(() => ({}))
  const category = createCategory(body)
  return NextResponse.json({ ok: true, category }, { status: 201 })
}

/** PUT /api/admin/categories — update a category. Body: { id, ...patch } */
export async function PUT(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
  }
  const body = await request.json().catch(() => ({}))
  const { id, ...patch } = body
  if (!id) return NextResponse.json({ error: 'Нужен id' }, { status: 400 })
  const updated = updateCategory(id, patch)
  if (!updated) return NextResponse.json({ error: 'Категория не найдена' }, { status: 404 })
  return NextResponse.json({ ok: true, category: updated })
}

/** DELETE /api/admin/categories?id=... */
export async function DELETE(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
  }
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Нужен id' }, { status: 400 })
  const ok = deleteCategory(id)
  if (!ok) return NextResponse.json({ error: 'Категория не найдена' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
