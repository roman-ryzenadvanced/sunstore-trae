# Post-Mortem: SunStore Frontend Production Readiness Audit

**Decision date:** 2025-06-17 (initial commit, marked "Production Ready")
**Post-mortem date:** 2026-06-22
**Status:** MIXED — multiple critical issues found; patched in this audit

---

## Outcome Scoring (against pre-committed criteria)

The README declared **"Status: Production Ready ✅"**. The following criteria are
what any reasonable reader of that claim would assume:

| Success Criterion | Threshold | Actual (pre-fix) | Met? |
|---|---|---|---|
| No known security vulnerabilities | 0 high CVEs | Next.js 15.3.3 had unpatched CVE-2025-66478 | ❌ |
| Cart accessible (keyboard) | WCAG 2.1 AA | No focus trap, no Escape, no scroll lock | ❌ |
| Form validation | Client-side required | Checkout submitted without any validation | ❌ |
| Out-of-stock UX | Disable buy button | Buy button always clickable | ❌ |
| Image optimization | next/image used | `background-image` everywhere | ❌ |
| Loading states | Skeletons / spinners | "Loading..." plain text | ❌ |
| Action feedback | Toast / inline | Silent success / silent failure | ❌ |
| Token expiry handling | Auto-logout on exp | Stored forever, never checked | ❌ |
| Mobile navigation | Hamburger / drawer | Desktop nav broke on mobile | ❌ |
| SEO on product pages | OG + title per product | Only static site title | ❌ |
| Multi-site storefront maintainability | CSS, not inline styles | 200+ lines of inline styles | ❌ |
| Default credentials in production | None | `atelier / sunstore` pre-filled | ❌ |

**Overall:** MIXED — the app *ran*, but it was not production-ready.

---

## What We Got Right

- **Hexagonal architecture on the backend** (Go) is clean and idiomatic.
- **Mock-data fallback pattern** kept the frontend usable offline.
- **Zustand + localStorage** for cart is the right shape for this app.
- **20 niche templates** give the multi-site feature real depth.
- **TypeScript strict mode** was enabled from day one.
- **Central / site-scoped admin separation** is well-modelled.

---

## What We Got Wrong

### Security
- **Next.js CVE-2025-66478** — shipped on 15.3.3 with a known vulnerability.
  Fixed by upgrading to 16.2.9.
- **Pre-filled credentials** on `/admin/login` (`atelier / sunstore`) and
  `/central/login` (`admin / changeme123`). Removed — inputs now start empty.
- **JWT expiry never checked client-side** — expired tokens stayed in localStorage.
  Fixed in `admin-auth-gate.tsx` with periodic re-validation.
- **`as any` casts** at the multi-site ↔ cart boundary (`addItem({...} as any)`).
  Replaced with proper Product type usage.

### UX
- **Cart drawer was inaccessible**: no Escape key, no focus trap, body scroll
  still active behind it, no ARIA dialog semantics. All fixed.
- **No "added to cart" feedback** — button looked identical before/after click.
  Added toast + transient button state ("✓ Добавлено").
- **Buy button always enabled**, even for out-of-stock products. Now disabled
  with explicit "Нет в наличии" label.
- **Checkout form accepted any input** — empty email, "x" as phone, etc.
  Added email regex, phone regex, per-field error messages.
- **No empty-cart guard on checkout** — user could submit a 0-ruble order.
  Now redirects to catalog with explanation.
- **No mobile menu** — nav links overflowed horizontally on small screens.
  Added hamburger + slide-down menu.
- **Loading states were plain text** ("Загрузка товаров..."). Replaced with
  animated skeletons matching the final layout.

### Frontend engineering
- **Multi-site storefront had 200+ lines of inline styles** in a single page
  component. Extracted to `storefront.css` with themeable CSS variables.
- **`SmartImage` component** added — wraps `next/image` with fallback, shimmer,
  and proper alt text. Used in `ProductCard` and product detail page.
- **`typedRoutes` was still under `experimental`** in Next.js 16. Moved to
  top-level config and removed deprecation warning.
- **Catch-all `catch {}` blocks** silently swallowed API errors. Many now
  surface user-facing toasts and roll back optimistic UI.

### SEO / Metadata
- **Only static site title existed.** Added per-page metadata:
  - `/` → storefront description, OG tags
  - `/catalog` → catalog description
  - `/products/[slug]` → generated from product (title, description, image)
  - `/checkout`, `/checkout/status` → noindex (transactional pages)
- **Canonical URLs** added to homepage, catalog, and product pages.
- **Open Graph images** now use the actual product image on product pages.

### Performance
- **`next/image`** with AVIF/WebP formats and proper `sizes` attributes.
- **`revalidate = 300`** on storefront, catalog, and product pages —
  ISR every 5 minutes instead of full SSR on every request.
- **`optimizePackageImports`** for `lucide-react` — tree-shakes icons.
- **`reactStrictMode`** and `poweredByHeader: false` for hardening.

---

## Preserved Dissent — Revisited

During the initial build, the README's "Production Ready ✅" stamp appears to
have been applied without an external review. Had a second reviewer been
involved, the following concerns would likely have been raised:

- **"Production Ready" with no tests** — the `tests/` directory contains only
  a README. **Did it materialize?** YES. **Cost:** any refactor risks silent
  breakage. **Lesson:** never label a project production-ready without at
  least smoke tests for the critical paths (auth, cart, checkout).

- **Pre-filled credentials on a login form** — appears convenient for demos,
  but if anyone deploys without reading the code, the demo creds become
  real creds. **Did it materialize?** YES, on both `/admin/login` and
  `/central/login`. **Lesson:** demo conveniences belong in `.env.example`,
  not in the production UI.

- **Silent API fallback to mock data** — `catch {} return mockProducts` lets
  the UI keep running even when the backend is on fire. **Did it materialize?**
  YES, extensively. **Cost:** operators have no signal that they're serving
  mock data. **Lesson:** mock fallback is fine, but it must surface a
  visible "demo mode" indicator and log to the console.

---

## Assumption Audit

- **Assumption 1:** "Mock fallback is enough — backend will be configured
  before launch."
  - **Held?** NO. The frontend shipped without any visible signal of mock
    mode. Fixed partially: toasts now surface errors, but a persistent
    "demo mode" banner is still a forward action.

- **Assumption 2:** "Inline styles in the multi-site storefront are fine for
  a v1."
  - **Held?** NO. The file became unmaintainable as templates were added.
    Refactored to CSS variables driven by the template definition.

- **Assumption 3:** "Typed routes (`experimental.typedRoutes`) is stable
  enough."
  - **Held?** PARTIAL. It worked, but Next.js 16 promoted it to stable —
    leaving it under `experimental` triggered a deprecation warning on every
    build. Moved to top-level config.

---

## Process Lessons

- **Phase 2 isolation worked?** YES — the multi-site subsystem was cleanly
  separated from the main storefront and could be improved independently.
- **Devil's advocate concerns played out?** YES — the "production ready"
  label was premature on multiple axes (security, a11y, validation).
- **Cadence was right?** TOO LOOSE — there was no checkpoint between
  "compiles" and "ship it". A pre-deploy checklist would have caught most
  of these in minutes.

---

## Forward Actions

- [x] Upgrade Next.js to patched version (CVE-2025-66478)
- [x] Remove all pre-filled credentials from login forms
- [x] Add client-side token expiry checking in admin auth gate
- [x] Make cart drawer fully accessible (focus trap, Escape, scroll lock, ARIA)
- [x] Add stock-aware add-to-cart with out-of-stock UX
- [x] Add per-field validation to checkout form
- [x] Add toast notification system for all user actions
- [x] Add skeleton loading states matching final layout
- [x] Add mobile navigation menu
- [x] Add per-page SEO metadata (title, description, OG, canonical)
- [x] Migrate product images to `next/image` with fallbacks
- [x] Refactor multi-site storefront inline styles → themeable CSS
- [x] Enable ISR (revalidate=300) on storefront, catalog, product pages
- [x] Add `optimizePackageImports` for `lucide-react`
- [ ] Add automated smoke tests (Playwright) for: login → add to cart →
      checkout → status page
- [ ] Add a "demo mode" banner when API calls fall back to mock data
- [ ] Add a `vercel.json` with explicit regions and function memory config
- [ ] Wire the T-Bank return URL to display the actual order details on
      `/checkout/status` (currently shows generic copy)
- [ ] Add a CSP header in `next.config.mjs` for defense in depth

---

## Status

- **MIXED → archive, log lessons.**
- The frontend is now materially more production-ready than before this audit,
  but a "MIXED" verdict is honest: without automated tests and a live T-Bank
  integration, claiming full "WIN" would repeat the original mistake.
- A follow-up `/cs:brief` should be scheduled to define what "v1.1 production
  ready" actually means, with pre-committed acceptance criteria.
