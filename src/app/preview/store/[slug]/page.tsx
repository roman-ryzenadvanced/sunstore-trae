import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { StorefrontPreviewPage } from '@/components/storefront/storefront-preview-page'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  return {
    title: `${slug} — SunStore Preview`,
    description: `Предпросмотр магазина ${slug}`,
  }
}

export async function generateStaticParams() {
  return []
}

export default async function PreviewStorePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Fetch storefront data server-side
  const apiUrl = `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/storefront/${slug}`
  const res = await fetch(apiUrl, { next: { revalidate: 60 } })

  if (!res.ok) {
    return <StorefrontPreviewPage initialData={null} error={`Не удалось загрузить магазин ${slug}.`}/>
  }

  const data = await res.json()

  return <StorefrontPreviewPage initialData={data} />
}
