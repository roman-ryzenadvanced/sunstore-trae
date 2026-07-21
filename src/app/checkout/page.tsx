"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useCart } from '@/contexts/CartContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

/* Static map of gateway IDs → Russian display names (per spec). */
const GATEWAY_NAMES: Record<string, string> = {
  tbank: 'Т-Банк',
  yookassa: 'ЮKassa',
  sberbank: 'Сбербанк',
  cloudpayments: 'CloudPayments',
  robokassa: 'Робокасса',
  demo: 'Демо-режим'
}

const rubFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0
})

/* ---- CloudPayments widget loader ---- */
declare global {
  interface Window {
    cp?: { cloudPayments?: new (publicId: string) => { pay: (opts: any) => void } }
  }
}

function runCloudPaymentsWidget(widget: any, onSuccess?: () => void, onFail?: () => void) {
  const CpCtor = window.cp?.cloudPayments
  if (!CpCtor) {
    throw new Error('Не удалось загрузить виджет оплаты')
  }
  const instance = new CpCtor(widget.publicId)
  instance.pay({
    ...widget,
    onSuccess: onSuccess,
    onFail: onFail
  })
}

function loadCloudPaymentsWidget(
  widget: any,
  onSuccess?: () => void,
  onFail?: () => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.cp?.cloudPayments) {
      try {
        runCloudPaymentsWidget(widget, onSuccess, onFail)
        resolve()
      } catch (e) {
        reject(e)
      }
      return
    }

    const existing = document.getElementById('cloudpayments-widget') as HTMLScriptElement | null
    if (existing) {
      if (window.cp?.cloudPayments) {
        try {
          runCloudPaymentsWidget(widget, onSuccess, onFail)
          resolve()
        } catch (e) {
          reject(e)
        }
      } else {
        existing.addEventListener('load', () => {
          try {
            runCloudPaymentsWidget(widget, onSuccess, onFail)
            resolve()
          } catch (e) {
            reject(e)
          }
        })
        existing.addEventListener('error', () => reject(new Error('Не удалось загрузить виджет оплаты')))
      }
      return
    }

    const script = document.createElement('script')
    script.src = 'https://widget.cloudpayments.ru/bundles/cloudpayments.js'
    script.id = 'cloudpayments-widget'
    script.async = true
    script.onload = () => {
      try {
        runCloudPaymentsWidget(widget, onSuccess, onFail)
        resolve()
      } catch (e) {
        reject(e)
      }
    }
    script.onerror = () => reject(new Error('Не удалось загрузить виджет оплаты'))
    document.body.appendChild(script)
  })
}

export default function CheckoutPage() {
  const { cartItems, updateQuantity, removeFromCart, clearCart, isLoading } = useCart()
  const { formatPrice: ctxFormatPrice } = useCurrency() as any
  const [currentStep, setCurrentStep] = useState(1)
  const [paymentData, setPaymentData] = useState({
    method: 'card',
    // Customer fields collected for order creation
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    addressStreet: '',
    addressCity: '',
    addressPostal: '',
    addressCountry: 'Россия'
  })
  const [customerError, setCustomerError] = useState('')

  // Created order context (drives the gateway step)
  const [order, setOrder] = useState<{
    orderId: string
    orderNumber: string
    total: number
    currency: string
  } | null>(null)
  const [orderCreating, setOrderCreating] = useState(false)

  // Gateway selection step state
  const [gateways, setGateways] = useState<{ id: string; enabled: boolean; mode: string }[]>([])
  const [activeGateway, setActiveGateway] = useState<string>('')
  const [selectedGateway, setSelectedGateway] = useState<string>('')
  const [configLoading, setConfigLoading] = useState(false)
  const [payLoading, setPayLoading] = useState(false)
  const [payError, setPayError] = useState('')

  // Guard against double-charging on reload: persist created order id
  const createdOrderKey = 'sunstore_created_order'
  const orderInitRef = useRef(false)

  // Initialize dark theme
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }, [])

  // On mount: if an order was already created this session, resume at the gateway step.
  useEffect(() => {
    if (orderInitRef.current) return
    orderInitRef.current = true
    try {
      const raw = typeof window !== 'undefined' ? sessionStorage.getItem(createdOrderKey) : null
      if (raw) {
        const parsed = JSON.parse(raw)
        setOrder(parsed)
        setCurrentStep(4)
      }
    } catch {
      /* ignore corrupt session state */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When entering the gateway step, load enabled gateways from store-config.
  useEffect(() => {
    if (currentStep === 4) {
      loadStoreConfig()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep])

  const loadStoreConfig = async () => {
    setConfigLoading(true)
    try {
      const res = await fetch('/api/store-config')
      const data = await res.json()
      const map = data.gateways || {}
      const list = Object.entries(map)
        .map(([id, cfg]: [string, any]) => ({ id, enabled: !!cfg.enabled, mode: cfg.mode }))
        .filter((g) => g.enabled)
      setGateways(list)
      const preselect = list.find((g) => g.id === data.activeGateway)?.id || list[0]?.id || ''
      setActiveGateway(data.activeGateway || '')
      setSelectedGateway(preselect)
    } catch (e) {
      setPayError('Не удалось загрузить способы оплаты. Попробуйте обновить страницу.')
    } finally {
      setConfigLoading(false)
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shippingCost = subtotal >= 50000 ? 0 : 3500
  const total = subtotal + shippingCost

  /* Step 3 → create the order, then advance to gateway selection (step 4). */
  const handleCreateOrder = async () => {
    setOrderCreating(true)
    setPayError('')
    try {
      const sessionId = localStorage.getItem('sunstore_session_id') || 'default'
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({
          customerName: paymentData.customerName || 'Покупатель',
          customerEmail: paymentData.customerEmail || 'customer@example.com',
          customerPhone: paymentData.customerPhone || '+7 999 123 45 67',
          shippingAddress: {
            street: paymentData.addressStreet,
            city: paymentData.addressCity,
            postalCode: paymentData.addressPostal,
            country: paymentData.addressCountry
          },
          paymentMethod: paymentData.method,
          notes: 'Order placed via checkout'
        })
      })

      if (response.ok) {
        const data = await response.json()
        const created = {
          orderId: data.orderId,
          orderNumber: data.orderNumber,
          total: typeof data.total === 'number' ? data.total : total,
          currency: data.currency || 'RUB'
        }
        setOrder(created)
        // Persist so a reload resumes here instead of double-charging.
        try {
          sessionStorage.setItem(createdOrderKey, JSON.stringify(created))
        } catch {
          /* ignore */
        }
        setCurrentStep(4)
      } else {
        const err = await response.json().catch(() => ({}))
        setPayError(err.error || 'Не удалось создать заказ. Попробуйте ещё раз.')
      }
    } catch (error) {
      console.error('Order creation failed:', error)
      setPayError('Не удалось создать заказ. Проверьте соединение и попробуйте снова.')
    } finally {
      setOrderCreating(false)
    }
  }

  /* Step 4 → initialize payment through the chosen gateway. */
  const handlePay = async () => {
    if (!order || !selectedGateway) return
    setPayLoading(true)
    setPayError('')
    try {
      const response = await fetch('/api/payments/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.orderId, gateway: selectedGateway })
      })
      const data = await response.json()

      if (data.ok === false) {
        setPayError(data.error || 'Не удалось инициализировать платёж.')
        return
      }

      // Redirect-based gateway
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
        return
      }

      // Widget-based gateway (CloudPayments)
      if (data.widget) {
        try {
          await loadCloudPaymentsWidget(
            data.widget,
            () => {
              window.location.href = `/status?id=${encodeURIComponent(order.orderId)}`
            },
            () => {
              window.location.href = `/status?id=${encodeURIComponent(order.orderId)}&fail=1`
            }
          )
          return
        } catch (e: any) {
          setPayError(e?.message || 'Не удалось загрузить виджет оплаты')
          return
        }
      }

      // Fallback: no paymentUrl and no widget
      setPayError('Шлюз не вернул способ оплаты. Выберите другой способ.')
    } catch (error) {
      console.error('Payment init failed:', error)
      setPayError('Не удалось начать оплату. Попробуйте ещё раз.')
    } finally {
      setPayLoading(false)
    }
  }

  const goToCustomer = () => {
    setCustomerError('')
    setCurrentStep(2)
  }

  const validateCustomer = (): boolean => {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentData.customerEmail)
    const phoneOk = paymentData.customerPhone.replace(/\D/g, '').length >= 10
    if (!paymentData.customerName.trim()) {
      setCustomerError('Укажите имя получателя.')
      return false
    }
    if (!emailOk) {
      setCustomerError('Укажите корректный email.')
      return false
    }
    if (!phoneOk) {
      setCustomerError('Укажите корректный телефон.')
      return false
    }
    if (!paymentData.addressStreet.trim() || !paymentData.addressCity.trim()) {
      setCustomerError('Укажите адрес доставки.')
      return false
    }
    setCustomerError('')
    return true
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
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${currentStep >= step
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/50'
                  : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'}`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`h-0.5 w-32 ml-4 rounded-full transition-all duration-300 ${currentStep > step
                    ? 'bg-orange-500'
                    : 'bg-slate-700/50'}`}>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4 space-x-10">
            <div className="text-sm text-slate-400">Корзина</div>
            <div className="text-sm text-slate-400">Данные</div>
            <div className="text-sm text-slate-400">Подтверждение</div>
            <div className="text-sm text-slate-400">Оплата</div>
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
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10a2 2 0 012-2zm12-4v4m-4-4v4m-4-4v4m-4-4h16" />
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="w-12 text-center font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg flex items-center justify-center transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8l-8 8-8-8" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xl font-bold text-orange-400">
                            {ctxFormatPrice(item.price * item.quantity)}
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
                onClick={goToCustomer}
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

        {/* Step 2: Customer data + payment method */}
        {currentStep === 2 && (
          <div>
            <h1 className="text-4xl font-bold mb-8 text-center">
              <span className="text-blue-400">Данные</span> получателя
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8">
                <h2 className="text-2xl font-semibold mb-6">Контактные данные</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Имя получателя</label>
                    <input
                      type="text"
                      placeholder="Иван Иванов"
                      value={paymentData.customerName}
                      onChange={(e) => setPaymentData((p) => ({ ...p, customerName: e.target.value }))}
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-slate-50 placeholder-slate-400 focus:outline-none focus:border-orange-500/50 focus:bg-slate-700/80 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Email</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={paymentData.customerEmail}
                      onChange={(e) => setPaymentData((p) => ({ ...p, customerEmail: e.target.value }))}
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-slate-50 placeholder-slate-400 focus:outline-none focus:border-orange-500/50 focus:bg-slate-700/80 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Телефон</label>
                    <input
                      type="tel"
                      placeholder="+7 999 123 45 67"
                      value={paymentData.customerPhone}
                      onChange={(e) => setPaymentData((p) => ({ ...p, customerPhone: e.target.value }))}
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-slate-50 placeholder-slate-400 focus:outline-none focus:border-orange-500/50 focus:bg-slate-700/80 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Адрес доставки</label>
                    <input
                      type="text"
                      placeholder="ул. Солнечная, 1"
                      value={paymentData.addressStreet}
                      onChange={(e) => setPaymentData((p) => ({ ...p, addressStreet: e.target.value }))}
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-slate-50 placeholder-slate-400 focus:outline-none focus:border-orange-500/50 focus:bg-slate-700/80 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Город"
                      value={paymentData.addressCity}
                      onChange={(e) => setPaymentData((p) => ({ ...p, addressCity: e.target.value }))}
                      className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-slate-50 placeholder-slate-400 focus:outline-none focus:border-orange-500/50 focus:bg-slate-700/80 transition-all"
                    />
                    <input
                      type="text"
                      placeholder="Индекс"
                      value={paymentData.addressPostal}
                      onChange={(e) => setPaymentData((p) => ({ ...p, addressPostal: e.target.value }))}
                      className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-slate-50 placeholder-slate-400 focus:outline-none focus:border-orange-500/50 focus:bg-slate-700/80 transition-all"
                    />
                  </div>
                </div>

                {customerError && (
                  <div className="mt-4 text-sm text-red-400">{customerError}</div>
                )}
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8">
                <h2 className="text-2xl font-semibold mb-6">Способ оплаты</h2>

                <div className="space-y-4">
                  <label className="flex items-center space-x-3 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30 cursor-pointer hover:bg-slate-700/50 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentData.method === 'card'}
                      onChange={() => setPaymentData((p) => ({ ...p, method: 'card' }))}
                      className="w-5 h-5 text-orange-500"
                    />
                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="2" />
                      <path d="M2 10h20" strokeWidth="2" />
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
                      onChange={() => setPaymentData((p) => ({ ...p, method: 'tbank' }))}
                      className="w-5 h-5 text-orange-500"
                    />
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
                      <path d="M12 6v8l4 4" />
                    </svg>
                    <div>
                      <div className="font-semibold">Т-Банк</div>
                      <div className="text-sm text-slate-400">Электронные платежи</div>
                    </div>
                  </label>
                </div>

                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">Сумма заказа</h3>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between py-3 border-b border-slate-700/50">
                      <span className="text-slate-400">Сумма заказа</span>
                      <span className="font-semibold">{ctxFormatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-slate-700/50">
                      <span className="text-slate-400">Доставка</span>
                      <span className={`font-semibold ${shippingCost === 0 ? 'text-green-400' : ''}`}>
                        {shippingCost === 0 ? 'Бесплатно' : ctxFormatPrice(shippingCost)}
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
                      <span className="text-2xl font-bold text-orange-400">{ctxFormatPrice(total)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (validateCustomer()) setCurrentStep(3)
                    }}
                    className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 border border-blue-500/30"
                  >
                    Перейти к подтверждению
                  </button>
                </div>
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
                  <span className="text-slate-400">Получатель</span>
                  <span className="font-semibold">{paymentData.customerName || '—'}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                  <span className="text-slate-400">Email</span>
                  <span className="font-semibold">{paymentData.customerEmail || '—'}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                  <span className="text-slate-400">Телефон</span>
                  <span className="font-semibold">{paymentData.customerPhone || '—'}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                  <span className="text-slate-400">Адрес доставки</span>
                  <span className="font-semibold text-right max-w-[60%]">
                    {[paymentData.addressStreet, paymentData.addressCity, paymentData.addressPostal]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                  <span className="text-slate-400">Способ оплаты</span>
                  <span className="font-semibold">
                    {paymentData.method === 'card' ? 'Банковская карта' : 'Т-Банк'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                  <span className="text-slate-400">Сумма заказа</span>
                  <span className="font-semibold">{ctxFormatPrice(total)}</span>
                </div>
              </div>

              <button
                onClick={handleCreateOrder}
                disabled={orderCreating}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-orange-500/25 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
              >
                {orderCreating && <span className="spinner-ss" />}
                {orderCreating ? 'Создание заказа…' : 'Создать заказ и перейти к оплате'}
              </button>

              {payError && (
                <div className="mt-4">
                  <span className="badge-danger">{payError}</span>
                </div>
              )}
            </div>

            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-400 text-sm text-center">
                🔒 Ваша безопасность важна. Все платежи защищены HTTPS шифрованием.
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Choose payment gateway */}
        {currentStep === 4 && order && (
          <div className="container-ss !px-0">
            <div className="text-center mb-10">
              <p className="eyebrow-ss mb-3">Заказ {order.orderNumber}</p>
              <h1 className="h-display text-3xl md:text-4xl mb-3">Выберите способ оплаты</h1>
              <p className="lede-ss">
                К оплате: <span className="price-ss">{rubFormatter.format(order.total)}</span>
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              {configLoading ? (
                <div className="card-ss p-10 flex items-center justify-center gap-3 text-ink-2">
                  <span className="spinner-ss" />
                  <span>Загрузка способов оплаты…</span>
                </div>
              ) : gateways.length > 0 ? (
                <div className="space-y-3">
                  {gateways.map((g) => {
                    const isSelected = selectedGateway === g.id
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setSelectedGateway(g.id)}
                        className={`card-ss w-full text-left p-5 flex items-center justify-between transition-all ${
                          isSelected ? 'border-accent bg-accent-soft' : 'card-ss-hover'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span
                            className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                              isSelected ? 'border-accent' : 'border-hairline-strong'
                            }`}
                          >
                            {isSelected && (
                              <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                            )}
                          </span>
                          <div>
                            <div className="font-medium text-ink">
                              {GATEWAY_NAMES[g.id] || g.id}
                            </div>
                            {g.id === activeGateway && (
                              <div className="mt-0.5">
                                <span className="badge-accent">По умолчанию</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="muted-ss text-xs uppercase tracking-wider">
                          {g.mode === 'live' ? 'Боевой режим' : 'Песочница'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="card-ss p-8 text-center">
                  <span className="badge-danger">Нет доступных способов оплаты</span>
                  <p className="muted-ss mt-3">Обратитесь в поддержку магазина.</p>
                </div>
              )}

              {payError && (
                <div className="mt-5">
                  <span className="badge-danger">{payError}</span>
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3">
                <button
                  onClick={handlePay}
                  disabled={payLoading || !selectedGateway || gateways.length === 0}
                  className="btn btn-primary btn-lg w-full"
                >
                  {payLoading && <span className="spinner-ss" />}
                  {payLoading ? 'Переход к оплате…' : 'Оплатить'}
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={payLoading}
                  className="btn btn-ghost btn-lg w-full"
                >
                  Назад
                </button>
              </div>

              <p className="muted-ss text-center text-sm mt-6">
                Нажимая «Оплатить», вы перейдёте к защищённому платёжному шлюзу.
                Реальные списания выполняются только в боевом режиме.
              </p>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
