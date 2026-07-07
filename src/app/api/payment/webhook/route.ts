import { NextRequest, NextResponse } from 'next/server'
import { db, commitDb } from '@/lib/db'
import { verifyNotificationToken, getDemoTBankConfig, mapTBankStatus } from '@/lib/tbank'
import type { TBankNotification } from '@/lib/tbank'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Cast to TBank notification format
    const notification = body as unknown as TBankNotification

    if (!notification.Token || !notification.OrderId || !notification.Status) {
      return NextResponse.json({ error: 'Invalid notification' }, { status: 400 })
    }

    // Verify the token
    const config = getDemoTBankConfig()
    const isValid = verifyNotificationToken(notification, config.password)

    if (!isValid) {
      console.error('Invalid T-Bank notification token')
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Find the order
    const order = await db.siteOrder.findUnique({
      where: { id: notification.OrderId },
    })

    if (!order) {
      console.error(`Order ${notification.OrderId} not found for webhook`)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Map T-Bank status to our status
    const newStatus = mapTBankStatus(notification.Status)
    const isSuccessful = notification.Success === 'true' || notification.Status === 'CONFIRMED'

    // Update order status
    await db.siteOrder.update({
      where: { id: order.id },
      data: {
        status: newStatus,
        paymentId: notification.PaymentId || order.paymentId,
      },
    })

    // Update payment transaction
    const txStatus = isSuccessful
      ? (notification.Status === 'AUTHORIZED' ? 'authorized' : 'confirmed')
      : 'rejected'

    await db.paymentTransaction.upsert({
      where: { orderId: order.id },
      update: {
        tbankPaymentId: notification.PaymentId || '',
        status: txStatus,
        rawResponse: JSON.stringify(notification),
      },
      create: {
        orderId: order.id,
        siteId: order.siteId,
        tbankPaymentId: notification.PaymentId || '',
        amount: order.totalAmount,
        currency: order.currency,
        status: txStatus,
        rawResponse: JSON.stringify(notification),
      },
    })

    // If rejected, restore stock
    if (!isSuccessful) {
      const orderItems = await db.orderItem.findMany({
        where: { orderId: order.id },
      })
      for (const item of orderItems) {
        await db.siteProduct.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      }
    }

    try { await commitDb() } catch (e) { console.error('DB commit failed:', e) }

    return NextResponse.json({ OK: true })
  } catch (error) {
    console.error('Payment webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}