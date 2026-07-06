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

  // Render the client component - it will fetch data on the client
  // Using dynamic import to ensure proper SSR/client boundary
  const StorefrontPreviewPage = (await import('@/components/storefront/storefront-preview-client')).StorefrontPreviewClient
  
  return <StorefrontPreviewPage slug={slug} initialData={null} error={null} />
}