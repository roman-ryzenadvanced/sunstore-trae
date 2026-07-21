'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import type { Order } from '@/lib/mockDb'

const rub = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0
})

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Ожидает' },
  { value: 'paid', label: 'Оплачен' },
  { value: 'cancelled', label: 'Отменён' },
  { value: 'shipped', label: 'Отправлен' },
  { value: 'delivered', label: 'Доставлен' }
]

const STATUS_BADGE: Record<string, string> = {
  paid: 'badge-success',
  pending: 'badge-accent',
  cancelled: 'badge-danger',
  shipped: 'badge-ss',
  delivered: 'badge-ss'
}

const STATUS_BADGE_LABEL: Record<string, string> = {
  paid: 'Оплачен',
  pending: 'Ожидает',
  cancelled: 'Отменён',
  shipped: 'Отправлен',
  delivered: 'Доставлен'
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

export default function AdminOrdersPage() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [updating, setUpdating] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/orders')
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const changeStatus = async (id: string, status: string) => {
    setUpdating(id)
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status } : o))
        )
      }
    } finally {
      setUpdating(null)
    }
  }

  const filtered = useMemo(() => {
    if (filter === 'all') return orders
    return orders.filter((o) => o.status === filter)
  }, [orders, filter])

  return (
    <div className="fade-up">
      <header className="mb-8">
        <p className="eyebrow-ss mb-2">Продажи</p>
        <h1 className="h-display text-3xl">Заказы</h1>
      </header>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          className={`btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setFilter('all')}
        >
          Все
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s.value}
            className={`btn-sm ${filter === s.value ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="card-ss p-6">
        <table className="table-ss">
          <thead>
            <tr>
              <th>№ заказа</th>
              <th>Клиент</th>
              <th>Сумма</th>
              <th>Оплата</th>
              <th>Статус</th>
              <th>Дата</th>
              <th>Изменить</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id}>
                <td className="text-ink">{o.orderNumber}</td>
                <td>
                  <div className="text-ink">{o.customerName}</div>
                  <div className="muted-ss text-xs">{o.customerEmail}</div>
                </td>
                <td className="text-ink">{rub.format(o.totalAmount)}</td>
                <td>{o.paymentMethod || '—'}</td>
                <td>
                  <span className={STATUS_BADGE[o.status] ?? 'badge-ss'}>
                    {STATUS_BADGE_LABEL[o.status] ?? o.status}
                  </span>
                </td>
                <td className="muted-ss">{formatDate(o.createdAt)}</td>
                <td>
                  <select
                    className="select-ss"
                    value={o.status}
                    disabled={updating === o.id}
                    onChange={(e) => changeStatus(o.id, e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="muted-ss text-center py-8">
                  Заказов в этом статусе нет.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
