/**
 * CloudPayments adapter (widget-based).
 * createPayment returns a WidgetPayload — the checkout page loads the CP widget
 * (https://widget.cloudpayments.ru/bundles/cloudpayments) and calls cp.pay().
 * Callbacks are signed with HMAC-SHA256(body, apiPassword).
 */
import crypto from 'crypto'
import type {
  GatewayAdapter,
  GatewayConfig,
  GatewayMode,
  CredentialField,
  PaymentRequest,
  PaymentResult,
  CallbackResult
} from '../types'
import { credsFor } from '../types'

const API = 'https://api.cloudpayments.ru'

function basicAuth(publicId: string, apiPassword: string): string {
  return 'Basic ' + Buffer.from(`${publicId}:${apiPassword}`).toString('base64')
}

export const cloudpaymentsAdapter: GatewayAdapter = {
  id: 'cloudpayments',
  meta: {
    name: 'CloudPayments',
    short: 'CP',
    description: 'CloudPayments: удобная платёжная форма-виджет, карты РФ и мира, СБП.',
    popular: false,
    methods: ['Карты', 'СБП', 'Виджет'],
    docsUrl: 'https://developers.cloudpayments.ru/'
  },

  requiredFields(_mode: GatewayMode): CredentialField[] {
    return [
      { key: 'shopId', label: 'Public ID', placeholder: 'pk_xxxxxxxx' },
      { key: 'password', label: 'API-пароль', secret: true, placeholder: 'API-пароль из ЛК' }
    ]
  },

  async createPayment(req: PaymentRequest, cfg: GatewayConfig): Promise<PaymentResult> {
    const creds = credsFor(cfg)
    const publicId = creds.shopId || ''
    if (!publicId) {
      return { ok: false, status: 'failed', error: 'Не указан Public ID' }
    }
    // Widget flow: no server charge; return payload for the client widget.
    return {
      ok: true,
      status: 'pending',
      paymentId: req.orderId,
      widget: {
        provider: 'cloudpayments',
        publicId,
        amount: req.amount,
        currency: req.currency || 'RUB',
        invoiceId: req.orderId,
        description: req.description,
        email: req.customer?.email
      }
    }
  },

  async verifyCallback(body: any, headers, cfg: GatewayConfig): Promise<CallbackResult> {
    const creds = credsFor(cfg)
    const apiPassword = creds.password || ''
    const signature = headers['x-signature'] || headers['X-Signature']

    let verified = false
    if (signature && apiPassword) {
      // CloudPayments signs the raw JSON body with HMAC-SHA256.
      const raw = typeof body === 'string' ? body : JSON.stringify(body)
      const hmac = crypto.createHmac('sha256', apiPassword).update(raw).digest('base64')
      const a = Buffer.from(String(signature))
      const b = Buffer.from(hmac)
      verified = a.length === b.length && crypto.timingSafeEqual(a, b)
    }

    const data = typeof body === 'string' ? safeParse(body) : body
    const status = String(data?.Status || '')
    return {
      verified,
      orderId: data?.InvoiceId,
      paymentId: data?.TransactionId ? String(data.TransactionId) : undefined,
      status: status === 'Completed' ? 'succeeded' : status === 'Rejected' ? 'failed' : 'pending',
      amount: data?.Amount ? Number(data.Amount) : undefined,
      raw: data
    }
  },

  async getStatus(paymentId: string, cfg: GatewayConfig): Promise<{ status: string; raw?: any }> {
    const creds = credsFor(cfg)
    try {
      const res = await fetch(`${API}/payments/transactions/list`, {
        method: 'POST',
        headers: {
          Authorization: basicAuth(creds.shopId || '', creds.password || ''),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          period: { fromDate: new Date(Date.now() - 86400000).toISOString(), toDate: new Date().toISOString() }
        })
      })
      const data = await res.json()
      const tx = (data?.Model || []).find((t: any) => String(t.InvoiceId) === String(paymentId))
      return { status: tx?.Status || 'unknown', raw: tx || data }
    } catch (e: any) {
      return { status: 'error', raw: { error: e?.message } }
    }
  },

  async testConnection(cfg: GatewayConfig): Promise<{ success: boolean; message: string }> {
    const creds = credsFor(cfg)
    if (!creds.shopId || !creds.password) {
      return { success: false, message: 'Заполните Public ID и API-пароль' }
    }
    try {
      const res = await fetch(`${API}/payments/transactions/list`, {
        method: 'POST',
        headers: {
          Authorization: basicAuth(creds.shopId, creds.password),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          period: { fromDate: new Date(Date.now() - 86400000).toISOString(), toDate: new Date().toISOString() }
        })
      })
      if (res.ok) return { success: true, message: 'Подключение успешно' }
      if (res.status === 401 || res.status === 403) {
        return { success: false, message: 'Неверный Public ID или API-пароль' }
      }
      return { success: false, message: `Ошибка (HTTP ${res.status})` }
    } catch (e: any) {
      return { success: false, message: 'Нет соединения с CloudPayments: ' + (e?.message || '') }
    }
  }
}

function safeParse(s: string): any {
  try {
    return JSON.parse(s)
  } catch {
    return {}
  }
}
