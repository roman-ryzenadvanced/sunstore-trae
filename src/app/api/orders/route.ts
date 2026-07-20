import { NextRequest, NextResponse } from 'next/server'
import { createOrder, getOrderById, getCart } from '@/lib/mockDb'

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id') || 'default'
    const { getOrdersBySession } = await import('@/lib/mockDb')
    const userOrders = getOrdersBySession(sessionId)
    
    return NextResponse.json({ orders: userOrders })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ orders: [] }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id') || 'default'
    const body = await request.json()
    
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      paymentMethod,
      notes
    } = body
    
    const shippingAddressString = typeof shippingAddress === 'string'
      ? shippingAddress
      : JSON.stringify(shippingAddress)
    
    const order = createOrder(
      sessionId,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddressString,
      paymentMethod,
      notes
    )
    
    if (!order) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }
    
    const { getPaymentUrl } = await import('@/lib/mockDb')
    
    return NextResponse.json(
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.totalAmount,
        currency: order.currency,
        paymentUrl: getPaymentUrl(order.id)
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get('id')
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }
    
    const { cancelOrder } = await import('@/lib/mockDb')
    const cancelledOrder = cancelOrder(orderId)
    
    if (!cancelledOrder) {
      return NextResponse.json(
        { error: 'Order not found or cannot be cancelled' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      orderId: cancelledOrder.id,
      status: cancelledOrder.status
    })
  } catch (error) {
    console.error('Error cancelling order:', error)
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    )
  }
}