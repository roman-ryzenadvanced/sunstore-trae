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

  const VERCEL_URL = process.env.VERCEL_URL || ''
  const apiUrl = VERCEL_URL
    ? `https://${VERCEL_URL}/api/storefront/${slug}`
    : `http://127.0.0.1:3000/api/storefront/${slug}`

  let data = null
  let error = null

  try {
    const res = await fetch(apiUrl, { cache: 'no-store' })
    if (res.ok) {
      data = await res.json()
    } else {
      error = `Store "${slug}" not found. Make sure the store exists and has status READY.`
    }
  } catch (e: any) {
    error = `Failed to load store data: ${e?.message || 'unknown error'}`
  }

  return <StorefrontPreviewPage slug={slug} initialData={data} error={error} />
}
