# QA Report — Sunstore Full QA Pass

**Date:** 2026-07-21
**Scope:** Full frontend ↔ backend wiring audit. Triggered by user-reported bug: *"adding product to cart > open cart > its empty"*.

---

## Summary

| Category | Result |
|---|---|
| Bugs found | **5** (2 critical, 3 cleanup) |
| Bugs fixed | **5 / 5** |
| TypeScript compile | **PASS** (exit 0) |
| End-to-end browser QA | **PASS** (all flows green) |
| Console errors | **0** |

---

## Bugs Found & Fixed

### BUG 1 — CRITICAL: Cart shows empty after adding product
**Root cause:** The `<CartProvider>` was instantiated multiple times — once at the root in `src/app/layout.tsx` (correct) AND again inside each major page:

- `src/app/page.tsx` — wrapped `<HomeContent>` in its own `<CartProvider>`
- `src/app/array/page.tsx` — wrapped `<ArrayContent>` in its own `<CartProvider>`
- `src/app/blueprint/page.tsx` — wrapped `<BlueprintContent>` in its own `<CartProvider>`

Each nested provider created an isolated cart state. Items added on `/` went into the inner provider; the cart page `/velocity` (which correctly uses only the root provider) never saw them.

**Fix:** Removed the redundant nested `<CartProvider>` wrappers on all three pages. Now the entire app shares the single root provider from `layout.tsx`.

**Files touched:**
- `src/app/page.tsx`
- `src/app/array/page.tsx`
- `src/app/blueprint/page.tsx`

---

### BUG 2 — CRITICAL: `/admin/login` was unreachable (infinite loading spinner)
**Root cause:** `src/app/admin/layout.tsx` runs an auth check (`GET /api/store-config?scope=admin`) on **every** route under `/admin/*`, including `/admin/login` itself. For an unauthenticated user the check returns 401, the layout redirects to `/admin/login` — which then re-runs the same check, re-redirects, and the login form is never rendered. User saw a permanent spinner.

**Fix:** Skip the auth gate when `pathname === '/admin/login'`. Render the login page full-bleed (no admin sidebar chrome) for a clean UX.

**Files touched:**
- `src/app/admin/layout.tsx`

---

### BUG 3 — Belt-and-suspenders: Cart not re-syncing on tab focus
**Root cause:** The root `<CartProvider>` only fetched cart contents once on initial mount. If the user added items in another tab or returned to the tab after a while, the badge was stale.

**Fix:** Added `visibilitychange` + `window focus` listeners in `CartContext` that silently re-fetch `/api/cart` whenever the tab becomes visible.

**Files touched:**
- `src/contexts/CartContext.tsx`

---

### BUG 4 — Dead code: orphaned typo'd folder `src/contextts/`
**Root cause:** A folder literally named `contextts` (double-t) contained an orphan stub `CartProvider.tsx` with `null` default context. Not imported anywhere, but a trap for future developers.

**Fix:** Deleted `src/contextts/CartProvider.tsx` and the empty `contextts/` directory.

---

### BUG 5 — Dead code & unused imports
**Fix:**
- Deleted unused `src/components/Providers.tsx` (not imported anywhere).
- Removed unused `CartProvider` import from `src/app/checkout/page.tsx` (only `useCart` is used).

---

## Verification (all green)

### Browser E2E — `qa_cart_flow.py`
Reproduces the user's exact scenario:
1. Visit `/`
2. Click "В корзину"
3. Verify cart badge shows count
4. Navigate to `/velocity` (cart page)
5. Verify item is present (NOT the empty-cart message)

```
[PASS] cart badge shows count after add
[PASS] cart page shows the added product
[PASS] no console errors during flow
OVERALL: ALL CHECKS PASSED
```

### Browser E2E — `qa_cart_ops.py`
Extended cart operations:
```
[PASS] cart badge reflects multiple adds (2)
[PASS] quantity + button works (1 -> 2)
[PASS] currency switched RUB -> USD
[PASS] remove reduced items 2 -> 1
[PASS] checkout page renders step 1
OVERALL: ALL CHECKS PASSED
```

### Browser E2E — `qa_admin_full.py`
Full admin authentication flow:
```
[PASS] login form visible
[PASS] redirected to /admin dashboard (password: sunstore)
[PASS] admin sidebar nav visible
[PASS] admin stats API returns 200
[PASS] admin products API returns 200
[PASS] /admin/products page accessible
[PASS] no console errors
OVERALL: ALL CHECKS PASSED
```

### Backend API smoke test
All endpoints respond correctly:
- `GET /` → 200 (homepage)
- `GET /array, /velocity, /checkout, /admin, /admin/login, /status` → 200
- `GET /api/products` → 200 with product list
- `GET /api/cart` → 200 with items array
- `GET /api/store-config` → 200 with gateway config
- `GET /api/admin/stats, /api/admin/orders` → correctly return 401 unauth

### TypeScript
```
npx tsc --noEmit -p tsconfig.json
exit: 0   (zero errors)
```

---

## Frontend ↔ Backend Wiring Matrix (verified)

| UI Action | Frontend | API Wire | Status |
|---|---|---|---|
| Add to cart | `/`, `/array`, `/blueprint` product cards | `POST /api/cart/sync` | ✅ |
| Open cart | Header cart button, `/velocity` | `GET /api/cart` | ✅ |
| Update quantity | `/velocity` + / − buttons | `POST /api/cart/sync` | ✅ |
| Remove item | `/velocity` "Удалить" | `POST /api/cart/sync` | ✅ |
| Switch currency | Header `<select>` | localStorage + `useCurrency` | ✅ |
| Begin checkout | `/velocity` → "Оформить" | navigates to `/checkout` | ✅ |
| Admin login | `/admin/login` form | `POST /api/admin/login` | ✅ |
| Admin logout | sidebar "Выйти" | `POST /api/admin/logout` | ✅ |
| Admin dashboard | `/admin` | `GET /api/admin/stats` | ✅ |
| Admin products | `/admin/products` | `GET /api/admin/products` | ✅ |
| Admin orders | `/admin/orders` | `GET /api/admin/orders` | ✅ |
| Admin payments | `/admin/settings/payments` | `GET /api/store-config?scope=admin` | ✅ |

---

## How to re-run the QA suite

```powershell
# Dev server must be running on http://localhost:3100
$env:PORT="3100"; npx next dev

# In another terminal:
python .qa\qa_cart_flow.py     # the original reported bug
python .qa\qa_cart_ops.py      # extended cart ops
python .qa\qa_admin_full.py    # admin auth + dashboard
```

Screenshots from each run are saved under `.qa/`.

---

## Notes

- Default admin password: `sunstore` (override with `ADMIN_PASSWORD` env var; see `src/lib/adminAuth.ts`).
- Cart persistence is session-based via `x-session-id` header (cookie in browser).
- All six payment gateways remain in demo mode by default and respond to `POST /api/payments/create`.
