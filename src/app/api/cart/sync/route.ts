import { NextRequest, NextResponse } from 'next/server'
import { getCart, setCartItems } from '@/lib/mockDb'

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id') || 'default'
    const body = await request.json()
    const { items } = body

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid items array' }, { status: 400 })
    }

    // Sync the full cart state from client to server
    setCartItems(sessionId, items.map((item: any) => ({
      id: item.id || 'ci_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      category: item.category || 'standard'
    })))

    const cart = getCart(sessionId)
    return NextResponse.json({ items: cart.items, success: true })
  } catch (error) {
    console.error('Error syncing cart:', error)
    return NextResponse.json(
      { error: 'Failed to sync cart' },
      { status: 500 }
    )
  }
}
