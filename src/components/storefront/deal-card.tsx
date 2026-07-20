import { useState } from 'react'
import { ShoppingCart, Package, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/store/cart-store'
import type { StorefrontProduct } from './types'

interface Props {
  product: StorefrontProduct
  primaryColor: string
}

function formatPrice(price: number): string {
  return '₽' + Math.round(price).toLocaleString('ru-RU', { useGrouping: true })
}

function getDiscount(price: number, oldPrice: number): number {
  if (!oldPrice || oldPrice <= price) return 0
  return Math.round((1 - price / oldPrice) * 100)
}

function getFirstImage(imagesStr: string): string | null {
  try {
    const arr = JSON.parse(imagesStr)
    if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === 'string') return arr[0]
  } catch { /* empty */ }
  return null
}

export function DealCard({ product, primaryColor }: Props) {
  const [added, setAdded] = useState(false)
  const add = useCartStore((s) => s.add)
  const discount = getDiscount(product.price, product.oldPrice)
  const imgUrl = getFirstImage(product.images)

  const handleAdd = () => {
    add({
      id: product.id,
      title: product.title,
      price: product.price,
      image: imgUrl,
      stock: product.stock,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  return (
    <div className="shrink-0 w-56 bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
      <div className="relative h-36 bg-gray-50 flex items-center justify-center">
        {imgUrl ? (
          <img src={imgUrl} alt={product.title} className="size-full object-cover" />
        ) : (
          <Package className="size-12 text-gray-300" />
        )}
        <Badge className="absolute top-2 left-2 bg-red-500 text-white border-0 text-[11px] px-2 py-0.5 font-bold">
          -{discount}%
        </Badge>
      </div>
      <div className="p-3">
        <p className="text-xs text-gray-900 font-medium line-clamp-2 leading-snug min-h-[2rem]">
          {product.title}
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>
          <span className="text-xs text-gray-400 line-through">
            {formatPrice(product.oldPrice)}
          </span>
        </div>
        <Button
          size="sm"
          className="mt-2 w-full text-xs border-0 text-white h-9 font-semibold"
          style={{ backgroundColor: added ? '#16a34a' : primaryColor }}
          onClick={handleAdd}
        >
          {added ? (
            <>
              <Check className="size-3.5 mr-1" />
              В корзине
            </>
          ) : (
            <>
              <ShoppingCart className="size-3.5 mr-1" />
              В корзину
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
