import { NextRequest, NextResponse } from 'next/server'
import { db, commitDb } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const ticket = await db.supportTicket.findUnique({
      where: { id },
      include: {
        site: { select: { id: true, name: true, slug: true, primaryColor: true } },
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Get ticket error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { reply, status } = body

    const ticket = await db.supportTicket.findUnique({ where: { id } })
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (reply) {
      data.reply = reply
      if (!status) {
        data.status = 'replied'
      }
    }
    if (status) {
      const validStatuses = ['open', 'replied', 'closed']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      data.status = status
    }

    const updated = await db.supportTicket.update({
      where: { id },
      data,
      include: {
        site: { select: { id: true, name: true, slug: true } },
      },
    })

    try { await commitDb() } catch (e) { console.error('DB commit failed:', e) }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update ticket error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}