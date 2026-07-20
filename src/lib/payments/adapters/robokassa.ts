/**
 * Робокасса (Robokassa) adapter — redirect-based.
 * Checkout URL: https://auth.robokassa.ru/Merchant/Index.aspx (IsTest=1 for sandbox).
 * SignatureValue (request) = MD5(MerchantLogin:OutSum:InvId:Password1).
 * Callback signature       = MD5(OutSum:InvId:Password2).
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

const BASE = 'https://auth.robokassa.ru/Merchant/Index.aspx'

const md5 = (s: string) => crypto.createHash('md5').update(s).digest('hex')

export const robokassaAdapter: GatewayAdapter = {
  id: 'robokassa',
  meta: {
    name: 'Робокасса',
    short: 'R',
    description: 'Робокасса: простой приём платежей без юрлица — карты, СБП, кошельки.',
    popular: false,
    methods: ['Карты', 'СБП', 'Кошельки'],
    docsUrl: 'https://docs.robokassa.ru/'
  },

  requiredFields(_mode: GatewayMode): CredentialField[] {
    return [
      { key: 'merchantId', label: 'MerchantLogin (идентификатор магазина)', placeholder: 'sunstore' },
      { key: 'password', label: 'Пароль №1', secret: true, placeholder: 'Password1' },
      { key: 'apiKey', label: 'Пароль №2 (для уведомлений)', secret: true, placeholder: 'Password2' }
    ]
  },

  async createPayment(req: PaymentRequest, cfg: GatewayConfig): Promise<PaymentResult> {
    const creds = credsFor(cfg)
    const login = creds.merchantId || ''
    const pass1 = creds.password || ''
    if (!login || !pass1) {
      return { ok: false, status: 'failed', error: 'Не заполнены данные магазина' }
    }

    const outSum = req.amount.toFixed(2)
    const invId = req.orderId
    const signature = md5(`${login}:${outSum}:${invId}:${pass1}`).toUpperCase()

    const params = new URLSearchParams({
      MerchantLogin: login,
      OutSum: outSum,
      InvId: invId,
      Description: req.description,
      SignatureValue: signature,
      Culture: 'ru',
      Encoding: 'utf-8'
    })
    if (cfg.mode === 'sandbox') params.set('IsTest', '1')
    if (req.returnUrl) params.set('SuccessURL', req.returnUrl)
    if (req.failUrl) params.set('FailURL', req.failUrl)

    return {
      ok: true,
      status: 'pending',
      paymentId: invId,
      paymentUrl: `${BASE}?${params.toString()}`
    }
  },

  async verifyCallback(body: any, _headers, cfg: GatewayConfig): Promise<CallbackResult> {
    const creds = credsFor(cfg)
    const pass2 = creds.apiKey || creds.password || ''
    const outSum = String(body?.OutSum ?? '')
    const invId = String(body?.InvId ?? '')
    const received = String(body?.SignatureValue ?? '').toUpperCase()
    const calculated = md5(`${outSum}:${invId}:${pass2}`).toUpperCase()

    return {
      verified: Boolean(received) && received === calculated,
      orderId: invId,
      paymentId: invId,
      status: 'succeeded',
      amount: outSum ? Number(outSum) : undefined,
      raw: body
    }
  },

  async getStatus(_paymentId: string, _cfg: GatewayConfig): Promise<{ status: string; raw?: any }> {
    // Classic Robokassa relies on result callbacks; there is no simple status endpoint.
    return { status: 'unknown', raw: { note: 'Status is delivered via callback' } }
  },

  async testConnection(cfg: GatewayConfig): Promise<{ success: boolean; message: string }> {
    const creds = credsFor(cfg)
    if (!creds.merchantId || !creds.password) {
      return { success: false, message: 'Заполните MerchantLogin и Пароль №1' }
    }
    // Robokassa has no auth-check endpoint; validate that credentials are present.
    return { success: true, message: 'Данные сохранены. Проверьте магазин тестовым платежом.' }
  }
}
