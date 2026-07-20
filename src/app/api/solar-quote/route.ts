import { NextRequest, NextResponse } from 'next/server'
import { db, commitDb } from '@/lib/db'

interface QuoteRequest {
  email: string
  name?: string
  phone?: string
  panels: number
  inverter: number
  battery: number
  total: number
  monthly: number
  siteId?: string
  consumption: number
  installationType: 'roof' | 'fence' | 'balcony'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      name,
      phone,
      panels,
      inverter,
      battery,
      total,
      monthly,
      siteId,
      consumption,
      installationType,
    } = body as QuoteRequest

    if (!email || !total) {
      return NextResponse.json({ error: 'Email and total are required' }, { status: 400 })
    }

    // Find a default site for quotes if siteId is invalid
    let validSiteId = siteId
    if (validSiteId) {
      const siteExists = await db.site.findUnique({ where: { id: validSiteId }, select: { id: true } })
      if (!siteExists) {
        validSiteId = undefined
      }
    }
    
    // If still no valid siteId, use the first site or create a placeholder
    if (!validSiteId) {
      const firstSite = await db.site.findFirst({ select: { id: true } })
      validSiteId = firstSite?.id || undefined
    }

    // Use existing SiteOrder for storing quotes
    const orderNumber = `QUOTE-${Date.now()}`
    
    // Build the quote note as a compact string
    const quoteNote = `QUOTE|panels=${panels}|inverter=${inverter}|battery=${battery}|consumption=${consumption}|installation=${installationType}|monthly=${monthly}`
    
    // Create the quote order - siteId is required, so we must have one
    const order = await db.siteOrder.create({
      data: {
        siteId: validSiteId || 'placeholder',
        orderNumber,
        status: 'QUOTE',
        customerName: name || email,
        customerEmail: email,
        customerPhone: phone || '',
        totalAmount: total,
        currency: 'RUB',
        paymentMode: 'quote',
        note: quoteNote,
      },
    })

    try {
      await commitDb()
    } catch (e) {
      console.error('DB commit failed:', e)
    }

    return NextResponse.json({
      success: true,
      message: 'Quote request received! Check your email for the detailed proposal.',
      orderNumber,
    })
  } catch (error: any) {
    console.error('Quote submission error:', error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}