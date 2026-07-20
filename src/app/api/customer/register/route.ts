import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name, phone } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Check if customer already exists
    const existing = await db.customer.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Customer already exists' }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)

    const customer = await db.customer.create({
      data: {
        email,
        password: hashedPassword,
        name: name || '',
        phone: phone || '',
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ customer }, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Customer registration error:', error)
    return NextResponse.json({ error: `Internal server error: ${msg}` }, { status: 500 })
  }
}
