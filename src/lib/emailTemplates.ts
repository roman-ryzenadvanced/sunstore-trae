// Email templates for Sunstore transactional notifications

import type { Order } from '@/lib/mockDb'

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

/** Generate an order status update email template. */
export function orderStatusUpdateEmail(order: Order, baseUrl: string): EmailTemplate {
  const statusLabels: Record<string, string> = {
    pending: 'Ожидает обработки',
    paid: 'Оплачен',
    processing: 'В обработке',
    shipped: 'Отправлен',
    delivered: 'Доставлен',
    cancelled: 'Отменён',
  }

  const statusLabel = statusLabels[order.status] || order.status
  const orderUrl = `${baseUrl}/order?number=${order.orderNumber}`

  const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#000;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#18181b;border:1px solid #27272a;border-radius:12px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:#f59e0b;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#000;font-size:24px;font-weight:700;">Sunstore</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;color:#f5f5f7;">
              <p style="margin:0 0 16px;font-size:16px;">Здравствуйте, ${order.customerName}!</p>
              <p style="margin:0 0 24px;font-size:16px;">
                Статус вашего заказа <strong style="color:#f59e0b;">${order.orderNumber}</strong> изменён:
              </p>
              <p style="margin:0 0 24px;font-size:20px;font-weight:700;color:#f59e0b;">${statusLabel}</p>
              <table width="100%" cellpadding="12" cellspacing="0" style="background:#27272a;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="color:#a1a1aa;font-size:14px;border-bottom:1px solid #3f3f46;">Сумма</td>
                  <td style="color:#f5f5f7;font-size:14px;text-align:right;border-bottom:1px solid #3f3f46;">${order.totalAmount.toLocaleString('ru-RU')} ₽</td>
                </tr>
                <tr>
                  <td style="color:#a1a1aa;font-size:14px;border-bottom:1px solid #3f3f46;">Способ оплаты</td>
                  <td style="color:#f5f5f7;font-size:14px;text-align:right;border-bottom:1px solid #3f3f46;">${order.paymentMethod}</td>
                </tr>
                <tr>
                  <td style="color:#a1a1aa;font-size:14px;">Дата обновления</td>
                  <td style="color:#f5f5f7;font-size:14px;text-align:right;">${new Date(order.updatedAt).toLocaleDateString('ru-RU')}</td>
                </tr>
              </table>
              <p style="margin:0 0 24px;text-align:center;">
                <a href="${orderUrl}" style="display:inline-block;background:#f59e0b;color:#000;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">
                  Посмотреть заказ
                </a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #27272a;text-align:center;">
              <p style="margin:0;color:#71717a;font-size:12px;">
                © ${new Date().getFullYear()} Sunstore. Солнечное оборудование для вашего дома.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  const text = `
Sunstore — Обновление статуса заказа

Здравствуйте, ${order.customerName}!

Статус вашего заказа ${order.orderNumber} изменён: ${statusLabel}

Сумма: ${order.totalAmount.toLocaleString('ru-RU')} ₽
Способ оплаты: ${order.paymentMethod}
Дата обновления: ${new Date(order.updatedAt).toLocaleDateString('ru-RU')}

Посмотреть заказ: ${orderUrl}

© ${new Date().getFullYear()} Sunstore
  `.trim()

  return {
    subject: `Sunstore — Заказ ${order.orderNumber}: ${statusLabel}`,
    html,
    text,
  }
}
