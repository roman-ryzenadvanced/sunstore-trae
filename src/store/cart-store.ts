'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// SSR-safe storage (see app-store.ts for rationale)
const safeStorage = createJSONStorage(() => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    }
  }
  return window.localStorage
})

export interface CartItem {
  id: string
  title: string
  price: number
  image: string | null
  stock: number
  quantity: number
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  storeSlug: string | null
  // actions
  initForStore: (slug: string) => void
  add: (item: Omit<CartItem, 'quantity'>, qty?: number) => void
  remove: (id: string) => void
  setQty: (id: string, qty: number) => void
  clear: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  // selectors
  count: () => number
  subtotal: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      storeSlug: null,

      // Each store has its own cart. Switching stores resets the cart.
      initForStore: (slug) => {
        const current = get().storeSlug
        if (current !== slug) {
          set({ storeSlug: slug, items: [], isOpen: false })
        }
      },

      add: (item, qty = 1) => {
        const items = get().items
        const existing = items.find((i) => i.id === item.id)
        if (existing) {
          const nextQty = Math.min(existing.quantity + qty, item.stock || 999)
          set({
            items: items.map((i) =>
              i.id === item.id ? { ...i, quantity: nextQty } : i
            ),
            isOpen: true, // pop the cart open on add
          })
        } else {
          set({
            items: [...items, { ...item, quantity: Math.min(qty, item.stock || 999) }],
            isOpen: true,
          })
        }
      },

      remove: (id) =>
        set({ items: get().items.filter((i) => i.id !== id) }),

      setQty: (id, qty) =>
        set({
          items: get()
            .items.map((i) =>
              i.id === id
                ? { ...i, quantity: Math.max(0, Math.min(qty, i.stock || 999)) }
                : i
            )
            .filter((i) => i.quantity > 0),
        }),

      clear: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),

      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: 'sunstore-cart',
      storage: safeStorage,
      // Persist cart contents per browser
      partialize: (state) => ({
        items: state.items,
        storeSlug: state.storeSlug,
      }),
    }
  )
)
