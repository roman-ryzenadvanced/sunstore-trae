'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { LoginForm } from '@/components/dashboard/login-form'
import { AppSidebar } from '@/components/dashboard/sidebar'
import { CheckoutStatus } from '@/components/dashboard/checkout-status'

export default function Home() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const currentView = useAppStore((s) => s.currentView)
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch: the persisted auth state is only available
  // on the client. Render a stable shell on the server / first paint.
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

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