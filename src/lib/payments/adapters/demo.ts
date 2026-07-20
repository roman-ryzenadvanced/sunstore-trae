/**
 * Demo gateway — zero-credentials test mode.
 * createPayment redirects to an internal /pay/demo/[orderId] page where the
 * store owner can simulate a successful or failed payment. Enabled by default
 * so checkout works out of the box before real merchant keys are added.
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

export const demoAdapter: GatewayAdapter = {
  id: 'demo',
  meta: {
    name: 'Демо-режим',
    short: 'D',
    description: 'Тестовый режим без реальных списаний. Имитация успешной или отклонённой оплаты.',
    popular: false,
    methods: ['Имитация оплаты']
  },

  requiredFields(_mode: GatewayMode): CredentialField[] {
    return []
  },

  async createPayment(req: PaymentRequest, _cfg: GatewayConfig): Promise<PaymentResult> {
    return {
      ok: true,
      status: 'pending',
      paymentId: req.orderId,
      paymentUrl: `/pay/demo/${encodeURIComponent(req.orderId)}`
    }
  },

  async verifyCallback(body: any, _headers, _cfg: GatewayConfig): Promise<CallbackResult> {
    return {
      verified: true,
      orderId: body?.orderId,
      paymentId: body?.orderId,
      status: body?.status === 'failed' ? 'failed' : 'succeeded',
      raw: body
    }
  },

  async getStatus(_paymentId: string, _cfg: GatewayConfig): Promise<{ status: string; raw?: any }> {
    return { status: 'succeeded', raw: { note: 'demo' } }
  },

  async testConnection(_cfg: GatewayConfig): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Демо-режим активен' }
  }
}
