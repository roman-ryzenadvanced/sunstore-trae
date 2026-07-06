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

  // Fetch storefront data on server
  // In Vercel, process.env.VERCEL_URL contains the full URL
  const baseUrl = process.env.VERCEL_URL || 'sunstore.vercel.app'
  const apiUrl = `https://${baseUrl}/api/storefront/${slug}`

  let data = null
  let error = null

  try {
    const res = await fetch(apiUrl, { 
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    })
    if (res.ok) {
      data = await res.json()
    } else {
      error = `Store "${slug}" not found.`
    }
  } catch (e) {
    error = `Store "${slug}" not found.`
  }

  // Import and render the client component with data
  const StorefrontPreviewClient = (await import(
    '@/components/storefront/storefront-preview-client'
  )).StorefrontPreviewClient

  return <StorefrontPreviewClient slug={slug} initialData={data} error={error} />
}