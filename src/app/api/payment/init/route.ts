import { NextRequest, NextResponse } from 'next/server'
import { db, commitDb } from '@/lib/db'
import { initPayment, getDemoTBankConfig, mapTBankStatus } from '@/lib/tbank'

function generateOrderNumber(): string {
  const now = new Date()
  const y = now.getFullYear().toString().slice(-2)
  const m = (now.getMonth() + 1).toString().padStart(2, '0')
  const d = now.getDate().toString().padStart(2, '0')
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ORD-${y}${m}${d}-${rand}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { siteId, items, customerName, customerEmail, customerPhone } = body

    if (!siteId || !items || !items.length || !customerName || !customerEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify site exists
    const site = await db.site.findUnique({ where: { id: siteId } })
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Validate items and check stock
    const productIds = items.map((item: { productId: string }) => item.productId)
    const products = await db.siteProduct.findMany({
      where: { id: { in: productIds }, siteId },
    })

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: 'One or more products not found' }, { status: 400 })
    }

    for (const item of items) {
      const product = products.find(p => p.id === item.productId)
      if (!product || !product.active) {
        return NextResponse.json({ error: `Product ${item.productId} is not available` }, { status: 400 })
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.title}` },
          { status: 400 }
        )
      }
    }

    // Calculate total
    let totalAmount = 0
    const orderItemsData: Array<{
      productId: string
      title: string
      price: number
      quantity: number
    }> = []

    for (const item of items) {
      const product = products.find(p => p.id === item.productId)!
      const lineTotal = product.price * item.quantity
      totalAmount += lineTotal
      orderItemsData.push({
        productId: product.id,
        title: product.title,
        price: product.price,
        quantity: item.quantity,
      })
    }

    // Generate order number
    let orderNumber = generateOrderNumber()
    let orderExists = await db.siteOrder.findUnique({ where: { orderNumber } })
    while (orderExists) {
      orderNumber = generateOrderNumber()
      orderExists = await db.siteOrder.findUnique({ where: { orderNumber } })
    }

    // Create order with status NEW
    const order = await db.siteOrder.create({
      data: {
        siteId,
        orderNumber,
        status: 'NEW',
        customerName,
        customerEmail,
        customerPhone: customerPhone || '',
        totalAmount,
        currency: 'RUB',
      },
    })

    // Create order items
    await db.orderItem.createMany({
      data: orderItemsData.map(item => ({
        orderId: order.id,
        productId: item.productId,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
      })),
    })

    // Decrement stock
    for (const item of items) {
      await db.siteProduct.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })
    }

    // Update order to PENDING
    await db.siteOrder.update({
      where: { id: order.id },
      data: { status: 'PENDING' },
    })

    // Initiate T-Bank payment
    const tbankConfig = getDemoTBankConfig()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.APP_URL || ''

    const paymentResult = await initPayment(tbankConfig, {
      TerminalKey: tbankConfig.terminalKey,
      Amount: Math.round(totalAmount * 100), // Convert to kopecks
      OrderId: order.id,
      Description: `Order ${orderNumber} - ${site.name}`,
      CustomerEmail: customerEmail,
      CustomerPhone: customerPhone || undefined,
      NotificationURL: `${baseUrl}/api/payment/webhook`,
      SuccessURL: `${baseUrl}/checkout/success?order=${order.id}`,
      FailURL: `${baseUrl}/checkout/fail?order=${order.id}`,
    })

    if (!paymentResult.Success) {
      // Revert stock on payment init failure
      for (const item of items) {
        await db.siteProduct.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      }
      await db.siteOrder.update({
        where: { id: order.id },
        data: { status: 'REJECTED' },
      })
      return NextResponse.json(
        { error: paymentResult.ErrorMessage || 'Payment initialization failed' },
        { status: 400 }
      )
    }

    // Create payment transaction record
    await db.paymentTransaction.create({
      data: {
        orderId: order.id,
        siteId,
        tbankPaymentId: paymentResult.PaymentId,
        amount: totalAmount,
        currency: 'RUB',
        status: 'pending',
        rawRequest: JSON.stringify({
          Amount: Math.round(totalAmount * 100),
          OrderId: order.id,
          Description: `Order ${orderNumber}`,
        }),
      },
    })

    // Update order with payment info
    await db.siteOrder.update({
      where: { id: order.id },
      data: {
        paymentId: paymentResult.PaymentId,
        paymentUrl: paymentResult.PaymentURL,
        paymentMode: tbankConfig.mode,
      },
    })

    try { await commitDb() } catch (e) { console.error('DB commit failed:', e) }

    return NextResponse.json({
      orderId: order.id,
      orderNumber,
      paymentUrl: paymentResult.PaymentURL,
      totalAmount,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Payment init error:', error)
    return NextResponse.json({ error: `Internal server error: ${msg}` }, { status: 500 })
  }
}