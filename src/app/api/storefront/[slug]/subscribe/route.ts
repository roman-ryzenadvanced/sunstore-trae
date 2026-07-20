import { NextRequest, NextResponse } from 'next/server'
import { db, commitDb } from '@/lib/db'

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const body = await request.json()
    const { email } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    // Find site by slug
    const site = await db.site.findUnique({ where: { slug } })
    if (!site) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Upsert subscriber
    await db.subscriber.upsert({
      where: {
        siteId_email: {
          siteId: site.id,
          email,
        },
      },
      update: { email },
      create: {
        siteId: site.id,
        email,
      },
    })

    try { await commitDb() } catch (e) { console.error('DB commit failed:', e) }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
