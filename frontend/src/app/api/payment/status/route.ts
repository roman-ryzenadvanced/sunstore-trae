import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const order = await db.siteOrder.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        site: { select: { id: true, name: true, slug: true } },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const transaction = await db.paymentTransaction.findUnique({
      where: { orderId },
    })

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      currency: order.currency,
      paymentId: order.paymentId,
      paymentUrl: order.paymentUrl,
      paymentMode: order.paymentMode,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      items: order.items,
      site: order.site,
      transaction: transaction
        ? {
            status: transaction.status,
            tbankPaymentId: transaction.tbankPaymentId,
          }
        : null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    })
  } catch (error) {
    console.error('Payment status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}