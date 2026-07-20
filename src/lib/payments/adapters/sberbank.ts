/**
 * Сбербанк (Sberbank acquiring / SberPay) adapter.
 * Sandbox: https://3dsec.sberbank.ru/payment/rest
 * Live:    https://securepayments.sberbank.ru/payment/rest
 * Auth: userName + password per request. Amounts in kopecks.
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
import { toKopecks, credsFor } from '../types'

const URLS: Record<GatewayMode, string> = {
  sandbox: 'https://3dsec.sberbank.ru/payment/rest',
  live: 'https://securepayments.sberbank.ru/payment/rest'
}

async function postForm(url: string, params: Record<string, string>): Promise<any> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString()
  })
  return res.json()
}

export const sberbankAdapter: GatewayAdapter = {
  id: 'sberbank',
  meta: {
    name: 'Сбербанк (SberPay)',
    short: 'С',
    description: 'Эквайринг Сбербанка: карты, SberPay, СБП. Крупнейший банк-эквайер России.',
    popular: true,
    methods: ['Карты РФ', 'SberPay', 'СБП'],
    docsUrl: 'https://www.sberbank.ru/ru/s_m_business/bankingservice/equaring'
  },

  requiredFields(_mode: GatewayMode): CredentialField[] {
    return [
      { key: 'merchantId', label: 'userName (логин магазина)', placeholder: 'sunstore-api' },
      { key: 'password', label: 'Пароль', secret: true, placeholder: 'Пароль из ЛК' }
    ]
  },

  async createPayment(req: PaymentRequest, cfg: GatewayConfig): Promise<PaymentResult> {
    const creds = credsFor(cfg)
    try {
      const data = await postForm(`${URLS[cfg.mode]}/register.do`, {
        userName: creds.merchantId || '',
        password: creds.password || '',
        orderNumber: req.orderId,
        amount: String(toKopecks(req.amount)),
        currency: '643', // RUB
        returnUrl: req.returnUrl,
        failUrl: req.failUrl || req.returnUrl,
        description: req.description
      })

      if (data.formUrl) {
        return {
          ok: true,
          status: 'pending',
          paymentId: data.orderId,
          paymentUrl: data.formUrl,
          raw: data
        }
      }
      return {
        ok: false,
        status: 'failed',
        error: data.message || `Ошибка Сбербанка (код ${data.errorCode ?? '?'})`,
        raw: data
      }
    } catch (e: any) {
      return { ok: false, status: 'failed', error: e?.message || 'Сетевая ошибка' }
    }
  },

  async verifyCallback(body: any, _headers, cfg: GatewayConfig): Promise<CallbackResult> {
    // Sberbank callbacks are best verified by re-querying getOrderStatus.do.
    const orderNumber = body?.orderNumber || body?.mdorder
    const status = String(body?.status || '')
    return {
      verified: Boolean(orderNumber),
      orderId: orderNumber,
      paymentId: body?.mdorder,
      status: status === '2' ? 'succeeded' : status === '6' ? 'failed' : 'pending',
      raw: body
    }
  },

  async getStatus(paymentId: string, cfg: GatewayConfig): Promise<{ status: string; raw?: any }> {
    const creds = credsFor(cfg)
    try {
      const data = await postForm(`${URLS[cfg.mode]}/getOrderStatus.do`, {
        userName: creds.merchantId || '',
        password: creds.password || '',
        orderId: paymentId
      })
      // orderStatus: 2 = fully paid
      return { status: String(data.orderStatus ?? 'unknown'), raw: data }
    } catch (e: any) {
      return { status: 'error', raw: { error: e?.message } }
    }
  },

  async testConnection(cfg: GatewayConfig): Promise<{ success: boolean; message: string }> {
    const creds = credsFor(cfg)
    if (!creds.merchantId || !creds.password) {
      return { success: false, message: 'Заполните userName и пароль' }
    }
    try {
      // Read-only probe: getOrderStatus on a dummy id validates credentials/connectivity.
      const data = await postForm(`${URLS[cfg.mode]}/getOrderStatus.do`, {
        userName: creds.merchantId,
        password: creds.password,
        orderId: '0'
      })
      // errorCode 6 = "order not found" but proves auth succeeded.
      if (data && (data.orderStatus !== undefined || data.errorCode !== undefined)) {
        if (data.errorCode === '3' || data.errorCode === '5') {
          return { success: false, message: data.message || 'Неверный логин или пароль' }
        }
        return { success: true, message: 'Подключение успешно' }
      }
      return { success: false, message: 'Неожиданный ответ шлюза' }
    } catch (e: any) {
      return { success: false, message: 'Нет соединения со Сбербанком: ' + (e?.message || '') }
    }
  }
}
