export interface StorefrontSite {
  id: string
  name: string
  slug: string
  tagline: string
  primaryColor: string
}

export interface StorefrontProduct {
  id: string
  title: string
  price: number
  oldPrice: number
  category: string
  images: string
  stock: number
  featured: boolean
  createdAt: string
}

export interface StorefrontData {
  site: {
    name: string
    tagline: string
    primaryColor: string
    slug: string
  }
  categories: string[]
  products: StorefrontProduct[]
}
