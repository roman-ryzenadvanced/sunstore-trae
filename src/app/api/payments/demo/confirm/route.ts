import { NextRequest, NextResponse } from 'next/server'
import { markOrderPaid, updateOrderStatus, getOrderById } from '@/lib/mockDb'

export const dynamic = 'force-dynamic'

/**
 * POST /api/payments/demo/confirm
 * Body: { orderId, status: 'succeeded' | 'failed' }
 * Simulates a gateway result for the demo payment page.
 */
export async function POST(request: NextRequest) {
  const { orderId, status } = await request.json().catch(() => ({}))

  if (!orderId) {
    return NextResponse.json({ ok: false, error: 'Не указан заказ' }, { status: 400 })
  }

  const order = getOrderById(orderId)
  if (!order) {
    return NextResponse.json({ ok: false, error: 'Заказ не найден' }, { status: 404 })
  }

  if (status === 'failed') {
    updateOrderStatus(orderId, 'cancelled')
    return NextResponse.json({ ok: true, status: 'failed' })
  }

  markOrderPaid(orderId, 'demo_' + Date.now())
  return NextResponse.json({ ok: true, status: 'succeeded' })
}
