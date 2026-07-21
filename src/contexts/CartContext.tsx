"use client"

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react'

interface CartItem {
  id: string
  name: string
  price: number
  image: string
  quantity: number
  energy?: number
  efficiency?: number
  category?: string
}

interface CartContextType {
  cartItems: CartItem[]
  cartCount: number
  addToCart: (item: CartItem) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
  isLoading: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

function getSessionId(): string {
  if (typeof window === 'undefined') return 'default'
  let sessionId = localStorage.getItem('sunstore_session_id')
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem('sunstore_session_id', sessionId)
  }
  return sessionId
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load cart from backend on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const sessionId = getSessionId()
        const response = await fetch('/api/cart', {
          headers: { 'x-session-id': sessionId }
        })
        const data = await response.json()
        if (data.items) {
          setCartItems(data.items)
        }
      } catch (error) {
        console.error('Failed to load cart:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadCart()
  }, [])

  // Re-sync cart when the tab regains focus or becomes visible again.
  // Ensures the header cart badge and drawer stay correct across
  // client-side navigations and multi-tab sessions.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const sessionId = getSessionId()
        fetch('/api/cart', { headers: { 'x-session-id': sessionId } })
          .then((r) => r.json())
          .then((data) => {
            if (Array.isArray(data.items)) setCartItems(data.items)
          })
          .catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleVisibility)
    }
  }, [])

  const syncToBackend = useCallback(async (items: CartItem[]) => {
    try {
      const sessionId = getSessionId()
      // Push the full cart state to backend
      await fetch('/api/cart/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({ items })
      })
    } catch (error) {
      console.error('Failed to sync cart:', error)
    }
  }, [])

  const addToCart = (newItem: CartItem) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === newItem.id)
      let updatedItems: CartItem[]

      if (existingItem) {
        updatedItems = prev.map(item =>
          item.id === newItem.id
            ? { ...item, quantity: Math.min(10, item.quantity + newItem.quantity) }
            : item
        )
      } else {
        updatedItems = [...prev, newItem]
      }

      syncToBackend(updatedItems)
      return updatedItems
    })
    setIsCartOpen(true)
  }

  const removeFromCart = (id: string) => {
    setCartItems(prev => {
      const updatedItems = prev.filter(item => item.id !== id)
      syncToBackend(updatedItems)
      return updatedItems
    })
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }
    setCartItems(prev => {
      const updatedItems = prev.map(item =>
        item.id === id ? { ...item, quantity: Math.min(10, quantity) } : item
      )
      syncToBackend(updatedItems)
      return updatedItems
    })
  }

  const clearCart = () => {
    setCartItems([])
    syncToBackend([])
  }

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isCartOpen,
      setIsCartOpen,
      isLoading
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
