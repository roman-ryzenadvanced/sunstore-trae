'use client'

import { Star } from 'lucide-react'

export function StarRating() {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className="size-3.5 fill-amber-400 text-amber-400"
        />
      ))}
      <span className="text-xs text-gray-500 ml-1">(12)</span>
    </div>
  )
}
