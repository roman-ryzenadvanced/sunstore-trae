"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminAuthGate, clearAdminSession } from "@/components/admin-auth-gate";
import {
  createAdminProduct,
  deleteAdminProduct,
  listAdminProducts,
  updateAdminProduct
} from "@/lib/api";
import { formatPrice, slugify } from "@/lib/format";
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
      {(session) => <AdminProductsContent token={session.token} username={session.username} />}
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
  const [form, setForm] = useState<UpsertProductInput>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    listAdminProducts(token, { search })
      .then((response) => {
        if (mounted) {
          setProducts(response);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [token, search]);

  const lowStockCount = useMemo(
    () => products.filter((product) => product.stock_quantity <= 5).length,
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
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prepared = normalizeForm({
      ...form,
      slug: form.slug || slugify(form.title_ru)
    });

    const saved = editingId
      ? await updateAdminProduct(token, editingId, prepared)
      : await createAdminProduct(token, prepared);

    setProducts((current) => {
      if (editingId) {
        return current.map((product) => (product.id === editingId ? saved : product));
      }
      return [saved, ...current];
    });

    setMessage(editingId ? "Карточка обновлена." : "Карточка создана.");
    resetForm();
  }

  async function removeProduct(id: number) {
    await deleteAdminProduct(token, id);
    setProducts((current) => current.filter((product) => product.id !== id));
    if (editingId === id) {
      resetForm();
    }
  }

  return (
    <section className="admin-grid">
      <div className="admin-panel">
        <div className="admin-panel__header">
          <div>
            <p className="eyebrow">Signed in as {username}</p>
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
            <button
              type="button"
              className="button button--ghost"
              onClick={() => {
                clearAdminSession();
                window.location.href = "/admin/login";
              }}
            >
              Выйти
            </button>
          </div>
        </div>

        <div className="toolbar">
          <label className="field">
            <span>Поиск</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Название, SKU или описание"
            />
          </label>
        </div>

        {loading ? (
          <div className="admin-empty">Загрузка товаров...</div>
        ) : (
          <div className="admin-table">
            <div className="admin-table__head">
              <span>Товар</span>
              <span>Цена</span>
              <span>Остаток</span>
              <span>Статус</span>
              <span />
            </div>
            {products.map((product) => (
              <div key={product.id} className="admin-table__row">
                <div>
                  <p className="eyebrow">{product.sku}</p>
                  <strong>{product.title_ru}</strong>
                  <p>{product.slug}</p>
                </div>
                <strong>{formatPrice(product.price_kopecks)}</strong>
                <span>{product.stock_quantity}</span>
                <span>{product.is_active ? "Активен" : "Скрыт"}</span>
                <div className="admin-row-actions">
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => startEditing(product)}
                  >
                    Редактировать
                  </button>
                  <button
                    type="button"
                    className="text-button text-button--danger"
                    onClick={() => removeProduct(product.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form className="admin-panel admin-form" onSubmit={submitForm}>
        <div>
          <p className="eyebrow">{editingId ? "Editing" : "New product"}</p>
          <h2>{editingId ? "Редактирование товара" : "Новая карточка"}</h2>
          <p className="muted">
            Поля соответствуют backend payload {`UpsertProductInput`}.
          </p>
        </div>

        <label className="field">
          <span>Название</span>
          <input
            value={form.title_ru}
            onChange={(event) =>
              setForm((current) => ({ ...current, title_ru: event.target.value }))
            }
          />
        </label>

        <label className="field">
          <span>Slug</span>
          <input
            value={form.slug}
            onChange={(event) =>
              setForm((current) => ({ ...current, slug: event.target.value }))
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
              setForm((current) => ({
                ...current,
                description_ru: event.target.value
              }))
            }
          />
        </label>

        <div className="field-grid">
          <label className="field">
            <span>Цена, коп.</span>
            <input
              type="number"
              min={0}
              value={form.price_kopecks}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  price_kopecks: Number(event.target.value)
                }))
              }
            />
          </label>
          <label className="field">
            <span>Остаток</span>
            <input
              type="number"
              min={0}
              value={form.stock_quantity}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  stock_quantity: Number(event.target.value)
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
                setForm((current) => ({ ...current, sku: event.target.value }))
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
                setForm((current) => ({
                  ...current,
                  category_id: event.target.value ? Number(event.target.value) : null
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
              setForm((current) => ({
                ...current,
                images: event.target.value.split("\n")
              }))
            }
          />
        </label>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) =>
              setForm((current) => ({ ...current, is_active: event.target.checked }))
            }
          />
          <span>Товар активен на витрине</span>
        </label>

        {message ? <p className="success-text">{message}</p> : null}

        <div className="admin-form__actions">
          <button type="submit" className="button button--primary">
            {editingId ? "Сохранить" : "Создать"}
          </button>
          <button type="button" className="button button--ghost" onClick={resetForm}>
            Сбросить
          </button>
        </div>
      </form>
    </section>
  );
}
