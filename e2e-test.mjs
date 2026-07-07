// Local end-to-end play test driving the same API flows the UI uses.
const B = process.env.BASE || 'http://localhost:3001'

async function j(method, path, body, token) {
  const res = await fetch(B + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = text }
  return { status: res.status, data }
}

const results = []
function check(name, cond, detail) {
  results.push({ name, ok: !!cond, detail })
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -> ' + detail : ''}`)
}

const run = async () => {
  // 1. Super admin login
  const login = await j('POST', '/api/auth', { username: 'admin', password: 'changeme123' })
  check('super admin login', login.status === 200 && login.data.token, login.data.error || '')
  const T = login.data.token

  // 2. List sites (was empty bug)
  const list = await j('GET', '/api/sites', null, T)
  check('list sites (non-empty)', Array.isArray(list.data.sites) && list.data.sites.length >= 1, `count=${list.data.sites?.length}`)

  // 3. Create store
  const slug = 'e2e-' + Date.now()
  const create = await j('POST', '/api/sites', {
    name: 'E2E Store', slug, tagline: 'e2e', templateId: 'solar-panels',
    primaryColor: '#1e3a5f', categories: 'Panels,Inverters',
    ownerName: 'E2E Owner', ownerEmail: 'owner@e2e.com',
    ownerUsername: 'e2e_owner_' + Date.now(), ownerPassword: 'e2epass123',
  }, T)
  check('create store', create.status === 201 && create.data.id, create.data.error || '')
  const SID = create.data.id

  // 4. Site appears in list
  const list2 = await j('GET', '/api/sites', null, T)
  check('new store visible in list', list2.data.sites.some(s => s.id === SID), '')

  // 5. Storefront API (public)
  const sf = await j('GET', `/api/storefront/${slug}`)
  check('storefront api', sf.data.site && Array.isArray(sf.data.products) && sf.data.products.length > 0, `products=${sf.data.products?.length}`)
  const PID = sf.data.products[0].id

  // 6. Site admin login (owner)
  const saUser = 'e2e_owner_' + slug.replace('e2e-', '')
  const sa = await j('POST', '/api/auth', { username: create.data.owner.username, password: 'e2epass123' })
  check('site admin login', sa.status === 200 && sa.data.role === 'site_admin', sa.data.error || '')
  const SAT = sa.data.token

  // 7. Site admin RBAC scoping
  const saList = await j('GET', '/api/sites', null, SAT)
  check('site admin sees only own store', saList.data.sites.length === 1 && saList.data.sites[0].slug === slug, `visible=${saList.data.sites?.map(s=>s.slug)}`)

  // 8. Customer register (was 500 bug)
  const reg = await j('POST', '/api/customer/register', { email: 'buyer' + Date.now() + '@e2e.com', password: 'buy123', name: 'E2E Buyer' })
  check('customer register', reg.status === 201 && reg.data.customer, reg.data.error || '')
  const custEmail = reg.data.customer.email

  // 9. Customer login
  const clog = await j('POST', '/api/customer/login', { email: custEmail, password: 'buy123' })
  check('customer login', clog.status === 200 && clog.data.token, clog.data.error || '')

  // 10. Payment init (was 500 bug)
  const pay = await j('POST', '/api/payment/init', {
    siteId: SID, items: [{ productId: PID, quantity: 1 }],
    customerName: 'E2E Buyer', customerEmail: custEmail,
  })
  check('payment init', pay.status === 200 && pay.data.orderId, pay.data.error || '')
  const ORDER_ID = pay.data.orderId

  // 11. Order created & visible to super admin
  const orders = await j('GET', `/api/sites/${SID}/orders`, null, T)
  const data = orders.data.data || orders.data
  const ordArr = Array.isArray(data) ? data : (data.orders || [])
  check('order created & listed', ordArr.some(o => o.id === ORDER_ID), `orders=${ordArr.length}`)

  // 12. Update order status
  const upd = await j('PATCH', `/api/sites/${SID}/orders`, { orderId: ORDER_ID, status: 'CONFIRMED' }, T)
  check('update order status', upd.status === 200 && upd.data.status === 'CONFIRMED', upd.data.error || '')

  // 13. Stats API
  const stats = await j('GET', '/api/stats', null, T)
  check('stats api', stats.status === 200, stats.data.error || '')

  const passed = results.filter(r => r.ok).length
  console.log(`\n=== ${passed}/${results.length} checks passed ===`)
  if (passed !== results.length) process.exit(1)
}

run().catch(e => { console.error('E2E crashed:', e); process.exit(1) })
