'use client'

import { useState } from 'react'
import { ShoppingCart, Heart, Package, Check, Star } from 'lucide-react'
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

function getStockInfo(stock: number) {
  if (stock <= 0) return { label: 'Нет в наличии', color: 'text-red-500' }
  if (stock <= 5) return { label: `В наличии мало: ${stock} шт.`, color: 'text-amber-600' }
  return { label: `В наличии: ${stock} шт.`, color: 'text-green-600' }
}

function getFirstImage(imagesStr: string): string | null {
  try {
    const arr = JSON.parse(imagesStr)
    if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === 'string') return arr[0]
  } catch { /* empty */ }
  return null
}

function getFeaturedBadge(product: StorefrontProduct): string | null {
  if (product.featured) {
    const age = Date.now() - new Date(product.createdAt).getTime()
    const daysOld = age / (1000 * 60 * 60 * 24)
    if (daysOld < 14) return 'Новинка'
    return 'Хит'
  }
  return null
}

export function ProductCard({ product, primaryColor }: Props) {
  const [liked, setLiked] = useState(false)
  const [added, setAdded] = useState(false)
  const add = useCartStore((s) => s.add)
  const imgUrl = getFirstImage(product.images)
  const discount = getDiscount(product.price, product.oldPrice)
  const featuredBadge = getFeaturedBadge(product)
  const stockInfo = getStockInfo(product.stock)

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
    <div className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col hover:-translate-y-0.5">
      {/* Image area */}
      <div className="relative h-48 bg-gray-50 flex items-center justify-center shrink-0">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={product.title}
            className="size-full object-cover"
          />
        ) : (
          <Package className="size-14 text-gray-300" />
        )}

        {featuredBadge && (
          <Badge
            className="absolute top-2.5 left-2.5 z-10 text-[11px] px-2 py-0.5 border-0 font-semibold"
            style={{ backgroundColor: primaryColor, color: '#fff' }}
          >
            {featuredBadge}
          </Badge>
        )}

        {discount > 0 && (
          <Badge className="absolute top-2.5 right-2.5 z-10 bg-red-500 text-white border-0 text-[11px] px-2 py-0.5 font-bold">
            -{discount}%
          </Badge>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation()
            setLiked(!liked)
          }}
          className="absolute bottom-2.5 right-2.5 z-10 size-8 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white shadow-sm"
        >
          <Heart className={`size-4 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[2.5rem] leading-snug">
          {product.title}
        </h3>
        <div className="mt-1.5 flex items-center gap-1">
          <div className="flex items-center">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="size-3 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="text-xs text-gray-400">(12)</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          <span className="text-xl font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>
          {discount > 0 && (
            <>
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(product.oldPrice)}
              </span>
              <Badge className="bg-red-50 text-red-600 border-0 text-[10px] px-1.5 py-0 font-medium">
                -{discount}%
              </Badge>
            </>
          )}
        </div>
        <p className={`text-xs mt-1.5 font-medium ${stockInfo.color}`}>{stockInfo.label}</p>
        <Button
          className="mt-3 w-full text-sm font-semibold border-0 text-white transition-all hover:opacity-90"
          style={{ backgroundColor: added ? '#16a34a' : primaryColor }}
          disabled={product.stock <= 0}
          onClick={handleAdd}
        >
          {added ? (
            <>
              <Check className="size-4 mr-1.5" />
              В корзине
            </>
          ) : (
            <>
              <ShoppingCart className="size-4 mr-1.5" />
              В корзину
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
