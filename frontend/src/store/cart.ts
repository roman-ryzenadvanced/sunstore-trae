"use client";

import { create } from "zustand";

import type { Product } from "@/types/api";

interface CartLine {
  product: Product;
  quantity: number;
}

interface CartState {
  isOpen: boolean;
  items: CartLine[];
  hydrated: boolean;
  hydrate: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  addItem: (product: Product, qty?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clear: () => void;
  /** Total quantity across all lines. */
  count: () => number;
  /** Total price in kopecks. */
  total: () => number;
}

const STORAGE_KEY = "sunstore-cart";

function readInitialItems(): CartLine[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as CartLine[];
    if (!Array.isArray(parsed)) return [];
    // Defensive: drop any malformed entries.
    return parsed.filter(
      (line) =>
        line &&
        typeof line === "object" &&
        line.product &&
        typeof line.product.id === "number" &&
        typeof line.quantity === "number" &&
        line.quantity > 0
    );
  } catch {
    return [];
  }
}

function persist(items: CartLine[]) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Quota exceeded / private mode — fail silently.
  }
}

export const useCartStore = create<CartState>((set, get) => ({
  isOpen: false,
  items: [],
  hydrated: false,
  hydrate: () =>
    set((state) =>
      state.hydrated
        ? state
        : { items: readInitialItems(), hydrated: true }
    ),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  addItem: (product, qty = 1) =>
    set((state) => {
      const stockCap = product.stock_quantity > 0 ? product.stock_quantity : Infinity;
      const existing = state.items.find((item) => item.product.id === product.id);
      const items = existing
        ? state.items.map((item) =>
            item.product.id === product.id
              ? {
                  ...item,
                  quantity: Math.min(stockCap, item.quantity + qty)
                }
              : item
          )
        : [...state.items, { product, quantity: Math.min(stockCap, qty) }];
      persist(items);
      return { items, isOpen: true };
    }),
  removeItem: (productId) =>
    set((state) => {
      const items = state.items.filter((item) => item.product.id !== productId);
      persist(items);
      return { items };
    }),
  updateQuantity: (productId, quantity) =>
    set((state) => {
      const items = state.items
        .map((item) =>
          item.product.id === productId
            ? {
                ...item,
                quantity: Math.max(1, Math.min(item.product.stock_quantity > 0 ? item.product.stock_quantity : quantity, quantity))
              }
            : item
        )
        .filter((item) => item.quantity > 0);
      persist(items);
      return { items };
    }),
  clear: () => {
    persist([]);
    return set({ items: [], isOpen: false });
  },
  count: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
  total: () =>
    get().items.reduce(
      (sum, item) => sum + item.product.price_kopecks * item.quantity,
      0
    )
}));
