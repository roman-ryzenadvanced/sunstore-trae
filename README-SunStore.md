<div align="center">

# 🌞 SunStore

### Multi-store e-commerce platform — SaaS admin, storefront engine, CRM, solar quoting, and T-Bank payment integration.

[![Stack](https://img.shields.io/badge/stack-Next.js%2016%20%2B%20React%2019-000000)](https://nextjs.org)
[![Runtime](https://img.shields.io/badge/runtime-Bun%20%2F%20Node-informational)](https://bun.sh)
[![Database](https://img.shields.io/badge/database-Prisma%20%2B%20SQLite-4169E1)](https://prisma.io)
[![UI](https://img.shields.io/badge/ui-shadcn%2Fui%20%2B%20Tailwind%20v4-38BDF8)](https://ui.shadcn.com)

**One super-admin console. Unlimited branded storefronts. Orders, CRM tickets, subscribers, solar quotes, and real payments — all in a single Next.js app.**

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [What's New in v2](#whats-new-in-v2)
- [Key Capabilities](#key-capabilities)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Data Model](#data-model-prisma-schema)
- [API Reference](#api-reference)
- [Authentication & RBAC](#authentication--rbac)
- [Payments (T-Bank)](#payments-t-bank)
- [Storefront & Solar Quoting](#storefront--solar-quoting)
- [State Management](#state-management)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database & Persistence](#database--persistence)
- [Scripts](#scripts)
- [Deployment](#deployment)
  - [Vercel](#1-vercel-ai-studio--serverless)
  - [VPS (systemd + nginx)](#2-vps-systemd--nginx)
  - [Desktop (Electron)](#3-desktop-electron)
- [Demo Credentials](#demo-credentials)
- [Worklog & Provenance](#worklog--provenance)
- [License](#license)

---

## Overview

**SunStore** is a multi-tenant e-commerce **SaaS platform** rebuilt as a self-contained **Next.js 16 (App Router) + React 19** application. It replaces the older v1 architecture (Go/Gin backend + PostgreSQL + separate Next.js frontend) with a single Next.js codebase that uses **API Routes** as the backend and **SQLite via Prisma** as the datastore.

The platform supports:
- A **super-admin** who manages multiple stores ("sites") and their per-store admins.
- Per-store **storefronts** rendered from a slug (`/preview/store/[slug]`, public `/api/storefront/[slug]`).
- A full **e-commerce flow**: products → cart → checkout → T-Bank payment (demo/sandbox/live).
- A built-in **CRM**: support tickets + newsletter subscribers + broadcast email.
- A **solar quote calculator** that prices panel/inverter/battery systems and persists leads.
- **Analytics**: aggregate stats across all stores for the super-admin.

---

## What's New in v2

| Area | v1 | v2 (this repo) |
|---|---|---|
| Backend | Go (Gin) + PostgreSQL | Pure Next.js API Routes + **SQLite** |
| Store language | Russian storefront | English SunStore admin + multi-template storefronts |
| Login | `/central/login` | Root `/` dashboard |
| Runtime | Go binary | **Bun** (with Node fallback) |
| Process mgmt | unknown | **systemd** service |
| Persistence | managed Postgres | Prisma + SQLite (GitHub-synced on Vercel) |

The v2 rebuild was driven by the need for a **self-contained, easily deployable** store platform without external database infrastructure.

---

## Key Capabilities

- **Multi-store tenancy** — super-admin provisions unlimited branded stores, each with its own admin, products, orders, subscribers, and support tickets.
- **20+ store templates** — themed starter catalogs (solar panels, general retail, etc.) with sample products, hero copy, and trust badges (see `src/lib/templates.ts`).
- **Full storefront engine** — product cards, deal cards, star ratings, trust bar, cart drawer, loading skeletons, storefront preview client.
- **Payments** — T-Bank (Tinkoff) Internet Acquiring with `demo` / `sandbox` / `live` modes, SHA-256 token generation + webhook verification, stock decrement on order and restoration on failed payment.
- **CRM** — ticket creation + admin replies, subscriber management + broadcast email (Gmail/SMTP config per site).
- **Solar quoting** — interactive calculator (`solar-calculator.tsx`) that computes panel/inverter/battery counts and monthly savings, then saves a lead.
- **Auth & RBAC** — JWT (7-day) + bcrypt password hashing; three roles (`super_admin`, `site_admin`, `customer`) with site-scoped access enforcement.
- **Analytics dashboard** — stats cards, all-orders / all-products cross-store views with pagination + filters.
- **Internationalization ready** — `next-intl` and `next-themes` are installed for locale + dark/light theming.
- **Desktop build** — Electron packaging target (`dist:win`) wraps the standalone Next.js server.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Browser (React 19 SPA, Zustand-persisted auth)          │
│  Dashboard: /  (login → sidebar → views)                 │
│  Storefront: /preview/store/[slug]  (public)             │
│  Checkout: /checkout/{success,status,fail}               │
│  Customer: /customer/{login,register,orders}             │
│  Quote: /quote                                            │
└───────────────┬─────────────────────────────────────────┘
                │  fetch + Bearer JWT
┌───────────────▼─────────────────────────────────────────┐
│  Next.js 16 App Router                                   │
│  app/api/*  (Route Handlers — the "backend")             │
│    auth, sites, products, orders, payment, crm,          │
│    storefront, stats, config, solar-quote, customer      │
│  lib/: auth (JWT), rbac, db (Prisma), tbank, templates   │
└───────────────┬─────────────────────────────────────────┘
                │  Prisma Client
┌───────────────▼─────────────────────────────────────────┐
│  SQLite  (prisma/schema.prisma)                          │
│  Local: db/development.db  (or /tmp on Vercel)           │
│  Vercel: synced to private GitHub repo (sunstore-db)     │
└─────────────────────────────────────────────────────────┘
                │  HTTPS
┌───────────────▼─────────────────────────────────────────┐
│  T-Bank (Tinkoff) Acquiring — Init / Webhook / Status   │
└─────────────────────────────────────────────────────────┘
```

**Rendering model:** The dashboard is a **client-rendered SPA** orchestrated by a Zustand store (`currentView`, `selectedSiteId`). `app/page.tsx` switches between `LoginForm`, `CheckoutStatus`, and the `AppSidebar` shell based on persisted auth state (hydration-safe).

---

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4, `tailwindcss-animate`, `tw-animate-css` |
| UI kit | shadcn/ui (Radix primitives), 40+ components in `components/ui/` |
| State | Zustand 5 (`app-store`, `cart-store`) with persist middleware |
| Data | Prisma 6 + SQLite |
| Auth | `jsonwebtoken`, `bcryptjs` |
| Payments | T-Bank (Tinkoff) REST v2 |
| Animation | Framer Motion 12 |
| Charts | Recharts 2 |
| Tables | TanStack Table 8, TanStack Query 5 |
| Forms | React Hook Form 7 + Zod 4 + `@hookform/resolvers` |
| Markdown | React Markdown 10, `@mdxeditor/editor` |
| Desktop | Electron 29 + electron-builder |
| Runtime | Bun (preferred), Node 22 fallback |

---

## Project Structure

```
Sunstore-Tengiz-AIStudio/
├── package.json            # Next 16 + Bun scripts + Electron build
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json             # security headers
├── components.json          # shadcn/ui config
├── prisma/
│   └── schema.prisma       # 11 models (data model)
├── db/
│   ├── production.db       # seeded SQLite (demo data)
│   └── custom.db           # alternate bundled DB
├── public/                 # logo.svg, robots.txt
├── .zscripts/              # build/dev/mini-service shell helpers
├── deploy-vps.sh           # full VPS deployment (nginx + systemd)
├── sunstore-nginx.conf     # nginx site config
├── sunstore.service        # systemd unit
├── main.js                 # Electron entry
├── e2e-test.mjs            # end-to-end smoke test
├── check-login.js          # CLI auth check
├── check-site-admin.js     # CLI site-admin check
├── DEPLOY-VPS.md           # VPS deploy guide
├── worklog.md              # build provenance
└── src/
    ├── instrumentation.ts  # copies DB to /tmp on Vercel cold start
    ├── app/
    │   ├── layout.tsx, globals.css, page.tsx   # dashboard SPA shell
    │   ├── api/            # 18+ route handlers (see API Reference)
    │   ├── checkout/       # success / status / fail pages
    │   ├── customer/       # login / register / orders
    │   ├── preview/store/[slug]/  # storefront preview
    │   └── quote/          # solar quote page
    ├── components/
    │   ├── dashboard/      # 12 admin views (sidebar, sites, products, orders, crm, payments, stats…)
    │   ├── storefront/     # product-card, cart-drawer, deal-card, star-rating, trust-bar, preview client, types
    │   ├── ui/             # 40+ shadcn/ui primitives
    │   └── solar-calculator.tsx
    ├── lib/
    │   ├── auth.ts         # JWT sign/verify, bcrypt, getAuthUser
    │   ├── rbac.ts         # enforceAccess, checkSiteAccess
    │   ├── db.ts           # Prisma client + Vercel GitHub-sync persistence
    │   ├── tbank.ts        # T-Bank token, init, webhook verify, status map
    │   ├── templates.ts    # 20+ store templates w/ sample products
    │   ├── seed.ts         # super-admin + demo site seeder
    │   └── utils.ts
    ├── store/
    │   ├── app-store.ts    # auth + navigation (persisted)
    │   └── cart-store.ts   # storefront cart (persisted)
    └── hooks/              # use-mobile, use-toast
```

---

## Data Model (Prisma Schema)

11 models across auth, catalog, orders, CRM, payments, and quotes:

| Model | Purpose |
|---|---|
| `SuperAdmin` | Platform owner (login `admin`). |
| `Site` | A store/tenant (name, slug, template, theme color, status, custom domain). |
| `SiteAdmin` | Per-site admin account (one per site). |
| `SiteProduct` | Catalog item (price, oldPrice, currency, stock, images JSON, specs JSON, category, featured, active). |
| `SiteOrder` | Order (orderNumber, status, customer, totals, paymentId/Url, paymentMode). |
| `OrderItem` | Line item linking order ↔ product. |
| `SupportTicket` | CRM ticket (open/replied/closed) with admin reply. |
| `Subscriber` | Newsletter subscriber (unique per site+email). |
| `SiteEmailConfig` | Per-site Gmail/SMTP sending config. |
| `PlatformConfig` | Key-value platform settings (T-Bank keys, SMTP defaults). |
| `PaymentTransaction` | T-Bank transaction record (status, raw request/response JSON). |
| `SiteQuote` | Solar quote lead (panels, inverter, battery, totals, consumption, installationType). |
| `Customer` | Visitor account (bcrypt-hashed password, orders). |

Currencies default to **RUB**; order/quote status enums are documented inline in `schema.prisma`.

---

## API Reference

All routes under `src/app/api/`. Protected routes expect `Authorization: Bearer <jwt>`.

### Auth
| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth` | public | Login (super-admin / site-admin). |
| `POST` | `/api/auth/change-password` | auth | Change password. |
| `POST` | `/api/customer/login` | public | Customer login. |
| `POST` | `/api/customer/register` | public | Customer registration. |

### Sites (multi-tenant)
| Method | Path | Access | Description |
|---|---|---|---|
| `GET`/`POST` | `/api/sites` | super_admin | List / create stores. |
| `GET`/`PUT` | `/api/sites/[id]` | scoped | Read / update a store. |
| `GET`/`POST` | `/api/sites/[id]/products` | scoped | List / create products. |
| `GET`/`PUT`/`DELETE` | `/api/sites/[id]/products/[productId]` | scoped | Product CRUD. |
| `GET` | `/api/sites/[id]/orders` | scoped | Store orders (paginated). |
| `GET` | `/api/admin/site-admins/[siteId]` | super_admin | Manage site admins. |

### Catalog & Orders
| Method | Path | Access | Description |
|---|---|---|---|
| `GET`/`POST` | `/api/products` | super_admin | Cross-store products. |
| `GET`/`POST` | `/api/orders` | super_admin | Cross-store orders (paginated). |

### Payments (T-Bank)
| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/payment/init` | public* | Initiate payment → returns redirect URL. |
| `POST` | `/api/payment/webhook` | public | T-Bank async notification (token-verified). |
| `POST` | `/api/payment/status` | public | Poll payment status. |

### CRM
| Method | Path | Access | Description |
|---|---|---|---|
| `GET`/`POST` | `/api/crm/tickets` | scoped | List / create tickets. |
| `GET`/`PUT` | `/api/crm/tickets/[id]` | scoped | Read / reply to ticket. |
| `GET`/`POST` | `/api/crm/subscribers` | scoped | List / add subscribers. |

### Storefront (public)
| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/storefront/[slug]` | public | Full storefront payload (site + products). |
| `POST` | `/api/storefront/[slug]/subscribe` | public | Add newsletter subscriber. |
| `POST` | `/api/storefront/[slug]/order` | public | Place customer order. |

### Platform
| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/config` | auth | Platform + T-Bank config. |
| `GET` | `/api/stats` | super_admin | Aggregate analytics. |
| `POST` | `/api/solar-quote` | public | Save solar quote lead. |
| `GET` | `/api` | public | Health check → `"Hello, world!"`. |

> `*` Payment init is public so storefront checkouts work without a session, but it operates within a site scope.

Pagination pattern: `?page=&limit=` → server returns `items` + `total`/`page`/`limit`/`skip`.

---

## Authentication & RBAC

- **Tokens:** `jsonwebtoken` signed with `JWT_SECRET` (default dev fallback present — **set in production!**), 7-day expiry.
- **Passwords:** `bcryptjs` with cost `12`.
- **Roles:** `super_admin` (everything), `site_admin` (own site only), `customer` (own orders).
- **Enforcement:** `lib/rbac.ts` provides `enforceAccess()`, `requireAuth()`, and `checkSiteAccess()`. Site-scoped routes verify `user.siteId === siteId` for `site_admin`.
- **Client:** `getAuthUser(request)` parses `Bearer`/`token` prefixes from the `Authorization` header.

---

## Payments (T-Bank)

`lib/tbank.ts` implements Tinkoff Internet Acquiring:

- **Modes:** `demo` (mock redirect, no network), `sandbox` (`rest-api-test.tinkoff.ru/v2`), `live` (`securepay.tinkoff.ru/v2`).
- **Token:** SHA-256 over alphabetically-sorted params + password (per T-Bank spec). `generateToken()` for requests, `verifyNotificationToken()` for webhooks (uses `timingSafeEqual`).
- **Flow:** validate → create order → decrement stock → `Init` → return `PaymentURL`.
- **Webhook:** verifies token, maps T-Bank status (`AUTHORIZED/CONFIRMED/REJECTED/REFUNDED` → order status), **restores stock on failure**.
- **Config:** stored in `PlatformConfig` (`tbank_terminal_key`, `tbank_password`, `tbank_mode`) and overridable via env (`TBANK_TERMINAL_KEY`, `TBANK_PASSWORD`, `TBANK_MODE`).

---

## Storefront & Solar Quoting

- **Storefront:** public API + `/preview/store/[slug]` render. Components: `product-card`, `deal-card`, `cart-drawer`, `star-rating`, `trust-bar`, `loading-skeleton`, `storefront-preview-client`. Theming uses each site's `primaryColor`.
- **Solar calculator** (`solar-calculator.tsx`): inputs monthly consumption (kWh) + installation type (roof/fence/balcony), computes required 400W panels (130 kWh/panel/month × 0.97 inverter efficiency), inverter (3kW/5kW), battery, mounting, and installation cost (RUB constants), then `POST /api/solar-quote` to persist the lead.

---

## State Management

- **`app-store.ts`** — Zustand + `persist` (localStorage, SSR-safe noop fallback). Holds `isAuthenticated`, `token`, `user`, `currentView`, `selectedSiteId/Slug`. Includes a `migrate` for older persisted shapes (version 2).
- **`cart-store.ts`** — Zustand + `persist` for storefront cart contents.

---

## Getting Started

### Prerequisites
- **Bun** (recommended) or Node.js 22+
- Git

### Local Development

```bash
# 1. Clone
git clone https://github.com/RyzenAdvanced/Sunstore-Tengiz-AIStudio.git
cd Sunstore-Tengiz-AIStudio

# 2. Install
bun install
# or: npm install

# 3. Environment
cp .env.example .env        # fill JWT_SECRET, T-Bank vars (optional in demo mode)
# optional: GITHUB_DB_TOKEN etc. for Vercel-style sync (see Database section)

# 4. Push schema + seed demo data
bun run db:push
bun run db:seed

# 5. Run dev server (0.0.0.0:3000)
bun run dev
```

Open **http://localhost:3000** and log in with the demo credentials below.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ (local) | Prisma SQLite URL, e.g. `file:./db/development.db`. |
| `JWT_SECRET` | ✅ (prod) | Secret for signing JWTs. |
| `TBANK_TERMINAL_KEY` | ⬜ | T-Bank terminal key (default demo key if unset). |
| `TBANK_PASSWORD` | ⬜ | T-Bank password for token generation. |
| `TBANK_MODE` | ⬜ | `demo` / `sandbox` / `live` (default `demo`). |
| `GITHUB_DB_TOKEN` | ⬜ | PAT (repo scope) for Vercel DB sync. |
| `GITHUB_DB_OWNER` | ⬜ | DB repo owner (default `roman-ryzenadvanced`). |
| `GITHUB_DB_REPO` | ⬜ | DB repo name (default `sunstore-db`). |
| `GITHUB_DB_PATH` | ⬜ | DB file path in repo (default `sunstore.db`). |
| `GITHUB_DB_BRANCH` | ⬜ | DB repo branch (default `main`). |
| `NODE_ENV` | ⬜ | `production` for standalone builds. |
| `PORT` / `HOSTNAME` | ⬜ | Standalone server bind (default 3000 / 0.0.0.0). |

---

## Database & Persistence

- **Local dev:** Prisma reads/writes `db/development.db` on the persistent filesystem.
- **Vercel / serverless:** `lib/db.ts` implements a **pull-push SQLite sync** to a private GitHub repo (`sunstore-db`):
  - Cold start → download `sunstore.db` from GitHub into `/tmp`.
  - Every query → `ensureFresh()` (SHA-based freshness check, ~1.5s TTL).
  - After every write → `commitDb()` uploads the file back (with 409 conflict retry / last-write-wins).
  - Falls back to the **bundled `db/production.db`** if no token is set, so builds never break.
  - **Self-healing schema:** on first pull, runs `prisma db push` and raw `ALTER TABLE` fallbacks to add missing tables/columns.
- **Bundled data:** `db/production.db` ships seeded with the `admin` super-admin and a demo store **SunVolt Energy** (`demo-solar`) with sample solar products.

> ⚠️ Known limitation: concurrent writes within the same second can race (last-write-wins). Acceptable for low-traffic demo stores.

---

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Next dev server on `0.0.0.0:3000`. |
| `bun run build` | `prisma generate` + `next build` + assemble standalone (static + public copied). |
| `bun run start` | Run the standalone server (`NODE_ENV=production bun .next/standalone/server.js`). |
| `bun run lint` | ESLint. |
| `bun run db:push` / `db:generate` / `db:migrate` / `db:reset` | Prisma schema ops. |
| `bun run db:seed` | Seed super-admin + demo site (`npx tsx src/lib/seed.ts`). |
| `bun run electron-dev` | Run dev + Electron together. |
| `bun run dist:win` / `make:win` | Build Windows desktop installer (NSIS). |

---

## Deployment

### 1. Vercel (AI Studio / serverless)
- Project already deploys to `https://sunstore.vercel.app`.
- Set env vars: `JWT_SECRET`, `TBANK_MODE`, `TBANK_TERMINAL_KEY`, `TBANK_PASSWORD` (and optionally `GITHUB_DB_*`).
- `instrumentation.ts` copies the DB to `/tmp` on cold start; `lib/db.ts` syncs to GitHub.
- `vercel.json` adds security headers.

### 2. VPS (systemd + nginx)
Use the provided `deploy-vps.sh` (full guide in `DEPLOY-VPS.md`):

```bash
# One-liner (local terminal):
curl -fsSL https://raw.githubusercontent.com/roman-ryzenadvanced/sunstore/main/deploy-vps.sh \
  | GITHUB_TOKEN=$GITHUB_TOKEN bash -s

# Or over SSH:
GITHUB_TOKEN=$GITHUB_TOKEN ssh root@<VPS_IP> "bash -s" \
  < <(curl -fsSL https://raw.githubusercontent.com/roman-ryzenadvanced/sunstore/main/deploy-vps.sh)
```

The script: checks root → installs Bun → backs up `/app/sunstore` → clones → `bun install` → `bun run build` → assembles standalone → configures **nginx** (port 80 → 3000) → creates **systemd** service (`sunstore.service`) → starts + verifies.

After deploy:
- URL: `http://<VPS_IP>/`
- Logs: `journalctl -u sunstore -f`
- Restart: `systemctl restart sunstore`

### 3. Desktop (Electron)
```bash
bun install
bun run make:win     # outputs NSIS installer in dist_electron/
```
Wraps `.next/standalone` + `public` + `db` + `prisma` (configured in `package.json` `build` block, `main.js` entry).

---

## Demo Credentials

| Role | Username | Password |
|---|---|---|
| Super Admin | `admin` | `changeme123` |
| Demo Site Admin (SunVolt) | `demo` | `demo123` |

> 🔒 **Change these immediately in production.** The super-admin password is seeded by `src/lib/seed.ts`.

---

## Worklog & Provenance

`worklog.md` documents the v2 rebuild:
1. Studied v1 (Go + Postgres) and decided on a self-contained Next.js rebuild.
2. Designed the 11-model Prisma schema + seeded demo data.
3. Built 18 API route handlers (auth, sites, products, orders, payments, CRM, config, stats, storefront).
4. Built 14 dashboard components + 8-tab site detail + 4-step site wizard (20 templates).
5. Polished branding, security headers, env example.
6. Deployed to GitHub, Vercel (`sunstore.vercel.app`), and documented VPS.

---

## License

This repository is provided as-is for exploration and educational use. See repository settings for license details. The original AI Studio `README.md` (auto-generated run instructions) is preserved in the repo root.
