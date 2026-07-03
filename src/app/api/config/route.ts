import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const configs = await db.platformConfig.findMany({
      orderBy: { key: 'asc' },
    })

    // Convert to key-value object
    const configMap: Record<string, string> = {}
    for (const c of configs) {
      configMap[c.key] = c.value
    }

    return NextResponse.json(configMap)
  } catch (error) {
    console.error('Get config error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    const config = await db.platformConfig.upsert({
      where: { key },
      update: { value: value !== undefined ? String(value) : '' },
      create: { key, value: value !== undefined ? String(value) : '' },
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('Update config error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}