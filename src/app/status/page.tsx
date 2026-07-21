'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const rubFormatter = new Intl.NumberFormat('ru-RU')

const formatPrice = (price: number) => rubFormatter.format(price) + ' ₽'

function StatusPageContent() {
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const [orderData, setOrderData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setMounted(true)
    const orderId = searchParams.get('id')
    if (orderId) {
      fetchOrderStatus(orderId)
    } else {
      setLoading(false)
      setError(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const getSessionId = () => {
    let sessionId = localStorage.getItem('sunstore_session_id')
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('sunstore_session_id', sessionId)
    }
    return sessionId
  }

  const fetchOrderStatus = async (orderId: string) => {
    setLoading(true)
    setError(false)
    try {
      const sessionId = getSessionId()
      const response = await fetch(`/api/orders/${orderId}`, {
        headers: { 'x-session-id': sessionId }
      })
      const data = await response.json()
      if (response.ok) {
        setOrderData(data)
        setLoading(false)
        if (data.status !== 'delivered' && data.status !== 'cancelled') {
          startPolling(orderId)
        }
      } else {
        throw new Error(data.error || 'Failed to fetch order status')
      }
    } catch (err) {
      console.error('Error fetching order status:', err)
      setLoading(false)
      setError(true)
    }
  }

  const startPolling = (orderId: string) => {
    const interval = setInterval(async () => {
      try {
        const sessionId = getSessionId()
        const response = await fetch(`/api/orders/${orderId}`, {
          headers: { 'x-session-id': sessionId }
        })
        const data = await response.json()
        if (response.ok) {
          setOrderData(data)
          if (data.status === 'delivered' || data.status === 'cancelled') {
            clearInterval(interval)
          }
        }
      } catch (err) {
        console.error('Error polling order status:', err)
      }
    }, 30000)
    return () => clearInterval(interval)
  }

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: 'Ожидает',
      processing: 'В обработке',
      shipped: 'Отправлен',
      delivered: 'Доставлен',
      cancelled: 'Отменён'
    }
    return map[status?.toLowerCase()] || status
  }

  const getTimelineSteps = () => {
    const steps = [
      { key: 'pending', label: 'Заказ оформлен' },
      { key: 'processing', label: 'В обработке' },
      { key: 'shipped', label: 'Отправлен' },
      { key: 'delivered', label: 'Доставлен' }
    ]
    const currentIndex = steps.findIndex((step) => step.key === orderData?.status?.toLowerCase())
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex
    }))
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-[color:var(--ink-3)]">
        Загрузка…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-black text-[color:var(--ink)]">
        <Header />
        <div className="container-ss flex flex-1 flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 text-4xl">⚠️</div>
          <h2 className="text-2xl font-semibold">Заказ не найден</h2>
          <p className="muted-ss mt-2">Мы не смогли найти заказ, который вы ищете.</p>
          <Link href="/" className="btn btn-primary mt-6">Вернуться на главную</Link>
        </div>
        <Footer />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-black text-[color:var(--ink)]">
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
          <span className="spinner-ss" />
          <p className="muted-ss mt-4">Загрузка статуса заказа…</p>
        </div>
        <Footer />
      </div>
    )
  }

  if (!orderData) return null

  const timelineSteps = getTimelineSteps()

  return (
    <div className="min-h-screen bg-black text-[color:var(--ink)]">
      <Header />

      <section className="section-pad">
        <div className="container-ss">
          <div className="mb-10">
            <p className="eyebrow-ss mb-3">Статус заказа</p>
            <h1 className="h-display text-4xl md:text-5xl">Заказ №{orderData.id}</h1>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Status card */}
            <div className="card-ss p-7">
              <div className="mb-6 flex items-center gap-5 rounded-[var(--r-md)] bg-[color:var(--surface-2)] p-5">
                <div className="status-icon">
                  {getStatusLabel(orderData.status)}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{getStatusLabel(orderData.status)}</h2>
                  <p className="muted-ss text-sm">{orderData.notes || 'Ваш заказ обрабатывается'}</p>
                </div>
              </div>

              <div className="timeline flex flex-col gap-0">
                {timelineSteps.map((step) => (
                  <div
                    key={step.key}
                    className={`timeline-step ${step.completed ? 'completed' : ''} ${step.current ? 'current' : ''}`}
                  >
                    <div className="timeline-icon">{step.completed ? '✓' : ''}</div>
                    <div className="timeline-label">{step.label}</div>
                    <div className="timeline-line" />
                  </div>
                ))}
              </div>
            </div>

            {/* Details card */}
            <div className="card-ss p-7">
              <h3 className="mb-5 text-lg font-semibold">Детали заказа</h3>

              <div className="flex justify-between border-b border-[color:var(--hairline)] py-3 text-sm">
                <span className="muted-ss">Номер заказа</span>
                <span className="font-medium">{orderData.id}</span>
              </div>
              <div className="flex justify-between border-b border-[color:var(--hairline)] py-3 text-sm">
                <span className="muted-ss">Дата заказа</span>
                <span>{new Date(orderData.createdAt).toLocaleDateString('ru-RU')}</span>
              </div>
              <div className="flex justify-between border-b border-[color:var(--hairline)] py-3 text-sm">
                <span className="muted-ss">Сумма заказа</span>
                <span className="price-ss text-[color:var(--accent)]">{formatPrice(orderData.total)}</span>
              </div>
              <div className="flex justify-between border-b border-[color:var(--hairline)] py-3 text-sm">
                <span className="muted-ss">Способ оплаты</span>
                <span className="font-medium uppercase">{orderData.paymentMethod || 'Т-БАНК'}</span>
              </div>

              <div className="mt-5 border-t border-[color:var(--hairline)] pt-5">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--ink-3)]">
                  Адрес доставки
                </h4>
                <address className="muted-ss text-sm not-italic leading-relaxed">
                  {(() => {
                    try {
                      const addr = typeof orderData.shippingAddress === 'string'
                        ? JSON.parse(orderData.shippingAddress)
                        : orderData.shippingAddress
                      return (
                        <>
                          {addr?.fullName}
                          <br />
                          {addr?.address}
                          <br />
                          {addr?.city}, {addr?.postalCode}
                          <br />
                          {addr?.country}
                        </>
                      )
                    } catch {
                      return <>{orderData.shippingAddress}</>
                    }
                  })()}
                </address>
              </div>

              <div className="mt-5 border-t border-[color:var(--hairline)] pt-5">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--ink-3)]">
                  Товары в заказе
                </h4>
                <div className="flex flex-col gap-3">
                  {orderData.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between rounded-[var(--r-md)] bg-[color:var(--surface-2)] p-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{item.name}</div>
                        <div className="muted-ss text-xs">Кол-во: {item.quantity}</div>
                      </div>
                      <div className="price-ss shrink-0">{formatPrice(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/array" className="btn btn-ghost btn-lg">Продолжить покупки</Link>
            <Link href="/" className="btn btn-primary btn-lg">Вернуться на главную</Link>
          </div>
        </div>
      </section>

      <Footer />

      <style jsx global>{`
        .status-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 44px;
          padding: 0 16px;
          border-radius: var(--r-full);
          background: var(--accent-soft);
          color: var(--accent);
          font-weight: 600;
          font-size: 0.9rem;
        }

        .timeline {
          margin-top: 1.5rem;
        }

        .timeline-step {
          display: flex;
          align-items: center;
          gap: 1rem;
          position: relative;
          padding-bottom: 1.5rem;
        }

        .timeline-step:last-child {
          padding-bottom: 0;
        }

        .timeline-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--surface-3);
          border: 1px solid var(--hairline-strong);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          color: var(--ink-3);
          z-index: 1;
        }

        .timeline-step.completed .timeline-icon {
          background: var(--success);
          border-color: var(--success);
          color: #000;
        }

        .timeline-step.current .timeline-icon {
          background: var(--accent);
          border-color: var(--accent);
          color: #000;
        }

        .timeline-label {
          flex: 1;
          font-size: 0.95rem;
          color: var(--ink-3);
        }

        .timeline-step.completed .timeline-label,
        .timeline-step.current .timeline-label {
          color: var(--ink);
          font-weight: 600;
        }

        .timeline-line {
          position: absolute;
          left: 13px;
          top: 28px;
          width: 2px;
          height: calc(100% - 12px);
          background: var(--hairline);
        }

        .timeline-step.completed .timeline-line {
          background: var(--success);
        }

        .timeline-step:last-child .timeline-line {
          display: none;
        }
      `}</style>
    </div>
  )
}

export default function StatusPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-black text-[color:var(--ink-3)]">Загрузка…</div>}>
      <StatusPageContent />
    </Suspense>
  )
}
