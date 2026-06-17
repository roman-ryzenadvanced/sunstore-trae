"use client";

import type { Route } from "next";
import Link from "next/link";

import { formatPrice } from "@/lib/format";
import { useCartStore } from "@/store/cart";

export function CartDrawer() {
  const { isOpen, close, items, removeItem, updateQuantity } = useCartStore();
  const total = items.reduce(
    (sum, item) => sum + item.product.price_kopecks * item.quantity,
    0
  );

  return (
    <div className={`cart-drawer ${isOpen ? "cart-drawer--open" : ""}`} aria-hidden={!isOpen}>
      <button type="button" className="cart-drawer__overlay" onClick={close} />
      <aside className="cart-drawer__panel">
        <div className="cart-drawer__header">
          <div>
            <p className="eyebrow">Cart / edited in browser</p>
            <h3>Корзина</h3>
          </div>
          <button type="button" className="icon-button" onClick={close}>
            Закрыть
          </button>
        </div>

        <div className="cart-drawer__body">
          {items.length === 0 ? (
            <div className="empty-card">
              <p>Пока пусто. Добавьте изделие из каталога.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="cart-line">
                <div>
                  <p className="eyebrow">{item.product.sku}</p>
                  <strong>{item.product.title_ru}</strong>
                  <p>{formatPrice(item.product.price_kopecks)}</p>
                </div>
                <div className="cart-line__actions">
                  <div className="stepper">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => removeItem(item.product.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-drawer__footer">
          <div>
            <p className="eyebrow">Итого</p>
            <strong>{formatPrice(total)}</strong>
          </div>
          <Link href={"/checkout" as Route} className="button button--primary" onClick={close}>
            К оформлению
          </Link>
        </div>
      </aside>
    </div>
  );
}
