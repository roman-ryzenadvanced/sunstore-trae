import type { AdminLoginResponse, Order, Product } from "@/types/api";

const now = new Date().toISOString();

export const mockProducts: Product[] = [
  {
    id: 1,
    category_id: 10,
    category_slug: "signature",
    category_name_ru: "Signature",
    slug: "amber-solar-drop",
    title_ru: "Серьги Amber Solar Drop",
    description_ru:
      "Тёплый янтарный блеск, тонкий золотой контур и мягкий свет, который работает как украшение для тихих, уверенных образов.",
    price_kopecks: 189900,
    sku: "SUN-001",
    stock_quantity: 7,
    images: [
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1200&q=80"
    ],
    is_active: true,
    created_at: now,
    updated_at: now
  },
  {
    id: 2,
    category_id: 10,
    category_slug: "signature",
    category_name_ru: "Signature",
    slug: "velvet-noon-ring",
    title_ru: "Кольцо Velvet Noon",
    description_ru:
      "Графичная форма и полированная поверхность создают ощущение редкого предмета, найденного в частной коллекции.",
    price_kopecks: 124500,
    sku: "SUN-002",
    stock_quantity: 12,
    images: [
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1200&q=80"
    ],
    is_active: true,
    created_at: now,
    updated_at: now
  },
  {
    id: 3,
    category_id: 11,
    category_slug: "objects",
    category_name_ru: "Objects",
    slug: "lune-resin-vase",
    title_ru: "Ваза Lune Resin",
    description_ru:
      "Скульптурная ваза из дымчатой смолы — предмет для интерьера, в котором есть воздух, тишина и люксовая строгость.",
    price_kopecks: 269000,
    sku: "SUN-003",
    stock_quantity: 4,
    images: [
      "https://images.unsplash.com/photo-1616627451162-1d7f18495be2?auto=format&fit=crop&w=1200&q=80"
    ],
    is_active: true,
    created_at: now,
    updated_at: now
  },
  {
    id: 4,
    category_id: 12,
    category_slug: "fragrance",
    category_name_ru: "Fragrance",
    slug: "quiet-gold-candle",
    title_ru: "Свеча Quiet Gold",
    description_ru:
      "Ноты белого чая, цитруса и тёплого дерева. Домашний ритуал с ощущением boutique hotel suite.",
    price_kopecks: 79000,
    sku: "SUN-004",
    stock_quantity: 18,
    images: [
      "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1200&q=80"
    ],
    is_active: true,
    created_at: now,
    updated_at: now
  },
  {
    id: 5,
    category_id: 11,
    category_slug: "objects",
    category_name_ru: "Objects",
    slug: "nero-tray",
    title_ru: "Поднос Nero Tray",
    description_ru:
      "Минималистичный поднос для украшений и ритуалов ухода. Матовая фактура, строгая геометрия и спокойный контраст.",
    price_kopecks: 94500,
    sku: "SUN-005",
    stock_quantity: 9,
    images: [
      "https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=1200&q=80"
    ],
    is_active: true,
    created_at: now,
    updated_at: now
  },
  {
    id: 6,
    category_id: 12,
    category_slug: "fragrance",
    category_name_ru: "Fragrance",
    slug: "iris-night-oil",
    title_ru: "Масло Iris Night",
    description_ru:
      "Сухое ароматическое масло для кожи с мягким сиянием, созданное для вечерних выходов и коллекционных подарков.",
    price_kopecks: 112000,
    sku: "SUN-006",
    stock_quantity: 15,
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80"
    ],
    is_active: true,
    created_at: now,
    updated_at: now
  }
];

export const mockOrders: Order[] = [
  {
    id: 101,
    tbank_order_id: "SUN-MOCK-101",
    tbank_payment_id: "PAY-101",
    customer_name: "Алина В.",
    customer_email: "alina@example.com",
    customer_phone: "+7 999 111-22-33",
    total_amount_kopecks: 314400,
    status: "CONFIRMED",
    items: [
      {
        id: 1,
        order_id: 101,
        product_id: 1,
        product_slug: "amber-solar-drop",
        product_title_ru: "Серьги Amber Solar Drop",
        quantity: 1,
        price_at_purchase_kopecks: 189900
      },
      {
        id: 2,
        order_id: 101,
        product_id: 4,
        product_slug: "quiet-gold-candle",
        product_title_ru: "Свеча Quiet Gold",
        quantity: 1,
        price_at_purchase_kopecks: 79000
      },
      {
        id: 3,
        order_id: 101,
        product_id: 5,
        product_slug: "nero-tray",
        product_title_ru: "Поднос Nero Tray",
        quantity: 1,
        price_at_purchase_kopecks: 94500
      }
    ],
    created_at: now,
    updated_at: now
  },
  {
    id: 102,
    tbank_order_id: "SUN-MOCK-102",
    tbank_payment_id: "PAY-102",
    customer_name: "Мария С.",
    customer_email: "maria@example.com",
    customer_phone: "+7 999 222-33-44",
    total_amount_kopecks: 124500,
    status: "PENDING",
    items: [
      {
        id: 4,
        order_id: 102,
        product_id: 2,
        product_slug: "velvet-noon-ring",
        product_title_ru: "Кольцо Velvet Noon",
        quantity: 1,
        price_at_purchase_kopecks: 124500
      }
    ],
    created_at: now,
    updated_at: now
  }
];

export const mockAdminLogin: AdminLoginResponse = {
  token: "mock-admin-token",
  expires_at: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
  username: "atelier"
};
