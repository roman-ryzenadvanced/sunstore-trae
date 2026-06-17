"use client";

import { useMemo, useState } from "react";

import { checkoutInit } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { useCartStore } from "@/store/cart";

export function CheckoutForm() {
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.product.price_kopecks * item.quantity,
        0
      ),
    [items]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!items.length) {
      setError("Добавьте товары в корзину перед оформлением.");
      return;
    }

    setLoading(true);

    try {
      const response = await checkoutInit({
        customer_name: customerName,
        email,
        phone,
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity
        }))
      });

      clear();
      window.location.assign(response.payment_url);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Не удалось создать заказ"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="checkout-grid">
      <form className="checkout-card" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Checkout</p>
          <h1>Оформление заказа</h1>
          <p className="muted">
            Форма отправляет payload в POST /api/v1/checkout/init.
          </p>
        </div>

        <label className="field">
          <span>Имя</span>
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        </label>

        <label className="field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        <label className="field">
          <span>Телефон</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>

        {error ? <p className="error-text">{error}</p> : null}

        <button type="submit" className="button button--primary" disabled={loading}>
          {loading ? "Создаём заказ..." : "Перейти к оплате"}
        </button>
      </form>

      <aside className="checkout-card checkout-card--summary">
        <div>
          <p className="eyebrow">Summary</p>
          <h2>Ваш заказ</h2>
        </div>

        <div className="summary-lines">
          {items.map((item) => (
            <div key={item.product.id} className="summary-line">
              <div>
                <strong>{item.product.title_ru}</strong>
                <p>
                  {item.quantity} × {formatPrice(item.product.price_kopecks)}
                </p>
              </div>
              <strong>{formatPrice(item.product.price_kopecks * item.quantity)}</strong>
            </div>
          ))}
        </div>

        <div className="summary-total">
          <span>Итого</span>
          <strong>{formatPrice(total)}</strong>
        </div>
      </aside>
    </div>
  );
}
