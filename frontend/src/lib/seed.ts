import { db } from './db'
import { hashPassword } from './auth'

export async function seedDatabase() {
  // Check if super admin already exists
  const existingAdmin = await db.superAdmin.findFirst({
    where: { username: 'admin' },
  })

  if (!existingAdmin) {
    const hashedPw = await hashPassword('changeme123')
    await db.superAdmin.create({
      data: {
        username: 'admin',
        password: hashedPw,
        name: 'Main Administrator',
      },
    })
    console.log('✅ Super admin created: admin / changeme123')
  }

  // Seed platform config
  const configs = [
    { key: 'tbank_terminal_key', value: '1700000000000DEMO' },
    { key: 'tbank_password', value: 'demo_password' },
    { key: 'tbank_mode', value: 'demo' },
    { key: 'site_url', value: '' },
    { key: 'default_smtp_host', value: '' },
    { key: 'default_smtp_port', value: '587' },
    { key: 'default_smtp_user', value: '' },
    { key: 'default_smtp_pass', value: '' },
    { key: 'default_from_email', value: 'noreply@sunstore.app' },
    { key: 'default_from_name', value: 'SunStore' },
  ]

  for (const cfg of configs) {
    await db.platformConfig.upsert({
      where: { key: cfg.key },
      update: { value: cfg.value },
      create: { key: cfg.key, value: cfg.value },
    })
  }

  console.log('✅ Platform config seeded')
}

export async function seedDemoSite() {
  const existing = await db.site.findFirst({ where: { slug: 'demo-solar' } })
  if (existing) return

  // Create a demo solar panel store
  const hashedPw = await hashPassword('demo123')
  const site = await db.site.create({
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
          password: hashedPw,
          name: 'SunVolt Admin',
        },
      },
      products: {
        createMany: {
          data: [
            {
              title: 'Solar Panel 400W Monocrystalline',
              slug: 'solar-panel-400w',
              description: 'High-efficiency monocrystalline solar panel with 400W output. Perfect for residential and commercial installations. 22.3% efficiency rating with 25-year warranty.',
              price: 45000,
              oldPrice: 52000,
              stock: 25,
              images: JSON.stringify([]),
              specs: JSON.stringify({ Power: '400W', Type: 'Monocrystalline', Efficiency: '22.3%', Warranty: '25 years', Dimensions: '2100 × 1050 × 35mm', Weight: '22kg' }),
              category: 'Solar Panels',
              featured: true,
              active: true,
            },
            {
              title: 'Solar Panel 300W Polycrystalline',
              slug: 'solar-panel-300w',
              description: 'Budget-friendly polycrystalline solar panel. 300W output with reliable performance for smaller installations.',
              price: 28000,
              oldPrice: 33000,
              stock: 40,
              images: JSON.stringify([]),
              specs: JSON.stringify({ Power: '300W', Type: 'Polycrystalline', Efficiency: '18.5%', Warranty: '20 years', Dimensions: '1956 × 992 × 35mm', Weight: '19kg' }),
              category: 'Solar Panels',
              featured: true,
              active: true,
            },
            {
              title: 'Hybrid Inverter 5kW',
              slug: 'hybrid-inverter-5kw',
              description: '5kW hybrid inverter with built-in MPPT charge controller. Works with grid-tied and off-grid systems.',
              price: 85000,
              oldPrice: 95000,
              stock: 15,
              images: JSON.stringify([]),
              specs: JSON.stringify({ Power: '5kW', Type: 'Hybrid', Input_Voltage: '200-500V DC', Output: '230V AC', Efficiency: '97.6%' }),
              category: 'Inverters',
              featured: true,
              active: true,
            },
            {
              title: 'LiFePO4 Battery 5.12kWh',
              slug: 'lifepo4-battery-512kwh',
              description: 'Lithium iron phosphate battery bank for energy storage. 5.12kWh capacity with 6000+ cycle life.',
              price: 120000,
              oldPrice: 140000,
              stock: 10,
              images: JSON.stringify([]),
              specs: JSON.stringify({ Capacity: '5.12kWh', Chemistry: 'LiFePO4', Voltage: '51.2V', Cycles: '6000+', Weight: '45kg' }),
              category: 'Batteries',
              featured: true,
              active: true,
            },
            {
              title: 'Roof Mounting Kit for 4 Panels',
              slug: 'roof-mounting-kit-4',
              description: 'Complete roof mounting system for 4 solar panels. Includes rails, clamps, and flashing.',
              price: 18000,
              oldPrice: 22000,
              stock: 30,
              images: JSON.stringify([]),
              specs: JSON.stringify({ Panels: '4', Material: 'Aluminum', Compatibility: 'Standard frame panels', Warranty: '15 years' }),
              category: 'Mounting Systems',
              featured: false,
              active: true,
            },
            {
              title: 'MC4 Solar Connector Set (10 pairs)',
              slug: 'mc4-connector-set',
              description: 'Professional-grade MC4 connectors for solar panel wiring. IP67 waterproof rating.',
              price: 2500,
              stock: 100,
              images: JSON.stringify([]),
              specs: JSON.stringify({ Type: 'MC4', Pairs: '10', Rating: '30A / 1000V', Protection: 'IP67' }),
              category: 'Accessories',
              featured: false,
              active: true,
            },
          ],
        },
      },
    },
  })

  console.log(`✅ Demo site created: ${site.name} (${site.slug})`)
}