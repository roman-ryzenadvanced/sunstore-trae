import { NextRequest, NextResponse } from 'next/server'
import { getStoreConfig, updateStoreConfig, publicStoreConfig } from '@/lib/storeConfig'
import { listGateways } from '@/lib/payments/registry'
import { isAdminAuthenticated } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/store-config
 *  - default: public config (no secrets) for the storefront/checkout
 *  - ?scope=admin (authenticated): full config + gateway metadata for the back office
 */
export async function GET(request: NextRequest) {
  const scope = request.nextUrl.searchParams.get('scope')

  if (scope === 'admin') {
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
    }
    const cfg = getStoreConfig()
    const gateways = listGateways().map((g) => ({
      id: g.id,
      meta: g.meta,
      fields: {
        sandbox: g.requiredFields('sandbox'),
        live: g.requiredFields('live')
      }
    }))
    return NextResponse.json({ config: cfg, gateways })
  }

  return NextResponse.json(publicStoreConfig())
}

/**
 * POST /api/store-config — update runtime config (admin only).
 * Accepts a partial StoreConfig patch.
 */
export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const updated = updateStoreConfig(body)
    return NextResponse.json({ ok: true, config: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Некорректные данные' }, { status: 400 })
  }
}
