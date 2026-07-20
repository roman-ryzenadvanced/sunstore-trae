import { NextRequest, NextResponse } from 'next/server'
import { getGateway, getEffectiveConfig } from '@/lib/payments/registry'
import { isAdminAuthenticated } from '@/lib/adminAuth'
import type { GatewayConfig, GatewayId } from '@/lib/payments/types'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/test-gateway
 * Body: { gateway, config? } — tests the provided (or stored) credentials.
 */
export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ success: false, message: 'Требуется авторизация' }, { status: 401 })
  }

  const { gateway, config } = await request.json().catch(() => ({}))
  const id = gateway as GatewayId
  if (!id) {
    return NextResponse.json({ success: false, message: 'Не указан шлюз' }, { status: 400 })
  }

  const adapter = getGateway(id)
  // Use the credentials from the form if provided; otherwise the stored/effective config.
  const effective: GatewayConfig = config?.mode
    ? {
        enabled: config.enabled ?? true,
        mode: config.mode,
        sandbox: config.sandbox || {},
        live: config.live || {}
      }
    : getEffectiveConfig(id)

  const result = await adapter.testConnection(effective)
  return NextResponse.json(result, { status: result.success ? 200 : 400 })
}
