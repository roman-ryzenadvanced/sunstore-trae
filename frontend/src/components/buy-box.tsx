"use client";

import { useState } from "react";
import { Minus, Plus, Check, ShoppingBag } from "lucide-react";

import { useCartStore } from "@/store/cart";
import { toast } from "@/components/toaster";
import { cn } from "@/lib/format";
import type { Product } from "@/types/api";

interface BuyBoxProps {
  product: Product;
}

/**
 * Quantity stepper + add-to-cart for the product page.
 * Wraps the cart store's addItem(product, qty) instead of the single-unit
 * AddToCartButton so buyers can pick a multi-panel quantity.
 */
export function BuyBox({ product }: BuyBoxProps) {
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.open);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const outOfStock = product.stock_quantity <= 0;
  const max = Math.max(1, product.stock_quantity);

  function dec() {
    setQty((q) => Math.max(1, q - 1));
  }
  function inc() {
    setQty((q) => Math.min(max, q + 1));
  }

  function handleAdd() {
    if (outOfStock) {
      toast.warning("Нет в наличии", product.title_ru);
      return;
    }
    addItem(product, qty);
    toast.success(`Добавлено: ${qty} шт.`, product.title_ru);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
    openCart();
  }

  return (
    <div className="buybox">
      <div className="qty-stepper" data-disabled={outOfStock || undefined}>
        <button
          type="button"
          className="qty-stepper__btn"
          onClick={dec}
          disabled={outOfStock || qty <= 1}
          aria-label="Уменьшить количество"
        >
          <Minus size={16} aria-hidden="true" />
        </button>
        <input
          className="qty-stepper__value"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={qty}
          aria-label="Количество"
          disabled={outOfStock}
          onChange={(e) => {
            const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
            if (Number.isNaN(n)) return setQty(1);
            setQty(Math.min(max, Math.max(1, n)));
          }}
        />
        <button
          type="button"
          className="qty-stepper__btn"
          onClick={inc}
          disabled={outOfStock || qty >= max}
          aria-label="Увеличить количество"
        >
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        className={cn(
          "button buybox__cta",
          outOfStock ? "button--disabled" : "button--primary",
          justAdded && "button--success"
        )}
        onClick={handleAdd}
        disabled={outOfStock || justAdded}
      >
        {justAdded ? (
          <>
            <Check size={16} aria-hidden="true" /> Добавлено
          </>
        ) : outOfStock ? (
          <>
            <ShoppingBag size={16} aria-hidden="true" /> Нет в наличии
          </>
        ) : (
          <>
            <ShoppingBag size={16} aria-hidden="true" /> В корзину
          </>
        )}
      </button>
    </div>
  );
}
