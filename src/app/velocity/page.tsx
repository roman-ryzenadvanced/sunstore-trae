'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'

export default function VelocityPage() {
  const [mounted, setMounted] = useState(false)
  const { cartItems, updateQuantity, removeFromCart, isLoading } = useCart()

  useEffect(() => {
    setMounted(true)
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price)
  }

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const toast = document.getElementById('toast')
    if (!toast) return

    toast.textContent = message
    toast.className = `toast toast-${type} show`

    setTimeout(() => {
      toast.classList.remove('show')
    }, 3000)
  }

  if (!mounted) {
    return <div className="loading">Загрузка...</div>
  }

  const subtotal = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
  const shippingCost = subtotal >= 50000 ? 0 : 3500
  const orderTotal = subtotal + shippingCost

  return (
    <>
      <div className="velocity-page">
        <header className="velocity-header">
          <h1 className="velocity-title">Корзина</h1>
          <p className="velocity-subtitle">Ваши высокопроизводительные солнечные компоненты готовы к отправке</p>
        </header>

        <div className="velocity-container">
          <main className="cart-items">
            {isLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Загрузка корзины...</p>
              </div>
            ) : cartItems.length > 0 ? (
              cartItems.map((item: any) => (
                <article key={item.id} className="cart-item">
                  <div className="item-visual">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="item-image" />
                    ) : (
                      <div className="item-placeholder">{item.category}</div>
                    )}
                  </div>
                  <div className="item-details">
                    <h3 className="item-name">{item.name}</h3>
                    <p className="item-category">{item.category}</p>
                    <p className="item-price mono">₽{formatPrice(item.price)}</p>
                  </div>
                  <div className="item-actions">
                    <div className="quantity-controls">
                      <button
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        className="quantity-input"
                        value={item.quantity}
                        min="1"
                        max="10"
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                      />
                      <button
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= 10}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => {
                        removeFromCart(item.id)
                        showToast('Товар удалён из корзины!', 'success')
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-cart">
                <div className="empty-icon">🛒</div>
                <h2>Ваша корзина пуста</h2>
                <p>Похоже, вы ещё не добавили солнечные компоненты.</p>
                <Link href="/array" className="shop-now-btn">
                  Перейти к покупкам
                </Link>
              </div>
            )}
          </main>

          <aside className="cart-summary">
            <div className="summary-card">
              <h2 className="summary-title">Итог заказа</h2>
              <div className="summary-row">
                <span>Подытог</span>
                <span className="mono">₽{formatPrice(subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Доставка</span>
                <span className="mono">{shippingCost === 0 ? 'БЕСПЛАТНО' : `₽${formatPrice(shippingCost)}`}</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row total">
                <span>Итого</span>
                <span className="mono total-price">₽{formatPrice(orderTotal)}</span>
              </div>
              <div className="progress-section">
                <p className="progress-label">Прогресс бесплатной доставки</p>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(100, (subtotal / 50000) * 100)}%` }}
                  ></div>
                </div>
                <p className="progress-text">
                  {subtotal >= 50000
                    ? '🎉 Бесплатная доставка разблокирована!'
                    : `₽${formatPrice(50000 - subtotal)} до бесплатной доставки`}
                </p>
              </div>
              <Link
                href="/checkout"
                className="checkout-btn"
                style={{
                  opacity: cartItems.length === 0 ? 0.6 : 1,
                  pointerEvents: cartItems.length === 0 ? 'none' : 'auto'
                }}
              >
                Перейти к оформлению
              </Link>
              <Link href="/array" className="continue-shopping-btn">
                Продолжить покупки
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <div className="toast" id="toast"></div>

      <style jsx global>{`
        .velocity-page {
          --bg: #0f172a;
          --surface: #1e293b;
          --surface-2: #334155;
          --border: #334155;
          --ink: #f8fafc;
          --ink-2: #cbd5e1;
          --ink-3: #94a3b8;
          --brand: #f97316;
          --brand-hover: #ea580c;
          --success: #10b981;
          --r-sm: 0.25rem;
          --r-md: 0.5rem;
          --r-lg: 1rem;
          --r-xl: 2rem;
          --r-2xl: 3rem;
          --dur-base: 0.2s;
          --dur-slow: 0.4s;
          --ease-kinetic: ease;
        }

        .loading {
          text-align: center;
          padding: 2rem;
          color: var(--ink-3);
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          margin: 0 auto 1rem;
          border: 3px solid var(--border);
          border-top-color: var(--brand);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .toast {
          position: fixed;
          bottom: var(--r-lg);
          right: var(--r-lg);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          padding: var(--r-md) var(--r-lg);
          box-shadow: var(--leak-amber);
          z-index: 1000;
          transform: translateY(100px);
          opacity: 0;
          transition: all var(--dur-base) var(--ease-kinetic);
        }

        .toast.show {
          transform: translateY(0);
          opacity: 1;
        }

        .toast-success {
          border-color: var(--success);
        }

        .toast-error {
          border-color: #DC2626;
        }

        .velocity-page {
          min-height: 100vh;
          background: var(--bg);
          color: var(--ink);
          padding: var(--r-xl) var(--r-md);
        }

        .velocity-header {
          text-align: center;
          margin-bottom: var(--r-2xl);
          padding-top: var(--r-lg);
        }

        .velocity-title {
          font-family: var(--font-display);
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--ink);
          margin-bottom: var(--r-sm);
        }

        .velocity-subtitle {
          font-family: var(--font-body);
          font-size: 1.125rem;
          color: var(--ink-3);
          max-width: 600px;
          margin: 0 auto;
        }

        .velocity-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--r-xl);
          max-width: 1200px;
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .velocity-container {
            grid-template-columns: 1fr 380px;
          }
        }

        .cart-items {
          display: flex;
          flex-direction: column;
          gap: var(--r-md);
        }

        .cart-item {
          background: var(--surface);
          border-radius: var(--r-lg);
          padding: var(--r-md);
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--r-md);
          border: 1px solid var(--border);
          transition: all var(--dur-base) var(--ease-kinetic);
        }

        @media (min-width: 480px) {
          .cart-item {
            grid-template-columns: auto 1fr auto;
            align-items: center;
          }
        }

        .cart-item:hover {
          border-color: var(--brand);
          box-shadow: var(--leak-amber);
        }

        .item-visual {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, var(--surface-2) 0%, var(--surface) 100%);
          border-radius: var(--r-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          overflow: hidden;
        }

        .item-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .item-details {
          flex: 1;
        }

        .item-name {
          font-family: var(--font-display);
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: var(--r-xs);
          line-height: 1.3;
        }

        .item-category {
          font-size: 0.875rem;
          color: var(--ink-3);
          margin-bottom: var(--r-xs);
        }

        .item-price {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--brand);
        }

        .item-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: var(--r-sm);
        }

        .quantity-controls {
          display: flex;
          align-items: center;
          gap: var(--r-xs);
        }

        .quantity-btn {
          width: 32px;
          height: 32px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--r-sm);
          color: var(--ink);
          font-size: 1rem;
          cursor: pointer;
          transition: all var(--dur-base) var(--ease-kinetic);
        }

        .quantity-btn:hover {
          border-color: var(--brand);
          background: rgba(255, 154, 0, 0.1);
        }

        .quantity-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .quantity-input {
          width: 48px;
          text-align: center;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-sm);
          color: var(--ink);
          font-family: var(--font-mono);
          font-size: 0.875rem;
          padding: 0;
        }

        .remove-btn {
          background: transparent;
          border: none;
          color: var(--ink-3);
          font-size: 0.875rem;
          cursor: pointer;
          transition: color var(--dur-base) var(--ease-kinetic);
        }

        .remove-btn:hover {
          color: #DC2626;
        }

        .empty-cart {
          text-align: center;
          padding: var(--r-2xl);
          color: var(--ink-3);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: var(--r-md);
          opacity: 0.5;
        }

        .empty-cart h2 {
          font-family: var(--font-display);
          font-size: 1.5rem;
          margin-bottom: var(--r-sm);
          color: var(--ink);
        }

        .shop-now-btn {
          display: inline-block;
          background: var(--brand);
          color: var(--surface);
          padding: var(--r-md) var(--r-xl);
          border-radius: var(--r-md);
          font-weight: 600;
          text-decoration: none;
          transition: all var(--dur-base) var(--ease-kinetic);
          margin-top: var(--r-md);
        }

        .shop-now-btn:hover {
          background: var(--brand-hover);
          transform: translateY(-2px);
        }

        .cart-summary {
          position: sticky;
          top: var(--r-xl);
          height: fit-content;
        }

        .summary-card {
          background: var(--surface);
          border-radius: var(--r-lg);
          padding: var(--r-lg);
          border: 1px solid var(--border);
          box-shadow: var(--leak-soft);
        }

        .summary-title {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: var(--r-md);
          color: var(--ink);
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--r-md);
          font-size: 0.9375rem;
        }

        .summary-row.total {
          font-size: 1.125rem;
          font-weight: 600;
          margin-top: var(--r-md);
        }

        .total-price {
          color: var(--brand);
          font-size: 1.25rem;
        }

        .summary-divider {
          height: 1px;
          background: var(--border);
          margin: var(--r-md) 0;
        }

        .progress-section {
          margin-top: var(--r-lg);
          padding: var(--r-md);
          background: var(--surface-2);
          border-radius: var(--r-md);
        }

        .progress-label {
          font-size: 0.875rem;
          color: var(--ink-3);
          margin-bottom: var(--r-sm);
        }

        .progress-bar {
          height: 8px;
          background: var(--border);
          border-radius: var(--r-sm);
          overflow: hidden;
          margin-bottom: var(--r-sm);
        }

        .progress-fill {
          height: 100%;
          background: var(--brand);
          transition: width var(--dur-slow) var(--ease-kinetic);
        }

        .progress-text {
          font-size: 0.75rem;
          color: var(--ink-3);
          text-align: center;
        }

        .checkout-btn {
          display: block;
          width: 100%;
          padding: var(--r-md);
          background: var(--brand);
          color: var(--surface);
          border: none;
          border-radius: var(--r-md);
          font-weight: 600;
          text-align: center;
          text-decoration: none;
          transition: all var(--dur-base) var(--ease-kinetic);
          margin-top: var(--r-lg);
        }

        .checkout-btn:hover {
          background: var(--brand-hover);
          transform: translateY(-1px);
        }

        .continue-shopping-btn {
          display: block;
          width: 100%;
          padding: var(--r-md);
          background: transparent;
          color: var(--ink-2);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          font-weight: 600;
          text-align: center;
          text-decoration: none;
          transition: all var(--dur-base) var(--ease-kinetic);
          margin-top: var(--r-sm);
        }

        .continue-shopping-btn:hover {
          border-color: var(--brand);
          color: var(--brand);
        }

        .loading-state {
          text-align: center;
          padding: var(--r-2xl);
          color: var(--ink-3);
        }
      `}</style>
    </>
  )
}
