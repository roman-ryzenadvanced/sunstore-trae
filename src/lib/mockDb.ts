// In-memory mock database for preview purposes
// This replaces Prisma + PostgreSQL so the preview can run without a database setup

export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  imageUrl?: string
  specifications: string // JSON string
  stock: number
  sku: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  category: string
}

export interface Cart {
  sessionId: string
  items: CartItem[]
}

export interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: string
  totalAmount: number
  currency: string
  paymentMethod: string
  status: string
  paymentId?: string
  items: CartItem[]
  notes?: string
  createdAt: string
  updatedAt: string
}

// Seed products with realistic solar equipment data
const seedProducts: Product[] = [
  {
    id: 'prod_001',
    name: 'Helios Prime 450Вт монокристаллическая панель',
    description: 'Высокоэффективная монокристаллическая солнечная панель с технологией PERC',
    price: 24500,
    category: 'panels',
    imageUrl: '/images/prod_001.svg',
    specifications: JSON.stringify({
      power: '450W',
      efficiency: '21.4%',
      cellType: 'Монокристаллическая PERC',
      dimensions: '1909x1134x35mm',
      weight: '23.5kg',
      warranty: '25 лет'
    }),
    stock: 150,
    sku: 'HELIOS-450W-MONO',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_002',
    name: 'VortexX 5кВт гибридный инвертор',
    description: 'Умный гибридный инвертор с функциями подключения к сети и автономной работы',
    price: 78900,
    category: 'inverters',
    imageUrl: '/images/prod_002.svg',
    specifications: JSON.stringify({
      power: '5kW',
      type: 'Гибридный',
      inputVoltage: '48V DC',
      outputVoltage: '230V AC',
      efficiency: '97.5%',
      warranty: '10 лет'
    }),
    stock: 32,
    sku: 'VORTEXX-5KW-HYB',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_003',
    name: 'QuantumCore 10кВт·ч LiFePO4 аккумулятор',
    description: 'Передовой литий-железо-фосфатный аккумулятор с защитой BMS',
    price: 145000,
    category: 'batteries',
    imageUrl: '/images/prod_003.svg',
    specifications: JSON.stringify({
      capacity: '10kWh',
      chemistry: 'LiFePO4',
      voltage: '48V',
      cycles: '6000+ @ 80% DoD',
      warranty: '10 лет'
    }),
    stock: 18,
    sku: 'QUANTUM-10KWH-LFP',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_004',
    name: 'TitanMount система крепления на крышу',
    description: 'Премиальные алюминиевые рейки для всех типов кровли',
    price: 12500,
    category: 'mounting',
    imageUrl: '/images/prod_004.svg',
    specifications: JSON.stringify({
      material: 'Анодированный алюминий',
      compatibility: 'Все типы кровли',
      windLoad: '2400Pa',
      snowLoad: '5400Pa',
      warranty: '15 лет'
    }),
    stock: 75,
    sku: 'TITAN-ROOF-MT',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_005',
    name: 'SolarEdge MPPT контроллер заряда 60A',
    description: 'Контроллер отслеживания точки максимальной мощности для автономных систем',
    price: 34900,
    category: 'controllers',
    imageUrl: '/images/prod_005.svg',
    specifications: JSON.stringify({
      maxCurrent: '60A',
      systemVoltage: '12/24/48V',
      efficiency: '98.5%',
      tracking: 'MPPT',
      warranty: '5 лет'
    }),
    stock: 42,
    sku: 'SE-MPPT-60A',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_006',
    name: 'Полная солнечная система 5кВт для дома',
    description: 'Готовая система: панели, инвертор, аккумулятор и крепления',
    price: 389900,
    category: 'systems',
    imageUrl: '/images/prod_006.svg',
    specifications: JSON.stringify({
      systemSize: '5kW',
      includedPanels: '12 x 450W',
      inverter: '5kW Гибридный',
      battery: '10kWh LiFePO4',
      mounting: 'Полный комплект',
      warranty: '25 лет'
    }),
    stock: 8,
    sku: 'SYS-5KW-RES',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_007',
    name: 'Helios Prime 550Вт бифациальная панель',
    description: 'Бифациальная монокристаллическая панель с дополнительной выработкой +30%',
    price: 31200,
    category: 'panels',
    imageUrl: '/images/prod_007.svg',
    specifications: JSON.stringify({
      power: '550W + 30% бифациальность',
      efficiency: '22.1%',
      cellType: 'Бифациальная монокристаллическая',
      warranty: '30 лет'
    }),
    stock: 28,
    sku: 'HELIOS-550W-BI',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_008',
    name: 'VortexX 10кВт трёхфазный инвертор',
    description: 'Промышленный трёхфазный инвертор для крупных установок',
    price: 159900,
    category: 'inverters',
    imageUrl: '/images/prod_008.svg',
    specifications: JSON.stringify({
      power: '10kW',
      type: 'Трёхфазный',
      efficiency: '98.2%',
      warranty: '12 лет'
    }),
    stock: 14,
    sku: 'VORTEXX-10KW-3P',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export interface Category {
  id: string
  name: string        // Russian display name, e.g. "Панели"
  slug: string        // URL-safe key, e.g. "panels"
  description?: string
  sortOrder: number   // lower = first
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const seedCategories: Category[] = [
  { id: 'cat_001', name: 'Панели', slug: 'panels', sortOrder: 1, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'cat_002', name: 'Инверторы', slug: 'inverters', sortOrder: 2, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'cat_003', name: 'Аккумуляторы', slug: 'batteries', sortOrder: 3, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'cat_004', name: 'Контроллеры', slug: 'controllers', sortOrder: 4, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'cat_005', name: 'Крепления', slug: 'mounting', sortOrder: 5, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'cat_006', name: 'Системы', slug: 'systems', sortOrder: 6, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

// In-memory storage — use globalThis to persist across Next.js dev server module instances
const globalForDb = globalThis as unknown as {
  _sunstoreProducts?: Product[]
  _sunstoreCarts?: Map<string, Cart>
  _sunstoreOrders?: Map<string, Order>
  _sunstoreSessionOrders?: Map<string, string[]>
  _sunstoreCategories?: Category[]
}

if (!globalForDb._sunstoreProducts) {
  globalForDb._sunstoreProducts = [...seedProducts]
}
if (!globalForDb._sunstoreCarts) {
  globalForDb._sunstoreCarts = new Map()
}
if (!globalForDb._sunstoreOrders) {
  globalForDb._sunstoreOrders = new Map()
}
if (!globalForDb._sunstoreSessionOrders) {
  globalForDb._sunstoreSessionOrders = new Map()
}
if (!globalForDb._sunstoreCategories) {
  globalForDb._sunstoreCategories = [...seedCategories]
}

let products: Product[] = globalForDb._sunstoreProducts
const categories: Category[] = globalForDb._sunstoreCategories
const carts: Map<string, Cart> = globalForDb._sunstoreCarts
const orders: Map<string, Order> = globalForDb._sunstoreOrders
// Session to orders mapping for user order lookup
const sessionOrders: Map<string, string[]> = globalForDb._sunstoreSessionOrders

// Cart helper functions
export function getCart(sessionId: string): Cart {
  if (!carts.has(sessionId)) {
    carts.set(sessionId, { sessionId, items: [] })
  }
  return carts.get(sessionId)!
}

export function addToCart(sessionId: string, productId: string, quantity: number = 1): Cart {
  const cart = getCart(sessionId)
  const product = products.find(p => p.id === productId)
  
  if (!product) {
    throw new Error('Product not found')
  }
  
  const existingItem = cart.items.find(item => item.productId === productId)
  
  if (existingItem) {
    existingItem.quantity = Math.min(10, existingItem.quantity + quantity)
  } else {
    cart.items.push({
      id: 'ci_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: Math.min(10, quantity),
      category: product.category
    })
  }
  
  return cart
}

export function updateCartItem(sessionId: string, productId: string, quantity: number): Cart {
  const cart = getCart(sessionId)
  const item = cart.items.find(item => item.productId === productId)
  
  if (item) {
    if (quantity > 0 && quantity <= 10) {
      item.quantity = quantity
    }
  }
  
  return cart
}

export function removeFromCart(sessionId: string, productId: string): Cart {
  const cart = getCart(sessionId)
  cart.items = cart.items.filter(item => item.productId !== productId)
  return cart
}

export function setCartItems(sessionId: string, items: CartItem[]): Cart {
  const cart = getCart(sessionId)
  cart.items = items
  return cart
}

export function clearCart(sessionId: string): void {
  carts.delete(sessionId)
}

export function getProducts(): Product[] {
  return products.filter(p => p.isActive)
}

export function getProductById(id: string): Product | undefined {
  return products.find(p => p.id === id)
}

export function createOrder(
  sessionId: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  shippingAddress: string,
  paymentMethod: string,
  notes?: string
): Order | null {
  const cart = getCart(sessionId)
  
  if (cart.items.length === 0) {
    return null
  }
  
  const totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shippingCost = totalAmount >= 50000 ? 0 : 3500
  const finalTotal = totalAmount + shippingCost
  
  const order: Order = {
    id: 'ord_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    orderNumber: 'SUN-' + Date.now().toString().slice(-8),
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    totalAmount: finalTotal,
    currency: 'RUB',
    paymentMethod,
    status: 'pending',
    items: [...cart.items],
    notes: notes || `Заказ оформлен через checkout`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  orders.set(order.id, order)
  // Track which orders belong to which session
  if (!sessionOrders.has(sessionId)) {
    sessionOrders.set(sessionId, [])
  }
  sessionOrders.get(sessionId)!.push(order.id)
  clearCart(sessionId)
  
  return order
}

export function getOrderById(id: string): Order | undefined {
  return orders.get(id)
}

export function getOrderStatus(id: string): string {
  const order = orders.get(id)
  return order ? order.status : 'not_found'
}

export function updateOrderStatus(id: string, status: string): Order | null {
  const order = orders.get(id)
  if (order) {
    order.status = status
    order.updatedAt = new Date().toISOString()
    orders.set(id, order)
    return order
  }
  return null
}

export function cancelOrder(id: string): Order | null {
  const order = orders.get(id)
  if (order && order.status !== 'delivered') {
    order.status = 'cancelled'
    order.updatedAt = new Date().toISOString()
    orders.set(id, order)
    return order
  }
  return null
}

export function getPaymentUrl(orderId: string): string {
  return `https://payment.tbank.solar/order/${orderId}?session=${orderId.substring(0, 8)}`
}

export function getOrdersBySession(sessionId: string): Order[] {
  const orderIds = sessionOrders.get(sessionId) || []
  const userOrders = orderIds.map(id => orders.get(id)).filter((order): order is Order => order !== undefined)
  return userOrders
}

/* ============================ Admin helpers ============================ */

/** All products including inactive ones (admin view). */
export function getAllProducts(): Product[] {
  return products
}

export function createProduct(data: Partial<Product>): Product {
  const now = new Date().toISOString()
  const product: Product = {
    id: data.id || 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    name: data.name || 'Новый товар',
    description: data.description || '',
    price: Number(data.price) || 0,
    category: data.category || 'panels',
    imageUrl: data.imageUrl || '/images/prod_001.svg',
    specifications: data.specifications || '{}',
    stock: Number(data.stock) || 0,
    sku: data.sku || 'SKU-' + Date.now().toString().slice(-6),
    isActive: data.isActive !== undefined ? data.isActive : true,
    createdAt: now,
    updatedAt: now
  }
  products.push(product)
  globalForDb._sunstoreProducts = products
  return product
}

export function updateProduct(id: string, patch: Partial<Product>): Product | null {
  const idx = products.findIndex(p => p.id === id)
  if (idx === -1) return null
  products[idx] = {
    ...products[idx],
    ...patch,
    id: products[idx].id,
    updatedAt: new Date().toISOString()
  }
  globalForDb._sunstoreProducts = products
  return products[idx]
}

export function deleteProduct(id: string): boolean {
  const idx = products.findIndex(p => p.id === id)
  if (idx === -1) return false
  products.splice(idx, 1)
  globalForDb._sunstoreProducts = products
  return true
}

/** All orders, newest first (admin view). */
export function getAllOrders(): Order[] {
  return Array.from(orders.values()).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

/** Record the gateway payment id + method on an order. */
export function setOrderPayment(orderId: string, paymentId: string, paymentMethod: string): Order | null {
  const order = orders.get(orderId)
  if (!order) return null
  order.paymentId = paymentId
  order.paymentMethod = paymentMethod
  order.updatedAt = new Date().toISOString()
  orders.set(orderId, order)
  return order
}

/** Mark an order paid (used by payment callbacks + demo flow). */
export function markOrderPaid(orderId: string, paymentId?: string): Order | null {
  const order = orders.get(orderId)
  if (!order) return null
  order.status = 'paid'
  if (paymentId) order.paymentId = paymentId
  order.updatedAt = new Date().toISOString()
  orders.set(orderId, order)
  return order
}

/** Find an order by its public orderNumber (e.g. SUN-12345678). */
export function getOrderByNumber(orderNumber: string): Order | undefined {
  return Array.from(orders.values()).find(o => o.orderNumber === orderNumber)
}

/* ============================ Category helpers ============================ */

/** Returns active categories sorted by sortOrder (public/catalog view). */
export function getCategories(): Category[] {
  return categories.filter(c => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
}

/** Returns all categories including inactive ones (admin view). */
export function getAllCategories(): Category[] {
  return [...categories].sort((a, b) => a.sortOrder - b.sortOrder)
}

export function createCategory(data: Partial<Category>): Category {
  const now = new Date().toISOString()
  const maxOrder = categories.reduce((max, c) => Math.max(max, c.sortOrder), 0)
  const category: Category = {
    id: data.id || 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    name: data.name || 'Новая категория',
    slug: data.slug || data.name?.toLowerCase().replace(/\s+/g, '-') || 'new',
    description: data.description,
    sortOrder: data.sortOrder !== undefined ? data.sortOrder : maxOrder + 1,
    isActive: data.isActive !== undefined ? data.isActive : true,
    createdAt: now,
    updatedAt: now
  }
  categories.push(category)
  globalForDb._sunstoreCategories = categories
  return category
}

export function updateCategory(id: string, patch: Partial<Category>): Category | null {
  const idx = categories.findIndex(c => c.id === id)
  if (idx === -1) return null
  categories[idx] = {
    ...categories[idx],
    ...patch,
    id: categories[idx].id,
    updatedAt: new Date().toISOString()
  }
  globalForDb._sunstoreCategories = categories
  return categories[idx]
}

export function deleteCategory(id: string): boolean {
  const idx = categories.findIndex(c => c.id === id)
  if (idx === -1) return false
  categories.splice(idx, 1)
  globalForDb._sunstoreCategories = categories
  return true
}
