/**
 * Sunstore — runtime store configuration (in-memory via globalThis).
 * Holds gateway selection + per-gateway sandbox/live credentials.
 * Env vars act as a fallback/persistence path (merged in the registry).
 */
import type { GatewayConfig, GatewayId } from './payments/types'

export interface StoreConfig {
  storeName: string
  currency: string
  activeGateway: GatewayId
  gateways: Record<GatewayId, GatewayConfig>
}

const GATEWAY_IDS: GatewayId[] = [
  'tbank',
  'yookassa',
  'sberbank',
  'cloudpayments',
  'robokassa',
  'demo'
]

function emptyGateway(enabled = false): GatewayConfig {
  return { enabled, mode: 'sandbox', sandbox: {}, live: {} }
}

function defaults(): StoreConfig {
  return {
    storeName: 'Sunstore',
    currency: 'RUB',
    // Demo is enabled out of the box so checkout works with zero credentials.
    activeGateway: 'demo',
    gateways: {
      tbank: emptyGateway(false),
      yookassa: emptyGateway(false),
      sberbank: emptyGateway(false),
      cloudpayments: emptyGateway(false),
      robokassa: emptyGateway(false),
      demo: emptyGateway(true)
    }
  }
}

const globalForCfg = globalThis as unknown as { _sunstoreConfig?: StoreConfig }

export function getStoreConfig(): StoreConfig {
  if (!globalForCfg._sunstoreConfig) {
    globalForCfg._sunstoreConfig = defaults()
  }
  return globalForCfg._sunstoreConfig
}

/** Deep-ish merge: top-level scalars replaced, per-gateway objects merged. */
export function updateStoreConfig(patch: Partial<StoreConfig>): StoreConfig {
  const cfg = getStoreConfig()

  if (patch.storeName !== undefined) cfg.storeName = patch.storeName
  if (patch.currency !== undefined) cfg.currency = patch.currency
  if (patch.activeGateway !== undefined) cfg.activeGateway = patch.activeGateway

  if (patch.gateways) {
    for (const id of GATEWAY_IDS) {
      const incoming = patch.gateways[id]
      if (!incoming) continue
      const current = cfg.gateways[id] || emptyGateway()
      cfg.gateways[id] = {
        enabled: incoming.enabled ?? current.enabled,
        mode: incoming.mode ?? current.mode,
        sandbox: { ...current.sandbox, ...(incoming.sandbox || {}) },
        live: { ...current.live, ...(incoming.live || {}) }
      }
    }
  }

  globalForCfg._sunstoreConfig = cfg
  return cfg
}

/** Config safe to expose to the browser (secrets masked). */
export function publicStoreConfig(): {
  storeName: string
  currency: string
  activeGateway: GatewayId
  gateways: Record<string, { enabled: boolean; mode: string }>
} {
  const cfg = getStoreConfig()
  const gateways: Record<string, { enabled: boolean; mode: string }> = {}
  for (const id of GATEWAY_IDS) {
    gateways[id] = { enabled: cfg.gateways[id].enabled, mode: cfg.gateways[id].mode }
  }
  return {
    storeName: cfg.storeName,
    currency: cfg.currency,
    activeGateway: cfg.activeGateway,
    gateways
  }
}
