"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, LogOut, Package, Plus, Search } from "lucide-react";

import { AdminAuthGate, clearAdminSession } from "@/components/admin-auth-gate";
import {
  createAdminProduct,
  deleteAdminProduct,
  listAdminProducts,
  updateAdminProduct
} from "@/lib/api";
import { formatPrice, slugify } from "@/lib/format";
import { toast } from "@/components/toaster";
import {
  AdminRowSkeleton,
  Skeleton
} from "@/components/skeletons";
import type { Product, UpsertProductInput } from "@/types/api";

const emptyForm: UpsertProductInput = {
  category_id: null,
  slug: "",
  title_ru: "",
  description_ru: "",
  price_kopecks: 0,
  sku: "",
  stock_quantity: 0,
  images: [""],
  is_active: true
};

function normalizeForm(form: UpsertProductInput) {
  return {
    ...form,
    images: form.images.map((item) => item.trim()).filter(Boolean)
  };
}

export function AdminProductsManager() {
  return (
    <AdminAuthGate>
      {(session) => (
        <AdminProductsContent
          token={session.token}
          username={session.username}
        />
      )}
    </AdminAuthGate>
  );
}

function AdminProductsContent({
  token,
  username
}: {
  token: string;
  username: string;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [form, setForm] = useState<UpsertProductInput>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    listAdminProducts(token, { search })
      .then((response) => {
        if (mounted) setProducts(response);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [token, search]);

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock_quantity <= 5).length,
    [products]
  );

  const totalValue = useMemo(
    () =>
      products.reduce(
        (sum, p) => sum + p.price_kopecks * p.stock_quantity,
        0
      ),
    [products]
  );

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEditing(product: Product) {
    setEditingId(product.id);
    setForm({
      category_id: product.category_id ?? null,
      slug: product.slug,
      title_ru: product.title_ru,
      description_ru: product.description_ru,
      price_kopecks: product.price_kopecks,
      sku: product.sku,
      stock_quantity: product.stock_quantity,
      images: product.images.length ? product.images : [""],
      is_active: product.is_active
    });
    // Scroll form into view on mobile.
    setTimeout(() => {
      document
        .getElementById("admin-product-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title_ru.trim()) {
      toast.error("Введите название товара");
      return;
    }
    if (form.price_kopecks <= 0) {
      toast.error("Цена должна быть больше нуля");
      return;
    }

    const prepared = normalizeForm({
      ...form,
      slug: form.slug || slugify(form.title_ru)
    });

    setSaving(true);
    try {
      const saved = editingId
        ? await updateAdminProduct(token, editingId, prepared)
        : await createAdminProduct(token, prepared);

      setProducts((current) => {
        if (editingId) {
          return current.map((p) => (p.id === editingId ? saved : p));
        }
        return [saved, ...current];
      });

      toast.success(
        editingId ? "Карточка обновлена" : "Карточка создана",
        saved.title_ru
      );
      resetForm();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Не удалось сохранить";
      toast.error("Ошибка сохранения", msg);
    } finally {
      setSaving(false);
    }
  }

  async function removeProduct(id: number) {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    if (!confirm(`Удалить «${product.title_ru}»? Действие необратимо.`)) return;

    setDeletingId(id);
    // Optimistic removal.
    const previous = products;
    setProducts((current) => current.filter((p) => p.id !== id));
    if (editingId === id) resetForm();

    try {
      await deleteAdminProduct(token, id);
      toast.success("Товар удалён", product.title_ru);
    } catch (e) {
      // Roll back on failure.
      setProducts(previous);
      const msg = e instanceof Error ? e.message : "Не удалось удалить";
      toast.error("Ошибка удаления", msg);
    } finally {
      setDeletingId(null);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput.trim());
  }

  return (
    <section className="admin-grid">
      <div className="admin-panel">
        <div className="admin-panel__header">
          <div>
            <p className="eyebrow">
              Вы вошли как <strong>{username}</strong>
            </p>
            <h1>Товары</h1>
          </div>
          <div className="admin-stats">
            <div>
              <span>Всего</span>
              <strong>{products.length}</strong>
            </div>
            <div>
              <span>Низкий остаток</span>
              <strong>{lowStockCount}</strong>
            </div>
            <div>
              <span>Стоимость склада</span>
              <strong>{formatPrice(totalValue)}</strong>
            </div>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => {
                clearAdminSession();
                toast.info("Сессия завершена");
                window.location.href = "/admin/login";
              }}
            >
              <LogOut size={14} /> Выйти
            </button>
          </div>
        </div>

        <form className="toolbar" onSubmit={handleSearchSubmit} role="search">
          <label className="field">
            <span>Поиск</span>
            <div className="field__with-suffix">
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Название, SKU или описание"
                aria-label="Поиск товаров"
              />
              {searchInput ? (
                <button
                  type="button"
                  className="field__suffix"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                  }}
                  aria-label="Очистить поиск"
                >
                  ✕
                </button>
              ) : null}
            </div>
          </label>
          <button type="submit" className="button button--ghost">
            <Search size={14} /> Найти
          </button>
        </form>

        {loading ? (
          <div className="admin-table">
            <div className="admin-table__head">
              <span>Товар</span>
              <span>Цена</span>
              <span>Остаток</span>
              <span>Статус</span>
              <span />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <AdminRowSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="admin-empty">
            <Package size={28} aria-hidden="true" />
            <h3>Товаров нет</h3>
            <p className="muted">
              {search
                ? `Ничего не найдено по запросу «${search}».`
                : "Создайте первую карточку справа."}
            </p>
            {search ? (
              <button
                type="button"
                className="button button--ghost"
                onClick={() => {
                  setSearch("");
                  setSearchInput("");
                }}
              >
                Сбросить поиск
              </button>
            ) : null}
          </div>
        ) : (
          <div className="admin-table">
            <div className="admin-table__head">
              <span>Товар</span>
              <span>Цена</span>
              <span>Остаток</span>
              <span>Статус</span>
              <span />
            </div>
            {products.map((product) => {
              const lowStock = product.stock_quantity <= 5;
              const outOfStock = product.stock_quantity <= 0;
              return (
                <div key={product.id} className="admin-table__row">
                  <div className="admin-table__title">
                    <div
                      className="admin-table__thumb"
                      aria-hidden="true"
                      style={
                        product.images?.[0]
                          ? {
                              backgroundImage: `url(${product.images[0]})`
                            }
                          : undefined
                      }
                    >
                      {!product.images?.[0] ? "◐" : null}
                    </div>
                    <div>
                      <p className="eyebrow">{product.sku}</p>
                      <strong>{product.title_ru}</strong>
                      <p className="muted">/{product.slug}</p>
                    </div>
                  </div>
                  <strong>{formatPrice(product.price_kopecks)}</strong>
                  <span
                    className={
                      outOfStock
                        ? "status-pill status-pill--rejected"
                        : lowStock
                        ? "status-pill status-pill--pending"
                        : ""
                    }
                  >
                    {product.stock_quantity} шт.
                  </span>
                  <span>
                    <span
                      className={`status-pill ${
                        product.is_active
                          ? "status-pill--confirmed"
                          : "status-pill--refunded"
                      }`}
                    >
                      {product.is_active ? "Активен" : "Скрыт"}
                    </span>
                  </span>
                  <div className="admin-row-actions">
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => startEditing(product)}
                      aria-label={`Редактировать: ${product.title_ru}`}
                    >
                      Редактировать
                    </button>
                    <button
                      type="button"
                      className="text-button text-button--danger"
                      onClick={() => removeProduct(product.id)}
                      disabled={deletingId === product.id}
                      aria-label={`Удалить: ${product.title_ru}`}
                    >
                      {deletingId === product.id ? "…" : "Удалить"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <form
        id="admin-product-form"
        className="admin-panel admin-form"
        onSubmit={submitForm}
      >
        <div>
          <p className="eyebrow">
            {editingId ? "Редактирование" : "Новая карточка"}
          </p>
          <h2>{editingId ? "Изменить товар" : "Создать товар"}</h2>
          <p className="muted">
            {editingId
              ? "Внесите изменения и нажмите «Сохранить»."
              : "Заполните поля — карточка сразу появится в каталоге."}
          </p>
        </div>

        <label className="field">
          <span>Название *</span>
          <input
            value={form.title_ru}
            onChange={(event) =>
              setForm((c) => ({ ...c, title_ru: event.target.value }))
            }
            required
          />
        </label>

        <label className="field">
          <span>Slug</span>
          <input
            value={form.slug}
            onChange={(event) =>
              setForm((c) => ({ ...c, slug: event.target.value }))
            }
            placeholder="Сгенерируется из названия, если оставить пустым"
          />
        </label>

        <label className="field">
          <span>Описание</span>
          <textarea
            rows={5}
            value={form.description_ru}
            onChange={(event) =>
              setForm((c) => ({ ...c, description_ru: event.target.value }))
            }
          />
        </label>

        <div className="field-grid">
          <label className="field">
            <span>Цена, коп. *</span>
            <input
              type="number"
              min={0}
              value={form.price_kopecks}
              onChange={(event) =>
                setForm((c) => ({
                  ...c,
                  price_kopecks: Math.max(0, Number(event.target.value))
                }))
              }
              required
            />
          </label>
          <label className="field">
            <span>Остаток</span>
            <input
              type="number"
              min={0}
              value={form.stock_quantity}
              onChange={(event) =>
                setForm((c) => ({
                  ...c,
                  stock_quantity: Math.max(0, Number(event.target.value))
                }))
              }
            />
          </label>
        </div>

        <div className="field-grid">
          <label className="field">
            <span>SKU</span>
            <input
              value={form.sku}
              onChange={(event) =>
                setForm((c) => ({ ...c, sku: event.target.value }))
              }
            />
          </label>
          <label className="field">
            <span>Category ID</span>
            <input
              type="number"
              min={0}
              value={form.category_id ?? ""}
              onChange={(event) =>
                setForm((c) => ({
                  ...c,
                  category_id: event.target.value
                    ? Number(event.target.value)
                    : null
                }))
              }
            />
          </label>
        </div>

        <label className="field">
          <span>Изображения (по одному URL на строку)</span>
          <textarea
            rows={4}
            value={form.images.join("\n")}
            onChange={(event) =>
              setForm((c) => ({ ...c, images: event.target.value.split("\n") }))
            }
            placeholder="https://images.unsplash.com/…"
          />
        </label>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) =>
              setForm((c) => ({ ...c, is_active: event.target.checked }))
            }
          />
          <span>Товар активен на витрине</span>
        </label>

        <div className="admin-form__actions">
          <button
            type="submit"
            className="button button--primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 size={14} className="spin" /> Сохранение…
              </>
            ) : editingId ? (
              <>
                <Plus size={14} /> Сохранить
              </>
            ) : (
              <>
                <Plus size={14} /> Создать
              </>
            )}
          </button>
          <button
            type="button"
            className="button button--ghost"
            onClick={resetForm}
            disabled={saving}
          >
            Сбросить
          </button>
        </div>
      </form>
    </section>
  );
}
