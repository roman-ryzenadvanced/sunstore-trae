'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Order {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  currency: string
  customerName: string
  customerEmail: string
  items: Array<{ id: string; title: string; price: number; quantity: number }>
  createdAt: string
}

export default function CustomerOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('sunstore_customer_token')
    if (!token) {
      router.push('/customer/login?redirect=/customer/orders')
      return
    }

    fetch('/api/orders', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setOrders(data.data || [])
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load orders')
        setLoading(false)
      })
  }, [router])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'PENDING': return <Clock className="h-5 w-5 text-yellow-500" />
      case 'NEW': return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      case 'REJECTED': return <XCircle className="h-5 w-5 text-red-500" />
      default: return <Package className="h-5 w-5 text-gray-500" />
    }
  }

  const formatPrice = (price: number) => '₽' + price.toLocaleString('ru-RU')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>
        
        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No orders yet</p>
              <Button onClick={() => router.push('/')} className="mt-4">
                Start Shopping
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{order.orderNumber}</span>
                    <span className="text-sm font-normal flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <span className="text-gray-600">{order.status}</span>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Items</p>
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.title} × {item.quantity}</span>
                          <span>{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-3 flex justify-between items-center">
                      <span className="font-semibold">Total</span>
                      <span className="font-semibold">{formatPrice(order.totalAmount)}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Ordered on {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
