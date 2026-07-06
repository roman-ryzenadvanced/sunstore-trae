import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { StorefrontPreviewPage } from '@/components/storefront/storefront-preview-page'

// Force dynamic rendering so this route works for any slug
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

  // Build the API URL based on environment
  const apiUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}/api/storefront/${slug}`
    : `http://localhost:3000/api/storefront/${slug}`

  const res = await fetch(apiUrl)

  if (!res.ok) {
    return (
      <StorefrontPreviewPage
        initialData={null}
        error={`Store "${slug}" not found. Make sure the store exists and has status READY.`}
      />
    )
  }

  const data = await res.json()
  return <StorefrontPreviewPage initialData={data} />
}
