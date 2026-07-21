'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'

interface Subscriber {
  id: string
  email: string
  name: string
  source: 'footer' | 'checkout' | 'admin'
  isActive: boolean
  createdAt: string
}

const SOURCE_LABELS: Record<string, string> = {
  footer: 'Подписка',
  checkout: 'При оформлении',
  admin: 'Вручную',
}

const emptyDraft = { email: '', name: '' }

export default function AdminSubscribersPage() {
  const [loading, setLoading] = useState(true)
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [draft, setDraft] = useState(emptyDraft)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Mailing
  const [mailSubject, setMailSubject] = useState('')
  const [mailBody, setMailBody] = useState('')
  const [sending, setSending] = useState(false)
  const [mailResult, setMailResult] = useState<{ sent: number; errors: number } | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/subscribers')
      .then((r) => r.json())
      .then((d) => {
        setSubscribers(d.subscribers ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  const totalCount = subscribers.length
  const activeCount = subscribers.filter((s) => s.isActive).length
  const inactiveCount = totalCount - activeCount

  /* ---- Add subscriber ---- */
  const addSubscriber = async () => {
    if (!draft.email) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, source: 'admin' }),
      })
      if (res.ok) {
        setModalOpen(false)
        setDraft(emptyDraft)
        showToast('Подписчик добавлен')
        load()
      } else {
        showToast('Не удалось добавить подписчика')
      }
    } finally {
      setSaving(false)
    }
  }

  /* ---- Toggle active ---- */
  const toggleActive = async (sub: Subscriber) => {
    const res = await fetch('/api/admin/subscribers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: sub.id, isActive: !sub.isActive }),
    })
    if (res.ok) {
      load()
    }
  }

  /* ---- Delete ---- */
  const remove = async (id: string) => {
    if (!confirm('Удалить подписчика?')) return
    const res = await fetch(`/api/admin/subscribers?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      showToast('Подписчик удалён')
      load()
    }
  }

  /* ---- Send mailing ---- */
  const sendMailing = async () => {
    if (!mailSubject || !mailBody) return
    setSending(true)
    setMailResult(null)
    try {
      const res = await fetch('/api/admin/subscribers/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: mailSubject, htmlBody: mailBody }),
      })
      const d = await res.json()
      setMailResult({ sent: d.sent ?? 0, errors: d.errors ?? 0 })
    } catch {
      showToast('Ошибка при отправке')
    } finally {
      setSending(false)
    }
  }

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return iso
    }
  }

  return (
    <div className="fade-up">
      {toast && <div className="toast">{toast}</div>}

      {/* Header */}
      <header className="flex items-end justify-between mb-8">
        <div>
          <p className="eyebrow-ss mb-2">Маркетинг</p>
          <h1 className="h-display text-3xl">Рассылка</h1>
        </div>
        <button className="btn-primary" onClick={() => { setDraft(emptyDraft); setModalOpen(true) }}>
          Добавить подписчика
        </button>
      </header>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card-ss p-4 text-center">
          <p className="muted-ss text-xs mb-1">Всего подписчиков</p>
          <p className="h-display text-2xl">{totalCount}</p>
        </div>
        <div className="card-ss p-4 text-center">
          <p className="muted-ss text-xs mb-1">Активных</p>
          <p className="h-display text-2xl text-[color:var(--success,#2ecc71)]">{activeCount}</p>
        </div>
        <div className="card-ss p-4 text-center">
          <p className="muted-ss text-xs mb-1">Неактивных</p>
          <p className="h-display text-2xl">{inactiveCount}</p>
        </div>
      </div>

      {/* Subscribers table */}
      <div className="card-ss p-6">
        <table className="table-ss">
          <thead>
            <tr>
              <th>Email</th>
              <th>Имя</th>
              <th>Источник</th>
              <th>Статус</th>
              <th>Дата</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((s) => (
              <tr key={s.id}>
                <td className="text-ink">{s.email}</td>
                <td>{s.name || '—'}</td>
                <td>{SOURCE_LABELS[s.source] ?? s.source}</td>
                <td>
                  {s.isActive ? (
                    <span className="badge-success">Активен</span>
                  ) : (
                    <span className="badge-ss">Неактивен</span>
                  )}
                </td>
                <td className="muted-ss text-sm">{formatDate(s.createdAt)}</td>
                <td className="text-right whitespace-nowrap">
                  <button className="btn-quiet btn-sm" onClick={() => toggleActive(s)}>
                    {s.isActive ? 'Отключить' : 'Включить'}
                  </button>
                  <button className="btn-danger btn-sm ml-1" onClick={() => remove(s.id)}>
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
            {!loading && subscribers.length === 0 && (
              <tr>
                <td colSpan={6} className="muted-ss text-center py-8">
                  Подписчиков пока нет.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Send mailing section */}
      <div className="card-ss p-6 mt-6">
        <h2 className="h-display text-lg mb-5">Отправить рассылку</h2>

        <div className="space-y-4">
          <div>
            <label className="label-ss">Тема письма</label>
            <input
              className="input-ss"
              placeholder="Введите тему письма..."
              value={mailSubject}
              onChange={(e) => setMailSubject(e.target.value)}
            />
          </div>
          <div>
            <label className="label-ss">HTML-код письма</label>
            <textarea
              className="input-ss py-3 resize-y"
              style={{ minHeight: '200px' }}
              placeholder="<html>..."
              value={mailBody}
              onChange={(e) => setMailBody(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-6">
          <button
            className="btn-primary"
            onClick={sendMailing}
            disabled={sending || !mailSubject || !mailBody}
          >
            {sending ? 'Отправка...' : 'Отправить всем активным подписчикам'}
          </button>
          {mailResult && (
            <span className="text-sm">
              Отправлено: <strong className="text-ink">{mailResult.sent}</strong>, Ошибки:{' '}
              <strong className={mailResult.errors > 0 ? 'text-[color:var(--danger,#e74c3c)]' : 'text-ink'}>
                {mailResult.errors}
              </strong>
            </span>
          )}
        </div>
      </div>

      {/* Add subscriber modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-6 bg-black/60"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="card-ss w-full max-w-md p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="h-display text-xl mb-5">Новый подписчик</h2>

            <div className="space-y-4">
              <div>
                <label className="label-ss">Email</label>
                <input
                  className="input-ss"
                  placeholder="email@example.com"
                  value={draft.email}
                  onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="label-ss">Имя</label>
                <input
                  className="input-ss"
                  placeholder="Имя подписчика"
                  value={draft.name}
                  onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-7">
              <button className="btn-ghost" onClick={() => setModalOpen(false)}>
                Отмена
              </button>
              <button className="btn-primary" onClick={addSubscriber} disabled={saving || !draft.email}>
                {saving ? 'Сохранение...' : 'Добавить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
