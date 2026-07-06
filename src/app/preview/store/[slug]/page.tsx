import type { Metadata } from 'next'

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

  // Fetch storefront data on server
  try {
    const VERCEL_URL = process.env.VERCEL_URL || ''
    const apiUrl = VERCEL_URL
      ? `https://${VERCEL_URL}/api/storefront/${slug}`
      : `/api/storefront/${slug}`

    const res = await fetch(apiUrl, { cache: 'no-store' })
    if (res.ok) {
      data = await res.json()
    } else {
      error = `Store "${slug}" not found. Make sure the store exists and has status READY.`
    }
  } catch {
    error = `Store "${slug}" not found. Make sure the store exists and has status READY.`
  }

  // Render client component with initial data
  const { StorefrontPreviewClient } = await import('@/components/storefront/storefront-preview-client')
  return <StorefrontPreviewClient slug={slug} initialData={data} error={error} />
}