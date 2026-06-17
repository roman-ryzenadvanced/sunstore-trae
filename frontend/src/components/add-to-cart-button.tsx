"use client";

import type { Product } from "@/types/api";
import { useCartStore } from "@/store/cart";

export function AddToCartButton({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <button
      type="button"
      className="button button--primary"
      onClick={() => addItem(product)}
    >
      Добавить в корзину
    </button>
  );
}
