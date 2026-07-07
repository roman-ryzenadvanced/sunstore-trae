'use client'

import { useSearchParams } from 'next/navigation'
import { SolarCalculator } from '@/components/solar-calculator'

export default function QuotePage() {
  const searchParams = useSearchParams()
  const slug = searchParams.get('store') || ''

  const handleSuccess = (result: any) => {
    alert(result.message || 'Quote submitted successfully!')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Get Your Solar Power Quote</h1>
          <p className="text-gray-600">
            Calculate your solar energy system and receive a detailed proposal with monthly payment plan
          </p>
        </div>
        
        <SolarCalculator 
          storeSlug={slug}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  )
}
