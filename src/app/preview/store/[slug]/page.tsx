import type { Metadata } from 'next'
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

  // Client component receives the slug from URL
  return <StorefrontPreviewPage slug={slug} />
}
