import { NextRequest, NextResponse } from 'next/server'
import { getSubscriberByEmail, toggleSubscriber } from '@/lib/mockDb'

export const dynamic = 'force-dynamic'

/** POST /api/newsletter/unsubscribe — public unsubscribe. Body: { email } */
export async function POST(request: NextRequest) {
  const { email } = await request.json().catch(() => ({}))

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ ok: true })
  }

  const subscriber = getSubscriberByEmail(email)
  if (subscriber) {
    toggleSubscriber(subscriber.id, false)
  }

  return NextResponse.json({ ok: true })
}
