# Sun.store full project package

This is the complete Sun.store project: Go backend (Phase 1–3), Next.js
frontend (Russian storefront + admin), and configuration. It is packaged
without heavy build/install artifacts (`node_modules`, `.next`, Go build
cache, `tsconfig.tsbuildinfo`) so the archive is portable and small.

## What's inside

```
.
├── backend/        # Go API, Hexagonal / Clean architecture
└── frontend/       # Next.js (App Router, Russian UI)
```

## Backend (Go)

- Hexagonal architecture: `cmd`, `internal/{config,domain,usecase,repository,delivery}`
- PostgreSQL persistence via pgx/v5
- JWT-secured admin API
- Public storefront + checkout endpoints
- T-Bank Internet Acquiring integration:
  - `Init` request against the official `https://securepay.tinkoff.ru/v2/Init`
  - SHA-256 token signing for both outbound requests and incoming webhooks
  - Notification verification that rejects mismatches with HTTP 403
- Money is stored in Kopecks (`BIGINT`) to avoid float errors

### Run backend

```bash
cd backend
cp .env.example .env
# fill in: POSTGRES_*, TBANK_*, JWT_SECRET (>=32 bytes)
psql -U postgres -d sunstore -f migrations/0001_init.sql
go mod tidy
go run ./cmd/api
```

Server boots on `APP_PORT` (default `8080`). Healthcheck at `/healthz`.

## Frontend (Next.js, App Router, Russian UI)

- Storefront: `/`, `/catalog`, `/products/[slug]`, `/checkout`, `/checkout/status`
- Admin: `/admin/login`, `/admin/products`, `/admin/orders`,
  `/admin/dashboard`, `/admin/dashboard/products`
- Zustand cart with localStorage persistence
- Typed API client with graceful fallback to mock data when backend is offline

### Run frontend

```bash
cd frontend
cp .env.example .env.local
# set NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
npm install
npm run dev
```

Frontend dev server runs on `http://localhost:3000`.

## API surface (backend)

### Public
- `GET  /api/v1/products` — list active products
- `GET  /api/v1/products/{slug}` — single product
- `POST /api/v1/checkout/init` — create order + start T-Bank payment
- `POST /api/v1/webhooks/tbank` — T-Bank notifications (SHA-256 verified)

### Admin (Bearer JWT)
- `POST /api/v1/admin/auth/login`
- `GET  /api/v1/admin/products`
- `POST /api/v1/admin/products`
- `PUT  /api/v1/admin/products/{id}`
- `DELETE /api/v1/admin/products/{id}`
- `GET  /api/v1/admin/orders`

## T-Bank security algorithm

For every T-Bank request (outbound `Init` and inbound notification):

1. Collect `key:value` pairs from the JSON object, excluding `Token` and `Success`.
2. Append the terminal `Password` to the list.
3. Sort alphabetically by key.
4. Concatenate the values into one string.
5. Apply SHA-256 (UTF-8) and put the digest into `Token`.
6. Compare in constant time. On mismatch reject with `HTTP 403`.

## Notes on T-Bank SDK

The originally referenced `github.com/jfk9w-go/tbank-api` package targets
T-Bank client account/session APIs, not Internet Acquiring. The acquiring
integration is therefore implemented directly against the official T-Bank
`Init` API and notification rules so checkout and webhooks follow the
real payment contract.

## Verification performed

- `go vet ./...` and `go build ./...` pass on the backend
- `npm run typecheck` and `npm run build` pass on the frontend
- A local dev server can serve both layers; the frontend uses mock
  fallback data when the backend is offline so the UI stays usable.
