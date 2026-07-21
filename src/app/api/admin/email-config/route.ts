import { NextRequest, NextResponse } from 'next/server'
import { getEmailConfig, updateEmailConfig, testConnection } from '@/lib/emailService'
import type { EmailConfig } from '@/lib/emailService'
import { isAdminAuthenticated } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

/** Mask sensitive fields before returning config to client. */
function maskConfig(config: EmailConfig): Record<string, unknown> {
  const masked: Record<string, unknown> = { ...config }
  if (masked.smtpPass) masked.smtpPass = '****'
  if (masked.yandexToken) masked.yandexToken = '****'
  return masked
}

/** GET /api/admin/email-config — current config (masked). */
export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
  }
  return NextResponse.json(maskConfig(getEmailConfig()))
}

/** PUT /api/admin/email-config — update config fields. Body: { ...patch } */
export async function PUT(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
  }
  const patch = await request.json().catch(() => ({}))
  const updated = updateEmailConfig(patch)
  return NextResponse.json(maskConfig(updated))
}

/** POST /api/admin/email-config — test connection. Body: { action: 'test' } */
export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
  }
  const { action } = await request.json().catch(() => ({}))
  if (action !== 'test') {
    return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 })
  }
  const result = await testConnection()
  return NextResponse.json({ ok: result.ok, error: result.error })
}
