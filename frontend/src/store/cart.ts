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
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clear: () => void;
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
    return JSON.parse(raw) as CartLine[];
  } catch {
    return [];
  }
}

function persist(items: CartLine[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const useCartStore = create<CartState>((set) => ({
  isOpen: false,
  items: [],
  hydrated: false,
  hydrate: () => set({ items: readInitialItems(), hydrated: true }),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  addItem: (product) =>
    set((state) => {
      const existing = state.items.find((item) => item.product.id === product.id);
      const items = existing
        ? state.items.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...state.items, { product, quantity: 1 }];
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
            ? { ...item, quantity: Math.max(1, quantity) }
            : item
        )
        .filter((item) => item.quantity > 0);
      persist(items);
      return { items };
    }),
  clear: () => {
    persist([]);
    return set({ items: [], isOpen: false });
  }
}));
