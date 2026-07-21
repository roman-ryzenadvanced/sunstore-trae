import { NextRequest, NextResponse } from 'next/server'
import { addSubscriber } from '@/lib/mockDb'

export const dynamic = 'force-dynamic'

/** POST /api/newsletter/subscribe — public footer subscription. Body: { email, name? } */
export async function POST(request: NextRequest) {
  const { email, name } = await request.json().catch(() => ({}))

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: true })
  }

  addSubscriber(email, name, 'footer')

  return NextResponse.json({ ok: true })
}
