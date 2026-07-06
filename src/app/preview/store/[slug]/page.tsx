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
  const VERCEL_URL = process.env.VERCEL_URL || ''
  const apiUrl = VERCEL_URL
    ? `https://${VERCEL_URL}/api/storefront/${slug}`
    : null

  let data = null
  let error = null

  try {
    if (apiUrl) {
      const res = await fetch(apiUrl, { cache: 'no-store' })
      if (res.ok) {
        data = await res.json()
      } else {
        error = `Store "${slug}" not found.`
      }
    } else {
      const res = await fetch(`/api/storefront/${slug}`, { cache: 'no-store' })
      if (res.ok) {
        data = await res.json()
      } else {
        error = `Store "${slug}" not found.`
      }
    }
  } catch {
    error = `Store "${slug}" not found.`
  }

  // Import and render the client component
  // This works because the import happens at render time, not at module load time
  const StorefrontPreviewClient = (await import(
    '@/components/storefront/storefront-preview-client'
  )).StorefrontPreviewClient

  return <StorefrontPreviewClient slug={slug} initialData={data} error={error} />
}