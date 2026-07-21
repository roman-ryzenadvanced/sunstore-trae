'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import type { Product } from '@/lib/mockDb'

const rub = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0
})

const CATEGORY_LABELS: Record<string, string> = {
  panels: 'Панели',
  inverters: 'Инверторы',
  batteries: 'Аккумуляторы',
  controllers: 'Контроллеры',
  mounting: 'Крепления',
  systems: 'Системы'
}

const CATEGORIES = Object.keys(CATEGORY_LABELS)

type ProductDraft = {
  id?: string
  name: string
  description: string
  price: string
  category: string
  imageUrl: string
  stock: string
  sku: string
  isActive: boolean
}

const emptyDraft: ProductDraft = {
  name: '',
  description: '',
  price: '',
  category: 'panels',
  imageUrl: '',
  stock: '0',
  sku: '',
  isActive: true
}

export default function AdminProductsPage() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/products')
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.products ?? [])
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

  const openEdit = (p: Product) => {
    setDraft({
      id: p.id,
      name: p.name,
      description: p.description,
      price: String(p.price),
      category: p.category,
      imageUrl: p.imageUrl ?? '',
      stock: String(p.stock),
      sku: p.sku,
      isActive: p.isActive
    })
    setModalOpen(true)
  }

  const save = async () => {
    setSaving(true)
    const payload = {
      name: draft.name,
      description: draft.description,
      price: Number(draft.price) || 0,
      category: draft.category,
      imageUrl: draft.imageUrl || undefined,
      stock: Number(draft.stock) || 0,
      sku: draft.sku,
      isActive: draft.isActive
    }
    try {
      const res = await fetch('/api/admin/products', {
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
    if (!confirm('Удалить товар?')) return
    const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    })
    if (res.ok) {
      showToast('Товар удалён')
      load()
    }
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
          <h1 className="h-display text-3xl">Товары</h1>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          Добавить товар
        </button>
      </header>

      <div className="card-ss p-6">
        <table className="table-ss">
          <thead>
            <tr>
              <th></th>
              <th>Название</th>
              <th>Категория</th>
              <th>Цена</th>
              <th>Остаток</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-[color:var(--hairline)]" />
                  )}
                </td>
                <td className="text-ink">{p.name}</td>
                <td>{CATEGORY_LABELS[p.category] ?? p.category}</td>
                <td className="text-ink">{rub.format(p.price)}</td>
                <td>{p.stock}</td>
                <td>
                  {p.isActive ? (
                    <span className="badge-success">Активен</span>
                  ) : (
                    <span className="badge-ss">Скрыт</span>
                  )}
                </td>
                <td className="text-right whitespace-nowrap">
                  <button className="btn-quiet btn-sm" onClick={() => openEdit(p)}>
                    Изменить
                  </button>
                  <button className="btn-danger btn-sm ml-1" onClick={() => remove(p.id)}>
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={7} className="muted-ss text-center py-8">
                  Товаров пока нет.
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
              {draft.id ? 'Редактировать товар' : 'Новый товар'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="label-ss">Название</label>
                <input
                  className="input-ss"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label-ss">Описание</label>
                <textarea
                  className="input-ss h-20 py-3 resize-none"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-ss">Цена, ₽</label>
                  <input
                    type="number"
                    className="input-ss"
                    value={draft.price}
                    onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-ss">Остаток</label>
                  <input
                    type="number"
                    className="input-ss"
                    value={draft.stock}
                    onChange={(e) => setDraft({ ...draft, stock: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="label-ss">Категория</label>
                <select
                  className="select-ss"
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-ss">Артикул (SKU)</label>
                  <input
                    className="input-ss"
                    value={draft.sku}
                    onChange={(e) => setDraft({ ...draft, sku: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-ss">URL изображения</label>
                  <input
                    className="input-ss"
                    value={draft.imageUrl}
                    onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
                  />
                </div>
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
                {saving ? 'Сохранение…' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
