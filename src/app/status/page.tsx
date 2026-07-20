'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

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
  }, [searchParams])

  const getSessionId = () => {
    let sessionId = localStorage.getItem('sunstore_session_id')
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('sunstore_session_id', sessionId)
    }
    return sessionId
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price)
  }

  const fetchOrderStatus = async (orderId: string) => {
    setLoading(true)
    setError(false)
    try {
      const sessionId = getSessionId()
      const response = await fetch(`/api/orders/${orderId}`, {
        headers: {
          'x-session-id': sessionId
        }
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setOrderData(data)
        setLoading(false)
        
        // Start polling for updates if order is still processing
        if (data.status !== 'delivered' && data.status !== 'cancelled') {
          startPolling(orderId)
        }
      } else {
        throw new Error(data.error || 'Failed to fetch order status')
      }
    } catch (error) {
      console.error('Error fetching order status:', error)
      setLoading(false)
      setError(true)
    }
  }

  const startPolling = (orderId: string) => {
    const interval = setInterval(async () => {
      try {
        const sessionId = getSessionId()
        const response = await fetch(`/api/orders/${orderId}`, {
          headers: {
            'x-session-id': sessionId
          }
        })
        
        const data = await response.json()
        
        if (response.ok) {
          setOrderData(data)
          
          // Stop polling if order is delivered or cancelled
          if (data.status === 'delivered' || data.status === 'cancelled') {
            clearInterval(interval)
          }
        }
      } catch (error) {
        console.error('Error polling order status:', error)
      }
    }, 30000) // Poll every 30 seconds
    
    return () => clearInterval(interval)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#F59E0B'
      case 'processing':
        return '#3B82F6'
      case 'shipped':
        return '#8B5CF6'
      case 'delivered':
        return '#10B981'
      case 'cancelled':
        return '#DC2626'
      default:
        return '#6B7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '⏳'
      case 'processing':
        return '⚙️'
      case 'shipped':
        return '🚚'
      case 'delivered':
        return '✅'
      case 'cancelled':
        return '❌'
      default:
        return '📋'
    }
  }

  const getTimelineSteps = () => {
    const steps = [
      { key: 'pending', label: 'Заказ оформлен', icon: '📝' },
      { key: 'processing', label: 'В обработке', icon: '⚙️' },
      { key: 'shipped', label: 'Отправлен', icon: '🚚' },
      { key: 'delivered', label: 'Доставлен', icon: '✅' }
    ]
    
    const currentIndex = steps.findIndex(step => step.key === orderData?.status?.toLowerCase())
    
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex,
      pending: index > currentIndex
    }))
  }

  if (!mounted) {
    return <div className="loading">Загрузка...</div>
  }

  if (error) {
    return (
      <div className="status-page">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>Заказ не найден</h2>
          <p>Мы не смогли найти заказ, который вы ищете.</p>
          <Link href="/">Вернуться на главную</Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="status-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Загрузка статуса заказа...</p>
        </div>
      </div>
    )
  }

  if (!orderData) {
    return null
  }

  const timelineSteps = getTimelineSteps()

  return (
    <>
      <div className="status-page">
        <header className="status-header">
          <Link href="/" className="brand-mark">
            ☀️ <span>SUN</span>STORE
          </Link>
        </header>

        <main className="status-main">
          <div className="status-content">
            <div className="order-status-card">
              <div className="status-header">
                <h1>Статус заказа</h1>
                <div className="order-id">Заказ №{orderData.id}</div>
              </div>

              <div className="current-status">
                <div className="status-icon" style={{ backgroundColor: getStatusColor(orderData.status) }}>
                  {getStatusIcon(orderData.status)}
                </div>
                <div className="status-info">
                  <h2>{orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1)}</h2>
                  <p>{orderData.notes || 'Ваш заказ обрабатывается'}</p>
                </div>
              </div>

              <div className="timeline">
                {timelineSteps.map((step, index) => (
                  <div key={step.key} className={`timeline-step ${step.completed ? 'completed' : ''} ${step.current ? 'current' : ''} ${step.pending ? 'pending' : ''}`}>
                    <div className="timeline-icon">{step.icon}</div>
                    <div className="timeline-label">{step.label}</div>
                    <div className="timeline-line"></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-details-card">
              <h3>Детали заказа</h3>
              
              <div className="detail-row">
                <span>Номер заказа</span>
                <span className="mono">{orderData.id}</span>
              </div>
              
              <div className="detail-row">
                <span>Дата заказа</span>
                <span>{new Date(orderData.createdAt).toLocaleDateString('ru-RU')}</span>
              </div>
              
              <div className="detail-row">
                <span>Сумма заказа</span>
                <span className="mono total-amount">₽{formatPrice(orderData.total)}</span>
              </div>

              <div className="detail-row">
                <span>Способ оплаты</span>
                <span>{orderData.paymentMethod?.toUpperCase() || 'Т-БАНК'}</span>
              </div>

              <div className="detail-section">
                <h4>Адрес доставки</h4>
                <address>
                  {(() => {
                    try {
                      const addr = typeof orderData.shippingAddress === 'string'
                        ? JSON.parse(orderData.shippingAddress)
                        : orderData.shippingAddress
                      return (
                        <>
                          {addr?.fullName}<br />
                          {addr?.address}<br />
                          {addr?.city}, {addr?.postalCode}<br />
                          {addr?.country}
                        </>
                      )
                    } catch {
                      return <>{orderData.shippingAddress}</>
                    }
                  })()}
                </address>
              </div>

              <div className="detail-section">
                <h4>Товары в заказе</h4>
                <div className="items-list">
                  {orderData.items?.map((item: any) => (
                    <div key={item.id} className="order-item">
                      <div className="item-info">
                        <div className="item-name">{item.name}</div>
                        <div className="item-quantity">Кол-во: {item.quantity}</div>
                      </div>
                      <div className="item-price mono">₽{formatPrice(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <Link href="/array" className="btn-secondary">
                Продолжить покупки
              </Link>
              <Link href="/" className="btn-primary">
                Вернуться на главную
              </Link>
            </div>
          </div>
        </main>
      </div>

      <style jsx global>{`
        .status-page {
          --bg: #0f172a;
          --surface: #1e293b;
          --surface-2: #334155;
          --border: #334155;
          --ink: #f8fafc;
          --ink-2: #cbd5e1;
          --ink-3: #94a3b8;
          --brand: #f97316;
          --brand-hover: #ea580c;
          --success: #10b981;
          --r-sm: 0.25rem;
          --r-md: 0.5rem;
          --r-lg: 1rem;
          --r-xl: 2rem;
          --r-2xl: 3rem;
          --dur-base: 0.2s;
          --ease-kinetic: ease;
        }

        .loading {
          text-align: center;
          padding: 2rem;
          color: var(--ink-3);
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          margin: 0 auto 1rem;
          border: 3px solid var(--border);
          border-top-color: var(--brand);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .status-page {
          min-height: 100vh;
          background: var(--bg);
          color: var(--ink);
        }

        .status-header {
          background: var(--surface);
          padding: var(--r-md) var(--r-xl);
          border-bottom: 1px solid var(--border);
        }

        .brand-mark {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--ink);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .brand-mark span {
          color: var(--brand);
        }

        .status-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--r-xl) var(--r-md);
        }

        .status-content {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--r-xl);
        }

        @media (min-width: 768px) {
          .status-content {
            grid-template-columns: 1fr 1fr;
          }
        }

        .order-status-card {
          background: var(--surface);
          border-radius: var(--r-lg);
          padding: var(--r-lg);
          border: 1px solid var(--border);
          box-shadow: var(--leak-soft);
        }

        .status-header {
          margin-bottom: var(--r-lg);
          padding-bottom: var(--r-md);
          border-bottom: 1px solid var(--border);
        }

        .status-header h1 {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: var(--r-sm);
        }

        .order-id {
          font-size: 0.875rem;
          color: var(--ink-3);
          font-family: var(--font-mono);
        }

        .current-status {
          display: flex;
          align-items: center;
          gap: var(--r-lg);
          margin-bottom: var(--r-xl);
          padding: var(--r-lg);
          background: var(--surface-2);
          border-radius: var(--r-md);
        }

        .status-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          flex-shrink: 0;
        }

        .status-info h2 {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: var(--r-xs);
        }

        .status-info p {
          font-size: 0.875rem;
          color: var(--ink-3);
        }

        .timeline {
          display: flex;
          flex-direction: column;
          gap: var(--r-md);
        }

        .timeline-step {
          display: flex;
          align-items: center;
          gap: var(--r-md);
          position: relative;
        }

        .timeline-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--surface-2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          z-index: 1;
          transition: all var(--dur-base) var(--ease-kinetic);
        }

        .timeline-step.completed .timeline-icon {
          background: var(--success);
          color: white;
        }

        .timeline-step.current .timeline-icon {
          background: var(--brand);
          color: white;
        }

        .timeline-label {
          flex: 1;
          font-size: 0.9375rem;
          font-weight: 500;
        }

        .timeline-step.completed .timeline-label {
          color: var(--success);
        }

        .timeline-step.current .timeline-label {
          color: var(--brand);
          font-weight: 600;
        }

        .timeline-step.pending .timeline-label {
          color: var(--ink-3);
        }

        .timeline-line {
          position: absolute;
          left: 16px;
          top: 32px;
          width: 2px;
          height: calc(100% + var(--r-md));
          background: var(--border);
        }

        .timeline-step:last-child .timeline-line {
          display: none;
        }

        .timeline-step.completed .timeline-line {
          background: var(--success);
        }

        .order-details-card {
          background: var(--surface);
          border-radius: var(--r-lg);
          padding: var(--r-lg);
          border: 1px solid var(--border);
          box-shadow: var(--leak-soft);
        }

        .order-details-card h3 {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: var(--r-lg);
          padding-bottom: var(--r-md);
          border-bottom: 1px solid var(--border);
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--r-md) 0;
          border-bottom: 1px solid var(--border);
          font-size: 0.9375rem;
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .total-amount {
          font-weight: 700;
          color: var(--brand);
          font-size: 1.125rem;
        }

        .detail-section {
          margin-top: var(--r-lg);
          padding-top: var(--r-md);
          border-top: 1px solid var(--border);
        }

        .detail-section h4 {
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: var(--r-md);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--ink-2);
        }

        .detail-section address {
          font-style: normal;
          color: var(--ink-3);
          line-height: 1.6;
        }

        .items-list {
          display: flex;
          flex-direction: column;
          gap: var(--r-md);
        }

        .order-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--r-md);
          background: var(--surface-2);
          border-radius: var(--r-md);
        }

        .item-info {
          flex: 1;
        }

        .item-name {
          font-weight: 600;
          margin-bottom: var(--r-xs);
        }

        .item-quantity {
          font-size: 0.75rem;
          color: var(--ink-3);
        }

        .item-price {
          font-weight: 600;
        }

        .action-buttons {
          grid-column: 1 / -1;
          display: flex;
          gap: var(--r-md);
          margin-top: var(--r-lg);
        }

        .btn-primary,
        .btn-secondary {
          flex: 1;
          padding: var(--r-md);
          border-radius: var(--r-md);
          font-weight: 600;
          text-align: center;
          text-decoration: none;
          transition: all var(--dur-base) var(--ease-kinetic);
        }

        .btn-primary {
          background: var(--brand);
          color: var(--surface);
        }

        .btn-primary:hover {
          background: var(--brand-hover);
        }

        .btn-secondary {
          background: transparent;
          color: var(--ink-2);
          border: 1px solid var(--border);
        }

        .btn-secondary:hover {
          border-color: var(--brand);
          color: var(--brand);
        }

        .error-state {
          text-align: center;
          padding: var(--r-2xl);
          color: #DC2626;
        }

        .error-icon {
          font-size: 3rem;
          margin-bottom: var(--r-md);
        }

        .error-state a {
          color: var(--brand);
          margin-top: var(--r-md);
          display: inline-block;
        }

        .loading-state {
          text-align: center;
          padding: var(--r-2xl);
          color: var(--ink-3);
        }
      `}</style>
    </>
  )
}

export default function StatusPage() {
  return (
    <Suspense fallback={<div className="loading">Загрузка...</div>}>
      <StatusPageContent />
    </Suspense>
  )
}