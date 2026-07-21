import { NextRequest, NextResponse } from 'next/server'
import { getAllOrders, updateOrderStatus, getOrderById } from '@/lib/mockDb'
import { isAdminAuthenticated } from '@/lib/adminAuth'
import { getEmailConfig, sendEmail } from '@/lib/emailService'
import { orderStatusUpdateEmail } from '@/lib/emailTemplates'

export const dynamic = 'force-dynamic'

/** GET /api/admin/orders — all orders, newest first. */
export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
  }
  return NextResponse.json({ orders: getAllOrders() })
}

/** POST /api/admin/orders — update an order's status. Body: { id, status } */
export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
  }
  const { id, status } = await request.json().catch(() => ({}))
  if (!id || !status) {
    return NextResponse.json({ error: 'Нужны id и status' }, { status: 400 })
  }
  const updated = updateOrderStatus(id, status)
  if (!updated) {
    return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 })
  }

  // After successful status update, send email notification
  const emailConfig = getEmailConfig()
  if (emailConfig.isActive && updated.customerEmail) {
    const template = orderStatusUpdateEmail(updated, 'https://sunstore.vercel.app')
    sendEmail(updated.customerEmail, template.subject, template.html, template.text).catch(() => {})
  }

  return NextResponse.json({ ok: true, order: updated })
}
