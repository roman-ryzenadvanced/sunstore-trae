"use client"

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function DemoPaymentPage() {
  const params = useParams<{ orderId: string }>()
  const router = useRouter()
  const orderId = (params?.orderId as string) || ''
  const [loading, setLoading] = useState<'succeeded' | 'failed' | null>(null)
  const [error, setError] = useState('')

  const confirm = async (status: 'succeeded' | 'failed') => {
    if (!orderId) return
    setLoading(status)
    setError('')
    try {
      const res = await fetch('/api/payments/demo/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status })
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        if (status === 'succeeded') {
          router.push('/status?id=' + encodeURIComponent(orderId))
        } else {
          router.push('/status?id=' + encodeURIComponent(orderId) + '&fail=1')
        }
      } else {
        setError(data.error || 'Не удалось обработать платёж.')
        setLoading(null)
      }
    } catch (e) {
      console.error('Demo confirm failed:', e)
      setError('Не удалось обработать платёж. Попробуйте ещё раз.')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md fade-up">
        <div className="flex justify-center mb-8">
          <span className="brand-mark text-lg">
            <span className="brand-dot" />
            Sunstore
          </span>
        </div>

        <div className="card-ss p-8 md:p-10 text-center">
          <p className="eyebrow-ss mb-4">Демо-режим</p>
          <h1 className="h-display text-2xl md:text-3xl mb-3">Демо-оплата</h1>
          <p className="lede-ss mb-8">
            Заказ <span className="price-ss">#{orderId}</span>
          </p>

          {error && (
            <div className="mb-6">
              <span className="badge-danger">{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={() => confirm('succeeded')}
              disabled={loading !== null}
              className="btn btn-primary btn-lg w-full"
            >
              {loading === 'succeeded' && <span className="spinner-ss" />}
              {loading === 'succeeded' ? 'Обработка…' : 'Имитировать успешную оплату'}
            </button>
            <button
              onClick={() => confirm('failed')}
              disabled={loading !== null}
              className="btn btn-ghost btn-lg w-full"
            >
              {loading === 'failed' && <span className="spinner-ss" />}
              {loading === 'failed' ? 'Обработка…' : 'Отклонить'}
            </button>
          </div>

          <div className="divider-ss my-8" />

          <p className="muted-ss text-sm leading-relaxed">
            Это тестовый режим — реальные списания не выполняются.
          </p>
        </div>
      </div>
    </div>
  )
}
