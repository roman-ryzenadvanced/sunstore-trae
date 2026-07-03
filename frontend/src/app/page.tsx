'use client'

import { useAppStore } from '@/store/app-store'
import { LoginForm } from '@/components/dashboard/login-form'
import { AppSidebar } from '@/components/dashboard/sidebar'
import { CheckoutStatus } from '@/components/dashboard/checkout-status'

export default function Home() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const currentView = useAppStore((s) => s.currentView)

  // Show login if not authenticated
  if (!isAuthenticated || currentView === 'login') {
    return <LoginForm />
  }

  // Show checkout-status standalone (no sidebar)
  if (currentView === 'checkout-status') {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <CheckoutStatus />
      </div>
    )
  }

  // Show dashboard with sidebar
  return <AppSidebar />
}