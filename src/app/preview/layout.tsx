import type { Metadata } from 'next'
import { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'SunStore Preview',
  description: 'Store preview mode',
  robots: 'noindex',
}

export const dynamic = 'force-dynamic'
export const dynamicParams = true

export default function PreviewLayout({
  children,
}: {
  children: ReactNode
}) {
  return <>{children}</>
}