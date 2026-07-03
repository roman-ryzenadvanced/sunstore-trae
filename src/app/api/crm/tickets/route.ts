import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const skip = (page - 1) * limit

    const where: Prisma.SupportTicketWhereInput = {}
    if (siteId) {
      where.siteId = siteId
    }
    if (status) {
      where.status = status
    }

    const [tickets, total] = await Promise.all([
      db.supportTicket.findMany({
        where,
        include: {
          site: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.supportTicket.count({ where }),
    ])

    return NextResponse.json({
      data: tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('List tickets error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { siteId, name, email, subject, message } = body

    if (!siteId || !name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const site = await db.site.findUnique({ where: { id: siteId } })
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    const ticket = await db.supportTicket.create({
      data: {
        siteId,
        name,
        email,
        subject,
        message,
      },
    })

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error('Create ticket error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}