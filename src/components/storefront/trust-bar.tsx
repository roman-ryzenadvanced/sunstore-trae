const TRUST_ITEMS = [
  { icon: '✓', label: 'Гарантия качества' },
  { icon: '🚚', label: 'Быстрая доставка' },
  { icon: '↩️', label: 'Возврат 14 дней' },
  { icon: '🔒', label: 'Безопасная оплата' },
]

export function TrustBar() {
  return (
    <div className="bg-gray-50 border-b">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 px-4 py-4">
        {TRUST_ITEMS.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2.5 justify-center"
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="text-sm text-gray-700 font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
