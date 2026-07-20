import { NextRequest, NextResponse } from 'next/server'
import { getOrderById, setOrderPayment } from '@/lib/mockDb'
import { resolveGateway } from '@/lib/payments/registry'
import { getStoreConfig } from '@/lib/storeConfig'
import type { GatewayId, PaymentRequest } from '@/lib/payments/types'

export const dynamic = 'force-dynamic'

/**
 * POST /api/payments/init
 * Body: { orderId, gateway? }
 * Resolves the active (or requested) gateway, creates a payment for the order,
 * and returns either a redirect URL or a widget payload.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const orderId: string = body.orderId
    const preferred: GatewayId | undefined = body.gateway

    const order = getOrderById(orderId)
    if (!order) {
      return NextResponse.json({ ok: false, error: 'Заказ не найден' }, { status: 404 })
    }

    const { id, adapter, config } = resolveGateway(preferred)
    const origin = request.nextUrl.origin
    const cfg = getStoreConfig()

    const payReq: PaymentRequest = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.totalAmount,
      currency: order.currency || cfg.currency || 'RUB',
      description: `Заказ ${order.orderNumber} — Sunstore`,
      customer: {
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone
      },
      returnUrl: `${origin}/status?id=${encodeURIComponent(order.id)}`,
      failUrl: `${origin}/status?id=${encodeURIComponent(order.id)}&fail=1`
    }

    const result = await adapter.createPayment(payReq, config)

    if (result.ok && result.paymentId) {
      setOrderPayment(order.id, result.paymentId, adapter.meta.name)
    }

    return NextResponse.json({
      ...result,
      gateway: id,
      gatewayName: adapter.meta.name,
      mode: config.mode
    })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Не удалось создать платёж' },
      { status: 500 }
    )
  }
}
