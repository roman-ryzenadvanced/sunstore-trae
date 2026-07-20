import { NextRequest, NextResponse } from 'next/server'
import { getProducts } from '@/lib/mockDb'

export async function GET(request: NextRequest) {
  try {
    const products = getProducts()
    return NextResponse.json({ products })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // For preview, return a mock product
    return NextResponse.json(
      {
        product: {
          id: 'prod_new_' + Date.now(),
          ...body,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}