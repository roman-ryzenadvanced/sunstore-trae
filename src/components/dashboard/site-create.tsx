'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { getTemplate } from '@/lib/templates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { apiFetch } from '@/lib/api'

const templateList = [
  { id: 'solar-panels', label: 'Solar Panels', emoji: '☀️' },
  { id: 'jewelry', label: 'Jewelry', emoji: '💎' },
  { id: 'fashion', label: 'Fashion', emoji: '👗' },
  { id: 'electronics', label: 'Electronics', emoji: '📱' },
  { id: 'food', label: 'Food', emoji: '🍕' },
  { id: 'beauty', label: 'Beauty', emoji: '💄' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'books', label: 'Books', emoji: '📚' },
  { id: 'home-garden', label: 'Home & Garden', emoji: '🏡' },
  { id: 'pets', label: 'Pets', emoji: '🐾' },
  { id: 'automotive', label: 'Automotive', emoji: '🚗' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'art', label: 'Art', emoji: '🎨' },
  { id: 'toys', label: 'Toys', emoji: '🧸' },
  { id: 'health', label: 'Health', emoji: '💊' },
  { id: 'travel', label: 'Travel', emoji: '✈️' },
  { id: 'tools', label: 'Tools', emoji: '🔧' },
  { id: 'garden', label: 'Garden', emoji: '🌱' },
  { id: 'baby', label: 'Baby', emoji: '🍼' },
  { id: 'general', label: 'General', emoji: '🛒' },
]

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function SiteCreate() {
  const navigate = useAppStore((s) => s.navigate)
  const token = useAppStore((s) => s.token)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1
  const [selectedTemplate, setSelectedTemplate] = useState('')

  // Step 2
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [tagline, setTagline] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#000000')
  const [categories, setCategories] = useState('')

  // Step 3
  const [adminUsername, setAdminUsername] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState('')

  const steps = [
    { num: 1, label: 'Niche' },
    { num: 2, label: 'Details' },
    { num: 3, label: 'Owner' },
    { num: 4, label: 'Review' },
  ]

  // Auto-fill fields when template is selected
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    const tpl = getTemplate(templateId)
    if (tpl) {
      setName(tpl.suggestedName)
      setSlug(slugify(tpl.suggestedName))
      setTagline(tpl.suggestedTagline)
      setPrimaryColor(tpl.primaryColor)
      setCategories(tpl.suggestedCategories.join(', '))
    }
  }

  const validateStep = (): boolean => {
    setError('')
    if (step === 1 && !selectedTemplate) {
      setError('Please select a template')
      return false
    }
    if (step === 2) {
      if (!name.trim()) { setError('Store name is required'); return false }
      if (!slug.trim()) { setError('Slug is required'); return false }
    }
    if (step === 3) {
      if (!adminUsername.trim()) { setError('Admin username is required'); return false }
      if (!adminEmail.trim()) { setError('Admin email is required'); return false }
      if (adminPassword.length < 6) { setError('Password must be at least 6 characters'); return false }
      if (adminPassword !== adminPasswordConfirm) { setError('Passwords do not match'); return false }
    }
    return true
  }

  const handleNext = () => {
    if (!validateStep()) return
    if (step < 4) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
    else navigate('sites')
  }

  const handleLaunch = async () => {
    if (!isAuthenticated) {
      setError('You must be logged in to create a store')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/api/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          slug,
          tagline,
          templateId: selectedTemplate,
          primaryColor,
          categories: categories.split(',').map((c) => c.trim()).filter(Boolean),
          ownerName: adminUsername,
          ownerEmail: adminEmail,
          ownerUsername: adminUsername,
          ownerPassword: adminPassword,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create store')
      }
      const data = await res.json()
      navigate('site-detail', data.id, data.slug)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create store')
    } finally {
      setLoading(false)
    }
  }

  const tpl = getTemplate(selectedTemplate)

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Create New Store</h1>
        <p className="text-muted-foreground text-sm">
          Set up your new storefront in a few steps
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                step >= s.num ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {step > s.num ? <Check className="size-4" /> : s.num}
            </div>
            <span className={`text-sm hidden sm:inline ${step >= s.num ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div className={`h-px w-8 sm:w-12 ${step > s.num ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {error && <p className="text-sm text-destructive mb-4">{error}</p>}

          {/* Step 1: Template Grid - eBay/Amazon style */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold mb-1">Choose a Template</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Select a niche — your store will be pre-configured with products, categories, and design
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {templateList.map((t) => {
                  const isSelected = selectedTemplate === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleTemplateSelect(t.id)}
                      className={`group relative flex flex-col items-center gap-2.5 rounded-xl border-2 p-4 text-center transition-all duration-200 hover:shadow-md ${
                        isSelected
                          ? 'border-primary shadow-md ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      {/* Color preview dot */}
                      <div
                        className="absolute top-2 right-2 size-3 rounded-full ring-1 ring-black/5"
                        style={{ backgroundColor: t.id === 'solar-panels' ? '#eab308' : t.id === 'jewelry' ? '#9333ea' : t.id === 'fashion' ? '#e11d48' : t.id === 'electronics' ? '#0891b2' : t.id === 'food' ? '#dc2626' : t.id === 'beauty' ? '#db2777' : t.id === 'sports' ? '#16a34a' : t.id === 'books' ? '#78716c' : t.id === 'home-garden' ? '#b45309' : t.id === 'pets' ? '#c2410c' : t.id === 'automotive' ? '#1e40af' : t.id === 'music' ? '#7e22ce' : t.id === 'art' ? '#991b1b' : t.id === 'toys' ? '#0e7490' : t.id === 'health' ? '#059669' : t.id === 'travel' ? '#0369a1' : t.id === 'tools' ? '#a16207' : t.id === 'garden' ? '#15803d' : t.id === 'baby' ? '#c026d3' : '#0f172a' }}
                      />
                      <span className="text-3xl">{t.emoji}</span>
                      <span className="text-xs font-medium leading-tight">{t.label}</span>
                      {/* Product count badge */}
                      <span className="text-[10px] text-muted-foreground">5 items</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 2: Store Details - with template preview */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold mb-1">Store Details</h2>
              <p className="text-sm text-muted-foreground mb-2">
                {tpl ? `Customize your ${tpl.label} store — pre-filled with template defaults` : 'Basic information about your store'}
              </p>

              {/* Template indicator */}
              {tpl && (
                <div
                  className="flex items-center gap-3 rounded-lg p-3 text-white"
                  style={{ backgroundColor: tpl.primaryColor }}
                >
                  <span className="text-2xl">{tpl.emoji}</span>
                  <div>
                    <p className="font-medium text-sm">{tpl.label} Template</p>
                    <p className="text-xs text-white/70">{tpl.sampleProducts.length} sample products will be added</p>
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="store-name">Store Name</Label>
                  <Input
                    id="store-name"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setSlug(slugify(e.target.value)) }}
                    placeholder="My Amazing Store"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="store-slug">Slug</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground shrink-0">/</span>
                    <Input id="store-slug" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="my-amazing-store" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="store-tagline">Tagline</Label>
                  <Input id="store-tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Best products at the best prices" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="store-color">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="store-color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="size-9 rounded border border-input cursor-pointer"
                    />
                    <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="max-w-32 font-mono text-sm" />
                    {/* Preview swatch */}
                    <div className="h-9 w-16 rounded-md border" style={{ backgroundColor: primaryColor }} />
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="store-categories">Categories</Label>
                  <Input id="store-categories" value={categories} onChange={(e) => setCategories(e.target.value)} placeholder="shirts, pants, accessories" />
                  <p className="text-xs text-muted-foreground">Comma-separated list of product categories</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Owner */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold mb-1">Store Owner</h2>
              <p className="text-sm text-muted-foreground mb-2">Set up the admin account for this store</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="admin-username">Admin Username</Label>
                  <Input id="admin-username" value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} placeholder="storeadmin" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input id="admin-email" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@store.com" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <Input id="admin-password" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Min. 6 characters" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="admin-password-confirm">Confirm Password</Label>
                  <Input id="admin-password-confirm" type="password" value={adminPasswordConfirm} onChange={(e) => setAdminPasswordConfirm(e.target.value)} placeholder="Re-enter password" />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold mb-1">Review & Launch</h2>
              <p className="text-sm text-muted-foreground mb-2">Confirm everything looks good before launching</p>
              <div className="grid gap-3">
                {/* Template preview */}
                {tpl && (
                  <div
                    className="flex items-center gap-3 rounded-lg p-4 text-white"
                    style={{ backgroundColor: tpl.primaryColor }}
                  >
                    <span className="text-3xl">{tpl.emoji}</span>
                    <div>
                      <p className="font-semibold">{tpl.label} Template</p>
                      <p className="text-sm text-white/80">{tpl.sampleProducts.length} products, {tpl.suggestedCategories.length} categories</p>
                    </div>
                    <span className="ml-auto text-xs bg-white/20 rounded-full px-3 py-1">{tpl.dealBadge}</span>
                  </div>
                )}
                <ReviewRow label="Store Name" value={name} />
                <ReviewRow label="Slug" value={`/${slug}`} />
                <ReviewRow label="Tagline" value={tagline || '—'} />
                <ReviewRow
                  label="Primary Color"
                  value={
                    <span className="flex items-center gap-2">
                      <span className="size-4 rounded border border-input" style={{ backgroundColor: primaryColor }} />
                      {primaryColor}
                    </span>
                  }
                />
                <ReviewRow label="Categories" value={categories || '—'} />
                <ReviewRow label="Admin Username" value={adminUsername} />
                <ReviewRow label="Admin Email" value={adminEmail} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="size-4" />
          {step === 1 ? 'Cancel' : 'Back'}
        </Button>
        {step < 4 ? (
          <Button onClick={handleNext}>
            Next
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button onClick={handleLaunch} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Launch Store
          </Button>
        )}
      </div>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{typeof value === 'string' ? value : value}</span>
    </div>
  )
}