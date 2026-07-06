import { ShoppingCart, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  const discount = getDiscount(product.price, product.oldPrice)
  const imgUrl = getFirstImage(product.images)

  return (
    <div className="shrink-0 w-52 bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="relative h-32 bg-gray-100 flex items-center justify-center">
        {imgUrl ? (
          <img src={imgUrl} alt={product.title} className="size-full object-cover" />
        ) : (
          <Package className="size-10 text-gray-300" />
        )}
        <Badge className="absolute top-2 left-2 bg-red-500 text-white border-0 text-[11px] px-1.5 py-0.5 font-bold">
          Скидка {discount}%
        </Badge>
      </div>
      <div className="p-2.5">
        <p className="text-xs text-gray-900 font-medium line-clamp-2 leading-snug min-h-[2rem]">
          {product.title}
        </p>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-sm font-bold text-orange-600">
            {formatPrice(product.price)}
          </span>
          <span className="text-xs text-gray-400 line-through">
            {formatPrice(product.oldPrice)}
          </span>
        </div>
        <Button
          size="sm"
          className="mt-2 w-full text-xs border-0 text-white h-8"
          style={{ backgroundColor: primaryColor }}
        >
          <ShoppingCart className="size-3.5 mr-1" />
          В корзину
        </Button>
      </div>
    </div>
  )
}
