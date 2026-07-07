import { NextRequest, NextResponse } from 'next/server'
import { db, commitDb } from '@/lib/db'

function generateOrderNumber(): string {
  const now = new Date()
  const y = now.getFullYear().toString().slice(-2)
  const m = (now.getMonth() + 1).toString().padStart(2, '0')
  const d = now.getDate().toString().padStart(2, '0')
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ORD-${y}${m}${d}-${rand}`
}

interface OrderItemInput {
  productId: string
  quantity: number
}

// Public storefront order endpoint. No auth required — customers placing
// orders from the public storefront are not logged in. Creates a real order
// record, decrements stock, and returns the order details.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    const { items, customerName, customerEmail, customerPhone, note } = body as {
      items: OrderItemInput[]
      customerName: string
      customerEmail: string
      customerPhone?: string
      note?: string
    }

    // Basic validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }
    if (!customerName || !customerName.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!customerEmail || !/^\S+@\S+\.\S+$/.test(customerEmail)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }
    for (const it of items) {
      if (!it.productId || !Number.isInteger(it.quantity) || it.quantity < 1) {
        return NextResponse.json({ error: 'Invalid cart item' }, { status: 400 })
      }
    }

    // Find the site by slug (must be READY)
    const site = await db.site.findUnique({ where: { slug } })
    if (!site || site.status !== 'READY') {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Look up products (must belong to this site, be active, and have stock)
    const productIds = items.map((i) => i.productId)
    const products = await db.siteProduct.findMany({
      where: { id: { in: productIds }, siteId: site.id },
    })

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: 'One or more products not found' }, { status: 400 })
    }

    // Validate active + stock
    for (const it of items) {
      const p = products.find((x) => x.id === it.productId)!
      if (!p.active) {
        return NextResponse.json({ error: `${p.title} is no longer available` }, { status: 400 })
      }
      if (p.stock < it.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${p.title} (only ${p.stock} left)` },
          { status: 400 }
        )
      }
    }

    // Calculate total + build line items
    let totalAmount = 0
    const orderItemsData = items.map((it) => {
      const p = products.find((x) => x.id === it.productId)!
      const lineTotal = p.price * it.quantity
      totalAmount += lineTotal
      return {
        productId: p.id,
        title: p.title,
        price: p.price,
        quantity: it.quantity,
      }
    })

    // Generate a unique order number
    let orderNumber = generateOrderNumber()
    let exists = await db.siteOrder.findUnique({ where: { orderNumber } })
    while (exists) {
      orderNumber = generateOrderNumber()
      exists = await db.siteOrder.findUnique({ where: { orderNumber } })
    }

    // Create the order + items in a transaction for atomicity
    const order = await db.$transaction(async (tx) => {
      const created = await tx.siteOrder.create({
        data: {
          siteId: site.id,
          orderNumber,
          status: 'CONFIRMED', // public demo orders are confirmed immediately
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: (customerPhone || '').trim(),
          totalAmount,
          currency: 'RUB',
          paymentMode: 'demo',
          note: (note || '').trim(),
        },
      })

      await tx.orderItem.createMany({
        data: orderItemsData.map((it) => ({
          orderId: created.id,
          productId: it.productId,
          title: it.title,
          price: it.price,
          quantity: it.quantity,
        })),
      })

      // Decrement stock for each product
      for (const it of items) {
        await tx.siteProduct.update({
          where: { id: it.productId },
          data: { stock: { decrement: it.quantity } },
        })
      }

      return created
    })

    // Return the full order with items for the confirmation screen
    const fullOrder = await db.siteOrder.findUnique({
      where: { id: order.id },
      include: { items: true },
    })

    // Push the mutated DB file back to GitHub so other instances can see it.
    // Best-effort: a commit failure must NOT fail the customer's order.
    try {
      await commitDb()
    } catch (commitErr) {
      console.error('DB commit (non-fatal) failed:', commitErr)
    }

    return NextResponse.json(
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        currency: order.currency,
        items: fullOrder?.items || [],
        customerName: order.customerName,
        customerEmail: order.customerEmail,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Storefront order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
