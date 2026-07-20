'use client'

import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

type StatusType = 'success' | 'rejected' | 'pending' | 'mock'

const validStatuses = ['success', 'rejected', 'pending', 'mock']

function parseStatus(raw: string | null): StatusType {
  if (raw && validStatuses.includes(raw)) return raw as StatusType
  return 'pending'
}

const statusConfig: Record<
  StatusType,
  { icon: typeof CheckCircle2; title: string; description: string; color: string; bg: string }
> = {
  success: {
    icon: CheckCircle2,
    title: 'Payment Successful!',
    description: 'Your order has been confirmed and will be processed shortly.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
  },
  rejected: {
    icon: XCircle,
    title: 'Payment Failed',
    description: 'Your payment was declined. Please try again or use a different payment method.',
    color: 'text-red-600',
    bg: 'bg-red-100',
  },
  pending: {
    icon: Clock,
    title: 'Payment Pending',
    description: 'Your payment is being processed. You will receive a confirmation email shortly.',
    color: 'text-amber-600',
    bg: 'bg-amber-100',
  },
  mock: {
    icon: CheckCircle2,
    title: 'Test Payment Complete',
    description: 'This was a test/demo payment. No real charge was made.',
    color: 'text-primary',
    bg: 'bg-accent',
  },
}

export function CheckoutStatus() {
  const navigate = useAppStore((s) => s.navigate)
  const searchParams = useSearchParams()

  const status = useMemo(() => parseStatus(searchParams.get('status')), [searchParams])
  const orderNumber = searchParams.get('orderNumber') || searchParams.get('order_id') || ''
  const amount = searchParams.get('amount') || ''

  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div
            className={`mx-auto mb-4 flex size-16 items-center justify-center rounded-full ${config.bg}`}
          >
            <StatusIcon className={`size-8 ${config.color}`} />
          </div>
          <CardTitle className="text-xl">{config.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{config.description}</p>

          {(orderNumber || amount) && <Separator />}

          {orderNumber && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Order Number</span>
              <span className="font-mono font-medium">{orderNumber}</span>
            </div>
          )}
          {amount && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-bold">₽{Number(amount).toLocaleString()}</span>
            </div>
          )}

          <Button
            className="w-full mt-2"
            onClick={() => navigate('dashboard')}
          >
            <ArrowLeft className="size-4" />
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}