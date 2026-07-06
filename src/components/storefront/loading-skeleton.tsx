'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function LoadingSkeleton() {
  return (
    <div className="bg-white text-gray-900">
      {/* Top bar */}
      <Skeleton className="h-8 w-full" />
      {/* Header */}
      <Skeleton className="h-44 w-full" />
      {/* Hero */}
      <Skeleton className="h-48 w-full" />
      {/* Trust bar */}
      <Skeleton className="h-20 w-full" />
      {/* Category tabs */}
      <div className="flex gap-2 px-6 py-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-44 w-full rounded-t-lg" />
            <Skeleton className="h-4 w-3/4 mx-2" />
            <Skeleton className="h-4 w-1/3 mx-2" />
            <Skeleton className="h-5 w-1/2 mx-2 mt-1" />
            <Skeleton className="h-9 w-full mx-2 mt-2 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
