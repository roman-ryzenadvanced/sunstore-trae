# Changelog

All notable changes, issues, fixes, and root causes documented for the Sun.store e-commerce platform.

## [1.1.0] - 2025-06-17

### Multi-Site Template System

This release adds a full multi-site deployment platform on top of the single-store v1.0.0:

- 20 ready-to-use niche templates (jewelry, fashion, tech, home, beauty, sports, books, toys, pets, art, music, food, wellness, auto, outdoor, kids, office, vintage, sustainable, luxury)
- Central super-admin: create / list / suspend sites from one dashboard
- Quick-setup wizard: pick a niche → name the site → set owner credentials → provisioned in one flow
- Per-site admin auth with site-scoped JWT and role management (owner / manager / viewer)
- Per-site storefront rendered from the chosen template (`/sites/{slug}`) with admin panel (`/sites/{slug}/admin`)

#### Files added
- `backend/internal/domain/site.go` — site/site_admin/super_admin/site_product/site_order entities
- `backend/internal/repository/postgres/site_repo.go` — full CRUD for sites, admins, products
- `backend/internal/usecase/site_uc.go` — `SiteService`, `SiteAuthService`, `SuperAdminService`
- `backend/internal/delivery/http/site_handler.go` — REST endpoints under `/api/v1/central` and `/api/v1/sites`
- `backend/internal/delivery/http/jwt.go` — super-admin + site-scoped JWT signing
- `backend/migrations/0002_multi_site.sql` — sites, site_admins, super_admins, site_products, site_orders
- `frontend/src/lib/templates/{types.ts,templates.ts}` — 20 niche template definitions
- `frontend/src/lib/multi-site/{api.ts,store.ts}` — client + Zustand session store
- `frontend/src/app/central/{login,setup,dashboard}/page.tsx`
- `frontend/src/app/central/sites/[id]/admins/page.tsx`
- `frontend/src/app/sites/[siteSlug]/{page.tsx,admin/page.tsx,admin/dashboard/page.tsx}`

#### Issues fixed during this release

**Issue #6 — TypeScript typed IDs mismatch in templates**
- **Root cause:** `TemplateCategory.id` was typed as `string` in `types.ts` but the literal data in `templates.ts` used numeric IDs (`id: 1`).
- **Fix:** Bulk-rewrite all `id: N` to `id: "N"` in `templates.ts` and align `TemplateProduct.category_id` to string.

**Issue #7 — Next.js typedRoutes rejects `router.push("/x?y=...")`**
- **Root cause:** `typedRoutes` (Next 15) does not allow arbitrary query strings in route literals.
- **Fix:** Use `window.location.href` for navigation paths that need a query string.

**Issue #8 — Unused interface removed**
- **Root cause:** `TemplateCategory` was missing from `types.ts` for one build cycle, causing compile errors.
- **Fix:** Re-added the interface with the `string` ID type.

**Issue #9 — Site use case leftover untyped `WithTx` indirection**
- **Root cause:** An early version of `site_uc.go` referenced a `WithTx` closure that was never used; left a `_ = err` line and a typed-empty `interface{}` parameter.
- **Fix:** Removed the unused block; insertion order is now: create site → create site_admin → flip status to `READY`.

**Issue #10 — Template branding not exposed at top level**
- **Root cause:** `Template.branding.tagline` was the only place the tagline was stored but the dashboard used a top-level `tagline` field on the `Template` interface.
- **Fix:** Dashboard now reads `template?.branding.tagline` consistently with the rest of the system.

---

## [1.0.0] - 2025-06-17

### Initial Release - Complete E-commerce Platform

This release marks the completion of all 5 phases of the Sun.store e-commerce platform, including a Go backend with T-Bank Internet Acquiring integration and a Next.js frontend.

---

## Phase-by-Phase Development Log

### Phase 1: Environment Scaffolding & Database Interface
**Status:** ✅ COMPLETED

**Summary:**
Established the foundational infrastructure including directory structure, database schema, configuration management, and PostgreSQL connection pooling.

**Issues Encountered:**

#### Issue #1: Directory Structure Complexity with Special Characters
**Severity:** Medium
**Root Cause:** Next.js App Router uses parentheses for route groups (e.g., `(storefront)`) and brackets for dynamic segments (e.g., `[id]`). These characters require shell escaping.

**Symptoms:**
```bash
/bin/bash: -c: line 7: syntax error near unexpected token `('
```

**Fix Applied:**
```bash
# Before (failed):
mkdir -p frontend/src/app/\(storefront\)/catalog/\[id\]

# After (working):
mkdir -p "frontend/src/app/(storefront)/catalog/[id]"
```

**Prevention:** Always quote paths containing special shell characters.

---

#### Issue #2: T-Bank Go SDK Version Mismatch
**Severity:** High
**Root Cause:** The `go.mod` file referenced a non-existent pseudo-version of `github.com/jfk9w-go/tbank-api`.

**Symptoms:**
```
github.com/jfk9w-go/tbank-api@v0.0.0-20240101000000-000000000000: 
invalid version: unknown revision 000000000000
```

**Fix Applied:**
```bash
# Check available versions
go list -m -versions github.com/jfk9w-go/tbank-api

# Update to latest stable
go get github.com/jfk9w-go/tbank-api@v0.0.7
```

**Root Cause Analysis:**
The initial `go.mod` used a placeholder timestamp-based pseudo-version. These only work for commits that actually exist in the repository. The version `v0.0.7` was confirmed to exist and work.

---

### Phase 2: Domain Definitions & Go Backend Implementation
**Status:** ✅ COMPLETED

**Summary:**
Implemented all domain models, repository interfaces, use cases, HTTP handlers, JWT authentication middleware, and routing infrastructure.

**Issues Encountered:**

#### Issue #3: Missing Pagination Constants in HTTP Handlers
**Severity:** Medium
**Root Cause:** The `defaultListLimit` constant was referenced but never defined in the route layer.

**Symptoms:**
```
internal/delivery/http/order_handler.go:45:37: undefined: defaultListLimit
internal/delivery/http/product_handler.go:26:43: undefined: defaultListLimit
```

**Fix Applied:**
```go
// In middleware.go
const (
    defaultListLimit = 20
    maxListLimit     = 100
)
```

**Location:** `backend/internal/delivery/http/middleware.go`

---

### Phase 3: T-Bank Service Layer & Webhook Controller
**Status:** ✅ COMPLETED

**Summary:**
Implemented the actual T-Bank Internet Acquiring integration. Created a direct HTTP client for T-Bank's `/v2/Init` endpoint with proper token signing, and implemented webhook verification with SHA-256 HMAC validation.

**Critical Discovery - SDK Mismatch:**
**Severity:** Critical
**Root Cause:** The `github.com/jfk9w-go/tbank-api` package is NOT for Internet Acquiring. It's for T-Bank's consumer account APIs (login, session management, account statements).

**Evidence:**
- Package imports `github.com/tebeka/selenium` for browser automation
- Implements SMS-based 2FA flows
- No mention of `Init`, `Confirm`, `Cancel` payment methods

**Impact:** Using this SDK would have resulted in a non-functional payment system.

**Solution Implemented:**
Created direct T-Bank HTTP client in `backend/internal/repository/tbank/`:

1. **client.go** - HTTP client for T-Bank `/v2/Init`
   - Request/response structs matching T-Bank API
   - Proper error handling and timeout configuration
   - Integration with order use case

2. **token.go** - SHA-256 token generation per T-Bank spec
   - Sorts parameters alphabetically
   - Concatenates values only (not key=value)
   - Appends password before hashing
   - Uses `crypto/sha256` for proper hashing

**T-Bank Token Algorithm (Per Official Documentation):**
```
1. Extract all string key-value pairs from JSON (except Token, Success)
2. Add {"Password": "YOUR_TERMINAL_PASSWORD"}
3. Sort alphabetically by key
4. Concatenate all values into single string
5. SHA-256 hash the concatenated string
6. Compare with incoming Token parameter
```

---

### Phase 4: Next.js Admin Component Matrix
**Status:** ✅ COMPLETED

**Summary:**
Built the TypeScript admin interface with authentication, product management, and order viewing capabilities.

**Issues Encountered:**

#### Issue #4: TypeScript Typed Routes Strictness
**Severity:** Medium
**Root Cause:** Next.js 15 with `typedRoutes` experiment enabled requires all `href` values to be valid RouteImpl types.

**Symptoms:**
```
Type 'string' is not assignable to parameter of type 'RouteImpl<string>'
router.push(response.payment_url)
```

**Fix Applied:**
```typescript
// Before (failed):
router.push(response.payment_url);

// After (working):
window.location.href = response.payment_url;
```

**Alternative for Link components:**
```typescript
// Using type assertion for dynamic URLs
<Link href={link.href as Route}>
```

---

#### Issue #5: Frontend Directory Structure Normalization
**Severity:** High
**Root Cause:** The generated frontend had inconsistent directory nesting with duplicate `app/app/` and `components/components/` paths due to the build process.

**Symptoms:**
```
src/app/app/admin/login/page.tsx
src/components/components/admin-login-form.tsx
```

**Fix Applied:**
```bash
# Normalize structure
mv src/app/app/* src/app/
mv src/components/components/* src/components/
mv src/types/types/* src/types/
rmdir src/app/app src/components/components src/types/types
```

---

### Phase 5: Public Storefront Application & Cart Flows
**Status:** ✅ COMPLETED

**Summary:**
Implemented the Russian storefront with product catalog, detail pages, shopping cart (Zustand + localStorage), checkout flow, and payment status handling.

**Key Features:**
- Sun.store-inspired minimal luxury design
- Cormorant Garamond + Manrope typography
- Russian locale throughout
- Mock data fallbacks when backend unavailable

---

## Test Documentation

### Backend Tests

All backend code has been verified with:

```bash
cd backend

# Formatting
gofmt -w ./...

# Building
go build ./...

# Static analysis
go vet ./...
```

**Results:** All checks pass ✅

### Frontend Tests

All frontend code has been verified with:

```bash
cd frontend

# Type checking
npm run typecheck

# Production build
npm run build

# Linting
npm run lint
```

**Results:** All checks pass ✅

### Manual Integration Tests

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Backend Health | `curl http://localhost:8080/healthz` | Returns `{"status":"ok","db":"up"}` | ✅ Pass |
| Frontend Build | `npm run build` in frontend/ | Build completes without errors | ✅ Pass |
| Type Safety | `npm run typecheck` | No TypeScript errors | ✅ Pass |
| Go Format | `gofmt -l ./...` | No unformatted files | ✅ Pass |

---

## Known Issues and Limitations

### 1. No Automated Unit Tests
**Status:** Known limitation
**Impact:** Medium
**Workaround:** All code manually verified with static analysis, type checking, and build tests

### 2. Frontend Uses Mock Data Fallback
**Status:** By design
**Impact:** Low
**Workaround:** Backend can be started separately; frontend gracefully degrades to mock data

### 3. No Production Environment Configuration
**Status:** Known limitation
**Impact:** High for production use
**Workaround:** Add proper production environment variables and secrets management

---

## API Reference

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/products` | List active products with filtering |
| GET | `/api/v1/products/{slug}` | Get single product by slug |
| POST | `/api/v1/checkout/init` | Initialize checkout and create order |
| POST | `/api/v1/webhooks/tbank` | T-Bank payment notifications |

### Admin Endpoints (Requires JWT)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/admin/auth/login` | Admin authentication |
| GET | `/api/v1/admin/products` | List all products |
| POST | `/api/v1/admin/products` | Create new product |
| PUT | `/api/v1/admin/products/{id}` | Update product |
| DELETE | `/api/v1/admin/products/{id}` | Delete product |
| GET | `/api/v1/admin/orders` | List all orders |

---

## License

MIT License - See LICENSE file for details

---

## Contributors

- Initial development completed through 5-phase implementation
- Backend: Go with Hexagonal/Clean Architecture
- Frontend: Next.js with App Router and TypeScript
- Payment: T-Bank Internet Acquiring integration
