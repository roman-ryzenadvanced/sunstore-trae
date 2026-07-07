'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function CheckoutStatusPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order')
  const status = searchParams.get('status')

  useEffect(() => {
    // Demo mode: after "payment" completes, redirect to success or fail
    const timer = setTimeout(() => {
      if (status === 'mock') {
        // Demo payment succeeds — go to success page
        window.location.href = `/checkout/success?order=${orderId}`
      } else {
        window.location.href = `/checkout/fail?order=${orderId}`
      }
    }, 1500) // brief loading spinner

    return () => clearTimeout(timer)
  }, [orderId, status])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <Loader2 className="mb-4 h-10 w-10 animate-spin text-blue-600" />
      <p className="text-gray-600">Processing your payment...</p>
    </div>
  )
}
