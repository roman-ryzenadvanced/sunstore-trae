'use client'

import { useEffect, useState } from 'react'
import { Loader2, Zap, Save, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'

interface PaymentConfig {
  terminalKey: string
  password: string
  mode: 'demo' | 'sandbox' | 'live'
  platformUrl: string
}

const modeLabels: Record<string, string> = {
  demo: 'Demo',
  sandbox: 'Sandbox',
  live: 'Live',
}

const modeColors: Record<string, string> = {
  demo: 'bg-amber-100 text-amber-700 border-amber-200',
  sandbox: 'bg-blue-100 text-blue-700 border-blue-200',
  live: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

export function PaymentSettings() {
  const [config, setConfig] = useState<PaymentConfig>({
    terminalKey: '',
    password: '',
    mode: 'demo',
    platformUrl: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch('/api/config')
        if (res.ok) {
          const data = await res.json()
          setConfig((prev) => ({ ...prev, ...data }))
        }
      } catch {
        // empty
      } finally {
        setLoading(false)
      }
    }
    fetchConfig()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (res.ok) {
        setTestResult({ success: true, message: 'Settings saved successfully' })
      } else {
        setTestResult({ success: false, message: 'Failed to save settings' })
      }
    } catch {
      setTestResult({ success: false, message: 'Failed to save settings' })
    } finally {
      setSaving(false)
      setTimeout(() => setTestResult(null), 4000)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/payments/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 1 }),
      })
      if (res.ok) {
        const data = await res.json()
        setTestResult({
          success: true,
          message: `Connection successful! Payment URL: ${data.paymentUrl || 'generated'}`,
        })
      } else {
        const data = await res.json().catch(() => ({}))
        setTestResult({
          success: false,
          message: data.error || 'Connection failed',
        })
      }
    } catch {
      setTestResult({
        success: false,
        message: 'Connection failed — check your settings',
      })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-accent" />
        <div className="h-96 animate-pulse rounded-xl bg-accent" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Payment Settings</h1>
        <p className="text-muted-foreground text-sm">
          Configure T-Bank payment integration
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="size-5" />
            T-Bank Integration
          </CardTitle>
          <CardDescription>
            Your current mode:{' '}
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                modeColors[config.mode] || modeColors.demo
              }`}
            >
              {modeLabels[config.mode]}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="terminal-key">Terminal Key</Label>
            <Input
              id="terminal-key"
              value={config.terminalKey}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, terminalKey: e.target.value }))
              }
              placeholder="Enter your terminal key"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="tbank-password">Password</Label>
            <Input
              id="tbank-password"
              type="password"
              value={config.password}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder="Enter your terminal password"
            />
          </div>

          <Separator />

          <div className="flex flex-col gap-3">
            <Label>Mode</Label>
            <RadioGroup
              value={config.mode}
              onValueChange={(v) =>
                setConfig((prev) => ({
                  ...prev,
                  mode: v as 'demo' | 'sandbox' | 'live',
                }))
              }
              className="flex flex-col gap-3 sm:flex-row sm:gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="demo" id="mode-demo" />
                <Label htmlFor="mode-demo" className="font-normal cursor-pointer">
                  Demo
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="sandbox" id="mode-sandbox" />
                <Label
                  htmlFor="mode-sandbox"
                  className="font-normal cursor-pointer"
                >
                  Sandbox
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="live" id="mode-live" />
                <Label htmlFor="mode-live" className="font-normal cursor-pointer">
                  Live
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <Label htmlFor="platform-url">Platform Webhook URL</Label>
            <Input
              id="platform-url"
              value={config.platformUrl}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  platformUrl: e.target.value,
                }))
              }
              placeholder="https://yourdomain.com/api/payments/webhook"
            />
            <p className="text-xs text-muted-foreground">
              This URL will receive payment status notifications
            </p>
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="size-4 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="size-4 mt-0.5 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save Settings
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={testing}>
              {testing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Zap className="size-4" />
              )}
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}