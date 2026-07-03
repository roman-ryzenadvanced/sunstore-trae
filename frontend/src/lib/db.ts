import { PrismaClient } from '@prisma/client'
import { hashPassword } from './auth'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // In Vercel serverless, use /tmp for database persistence within a single function instance
  const isVercel = !!process.env.VERCEL
  if (isVercel) {
    process.env.DATABASE_URL = 'file:/tmp/sunstore.db'
  }
  return new PrismaClient()
}

export const db =
  globalForPrisma.prisma ?? createPrismaClient()

// In development, reuse the client across HMR cycles
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Auto-seed for serverless environments
let seeded = false

export async function ensureSeeded() {
  if (seeded) return db
  try {
    const adminCount = await db.superAdmin.count()
    if (adminCount === 0) {
      const hashedPw = await hashPassword('changeme123')
      await db.superAdmin.create({
        data: { username: 'admin', password: hashedPw, name: 'Main Administrator' },
      })

      // Seed platform config
      const configs = [
        { key: 'tbank_terminal_key', value: '1700000000000DEMO' },
        { key: 'tbank_password', value: 'demo_password' },
        { key: 'tbank_mode', value: 'demo' },
        { key: 'site_url', value: '' },
        { key: 'default_from_email', value: 'noreply@sunstore.app' },
        { key: 'default_from_name', value: 'SunStore' },
        { key: 'default_smtp_host', value: '' },
        { key: 'default_smtp_port', value: '587' },
        { key: 'default_smtp_user', value: '' },
        { key: 'default_smtp_pass', value: '' },
      ]
      for (const cfg of configs) {
        await db.platformConfig.upsert({
          where: { key: cfg.key },
          update: { value: cfg.value },
          create: { key: cfg.key, value: cfg.value },
        })
      }

      // Seed demo site
      const siteAdminPw = await hashPassword('demo123')
      await db.site.create({
        data: {
          name: 'SunVolt Energy',
          slug: 'demo-solar',
          tagline: 'Professional solar panel solutions for your home',
          templateId: 'solar-panels',
          status: 'READY',
          primaryColor: '#f59e0b',
          categories: JSON.stringify(['Solar Panels', 'Inverters', 'Batteries', 'Mounting Systems', 'Accessories']),
          owner: {
            create: {
              username: 'sunvolt_admin',
              email: 'admin@sunvolt.demo',
              password: siteAdminPw,
              name: 'SunVolt Admin',
            },
          },
          products: {
            createMany: {
              data: [
                { title: 'Solar Panel 400W Monocrystalline', slug: 'solar-panel-400w', description: 'High-efficiency monocrystalline solar panel with 400W output.', price: 45000, oldPrice: 52000, stock: 25, images: '[]', specs: JSON.stringify({ Power: '400W', Type: 'Monocrystalline', Efficiency: '22.3%', Warranty: '25 years' }), category: 'Solar Panels', featured: true, active: true },
                { title: 'Solar Panel 300W Polycrystalline', slug: 'solar-panel-300w', description: 'Budget-friendly polycrystalline solar panel.', price: 28000, oldPrice: 33000, stock: 40, images: '[]', specs: JSON.stringify({ Power: '300W', Type: 'Polycrystalline' }), category: 'Solar Panels', featured: true, active: true },
                { title: 'Hybrid Inverter 5kW', slug: 'hybrid-inverter-5kw', description: '5kW hybrid inverter with built-in MPPT charge controller.', price: 85000, oldPrice: 95000, stock: 15, images: '[]', specs: JSON.stringify({ Power: '5kW', Type: 'Hybrid' }), category: 'Inverters', featured: true, active: true },
                { title: 'LiFePO4 Battery 5.12kWh', slug: 'lifepo4-battery-512kwh', description: 'Lithium iron phosphate battery for energy storage.', price: 120000, oldPrice: 140000, stock: 10, images: '[]', specs: JSON.stringify({ Capacity: '5.12kWh', Chemistry: 'LiFePO4' }), category: 'Batteries', featured: true, active: true },
                { title: 'Roof Mounting Kit', slug: 'roof-mounting-kit', description: 'Complete roof mounting system for 4 panels.', price: 18000, oldPrice: 22000, stock: 30, images: '[]', specs: JSON.stringify({ Panels: '4', Material: 'Aluminum' }), category: 'Mounting Systems', featured: false, active: true },
                { title: 'MC4 Connector Set', slug: 'mc4-connector-set', description: 'Professional-grade MC4 connectors.', price: 2500, stock: 100, images: '[]', specs: JSON.stringify({ Type: 'MC4', Pairs: '10' }), category: 'Accessories', featured: false, active: true },
              ],
            },
          },
        },
      })

      console.log('✅ Auto-seeded database for serverless')
    }
    seeded = true
  } catch (e) {
    console.error('Seed check failed:', e)
  }
  return db
}