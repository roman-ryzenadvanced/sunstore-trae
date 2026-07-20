import { NextRequest, NextResponse } from 'next/server'
import { getOrderById } from '@/lib/mockDb'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const order = getOrderById(id)
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
    
    const shippingAddress = (() => {
      try {
        return JSON.parse(order.shippingAddress)
      } catch {
        return { address: order.shippingAddress }
      }
    })()
    
    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      total: order.totalAmount,
      totalAmount: order.totalAmount,
      currency: order.currency,
      paymentMethod: order.paymentMethod,
      paymentId: order.paymentId,
      shippingAddress,
      shippingAddressRaw: order.shippingAddress,
      items: order.items,
      notes: order.notes
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}