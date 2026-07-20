'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, X, Plus, Minus, Trash2, Loader2, CheckCircle2, Package, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCartStore } from '@/store/cart-store'

function formatPrice(price: number): string {
  return '₽' + Math.round(price).toLocaleString('ru-RU', { useGrouping: true })
}

interface Props {
  storeSlug: string
  primaryColor: string
}

type Stage = 'cart' | 'checkout' | 'processing' | 'success'

export function CartDrawer({ storeSlug, primaryColor }: Props) {
  const { items, isOpen, closeCart, setQty, remove, clear, subtotal } = useCartStore()
  const [stage, setStage] = useState<Stage>('cart')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [confirmation, setConfirmation] = useState<{
    orderNumber: string
    total: number
    paymentUrl?: string
  } | null>(null)
  const router = useRouter()

  // Reset to cart view whenever the drawer is reopened
  useEffect(() => {
    if (isOpen) {
      setStage('cart')
      setErrorMsg('')
      setConfirmation(null)
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart()
    }
    if (isOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, closeCart])

  const total = subtotal()

  const placeOrder = async () => {
    setErrorMsg('')
    if (!name.trim()) return setErrorMsg('Please enter your name')
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErrorMsg('Please enter a valid email')
    setStage('processing')
    try {
      // First, get the site ID from the storefront API
      const storeRes = await fetch(`/api/storefront/${storeSlug}`)
      if (!storeRes.ok) throw new Error('Failed to fetch store info')
      const storeData = await storeRes.json()
      const siteId = storeData.site.id

      // Now call the payment init endpoint (T-Bank integration)
      const res = await fetch('/api/payment/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setStage('checkout')
        return setErrorMsg(data.error || 'Failed to initiate payment')
      }

      // On success, redirect to T-Bank payment page (or local demo redirect)
      if (data.paymentUrl) {
        // Clear cart before redirect (order created in DB)
        clear()
        // Redirect to payment URL (T-Bank or local demo redirect)
        window.location.href = data.paymentUrl
      } else {
        // Fallback: show success screen if no payment URL
        setConfirmation({ orderNumber: data.orderNumber, total: data.totalAmount })
        clear()
        setStage('success')
      }
    } catch (err) {
      setStage('checkout')
      setErrorMsg(err instanceof Error ? err.message : 'Network error. Please try again.')
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="size-5" />
            <span className="font-semibold">
              {stage === 'cart' && `Your Cart (${items.length})`}
              {stage === 'checkout' && 'Checkout'}
              {stage === 'processing' && 'Placing Order…'}
              {stage === 'success' && 'Order Confirmed'}
            </span>
          </div>
          <button onClick={closeCart} className="rounded-full p-1 hover:bg-white/20">
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* ---- CART VIEW ---- */}
          {stage === 'cart' && (
            <>
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-gray-400">
                  <Package className="size-12" />
                  <p className="text-sm">Your cart is empty</p>
                  <Button variant="outline" size="sm" onClick={closeCart}>
                    Continue shopping
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col divide-y">
                  {items.map((it) => (
                    <div key={it.id} className="flex gap-3 p-4">
                      <div className="size-16 shrink-0 overflow-hidden rounded-md border bg-gray-100">
                        {it.image ? (
                          <img src={it.image} alt={it.title} className="size-full object-cover" />
                        ) : (
                          <div className="flex size-full items-center justify-center">
                            <Package className="size-5 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <p className="line-clamp-2 text-sm font-medium text-gray-900">{it.title}</p>
                        <p className="text-sm font-semibold" style={{ color: primaryColor }}>
                          {formatPrice(it.price)}
                        </p>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setQty(it.id, it.quantity - 1)}
                              className="flex size-7 items-center justify-center rounded border hover:bg-gray-100"
                            >
                              <Minus className="size-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">{it.quantity}</span>
                            <button
                              onClick={() => setQty(it.id, it.quantity + 1)}
                              disabled={it.quantity >= it.stock}
                              className="flex size-7 items-center justify-center rounded border hover:bg-gray-100 disabled:opacity-40"
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => remove(it.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ---- CHECKOUT VIEW ---- */}
          {stage === 'checkout' && (
            <div className="flex flex-col gap-4 p-5">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-900">Order Summary</h3>
                <div className="rounded-lg border p-3 text-sm">
                  {items.map((it) => (
                    <div key={it.id} className="flex justify-between py-0.5">
                      <span className="text-gray-600">
                        {it.title} × {it.quantity}
                      </span>
                      <span className="font-medium">{formatPrice(it.price * it.quantity)}</span>
                    </div>
                  ))}
                  <div className="mt-2 flex justify-between border-t pt-2 text-base font-bold">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="co-name">Full name *</Label>
                  <Input
                    id="co-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="co-email">Email *</Label>
                  <Input
                    id="co-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="co-phone">Phone</Label>
                  <Input
                    id="co-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 999 123-45-67"
                  />
                </div>
                {errorMsg && (
                  <p className="text-sm text-red-600">{errorMsg}</p>
                )}
                <p className="text-xs text-gray-400">
                  You will be redirected to our payment page to complete your purchase.
                </p>
              </div>
            </div>
          )}

          {/* ---- PROCESSING VIEW ---- */}
          {stage === 'processing' && (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-gray-500">
              <Loader2 className="size-10 animate-spin" style={{ color: primaryColor }} />
              <p className="text-sm">Processing your order…</p>
            </div>
          )}

          {/* ---- SUCCESS VIEW ---- */}
          {stage === 'success' && confirmation && (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <CheckCircle2 className="size-16" style={{ color: '#16a34a' }} />
              <h3 className="text-lg font-bold text-gray-900">Thank you for your order!</h3>
              <p className="text-sm text-gray-500">
                Your order has been placed successfully.
              </p>
              <div className="mt-2 rounded-lg border bg-gray-50 px-6 py-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">Order number</p>
                <p className="font-mono text-lg font-bold" style={{ color: primaryColor }}>
                  {confirmation.orderNumber}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Total: <span className="font-semibold">{formatPrice(confirmation.total)}</span>
                </p>
              </div>
              <Button className="mt-3" style={{ backgroundColor: primaryColor }} onClick={closeCart}>
                Continue shopping
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        {(stage === 'cart' || stage === 'checkout') && items.length > 0 && (
          <div className="border-t p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">Subtotal</span>
              <span className="text-lg font-bold">{formatPrice(total)}</span>
            </div>
            {stage === 'cart' ? (
              <Button
                className="w-full text-white"
                style={{ backgroundColor: primaryColor }}
                onClick={() => setStage('checkout')}
              >
                Proceed to Checkout
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setStage('cart')
                    setErrorMsg('')
                  }}
                >
                  Back
                </Button>
                <Button
                  className="flex-1 text-white"
                  style={{ backgroundColor: primaryColor }}
                  onClick={placeOrder}
                >
                  Pay Now
                </Button>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  )
}

// Floating cart button (fixed, bottom-right) shown on the storefront
export function CartFab({ primaryColor }: { primaryColor: string }) {
  const { count, openCart, items } = useCartStore()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted || items.length === 0) return null
  const c = count()

  return (
    <button
      onClick={openCart}
      className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full px-5 py-3 text-white shadow-lg transition-transform hover:scale-105"
      style={{ backgroundColor: primaryColor }}
    >
      <ShoppingCart className="size-5" />
      <span className="font-semibold">{formatPrice(useCartStore.getState().subtotal())}</span>
      <span className="flex size-5 items-center justify-center rounded-full bg-white text-xs font-bold" style={{ color: primaryColor }}>
        {c}
      </span>
    </button>
  )
}