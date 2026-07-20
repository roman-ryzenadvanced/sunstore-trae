/**
 * ЮKassa (YooMoney) adapter.
 * API: https://api.yookassa.ru/v3  (sandbox = same endpoint with test shopId/secret).
 * Auth: HTTP Basic base64(shopId:secretKey).
 */
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

const BASE = 'https://api.yookassa.ru/v3'

function basicAuth(shopId: string, secret: string): string {
  return 'Basic ' + Buffer.from(`${shopId}:${secret}`).toString('base64')
}

export const yookassaAdapter: GatewayAdapter = {
  id: 'yookassa',
  meta: {
    name: 'ЮKassa (Яндекс)',
    short: 'Ю',
    description: 'ЮKassa от ЮMoney: карты, СБП, SberPay, кошельки. Один из самых популярных шлюзов РФ.',
    popular: true,
    methods: ['Карты РФ', 'СБП', 'SberPay', 'Кошельки'],
    docsUrl: 'https://yookassa.ru/developers/api'
  },

  requiredFields(_mode: GatewayMode): CredentialField[] {
    return [
      { key: 'shopId', label: 'shopId (идентификатор магазина)', placeholder: '123456' },
      {
        key: 'secretKey',
        label: 'Секретный ключ',
        secret: true,
        placeholder: 'live_xxxxxxxx / test_xxxxxxxx'
      }
    ]
  },

  async createPayment(req: PaymentRequest, cfg: GatewayConfig): Promise<PaymentResult> {
    const creds = credsFor(cfg)
    const shopId = creds.shopId || ''
    const secret = creds.secretKey || ''

    try {
      const res = await fetch(`${BASE}/payments`, {
        method: 'POST',
        headers: {
          Authorization: basicAuth(shopId, secret),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: { value: req.amount.toFixed(2), currency: req.currency || 'RUB' },
          description: req.description,
          confirmation: { type: 'redirect', return_url: req.returnUrl },
          metadata: { orderId: req.orderId }
        })
      })
      const data = await res.json()

      if (res.ok && data.confirmation?.confirmation_url) {
        return {
          ok: true,
          status: 'pending',
          paymentId: data.id,
          paymentUrl: data.confirmation.confirmation_url,
          raw: data
        }
      }
      return {
        ok: false,
        status: 'failed',
        error: data.description || data.message || 'Ошибка ЮKassa',
        raw: data
      }
    } catch (e: any) {
      return { ok: false, status: 'failed', error: e?.message || 'Сетевая ошибка' }
    }
  },

  async verifyCallback(body: any, _headers, _cfg: GatewayConfig): Promise<CallbackResult> {
    // ЮKassa notifications carry the full payment object under `object`.
    const obj = body?.object || {}
    const status = String(obj.status || '')
    return {
      verified: Boolean(obj.id),
      orderId: obj.metadata?.orderId,
      paymentId: obj.id,
      status:
        status === 'succeeded'
          ? 'succeeded'
          : status === 'canceled'
            ? 'failed'
            : 'pending',
      amount: obj.amount?.value ? Number(obj.amount.value) : undefined,
      raw: body
    }
  },

  async getStatus(paymentId: string, cfg: GatewayConfig): Promise<{ status: string; raw?: any }> {
    const creds = credsFor(cfg)
    try {
      const res = await fetch(`${BASE}/payments/${paymentId}`, {
        headers: { Authorization: basicAuth(creds.shopId || '', creds.secretKey || '') }
      })
      const data = await res.json()
      return { status: String(data.status || 'unknown'), raw: data }
    } catch (e: any) {
      return { status: 'error', raw: { error: e?.message } }
    }
  },

  async testConnection(cfg: GatewayConfig): Promise<{ success: boolean; message: string }> {
    const creds = credsFor(cfg)
    if (!creds.shopId || !creds.secretKey) {
      return { success: false, message: 'Заполните shopId и секретный ключ' }
    }
    try {
      const res = await fetch(`${BASE}/payments?limit=1`, {
        headers: { Authorization: basicAuth(creds.shopId, creds.secretKey) }
      })
      if (res.ok) return { success: true, message: 'Подключение успешно' }
      if (res.status === 401 || res.status === 403) {
        return { success: false, message: 'Неверный shopId или секретный ключ' }
      }
      const data = await res.json().catch(() => ({}))
      return { success: false, message: data.description || `Ошибка (HTTP ${res.status})` }
    } catch (e: any) {
      return { success: false, message: 'Нет соединения с ЮKassa: ' + (e?.message || '') }
    }
  }
}
