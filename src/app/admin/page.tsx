'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import type { Order } from '@/lib/mockDb'

const rub = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0
})

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'paid':
      return <span className="badge-success">Оплачен</span>
    case 'pending':
      return <span className="badge-accent">Ожидает</span>
    case 'cancelled':
      return <span className="badge-danger">Отменён</span>
    default:
      return <span className="badge-ss">{status}</span>
  }
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export default function AdminOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => {
        setStats(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="spinner-ss" />
      </div>
    )
  }

  const kpis = [
    { label: 'Выручка', value: rub.format(stats.revenue ?? 0) },
    { label: 'Заказы всего', value: (stats.ordersTotal ?? 0).toLocaleString('ru-RU') },
    { label: 'Оплачено', value: (stats.ordersPaid ?? 0).toLocaleString('ru-RU') },
    { label: 'В ожидании', value: (stats.ordersPending ?? 0).toLocaleString('ru-RU') },
    { label: 'Средний чек', value: rub.format(stats.avgOrder ?? 0) },
    {
      label: 'Товары (активно)',
      value: `${stats.activeProducts ?? 0}/${stats.productsTotal ?? 0}`
    }
  ]

  return (
    <div className="fade-up">
      <header className="mb-8">
        <p className="eyebrow-ss mb-2">Панель управления</p>
        <h1 className="h-display text-3xl">Обзор</h1>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="card-ss p-5">
            <p className="muted-ss text-xs uppercase tracking-[0.14em] mb-2">{k.label}</p>
            <p className="price-ss text-2xl">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="card-ss p-6">
        <h2 className="h-display text-lg mb-4">Последние заказы</h2>
        <table className="table-ss">
          <thead>
            <tr>
              <th>№ заказа</th>
              <th>Клиент</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th>Дата</th>
            </tr>
          </thead>
          <tbody>
            {(stats.recentOrders ?? []).map((o: Order) => (
              <tr key={o.id}>
                <td className="text-ink">{o.orderNumber}</td>
                <td>{o.customerName}</td>
                <td className="text-ink">{rub.format(o.totalAmount)}</td>
                <td>
                  <StatusBadge status={o.status} />
                </td>
                <td className="muted-ss">{formatDate(o.createdAt)}</td>
              </tr>
            ))}
            {(stats.recentOrders ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="muted-ss text-center py-8">
                  Заказов пока нет.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
