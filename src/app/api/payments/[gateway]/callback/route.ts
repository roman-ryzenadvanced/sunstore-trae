import { NextRequest, NextResponse } from 'next/server'
import { getGateway, getEffectiveConfig } from '@/lib/payments/registry'
import { markOrderPaid, updateOrderStatus, getOrderById } from '@/lib/mockDb'
import type { GatewayId } from '@/lib/payments/types'

export const dynamic = 'force-dynamic'

/**
 * POST /api/payments/[gateway]/callback
 * Generic notification endpoint. Verifies the gateway signature and updates
 * the order status accordingly.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gateway: string }> }
) {
  const { gateway } = await params
  const id = gateway as GatewayId
  const adapter = getGateway(id)
  const config = getEffectiveConfig(id)

  // Parse body (JSON or form-encoded depending on the gateway).
  let body: any
  const contentType = request.headers.get('content-type') || ''
  const raw = await request.text()
  if (contentType.includes('application/json')) {
    try {
      body = JSON.parse(raw)
    } catch {
      body = raw
    }
  } else if (contentType.includes('form-urlencoded')) {
    body = Object.fromEntries(new URLSearchParams(raw))
  } else {
    try {
      body = JSON.parse(raw)
    } catch {
      body = Object.fromEntries(new URLSearchParams(raw))
    }
  }

  const headers: Record<string, string | string[] | undefined> = {}
  request.headers.forEach((v, k) => (headers[k] = v))

  const result = await adapter.verifyCallback(body, headers, config)

  if (result.orderId) {
    const order = getOrderById(result.orderId)
    if (order) {
      if (result.status === 'succeeded') {
        markOrderPaid(result.orderId, result.paymentId)
      } else if (result.status === 'failed') {
        updateOrderStatus(result.orderId, 'cancelled')
      }
    }
  }

  // T-Bank expects the literal "OK" body to acknowledge the notification.
  if (id === 'tbank') {
    return new NextResponse('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } })
  }

  return NextResponse.json({ ok: true, verified: result.verified })
}
