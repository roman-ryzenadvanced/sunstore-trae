'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Product } from '@/lib/mockDb'
import RichEditor from '@/components/RichEditor'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  sortOrder: number
  isActive: boolean
}

interface UploadedFile {
  name: string
  url: string
  size: number
  createdAt: string
}

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

/* ------------------------------------------------------------------ */
/*  Constants & helpers                                                */
/* ------------------------------------------------------------------ */

const rub = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

const stripHtml = (html: string) => {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

const emptyDraft: ProductDraft = {
  name: '',
  description: '',
  price: '',
  category: '',
  imageUrl: '',
  stock: '0',
  sku: '',
  isActive: true,
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminProductsPage() {
  /* ---- state ---- */
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // categories
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  // upload gallery
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [galleryLoading, setGalleryLoading] = useState(false)

  // refs
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ---- helpers ---- */
  const categoryName = useCallback(
    (slug: string) => {
      const cat = categories.find((c) => c.slug === slug)
      return cat ? cat.name : slug
    },
    [categories],
  )

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  /* ---- data loading ---- */
  const loadProducts = () => {
    setLoading(true)
    fetch('/api/admin/products')
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.products ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  const loadCategories = () => {
    setCategoriesLoading(true)
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.categories ?? [])
        setCategoriesLoading(false)
      })
      .catch(() => setCategoriesLoading(false))
  }

  const loadUploadedFiles = () => {
    setGalleryLoading(true)
    fetch('/api/admin/upload/list')
      .then((r) => r.json())
      .then((d) => {
        setUploadedFiles(d.files ?? [])
        setGalleryLoading(false)
      })
      .catch(() => setGalleryLoading(false))
  }

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])

  /* ---- filtered products ---- */
  const filteredProducts = activeFilter
    ? products.filter((p) => p.category === activeFilter)
    : products

  /* ---- modal openers ---- */
  const openCreate = () => {
    setDraft({ ...emptyDraft, category: categories[0]?.slug ?? '' })
    setGalleryOpen(false)
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
      isActive: p.isActive,
    })
    setGalleryOpen(false)
    setModalOpen(true)
  }

  /* ---- save / delete ---- */
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
      isActive: draft.isActive,
    }
    try {
      const res = await fetch('/api/admin/products', {
        method: draft.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft.id ? { id: draft.id, ...payload } : payload),
      })
      if (res.ok) {
        setModalOpen(false)
        setGalleryOpen(false)
        showToast('Сохранено')
        loadProducts()
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
      method: 'DELETE',
    })
    if (res.ok) {
      showToast('Товар удалён')
      loadProducts()
    }
  }

  /* ---- image upload ---- */
  const handleImageUpload = async (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.ok) {
        setDraft((prev) => ({ ...prev, imageUrl: data.url }))
      }
    } catch {
      // silently fail
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      void handleImageUpload(file)
    }
    // reset so the same file can be re-selected
    e.target.value = ''
  }

  /* ---- gallery actions ---- */
  const openGallery = () => {
    setGalleryOpen(true)
    loadUploadedFiles()
  }

  const selectGalleryImage = (url: string) => {
    setDraft((prev) => ({ ...prev, imageUrl: url }))
    setGalleryOpen(false)
  }

  const deleteUploadedFile = async (name: string) => {
    try {
      await fetch(`/api/admin/upload/delete?file=${encodeURIComponent(name)}`, {
        method: 'DELETE',
      })
      setUploadedFiles((prev) => prev.filter((f) => f.name !== name))
    } catch {
      // silently fail
    }
  }

  /* ---- rich text change handler ---- */
  const handleDescriptionChange = useCallback((html: string) => {
    setDraft((prev) => ({ ...prev, description: html }))
  }, [])

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <div className="fade-up">
      {toast && <div className="toast">{toast}</div>}

      {/* ---------- Header ---------- */}
      <header className="flex items-end justify-between mb-8">
        <div>
          <p className="eyebrow-ss mb-2">Каталог</p>
          <h1 className="h-display text-3xl">Товары</h1>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          Добавить товар
        </button>
      </header>

      {/* ---------- Category filter bar ---------- */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          className={activeFilter === null ? 'badge-accent' : 'badge-ss'}
          onClick={() => setActiveFilter(null)}
        >
          Все
        </button>
        {categoriesLoading &&
          categories.length === 0 &&
          Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className="badge-ss opacity-40">
              ...
            </span>
          ))}
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={activeFilter === cat.slug ? 'badge-accent' : 'badge-ss'}
            onClick={() =>
              setActiveFilter((prev) => (prev === cat.slug ? null : cat.slug))
            }
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* ---------- Products table ---------- */}
      <div className="card-ss p-6">
        <table className="table-ss">
          <thead>
            <tr>
              <th />
              <th>Название</th>
              <th>Категория</th>
              <th>Описание</th>
              <th>Цена</th>
              <th>Остаток</th>
              <th>Статус</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => (
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
                <td>{categoryName(p.category)}</td>
                <td className="muted-ss max-w-[220px] truncate text-sm">
                  {stripHtml(p.description).slice(0, 60) || '—'}
                </td>
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
                  <button
                    className="btn-danger btn-sm ml-1"
                    onClick={() => remove(p.id)}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
            {!loading && filteredProducts.length === 0 && (
              <tr>
                <td colSpan={8} className="muted-ss text-center py-8">
                  {products.length > 0
                    ? 'Нет товаров в выбранной категории.'
                    : 'Товаров пока нет.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ---------- Product Add/Edit Modal ---------- */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-6 bg-black/60"
          onClick={() => {
            setModalOpen(false)
            setGalleryOpen(false)
          }}
        >
          <div
            className="card-ss w-full max-w-2xl p-7 max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="h-display text-xl mb-5">
              {draft.id ? 'Редактировать товар' : 'Новый товар'}
            </h2>

            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="label-ss">Название</label>
                <input
                  className="input-ss"
                  value={draft.name}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              {/* Description — Rich Text Editor */}
              <div>
                <label className="label-ss">Описание</label>
                <RichEditor
                  value={draft.description}
                  onChange={handleDescriptionChange}
                  placeholder="Описание товара..."
                />
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-ss">Цена, ₽</label>
                  <input
                    type="number"
                    className="input-ss"
                    value={draft.price}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, price: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label-ss">Остаток</label>
                  <input
                    type="number"
                    className="input-ss"
                    value={draft.stock}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, stock: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Category — dynamic from API */}
              <div>
                <label className="label-ss">Категория</label>
                <select
                  className="select-ss"
                  value={draft.category}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, category: e.target.value }))
                  }
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name} ({cat.slug})
                    </option>
                  ))}
                </select>
              </div>

              {/* SKU */}
              <div>
                <label className="label-ss">Артикул (SKU)</label>
                <input
                  className="input-ss"
                  value={draft.sku}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, sku: e.target.value }))
                  }
                />
              </div>

              {/* Image section */}
              <div>
                <label className="label-ss">Изображение</label>

                {/* Current image preview */}
                <div className="flex items-start gap-4 mb-3">
                  {draft.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={draft.imageUrl}
                      alt="Превью"
                      className="w-20 h-20 rounded-[var(--r-sm)] object-cover border border-[color:var(--hairline)]"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-[var(--r-sm)] bg-white/[0.06] border border-[color:var(--hairline)] flex items-center justify-center muted-ss text-xs">
                      Нет фото
                    </div>
                  )}
                </div>

                {/* Upload button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
                <button
                  type="button"
                  className="btn-accent btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Загрузить изображение
                </button>

                {/* File picker */}
                <button
                  type="button"
                  className="btn-ghost btn-sm ml-2"
                  onClick={openGallery}
                >
                  Выбрать из загруженных
                </button>

                {/* URL fallback */}
                <div className="mt-3">
                  <p className="muted-ss text-xs mb-1">или введите URL</p>
                  <input
                    className="input-ss"
                    placeholder="https://example.com/image.jpg"
                    value={draft.imageUrl}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, imageUrl: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Uploaded images gallery */}
              {galleryOpen && (
                <div className="card-ss p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="label-ss mb-0">Загруженные файлы</p>
                    <button
                      type="button"
                      className="btn-quiet btn-sm"
                      onClick={() => setGalleryOpen(false)}
                    >
                      Закрыть
                    </button>
                  </div>
                  {galleryLoading ? (
                    <p className="muted-ss text-sm">Загрузка...</p>
                  ) : uploadedFiles.length === 0 ? (
                    <p className="muted-ss text-sm">Нет загруженных файлов.</p>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {uploadedFiles.map((file) => (
                        <div
                          key={file.name}
                          className="relative group cursor-pointer rounded-[var(--r-sm)] overflow-hidden border border-[color:var(--hairline)] hover:border-[color:var(--accent)] transition-colors"
                          onClick={() => selectGalleryImage(file.url)}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full aspect-square object-cover"
                          />
                          {/* Delete button */}
                          <button
                            type="button"
                            className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500/80 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Удалить"
                            onClick={(e) => {
                              e.stopPropagation()
                              void deleteUploadedFile(file.name)
                            }}
                          >
                            &times;
                          </button>
                          {/* Selected indicator */}
                          {draft.imageUrl === file.url && (
                            <div className="absolute inset-0 border-2 border-[color:var(--accent)] rounded-[var(--r-sm)] pointer-events-none" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Active toggle */}
              <div className="flex items-center justify-between pt-1">
                <span className="label-ss mb-0">Показывать в каталоге</span>
                <button
                  type="button"
                  className="toggle-ss"
                  data-on={draft.isActive ? 'true' : 'false'}
                  onClick={() =>
                    setDraft((prev) => ({ ...prev, isActive: !prev.isActive }))
                  }
                />
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex justify-end gap-2 mt-7">
              <button
                className="btn-ghost"
                onClick={() => {
                  setModalOpen(false)
                  setGalleryOpen(false)
                }}
              >
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
