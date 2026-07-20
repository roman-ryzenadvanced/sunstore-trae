'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OrderStatus {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  currency: string
  customerName: string
  customerEmail: string
  items: Array<{
    id: string
    title: string
    price: number
    quantity: number
  }>
  paymentUrl?: string
  paymentId?: string
  paymentMode?: string
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order')

  const [order, setOrder] = useState<OrderStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) {
      window.location.href = '/'
      return
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/payment/status?orderId=${orderId}`)
        if (!res.ok) throw new Error('Order not found')
        const data = await res.json()
        setOrder(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()

    // Poll for status updates (for webhook processing)
    const interval = setInterval(fetchOrder, 5000)
    return () => clearInterval(interval)
  }, [orderId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-primary" />
          <p className="text-gray-600">Checking your payment status…</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <p className="mb-4 text-red-600">{error || 'Order not found'}</p>
          <Button onClick={() => window.location.href = '/'}>
            Return to Home
          </Button>
        </div>
      </div>
    )
  }

  const formatPrice = (price: number) => '₽' + price.toLocaleString('ru-RU')

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-green-100 p-4">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
        </div>

        {/* Order Info */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            Order Confirmed
          </h1>

          <div className="mb-4">
            <p className="text-sm text-gray-500">Order number</p>
            <p className="font-mono text-lg font-bold text-gray-900">
              {order.orderNumber}
            </p>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-500">Status</p>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              order.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
              order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {order.status}
            </span>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="font-semibold text-lg text-gray-900">
              {formatPrice(order.totalAmount)} {order.currency}
            </p>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 mb-2">Items</p>
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between py-2">
                <span className="text-gray-600">
                  {item.title} × {item.quantity}
                </span>
                <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Button (for incomplete payments) */}
        {order.paymentUrl && order.status !== 'CONFIRMED' && (
          <div className="mt-6">
            <Button
              className="w-full"
              onClick={() => {
                if (order.paymentUrl?.startsWith('http')) {
                  window.location.href = order.paymentUrl
                }
              }}
            >
              Complete Payment
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => (window.location.href = '/')}>
            Continue Shopping
          </Button>
          {order.paymentUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Refresh order status
                if (orderId) {
                  fetch(`/api/payment/status?orderId=${orderId}`).then(() => {
                    window.location.reload()
                  })
                }
              }}
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              Refresh
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}