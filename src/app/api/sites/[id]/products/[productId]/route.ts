import { NextRequest, NextResponse } from 'next/server'
import { db, commitDb } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  try {
    const { id, productId } = await params

    const product = await db.siteProduct.findFirst({
      where: { id: productId, siteId: id },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Get product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, productId } = await params

    const product = await db.siteProduct.findFirst({
      where: { id: productId, siteId: id },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Site admin can only update products for their own site
    if (user.role === 'site_admin' && user.siteId !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}
    const allowedFields = [
      'title', 'description', 'price', 'oldPrice', 'stock',
      'images', 'specs', 'category', 'featured', 'active',
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'images' || field === 'specs') {
          data[field] = JSON.stringify(body[field])
        } else if (field === 'price' || field === 'oldPrice') {
          data[field] = Number(body[field])
        } else if (field === 'stock') {
          data[field] = Number(body[field])
        } else {
          data[field] = body[field]
        }
      }
    }

    const updated = await db.siteProduct.update({
      where: { id: productId },
      data,
    })

    try { await commitDb() } catch (e) { console.error('DB commit failed:', e) }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, productId } = await params

    // Site admin can only delete products for their own site
    if (user.role === 'site_admin' && user.siteId !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const product = await db.siteProduct.findFirst({
      where: { id: productId, siteId: id },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    await db.orderItem.deleteMany({ where: { productId } })
    await db.siteProduct.delete({ where: { id: productId } })

    try { await commitDb() } catch (e) { console.error('DB commit failed:', e) }

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}