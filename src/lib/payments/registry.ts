/**
 * Sunstore — Payment gateway registry.
 * Central access point for adapters + effective config resolution
 * (runtime store-config overrides merged with env-var fallback).
 */
import type { GatewayAdapter, GatewayConfig, GatewayCredentials, GatewayId } from './types'
import { tbankAdapter } from './adapters/tbank'
import { yookassaAdapter } from './adapters/yookassa'
import { sberbankAdapter } from './adapters/sberbank'
import { cloudpaymentsAdapter } from './adapters/cloudpayments'
import { robokassaAdapter } from './adapters/robokassa'
import { demoAdapter } from './adapters/demo'
import { getStoreConfig } from '../storeConfig'

const ADAPTERS: Record<GatewayId, GatewayAdapter> = {
  tbank: tbankAdapter,
  yookassa: yookassaAdapter,
  sberbank: sberbankAdapter,
  cloudpayments: cloudpaymentsAdapter,
  robokassa: robokassaAdapter,
  demo: demoAdapter
}

export const GATEWAY_ORDER: GatewayId[] = [
  'tbank',
  'yookassa',
  'sberbank',
  'cloudpayments',
  'robokassa',
  'demo'
]

export function getGateway(id: GatewayId): GatewayAdapter {
  return ADAPTERS[id] || demoAdapter
}

export function listGateways(): GatewayAdapter[] {
  return GATEWAY_ORDER.map((id) => ADAPTERS[id])
}

/** Env-var fallback credentials, used when runtime config fields are empty. */
function envCredentials(id: GatewayId): { sandbox: GatewayCredentials; live: GatewayCredentials } {
  const env = process.env
  switch (id) {
    case 'tbank':
      return {
        sandbox: {
          terminalKey: env.TBANK_TERMINAL_KEY,
          secretKey: env.TBANK_SECRET || env.TBANK_SECRET_KEY
        },
        live: {
          terminalKey: env.TBANK_TERMINAL_KEY,
          secretKey: env.TBANK_SECRET || env.TBANK_SECRET_KEY
        }
      }
    case 'yookassa':
      return {
        sandbox: { shopId: env.YOOKASSA_SHOP_ID, secretKey: env.YOOKASSA_SECRET_KEY },
        live: { shopId: env.YOOKASSA_SHOP_ID, secretKey: env.YOOKASSA_SECRET_KEY }
      }
    case 'sberbank':
      return {
        sandbox: { merchantId: env.SBERBANK_USERNAME, password: env.SBERBANK_PASSWORD },
        live: { merchantId: env.SBERBANK_USERNAME, password: env.SBERBANK_PASSWORD }
      }
    case 'cloudpayments':
      return {
        sandbox: { shopId: env.CLOUDPAYMENTS_PUBLIC_ID, password: env.CLOUDPAYMENTS_API_PASSWORD },
        live: { shopId: env.CLOUDPAYMENTS_PUBLIC_ID, password: env.CLOUDPAYMENTS_API_PASSWORD }
      }
    case 'robokassa':
      return {
        sandbox: {
          merchantId: env.ROBOKASSA_MERCHANT_LOGIN,
          password: env.ROBOKASSA_PASSWORD1,
          apiKey: env.ROBOKASSA_PASSWORD2
        },
        live: {
          merchantId: env.ROBOKASSA_MERCHANT_LOGIN,
          password: env.ROBOKASSA_PASSWORD1,
          apiKey: env.ROBOKASSA_PASSWORD2
        }
      }
    default:
      return { sandbox: {}, live: {} }
  }
}

function mergeCreds(base: GatewayCredentials, fallback: GatewayCredentials): GatewayCredentials {
  const out: GatewayCredentials = { ...base }
  for (const [k, v] of Object.entries(fallback)) {
    const key = k as keyof GatewayCredentials
    if (!out[key] && v) out[key] = v
  }
  return out
}

/** Effective config for a gateway: runtime config + env fallback for empty fields. */
export function getEffectiveConfig(id: GatewayId): GatewayConfig {
  const cfg = getStoreConfig()
  const stored = cfg.gateways[id] || { enabled: false, mode: 'sandbox', sandbox: {}, live: {} }
  const env = envCredentials(id)

  // T-Bank test-mode env flag can drive the default mode if not explicitly set.
  let mode = stored.mode
  if (id === 'tbank' && process.env.TBANK_TEST_MODE) {
    mode = process.env.TBANK_TEST_MODE === 'true' ? 'sandbox' : 'live'
  }

  return {
    enabled: stored.enabled,
    mode,
    sandbox: mergeCreds(stored.sandbox || {}, env.sandbox),
    live: mergeCreds(stored.live || {}, env.live)
  }
}

/**
 * Resolve the gateway to use for checkout.
 * Prefers an explicit gateway id; otherwise uses the configured active gateway.
 * Falls back to demo if the selected gateway is disabled.
 */
export function resolveGateway(preferred?: GatewayId): {
  id: GatewayId
  adapter: GatewayAdapter
  config: GatewayConfig
} {
  const cfg = getStoreConfig()
  let id: GatewayId = preferred || cfg.activeGateway || 'demo'

  const effective = getEffectiveConfig(id)
  if (!effective.enabled && id !== 'demo') {
    id = 'demo'
  }

  return { id, adapter: getGateway(id), config: getEffectiveConfig(id) }
}
