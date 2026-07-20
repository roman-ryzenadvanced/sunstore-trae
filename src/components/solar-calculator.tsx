'use client'

import { useState } from 'react'
import { Send, Sun, Home, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface SolarQuote {
  panels: number
  inverter: number
  battery: number
  mounting: number
  total: number
  monthly: number
}

// Component prices in RUB
const PANEL_400W_PRICE = 45000
const INVERTER_5KW_PRICE = 85000
const INVERTER_3KW_PRICE = 55000
const BATTERY_5KWH_PRICE = 120000
const MOUNTING_4PANELS_PRICE = 18000
const MOUNTING_BALKON_PRICE = 12000
const INSTALL_PRICE_PER_KW = 15000

// Energy output per month (kWh)
const PANEL_400W_MONTH = 130
const INVERTER_EFFICIENCY = 0.97

export function SolarCalculator({ 
  storeSlug,
  onSuccess 
}: { 
  storeSlug?: string
  onSuccess?: (quote: any) => void 
}) {
  const [consumption, setConsumption] = useState(300)
  const [installationType, setInstallationType] = useState<'roof' | 'fence' | 'balcony'>('roof')
  const [email, setEmail] = useState('')
  const [quote, setQuote] = useState<SolarQuote | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null)

  const calculateQuote = (): SolarQuote => {
    const panelsNeeded = Math.ceil(consumption / (PANEL_400W_MONTH * INVERTER_EFFICIENCY))
    let panelCount = panelsNeeded
    let mountingCost = 0

    if (installationType === 'balcony') {
      panelCount = Math.min(4, panelsNeeded)
      mountingCost = MOUNTING_BALKON_PRICE
    } else if (installationType === 'fence') {
      mountingCost = panelCount * 4500
    } else {
      mountingCost = MOUNTING_4PANELS_PRICE
    }

    const kWNeeded = panelCount * 0.4
    const inverterPrice = kWNeeded > 4 ? INVERTER_5KW_PRICE : INVERTER_3KW_PRICE
    const batteryCount = consumption > 400 ? 1 : 0
    const totalPrice = panelCount * PANEL_400W_PRICE + inverterPrice + batteryCount * BATTERY_5KWH_PRICE + mountingCost + kWNeeded * INSTALL_PRICE_PER_KW

    return {
      panels: panelCount,
      inverter: kWNeeded > 4 ? 5 : 3,
      battery: batteryCount,
      mounting: mountingCost,
      total: totalPrice,
      monthly: totalPrice / 12,
    }
  }

  const handleCalculate = () => {
    setQuote(calculateQuote())
    setSubmitResult(null)
  }

  const handleSubmit = async () => {
    if (!email || !quote) return
    
    setSubmitting(true)
    setSubmitResult(null)
    
    try {
      // Get site ID if we have a slug
      let siteId = ''
      if (storeSlug) {
        const storeRes = await fetch(`/api/storefront/${storeSlug}`)
        if (storeRes.ok) {
          const storeData = await storeRes.json()
          siteId = storeData.site.id || ''
        }
      }

      const response = await fetch('/api/solar-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: '',
          phone: '',
          panels: quote.panels,
          inverter: quote.inverter,
          battery: quote.battery,
          total: quote.total,
          monthly: quote.monthly,
          siteId,
          consumption,
          installationType,
        }),
      })

      const result = await response.json()
      setSubmitResult({ success: response.ok, message: result.message || result.error || 'Unknown error' })
      
      if (response.ok && onSuccess) {
        onSuccess(result)
      }
    } catch (error) {
      setSubmitResult({ success: false, message: 'Network error. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Sun className="h-6 w-6 text-yellow-500" />
          Solar Power Calculator
        </CardTitle>
        <CardDescription>Calculate your solar energy system in 3 simple steps</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 1. Requirements */}
        <div>
          <h3 className="text-lg font-semibold mb-3">1. Your Requirements</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="consumption">Monthly Consumption (kWh)</Label>
              <Input
                id="consumption"
                type="number"
                value={consumption}
                onChange={(e) => setConsumption(Number(e.target.value))}
                min={50}
                max={2000}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Georgian household average: 300-400 kWh/month</p>
            </div>
          </div>
        </div>

        {/* 2. Installation Type */}
        <div>
          <h3 className="text-lg font-semibold mb-3">2. Installation Type</h3>
          <Select value={installationType} onValueChange={(v: any) => setInstallationType(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select installation type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="roof">
                <div className="flex items-center gap-2"><Home className="h-4 w-4" /> Roof (most efficient)</div>
              </SelectItem>
              <SelectItem value="fence">
                <div className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Fence / Ground mounting</div>
              </SelectItem>
              <SelectItem value="balcony">
                <div className="flex items-center gap-2"><Home className="h-4 w-4" /> Balcony (max 4 panels)</div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Calculate Button */}
        <Button onClick={handleCalculate} className="w-full">
          Calculate Quote
        </Button>

        {/* Quote Results */}
        {quote && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="text-lg font-semibold mb-3">Your Solar System Proposal</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div><p className="text-sm text-gray-600">Solar Panels</p><p className="font-semibold">{quote.panels} × 400W panels</p></div>
              <div><p className="text-sm text-gray-600">Inverter</p><p className="font-semibold">{quote.inverter} kW hybrid inverter</p></div>
              <div><p className="text-sm text-gray-600">Battery</p><p className="font-semibold">{quote.battery} × 5.12 kWh battery</p></div>
              <div><p className="text-sm text-gray-600">Mounting</p><p className="font-semibold">{installationType === 'balcony' ? 'Balcony kit' : 'Roof mounting'}</p></div>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Estimated Cost:</span>
                <span className="text-2xl font-bold text-green-600">{quote.total.toLocaleString()} ₽</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Monthly payment (12 months):</span>
                <span>{quote.monthly.toLocaleString()} ₽ / month</span>
              </div>
            </div>
          </div>
        )}

        {/* Email Form */}
        {quote && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-3">3. Get Your Quote</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Your Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleSubmit} disabled={!email} className="w-full">
                <Send className="h-4 w-4 mr-2" /> Send Complete Quote
              </Button>
              <p className="text-xs text-gray-500 text-center">
                We'll send you a detailed proposal with equipment list, payment plan, and installation timeline.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
