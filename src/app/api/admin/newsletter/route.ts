import { NextRequest, NextResponse } from 'next/server'
import { getSubscribers } from '@/lib/mockDb'
import { getEmailConfig, sendEmail } from '@/lib/emailService'
import { isAdminAuthenticated } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

/** POST /api/admin/newsletter — send newsletter. Body: { subject, htmlBody } */
export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
  }

  const { subject, htmlBody } = await request.json().catch(() => ({}))
  if (!subject || !htmlBody) {
    return NextResponse.json({ error: 'Укажите тему и содержимое рассылки' }, { status: 400 })
  }

  const emailConfig = getEmailConfig()
  if (!emailConfig.isActive) {
    return NextResponse.json({ error: 'Почта не настроена' }, { status: 400 })
  }

  const activeSubscribers = getSubscribers()
  if (activeSubscribers.length === 0) {
    return NextResponse.json({ error: 'Нет активных подписчиков' }, { status: 400 })
  }

  const errors: string[] = []
  let sent = 0
  let failed = 0

  for (const subscriber of activeSubscribers) {
    try {
      const result = await sendEmail(subscriber.email, subject, htmlBody)
      if (result.ok) {
        sent++
      } else {
        failed++
        errors.push(`${subscriber.email}: ${result.error}`)
      }
    } catch (err) {
      failed++
      errors.push(`${subscriber.email}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return NextResponse.json({ ok: true, sent, failed, errors })
}
