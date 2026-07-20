/**
 * Sunstore — Payment Gateway Abstraction
 * Unified contract for Russian payment providers with sandbox + live modes.
 */

export type GatewayId =
  | 'tbank'
  | 'yookassa'
  | 'sberbank'
  | 'cloudpayments'
  | 'robokassa'
  | 'demo'

export type GatewayMode = 'sandbox' | 'live'

/** Generic credential bag — each adapter reads the fields it needs. */
export interface GatewayCredentials {
  shopId?: string       // YooKassa shopId, CloudPayments publicId
  secretKey?: string    // YooKassa secret, T-Bank Password
  terminalKey?: string  // T-Bank TerminalKey
  merchantId?: string   // Sberbank userName, Robokassa MerchantLogin
  password?: string     // CloudPayments API password, Robokassa password
  apiKey?: string       // spare
}

export interface GatewayConfig {
  enabled: boolean
  mode: GatewayMode
  sandbox: GatewayCredentials
  live: GatewayCredentials
}

export interface PaymentCustomer {
  name?: string
  email?: string
  phone?: string
}

export interface PaymentRequest {
  orderId: string
  orderNumber?: string
  /** Amount in major units (RUB), e.g. 1250.50 */
  amount: number
  currency: string
  description: string
  customer?: PaymentCustomer
  returnUrl: string
  failUrl?: string
}

/** CloudPayments-style widget payload for gateways that use a client widget. */
export interface WidgetPayload {
  provider: 'cloudpayments'
  publicId: string
  amount: number
  currency: string
  invoiceId: string
  description: string
  email?: string
}

export interface PaymentResult {
  ok: boolean
  status?: 'pending' | 'processing' | 'succeeded' | 'failed'
  paymentId?: string
  /** Redirect URL for redirect-based gateways. */
  paymentUrl?: string
  /** Widget config for widget-based gateways (CloudPayments). */
  widget?: WidgetPayload
  raw?: any
  error?: string
}

export interface CallbackResult {
  verified: boolean
  orderId?: string
  paymentId?: string
  status?: 'succeeded' | 'failed' | 'pending' | 'refunded'
  amount?: number
  raw?: any
}

export interface CredentialField {
  key: keyof GatewayCredentials
  label: string
  secret?: boolean
  placeholder?: string
}

export interface GatewayMeta {
  name: string          // Russian display name
  short: string         // short logo code
  description: string   // Russian description
  popular?: boolean
  methods: string[]     // e.g. ['Карты', 'СБП']
  docsUrl?: string
}

export interface GatewayAdapter {
  id: GatewayId
  meta: GatewayMeta
  /** Fields the merchant must fill for a given mode. */
  requiredFields(mode: GatewayMode): CredentialField[]
  createPayment(req: PaymentRequest, cfg: GatewayConfig): Promise<PaymentResult>
  verifyCallback(
    body: any,
    headers: Record<string, string | string[] | undefined>,
    cfg: GatewayConfig
  ): Promise<CallbackResult>
  getStatus(paymentId: string, cfg: GatewayConfig): Promise<{ status: string; raw?: any }>
  testConnection(cfg: GatewayConfig): Promise<{ success: boolean; message: string }>
}

/** Convert major units (RUB) to kopecks. */
export const toKopecks = (amount: number): number => Math.round(amount * 100)

/** Pick the credential set for the configured mode. */
export const credsFor = (cfg: GatewayConfig): GatewayCredentials =>
  cfg.mode === 'live' ? cfg.live : cfg.sandbox
