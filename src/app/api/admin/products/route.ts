import { NextRequest, NextResponse } from 'next/server'
import { getAllProducts, createProduct, updateProduct, deleteProduct } from '@/lib/mockDb'
import { isAdminAuthenticated } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

/** GET /api/admin/products — all products incl. inactive. */
export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
  }
  return NextResponse.json({ products: getAllProducts() })
}

/** POST /api/admin/products — create a product. */
export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
  }
  const body = await request.json().catch(() => ({}))
  const product = createProduct(body)
  return NextResponse.json({ ok: true, product }, { status: 201 })
}

/** PUT /api/admin/products — update a product. Body: { id, ...patch } */
export async function PUT(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
  }
  const body = await request.json().catch(() => ({}))
  const { id, ...patch } = body
  if (!id) return NextResponse.json({ error: 'Нужен id' }, { status: 400 })
  const updated = updateProduct(id, patch)
  if (!updated) return NextResponse.json({ error: 'Товар не найден' }, { status: 404 })
  return NextResponse.json({ ok: true, product: updated })
}

/** DELETE /api/admin/products?id=... */
export async function DELETE(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
  }
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Нужен id' }, { status: 400 })
  const ok = deleteProduct(id)
  if (!ok) return NextResponse.json({ error: 'Товар не найден' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
