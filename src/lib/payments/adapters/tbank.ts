/**
 * T-Bank (Tinkoff) acquiring adapter.
 * Sandbox: https://rest-api-test.tinkoff.ru/v2/
 * Live:    https://securepay.tinkoff.ru/v2/
 * Signing: SHA256 over sorted param values (excl. Token & TerminalKey) + Password.
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
import { toKopecks, credsFor } from '../types'

const URLS: Record<GatewayMode, string> = {
  sandbox: 'https://rest-api-test.tinkoff.ru/v2/',
  live: 'https://securepay.tinkoff.ru/v2/'
}

function sign(params: Record<string, unknown>, password: string): string {
  const values = Object.entries(params)
    .filter(
      ([key, value]) =>
        value !== null &&
        value !== undefined &&
        key !== 'Token' &&
        key !== 'TerminalKey' &&
        typeof value !== 'object'
    )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => String(value))
    .join('')

  return crypto.createHash('sha256').update(values + password).digest('hex')
}

export const tbankAdapter: GatewayAdapter = {
  id: 'tbank',
  meta: {
    name: 'Т-Банк (Тинькофф)',
    short: 'Т',
    description: 'Эквайринг Т-Банка: карты РФ, СБП, T-Pay. Популярный выбор для интернет-магазинов.',
    popular: true,
    methods: ['Карты РФ', 'СБП', 'T-Pay'],
    docsUrl: 'https://www.tinkoff.ru/kassa/develop/api/payments/'
  },

  requiredFields(mode: GatewayMode): CredentialField[] {
    return [
      {
        key: 'terminalKey',
        label: 'Terminal Key',
        placeholder: mode === 'sandbox' ? 'TestTerminal...' : '1234567890'
      },
      {
        key: 'secretKey',
        label: 'Пароль (Secret)',
        secret: true,
        placeholder: 'Пароль из личного кабинета'
      }
    ]
  },

  async createPayment(req: PaymentRequest, cfg: GatewayConfig): Promise<PaymentResult> {
    const creds = credsFor(cfg)
    const terminalKey = creds.terminalKey || ''
    const password = creds.secretKey || ''
    const base = URLS[cfg.mode]

    const params: Record<string, unknown> = {
      Amount: toKopecks(req.amount),
      OrderId: req.orderId,
      Description: req.description,
      CustomerKey: req.customer?.email || req.orderId,
      DATA: {
        Email: req.customer?.email || '',
        Phone: req.customer?.phone || ''
      }
    }

    const body = {
      ...params,
      TerminalKey: terminalKey,
      Token: sign(params, password)
    }

    try {
      const res = await fetch(base + 'Init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()

      if (data.Success && data.PaymentURL) {
        return {
          ok: true,
          status: 'pending',
          paymentId: String(data.PaymentId ?? ''),
          paymentUrl: data.PaymentURL,
          raw: data
        }
      }
      return {
        ok: false,
        status: 'failed',
        error: data.Message || data.Details || `Ошибка T-Bank (код ${data.ErrorCode ?? '?'})`,
        raw: data
      }
    } catch (e: any) {
      return { ok: false, status: 'failed', error: e?.message || 'Сетевая ошибка' }
    }
  },

  async verifyCallback(body: any, _headers, cfg: GatewayConfig): Promise<CallbackResult> {
    const creds = credsFor(cfg)
    const password = creds.secretKey || ''
    const received = body?.Token
    const calculated = sign(body || {}, password)

    let verified = false
    if (received && calculated) {
      const a = Buffer.from(String(received))
      const b = Buffer.from(calculated)
      verified = a.length === b.length && crypto.timingSafeEqual(a, b)
    }

    const status = String(body?.Status || '').toUpperCase()
    return {
      verified,
      orderId: body?.OrderId,
      paymentId: body?.PaymentId ? String(body.PaymentId) : undefined,
      status:
        status === 'CONFIRMED'
          ? 'succeeded'
          : status === 'REJECTED' || status === 'CANCELED'
            ? 'failed'
            : 'pending',
      amount: body?.Amount ? Number(body.Amount) / 100 : undefined,
      raw: body
    }
  },

  async getStatus(paymentId: string, cfg: GatewayConfig): Promise<{ status: string; raw?: any }> {
    const creds = credsFor(cfg)
    const params: Record<string, unknown> = {
      PaymentId: paymentId,
      TerminalKey: creds.terminalKey || ''
    }
    const body = { ...params, Token: sign(params, creds.secretKey || '') }
    try {
      const res = await fetch(URLS[cfg.mode] + 'GetState', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      return { status: String(data.Status || 'unknown'), raw: data }
    } catch (e: any) {
      return { status: 'error', raw: { error: e?.message } }
    }
  },

  async testConnection(cfg: GatewayConfig): Promise<{ success: boolean; message: string }> {
    const creds = credsFor(cfg)
    if (!creds.terminalKey || !creds.secretKey) {
      return { success: false, message: 'Заполните Terminal Key и Пароль' }
    }
    // Read-only probe: GetState on a non-existent payment validates signing + connectivity
    // without creating a charge (works for both sandbox and live).
    const params: Record<string, unknown> = {
      PaymentId: '0',
      TerminalKey: creds.terminalKey
    }
    const body = { ...params, Token: sign(params, creds.secretKey || '') }
    try {
      const res = await fetch(URLS[cfg.mode] + 'GetState', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      // A structured T-Bank response (even an error code) proves the credentials reached the API.
      if (data && typeof data === 'object' && ('Success' in data || 'ErrorCode' in data)) {
        if (data.ErrorCode === '7' || data.Message?.toLowerCase().includes('не')) {
          return { success: true, message: 'Подключение успешно (доступ подтверждён)' }
        }
        return { success: true, message: 'Подключение успешно' }
      }
      return { success: false, message: 'Неожиданный ответ шлюза' }
    } catch (e: any) {
      return { success: false, message: 'Нет соединения со шлюзом: ' + (e?.message || '') }
    }
  }
}
