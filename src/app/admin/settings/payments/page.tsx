'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'

interface FieldDef {
  key: string
  label: string
  secret?: boolean
  placeholder?: string
}
interface GatewayMeta {
  name: string
  short: string
  description: string
  popular?: boolean
  methods: string[]
  docsUrl?: string
}
interface GatewayDef {
  id: string
  meta: GatewayMeta
  fields: { sandbox: FieldDef[]; live: FieldDef[] }
}
interface GatewayCfg {
  enabled: boolean
  mode: 'sandbox' | 'live'
  sandbox: Record<string, string>
  live: Record<string, string>
}
type GatewayStates = Record<string, GatewayCfg>

export default function AdminPaymentsPage() {
  const [loading, setLoading] = useState(true)
  const [gatewayDefs, setGatewayDefs] = useState<GatewayDef[]>([])
  const [states, setStates] = useState<GatewayStates>({})
  const [activeGateway, setActiveGateway] = useState<string>('')
  const [storeName, setStoreName] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; message: string }>>({})

  useEffect(() => {
    fetch('/api/store-config?scope=admin')
      .then((r) => r.json())
      .then((d) => {
        const cfg = d.config ?? {}
        setStoreName(cfg.storeName ?? '')
        setActiveGateway(cfg.activeGateway ?? '')
        setGatewayDefs(d.gateways ?? [])
        const init: GatewayStates = {}
        for (const [id, g] of Object.entries<GatewayCfg>(cfg.gateways ?? {})) {
          init[id] = {
            enabled: !!g.enabled,
            mode: g.mode === 'live' ? 'live' : 'sandbox',
            sandbox: g.sandbox ?? {},
            live: g.live ?? {}
          }
        }
        setStates(init)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  const patchState = (id: string, patch: Partial<GatewayCfg>) => {
    setStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  const setCred = (id: string, mode: 'sandbox' | 'live', key: string, value: string) => {
    setStates((prev) => {
      const g = prev[id]
      return {
        ...prev,
        [id]: { ...g, [mode]: { ...g[mode], [key]: value } }
      }
    })
  }

  const testGateway = async (id: string) => {
    setTesting(id)
    setTestResult((prev) => {
      const n = { ...prev }
      delete n[id]
      return n
    })
    const g = states[id]
    try {
      const res = await fetch('/api/admin/test-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: id,
          config: { mode: g.mode, sandbox: g.sandbox, live: g.live }
        })
      })
      const d = await res.json()
      setTestResult((prev) => ({
        ...prev,
        [id]: { success: !!d.success, message: d.message ?? '' }
      }))
    } catch {
      setTestResult((prev) => ({ ...prev, [id]: { success: false, message: 'Ошибка сети' } }))
    } finally {
      setTesting(null)
    }
  }

  const save = async () => {
    const gateways: Record<string, { enabled: boolean; mode: string; sandbox: Record<string, string>; live: Record<string, string> }> = {}
    for (const [id, g] of Object.entries(states)) {
      gateways[id] = { enabled: g.enabled, mode: g.mode, sandbox: g.sandbox, live: g.live }
    }
    const res = await fetch('/api/store-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeName, activeGateway, gateways })
    })
    if (res.ok) showToast('Сохранено')
    else showToast('Не удалось сохранить')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="spinner-ss" />
      </div>
    )
  }

  return (
    <div className="fade-up">
      {toast && <div className="toast">{toast}</div>}

      <header className="mb-8">
        <p className="eyebrow-ss mb-2">Настройки</p>
        <h1 className="h-display text-3xl">Платежи</h1>
      </header>

      <div className="space-y-5">
        {gatewayDefs.map((gw) => {
          const g = states[gw.id]
          if (!g) return null
          const fieldsForMode = gw.fields?.[g.mode] ?? []
          const isActive = activeGateway === gw.id
          const result = testResult[gw.id]

          return (
            <div key={gw.id} className="card-ss p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="brand-dot" />
                    <h2 className="h-display text-lg">{gw.meta.name}</h2>
                    {isActive && <span className="badge-accent">Активен</span>}
                  </div>
                  <p className="muted-ss text-sm mt-1">{gw.meta.description}</p>
                  {gw.meta.methods?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {gw.meta.methods.map((m) => (
                        <span key={m} className="badge-ss">
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="divider-ss my-4" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-ink">Включить</p>
                    <p className="muted-ss text-xs mt-0.5">Принимать оплату через этот шлюз</p>
                  </div>
                  <button
                    type="button"
                    className="toggle-ss"
                    data-on={g.enabled ? 'true' : 'false'}
                    onClick={() => patchState(gw.id, { enabled: !g.enabled })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-ink">Режим</p>
                    <p className="muted-ss text-xs mt-0.5">
                      {g.mode === 'live' ? 'Боевой' : 'Песочница'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="toggle-ss"
                    data-on={g.mode === 'live' ? 'true' : 'false'}
                    onClick={() =>
                      patchState(gw.id, { mode: g.mode === 'live' ? 'sandbox' : 'live' })
                    }
                  />
                </div>
              </div>

              {fieldsForMode.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                  {fieldsForMode.map((f) => (
                    <div key={f.key}>
                      <label className="label-ss">{f.label}</label>
                      <input
                        type={f.secret ? 'password' : 'text'}
                        className="input-ss"
                        placeholder={f.placeholder ?? ''}
                        value={g[g.mode][f.key] ?? ''}
                        onChange={(e) => setCred(gw.id, g.mode, f.key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-6">
                <button
                  className="btn-ghost"
                  onClick={() => testGateway(gw.id)}
                  disabled={testing === gw.id}
                >
                  {testing === gw.id ? 'Проверка…' : 'Проверить подключение'}
                </button>
                <button
                  className="btn-accent"
                  disabled={isActive}
                  onClick={() => setActiveGateway(gw.id)}
                >
                  {isActive ? 'Активный шлюз' : 'Сделать активным'}
                </button>
                {result && (
                  <span className={result.success ? 'badge-success' : 'badge-danger'}>
                    {result.message || (result.success ? 'OK' : 'Ошибка')}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-end mt-7">
        <button className="btn-primary" onClick={save}>
          Сохранить
        </button>
      </div>
    </div>
  )
}
