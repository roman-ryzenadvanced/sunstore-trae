"use client";

import { useEffect, useRef } from "react";
import type { Route } from "next";
import Link from "next/link";

import { formatPrice } from "@/lib/format";
import { useCartStore } from "@/store/cart";
import { toast } from "@/components/toaster";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function CartDrawer() {
  const { isOpen, close, items, removeItem, updateQuantity, hydrated } =
    useCartStore();
  const panelRef = useRef<HTMLElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Body scroll lock + focus trap while open.
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into panel.
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    first?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "Tab" && panel) {
        const nodes = Array.from(
          panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        );
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen, close]);

  const total = items.reduce(
    (sum, item) => sum + item.product.price_kopecks * item.quantity,
    0
  );

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      className={`cart-drawer ${isOpen ? "cart-drawer--open" : ""}`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        className="cart-drawer__overlay"
        onClick={close}
        aria-label="Закрыть корзину"
        tabIndex={isOpen ? 0 : -1}
      />
      <aside
        ref={panelRef}
        className="cart-drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Корзина, ${itemCount} ${
          itemCount === 1 ? "товар" : itemCount < 5 ? "товара" : "товаров"
        }`}
      >
        <div className="cart-drawer__header">
          <div>
            <p className="eyebrow">Корзина</p>
            <h3>
              {itemCount > 0
                ? `${itemCount} ${
                    itemCount === 1
                      ? "товар"
                      : itemCount < 5
                      ? "товара"
                      : "товаров"
                  }`
                : "Корзина пуста"}
            </h3>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={close}
            aria-label="Закрыть"
            tabIndex={isOpen ? 0 : -1}
          >
            ✕
          </button>
        </div>

        <div className="cart-drawer__body">
          {!hydrated ? (
            <div className="empty-card">
              <p>Загрузка корзины…</p>
            </div>
          ) : items.length === 0 ? (
            <div className="empty-card">
              <p className="eyebrow">Пока пусто</p>
              <p>Добавьте изделие из каталога, чтобы оформить заказ.</p>
              <Link
                href={"/catalog" as Route}
                className="button button--ghost"
                onClick={close}
              >
                Перейти в каталог
              </Link>
            </div>
          ) : (
            items.map((item) => {
              const maxQty =
                item.product.stock_quantity > 0
                  ? item.product.stock_quantity
                  : 99;
              const atMax = item.quantity >= maxQty;
              return (
                <div key={item.product.id} className="cart-line">
                  <div className="cart-line__media">
                    {item.product.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.product.images[0]}
                        alt=""
                        loading="lazy"
                      />
                    ) : (
                      <span aria-hidden="true">◐</span>
                    )}
                  </div>
                  <div className="cart-line__info">
                    <p className="eyebrow">{item.product.sku}</p>
                    <strong>{item.product.title_ru}</strong>
                    <p>{formatPrice(item.product.price_kopecks)}</p>
                  </div>
                  <div className="cart-line__actions">
                    <div className="stepper">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity - 1)
                        }
                        aria-label="Уменьшить количество"
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <span aria-live="polite">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (atMax) {
                            toast.warning(
                              "Достигнут максимум",
                              `На складе: ${maxQty} шт.`
                            );
                            return;
                          }
                          updateQuantity(item.product.id, item.quantity + 1);
                        }}
                        aria-label="Увеличить количество"
                        disabled={atMax}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="text-button text-button--danger"
                      onClick={() => {
                        removeItem(item.product.id);
                        toast.info("Удалено из корзины", item.product.title_ru);
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="cart-drawer__footer">
          <div>
            <p className="eyebrow">Итого</p>
            <strong>{formatPrice(total)}</strong>
          </div>
          <Link
            href={"/checkout" as Route}
            className={`button button--primary ${
              items.length === 0 ? "button--disabled" : ""
            }`}
            onClick={close}
            aria-disabled={items.length === 0}
            tabIndex={items.length === 0 ? -1 : 0}
          >
            К оформлению
          </Link>
        </div>
      </aside>
    </div>
  );
}
