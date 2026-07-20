import { NextRequest, NextResponse } from 'next/server'
import { getCart, addToCart, updateCartItem, removeFromCart } from '@/lib/mockDb'

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id') || 'default'
    const cart = getCart(sessionId)
    
    return NextResponse.json({ items: cart.items })
  } catch (error) {
    console.error('Error fetching cart:', error)
    return NextResponse.json({ items: [] }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id') || 'default'
    const body = await request.json()
    const { productId, quantity, action } = body
    
    let cart
    
    switch (action) {
      case 'add':
        cart = addToCart(sessionId, productId, quantity || 1)
        break
      case 'update':
        cart = updateCartItem(sessionId, productId, quantity)
        break
      case 'remove':
        cart = removeFromCart(sessionId, productId)
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    return NextResponse.json({ items: cart.items, success: true })
  } catch (error) {
    console.error('Error updating cart:', error)
    return NextResponse.json(
      { error: 'Failed to update cart' },
      { status: 500 }
    )
  }
}