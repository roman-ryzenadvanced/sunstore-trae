'use client'

import { Shield, Truck, RefreshCw, Headphones } from 'lucide-react'

const TRUST_ITEMS = [
  { icon: Shield, label: 'Гарантия качества', desc: 'Официальная гарантия' },
  { icon: Truck, label: 'Быстрая доставка', desc: '1-3 рабочих дня' },
  { icon: RefreshCw, label: 'Возврат 30 дней', desc: 'Без вопросов' },
  { icon: Headphones, label: 'Поддержка 24/7', desc: 'Всегда на связи' },
]

export function TrustBar() {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 px-4 sm:px-6 py-4">
        {TRUST_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.label}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Icon className="size-5 text-gray-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500 truncate">{item.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
