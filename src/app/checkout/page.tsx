"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useCurrency } from '@/hooks/useCurrency'
import { CartProvider, useCart } from '@/contexts/CartContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function CheckoutPage() {
  const { cartItems, updateQuantity, removeFromCart, clearCart, isLoading } = useCart()
  const { currency, convertPrice, currencyConfig } = useCurrency()
  const [currentStep, setCurrentStep] = useState(1)
  const [paymentData, setPaymentData] = useState({
    method: 'card',
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  })

  // Initialize dark theme
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(convertPrice(price))
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shippingCost = subtotal >= 50000 ? 0 : 3500
  const total = subtotal + shippingCost

  const handlePayment = async () => {
    try {
      const sessionId = localStorage.getItem('sunstore_session_id') || 'default'
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({
          customerName: 'Customer Name',
          customerEmail: 'customer@example.com',
          customerPhone: '+7 999 123 45 67',
          shippingAddress: {
            street: '123 Solar Street',
            city: 'Moscow',
            postalCode: '123456',
            country: 'Russia'
          },
          paymentMethod: paymentData.method,
          notes: 'Order placed via checkout'
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Redirect to status page
        window.location.href = `/status?id=${data.orderId}`
      }
    } catch (error) {
      console.error('Payment failed:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Обработка заказа...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      <Header />

      {/* Progress Steps */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50 py-8">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-center space-x-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${currentStep >= step 
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/50' 
                  : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'}`}> 
                  {step}
                </div>
                {step < 3 && (
                  <div className={`h-0.5 w-32 ml-4 rounded-full transition-all duration-300 ${currentStep > step 
                    ? 'bg-orange-500' 
                    : 'bg-slate-700/50'}`}> 
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4 space-x-16">
            <div className="text-sm text-slate-400">Корзина</div>
            <div className="text-sm text-slate-400">Оплата</div>
            <div className="text-sm text-slate-400">Подтверждение</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Step 1: Cart Review */}
        {currentStep === 1 && (
          <div>
            <h1 className="text-4xl font-bold mb-8 text-center">
              <span className="text-orange-400">Проверка</span> Корзины
            </h1>
            
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 mb-8">
              <div className="p-6 border-b border-slate-700/50">
                <h2 className="text-2xl font-semibold">Товары в корзине</h2>
              </div>
              
              <div className="divide-y divide-slate-700/50">
                {cartItems.map((item: any) => (
                  <div key={item.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10a2 2 0 012-2zm12-4v4m-4-4v4m-4-4v4m-4-4h16"/>
                            </svg>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          <p className="text-slate-400 text-sm">Категория: {item.category}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="text-sm text-slate-400 mb-2">Количество</div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg flex items-center justify-center transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"/>
                              </svg>
                            </button>
                            <span className="w-12 text-center font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg flex items-center justify-center transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8l-8 8-8-8"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-xl font-bold text-orange-400">
                            {formatPrice(item.price * item.quantity)}
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-sm text-red-400 hover:text-red-300 transition-colors mt-1"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center mb-12">
              <button
                onClick={() => setCurrentStep(2)}
                className="bg-slate-700/50 hover:bg-slate-600/50 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Далее
              </button>
              
              <button
                onClick={() => clearCart()}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                Очистить корзину
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Payment */}
        {currentStep === 2 && (
          <div>
            <h1 className="text-4xl font-bold mb-8 text-center">
              <span className="text-blue-400">Оплата</span> и Доставка
            </h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8">
                <h2 className="text-2xl font-semibold mb-6">Способ оплаты</h2>
                
                <div className="space-y-4">
                  <label className="flex items-center space-x-3 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30 cursor-pointer hover:bg-slate-700/50 transition-colors"> 
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentData.method === 'card'}
                      onChange={() => setPaymentData(prev => ({ ...prev, method: 'card' }))}
                      className="w-5 h-5 text-orange-500"
                    />
                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="2"/>
                      <path d="M2 10h20" strokeWidth="2"/>
                    </svg>
                    <div>
                      <div className="font-semibold">Банковская карта</div>
                      <div className="text-sm text-slate-400">Visa, MasterCard, Mir</div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30 cursor-pointer hover:bg-slate-700/50 transition-colors"> 
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="tbank"
                      checked={paymentData.method === 'tbank'}
                      onChange={() => setPaymentData(prev => ({ ...prev, method: 'tbank' }))}
                      className="w-5 h-5 text-orange-500"
                    />
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/>
                      <path d="M12 6v8l4 4"/>
                    </svg>
                    <div>
                      <div className="font-semibold">Т-Банк</div>
                      <div className="text-sm text-slate-400">Электронные платежи</div>
                    </div>
                  </label>
                </div>

                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">Данные карты</h3>
                  
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Номер карты"
                      value={paymentData.cardNumber}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, cardNumber: e.target.value }))}
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-slate-50 placeholder-slate-400 focus:outline-none focus:border-orange-500/50 focus:bg-slate-700/80 transition-all"
                    />
                    
                    <input
                      type="text"
                      placeholder="Имя владельца"
                      value={paymentData.cardHolder}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, cardHolder: e.target.value }))}
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-slate-50 placeholder-slate-400 focus:outline-none focus:border-orange-500/50 focus:bg-slate-700/80 transition-all"
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="MM"
                        value={paymentData.expiryMonth}
                        onChange={(e) => setPaymentData(prev => ({ ...prev, expiryMonth: e.target.value }))}
                        className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-slate-50 placeholder-slate-400 focus:outline-none focus:border-orange-500/50 focus:bg-slate-700/80 transition-all"
                      />
                      <input
                        type="text"
                        placeholder="YYYY"
                        value={paymentData.expiryYear}
                        onChange={(e) => setPaymentData(prev => ({ ...prev, expiryYear: e.target.value }))}
                        className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-slate-50 placeholder-slate-400 focus:outline-none focus:border-orange-500/50 focus:bg-slate-700/80 transition-all"
                      />
                    </div>
                    
                    <input
                      type="text"
                      placeholder="CVV/CVC"
                      value={paymentData.cvv}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, cvv: e.target.value }))}
                      className="w-32 bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-slate-50 placeholder-slate-400 focus:outline-none focus:border-orange-500/50 focus:bg-slate-700/80 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8">
                <h2 className="text-2xl font-semibold mb-6">Сумма заказа</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between py-3 border-b border-slate-700/50">
                    <span className="text-slate-400">Сумма заказа</span>
                    <span className="font-semibold">{formatPrice(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between py-3 border-b border-slate-700/50">
                    <span className="text-slate-400">Доставка</span>
                    <span className={`font-semibold ${shippingCost === 0 ? 'text-green-400' : ''}`}>
                      {shippingCost === 0 ? 'Бесплатно' : formatPrice(shippingCost)}
                    </span>
                  </div>
                  
                  {shippingCost === 0 && (
                    <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                      <p className="text-green-400 text-sm">
                        🎉 Бесплатная доставка при заказе от 50 000 ₽
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-slate-700/50 pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Итого к оплате</span>
                    <span className="text-2xl font-bold text-orange-400">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => setCurrentStep(3)}
                  className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 border border-blue-500/30"
                >
                  Выбрать способ оплаты
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 3 && (
          <div>
            <h1 className="text-4xl font-bold mb-8 text-center">
              <span className="text-green-400">Подтверждение</span> Заказ
            </h1>
            
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 mb-8">
              <h2 className="text-2xl font-semibold mb-6">Информация о заказе</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                  <span className="text-slate-400">Номер заказа</span>
                  <span className="font-mono font-semibold">ORD-2024-12345</span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                  <span className="text-slate-400">Способ оплаты</span>
                  <span className="font-semibold">
                    {paymentData.method === 'card' ? 'Банковская карта' : 'Т-Банк'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                  <span className="text-slate-400">Сумма заказа</span>
                  <span className="font-semibold">{formatPrice(total)}</span>
                </div>
              </div>

              <button
                onClick={() => handlePayment()}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-orange-500/25"
              >
                Оплатить и подтвердить заказ
              </button>
            </div>

            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-400 text-sm text-center">
                🔒 Ваша безопасность важна. Все платежи защищены HTTPS шифрованием.
              </p>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}