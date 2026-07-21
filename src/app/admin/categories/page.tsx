'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import type { Category } from '@/lib/mockDb'

type CategoryDraft = {
  id?: string
  name: string
  slug: string
  description: string
  sortOrder: string
  isActive: boolean
}

const emptyDraft: CategoryDraft = {
  name: '',
  slug: '',
  description: '',
  sortOrder: '1',
  isActive: true
}

export default function AdminCategoriesPage() {
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [draft, setDraft] = useState<CategoryDraft>(emptyDraft)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.categories ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setDraft(emptyDraft)
    setModalOpen(true)
  }

  const openEdit = (c: Category) => {
    setDraft({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description ?? '',
      sortOrder: String(c.sortOrder),
      isActive: c.isActive
    })
    setModalOpen(true)
  }

  const save = async () => {
    setSaving(true)
    const payload = {
      name: draft.name,
      slug: draft.slug,
      description: draft.description || undefined,
      sortOrder: Number(draft.sortOrder) || 1,
      isActive: draft.isActive
    }
    try {
      const res = await fetch('/api/admin/categories', {
        method: draft.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft.id ? { id: draft.id, ...payload } : payload)
      })
      if (res.ok) {
        setModalOpen(false)
        showToast('Сохранено')
        load()
      } else {
        showToast('Не удалось сохранить')
      }
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Удалить категорию?')) return
    const res = await fetch(`/api/admin/categories?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    })
    if (res.ok) {
      showToast('Категория удалена')
      load()
    }
  }

  const moveOrder = async (category: Category, direction: 'up' | 'down') => {
    const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder)
    const idx = sorted.findIndex(c => c.id === category.id)
    if (direction === 'up' && idx <= 0) return
    if (direction === 'down' && idx >= sorted.length - 1) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const newOrder = sorted[swapIdx].sortOrder
    const oldOrder = category.sortOrder

    await fetch('/api/admin/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: category.id, sortOrder: newOrder })
    })
    await fetch('/api/admin/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: sorted[swapIdx].id, sortOrder: oldOrder })
    })
    load()
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  return (
    <div className="fade-up">
      {toast && <div className="toast">{toast}</div>}

      <header className="flex items-end justify-between mb-8">
        <div>
          <p className="eyebrow-ss mb-2">Каталог</p>
          <h1 className="h-display text-3xl">Категории</h1>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          Добавить категорию
        </button>
      </header>

      <div className="card-ss p-6">
        <table className="table-ss">
          <thead>
            <tr>
              <th>Название</th>
              <th>Слаг</th>
              <th>Порядок</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td className="text-ink">{c.name}</td>
                <td className="muted-ss">{c.slug}</td>
                <td>
                  <span className="inline-flex items-center gap-1">
                    <button
                      className="btn-quiet btn-sm px-1 py-0"
                      onClick={() => moveOrder(c, 'up')}
                      aria-label="Поднять"
                    >
                      &#9650;
                    </button>
                    {c.sortOrder}
                    <button
                      className="btn-quiet btn-sm px-1 py-0"
                      onClick={() => moveOrder(c, 'down')}
                      aria-label="Опустить"
                    >
                      &#9660;
                    </button>
                  </span>
                </td>
                <td>
                  {c.isActive ? (
                    <span className="badge-success">Активна</span>
                  ) : (
                    <span className="badge-ss">Скрыта</span>
                  )}
                </td>
                <td className="text-right whitespace-nowrap">
                  <button className="btn-quiet btn-sm" onClick={() => openEdit(c)}>
                    Изменить
                  </button>
                  <button className="btn-danger btn-sm ml-1" onClick={() => remove(c.id)}>
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
            {!loading && categories.length === 0 && (
              <tr>
                <td colSpan={5} className="muted-ss text-center py-8">
                  Категорий пока нет.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-6 bg-black/60"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="card-ss w-full max-w-lg p-7 max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="h-display text-xl mb-5">
              {draft.id ? 'Редактировать категорию' : 'Новая категория'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="label-ss">Название</label>
                <input
                  className="input-ss"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Например: Панели"
                />
              </div>
              <div>
                <label className="label-ss">Слаг (URL)</label>
                <input
                  className="input-ss"
                  value={draft.slug}
                  onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                  placeholder="Например: panels"
                />
              </div>
              <div>
                <label className="label-ss">Описание</label>
                <textarea
                  className="input-ss h-20 py-3 resize-none"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Краткое описание категории (необязательно)"
                />
              </div>
              <div>
                <label className="label-ss">Порядок сортировки</label>
                <input
                  type="number"
                  className="input-ss"
                  value={draft.sortOrder}
                  onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="label-ss mb-0">Показывать в каталоге</span>
                <button
                  type="button"
                  className="toggle-ss"
                  data-on={draft.isActive ? 'true' : 'false'}
                  onClick={() => setDraft({ ...draft, isActive: !draft.isActive })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-7">
              <button className="btn-ghost" onClick={() => setModalOpen(false)}>
                Отмена
              </button>
              <button className="btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
