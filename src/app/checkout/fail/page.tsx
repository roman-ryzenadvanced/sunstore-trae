'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { XCircle, Loader2, RefreshCw } from 'lucide-react'
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
}

export default function CheckoutFailPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order')
  const slug = searchParams.get('slug') || ''

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
  }, [orderId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-red-600" />
          <p className="text-gray-600">Loading order details…</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <XCircle className="mx-auto mb-4 h-12 w-12 text-red-600" />
          <h1 className="mb-2 text-xl font-bold text-gray-900">Payment Failed</h1>
          <p className="mb-4 text-gray-600">{error || 'Order not found'}</p>
          <div className="flex flex-col gap-3">
            <Button
              className="w-full"
              onClick={() => {
                if (slug) {
                  window.location.href = `/preview/store/${slug}`
                } else {
                  window.location.href = '/'
                }
              }}
            >
              Try Again
            </Button>
            <Button variant="outline" className="w-full" onClick={() => (window.location.href = '/')}>
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const formatPrice = (price: number) => '₽' + price.toLocaleString('ru-RU')

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        {/* Error Icon */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
        </div>

        {/* Order Info */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h1 className="mb-4 text-xl font-bold text-gray-900">Payment Cancelled</h1>

          <div className="mb-4">
            <p className="text-sm text-gray-500">Order number</p>
            <p className="font-mono text-lg font-bold text-gray-900">
              {order.orderNumber}
            </p>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-500">Status</p>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800">
              {order.status}
            </span>
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

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-3">
          <Button
            className="w-full"
            onClick={() => {
              if (slug) {
                window.location.href = `/preview/store/${slug}`
              } else {
                window.location.href = '/'
              }
            }}
          >
            Try Again
          </Button>
          <Button variant="outline" className="w-full" onClick={() => (window.location.href = '/')}>
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  )
}