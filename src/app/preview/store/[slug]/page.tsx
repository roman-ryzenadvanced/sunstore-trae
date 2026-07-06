import type { Metadata } from 'next'
import { StorefrontPreviewPage } from '@/components/storefront/storefront-preview-page'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  return {
    title: `${slug} — SunStore Store Preview`,
    description: `Preview of the store ${slug}`,
    robots: 'noindex',
  }
}

export default async function PreviewStorePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let data = null
  let error = null

  // Fetch storefront data
  const VERCEL_URL = process.env.VERCEL_URL || ''
  let res: Response

  try {
    // Try full URL first (works in node runtime and edge with VERCEL_URL)
    const apiUrl = VERCEL_URL
      ? `https://${VERCEL_URL}/api/storefront/${slug}`
      : null

    if (apiUrl) {
      res = await fetch(apiUrl, { cache: 'no-store' })
    } else {
      // Fallback to relative URL (works in local dev)
      res = await fetch(`/api/storefront/${slug}`, { cache: 'no-store' })
    }
  } catch {
    // If full URL fails, try relative
    res = await fetch(`/api/storefront/${slug}`, { cache: 'no-store' })
  }

  if (res.ok) {
    data = await res.json()
  } else {
    error = `Store "${slug}" not found. Make sure the store exists and has status READY.`
  }

  return <StorefrontPreviewPage slug={slug} initialData={data} error={error} />
}
