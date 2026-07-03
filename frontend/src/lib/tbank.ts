import crypto from 'crypto'

// T-Bank (Tinkoff) Internet Acquiring API Integration
// Supports: demo, sandbox, live modes

export interface TBankConfig {
  terminalKey: string
  password: string
  mode: 'demo' | 'sandbox' | 'live'
}

export interface PaymentInitRequest {
  TerminalKey: string
  Amount: number // in kopecks
  OrderId: string
  Description: string
  CustomerEmail?: string
  CustomerPhone?: string
  NotificationURL?: string
  SuccessURL?: string
  FailURL?: string
  DATA?: string
}

export interface PaymentInitResponse {
  Success: boolean
  PaymentId: string
  PaymentURL: string
  ErrorMessage?: string
}

export interface TBankNotification {
  TerminalKey: string
  OrderId: string
  Success: string
  Status: string
  PaymentId: string
  ErrorCode: string
  Amount: string
  Token: string
  CardId?: string
  PAN?: string
  ExpDate?: string
  RebillingId?: string
}

// Get T-Bank API endpoint based on mode
function getTBankEndpoint(mode: string): string {
  switch (mode) {
    case 'sandbox':
      return 'https://rest-api-test.tinkoff.ru/v2'
    case 'live':
      return 'https://securepay.tinkoff.ru/v2'
    default:
      return '' // demo mode doesn't call T-Bank
  }
}

// Generate T-Bank request token (SHA-256)
// Sort all parameters alphabetically, concatenate values, append Password
export function generateToken(params: Record<string, string | number | boolean>, password: string): string {
  const sortedKeys = Object.keys(params)
    .filter(k => k !== 'Token' && k !== 'DATA')
    .sort()

  const values = sortedKeys.map(k => String(params[k]))
  values.push(password)

  const concatenated = values.join('')
  return crypto.createHash('sha256').update(concatenated).digest('hex')
}

// Verify T-Bank notification token
export function verifyNotificationToken(notification: TBankNotification, password: string): boolean {
  const { Token, DATA, ...rest } = notification as Record<string, string>

  const sortedKeys = Object.keys(rest).filter(k => k !== 'Token' && k !== 'DATA' && k !== 'DATA').sort()
  const values = sortedKeys.map(k => String(rest[k]))
  values.push(password)

  const concatenated = values.join('')
  const expectedToken = crypto.createHash('sha256').update(concatenated).digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(Token),
    Buffer.from(expectedToken)
  )
}

// Initialize a payment
export async function initPayment(
  config: TBankConfig,
  request: PaymentInitRequest
): Promise<PaymentInitResponse> {
  if (config.mode === 'demo') {
    // Demo mode: return a mock response with local redirect
    return {
      Success: true,
      PaymentId: `demo_${Date.now()}`,
      PaymentURL: `/checkout/status?order=${request.OrderId}&status=mock`,
    }
  }

  const endpoint = getTBankEndpoint(config.mode)
  if (!endpoint) {
    throw new Error(`Unknown T-Bank mode: ${config.mode}`)
  }

  const params: Record<string, string | number | boolean> = {
    TerminalKey: request.TerminalKey,
    Amount: request.Amount,
    OrderId: request.OrderId,
    Description: request.Description,
  }

  if (request.CustomerEmail) params.CustomerEmail = request.CustomerEmail
  if (request.CustomerPhone) params.CustomerPhone = request.CustomerPhone
  if (request.NotificationURL) params.NotificationURL = request.NotificationURL
  if (request.SuccessURL) params.SuccessURL = request.SuccessURL
  if (request.FailURL) params.FailURL = request.FailURL

  params.Token = generateToken(params, config.password)

  const response = await fetch(`${endpoint}/Init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  const data = await response.json()
  return data as PaymentInitResponse
}

// Get default demo config
export function getDemoTBankConfig(): TBankConfig {
  return {
    terminalKey: process.env.TBANK_TERMINAL_KEY || '1700000000000DEMO',
    password: process.env.TBANK_PASSWORD || 'demo_password',
    mode: (process.env.TBANK_MODE as 'demo' | 'sandbox' | 'live') || 'demo',
  }
}

// Map T-Bank status to our order status
export function mapTBankStatus(tbankStatus: string): string {
  switch (tbankStatus) {
    case 'AUTHORIZED':
      return 'AUTHORIZED'
    case 'CONFIRMED':
      return 'CONFIRMED'
    case 'REJECTED':
    case 'CANCELED':
      return 'REJECTED'
    case 'REFUNDED':
      return 'REFUNDED'
    default:
      return 'PENDING'
  }
}