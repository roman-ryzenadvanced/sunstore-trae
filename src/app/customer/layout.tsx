import { Suspense } from 'react'

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-t-primary border-r-transparent"></div>
          <p className="text-gray-600">Loading…</p>
        </div>
      </div>
    }>
      {children}
    </Suspense>
  )
}