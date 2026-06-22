# Sunstore Tests

## Smoke tests

Run against any deployment (local, preview, or production):

```bash
# Basic smoke — all routes return 200 and contain expected content
node tests/e2e-smoke.js https://frontend-orcin-seven-95.vercel.app

# Deep validation — security headers, SEO metadata, accessibility, no-inline-handlers
node tests/e2e-deep.js https://frontend-orcin-seven-95.vercel.app
```

## What's covered

### e2e-smoke.js (18 checks)
- All public routes return expected HTTP status
- Home / catalog / product / checkout / admin / central / multi-site pages
- Custom 404 page renders
- Security headers present
- Query params (category filter, sort) work

### e2e-deep.js (12 checks)
- Security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS
- SEO metadata: title, description, OpenGraph, canonical
- Product page has product-specific SEO (generateMetadata)
- Checkout is noindex (transactional)
- Admin login form is empty by default (no pre-filled credentials)
- Toaster and CartDrawer components are loaded
- Multi-site storefront uses themeable CSS
- Vercel response headers present
- Custom 404 page
- No inline event handlers in server HTML

## Adding new tests

Both files use a simple declarative format — push a new object to the `routes` / `checks` array with `name`, `path`, and `expects` (or `fn` for deep tests).
