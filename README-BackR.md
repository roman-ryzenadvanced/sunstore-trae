<div align="center">

# ⚡ BACKR

### AI-native SEO platform — Technical audits, AI content generation, and rank tracking. Unlimited AI. Zero credits.

[![License: MIT-style / Private](https://img.shields.io/badge/license-private-orange)](https://github.com/RyzenAdvanced/BackR-)
[![Built with](https://img.shields.io/badge/built%20with-Vite%20%2B%20React%2019-646CFF)](https://vitejs.dev)
[![Powered by](https://img.shields.io/badge/powered%20by-Gemini%20Flash-4285F4)](https://ai.google.dev)

**Audit any URL. Get a scored SEO report in ~60 seconds. No signup, no credits.**

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Why BACKR](#why-backr)
- [Feature Set](#feature-set)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [How It Works (Architecture)](#how-it-works-architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

**BACKR** is a marketing landing page + functional SEO audit engine. It is built as a **Google AI Studio app** (`metadata.json` declares `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`), but it is a fully runnable Vite + React 19 + Express project that you can clone and run locally.

The app has two layers:

1. **Marketing site** (`/`) — a polished dark-mode landing page (Hero, Features, Comparison, Pricing, FAQ, CTA, Footer) with motion animations.
2. **SEO Audit API + Report view** (`/api/audit` + `/report`) — submit a URL, the server fetches the page, extracts on-page signals, and asks **Gemini** to produce a scored Markdown audit report.

> The free audit runs **without costly third-party crawl APIs** — it uses server-side fetching + cheerio parsing + Gemini analysis, which is why the product can offer "unlimited audits, unlimited AI content" at a free tier.

---

## Why BACKR

| | BACKR | Semrush | SurferSEO |
|---|---|---|---|
| Starting price | **Free** | $199/mo | $89/mo |
| AI content generation | **Unlimited, included** | Limited credits | Credit-based, expensive |
| Technical SEO audit | 10 checkers, free | Full suite | Basic only |
| Keyword research | Coming soon | Extensive | Limited |
| Rank tracking | Coming soon | Full | Not offered |

BACKR positions itself as the "audit + content + keywords" bundle that removes per-credit metering entirely.

---

## Feature Set

### Landing Page Sections
- **Navbar** — sticky, blurred, mobile hamburger menu, language toggle (EN), login CTA.
- **Hero** — animated headline, live URL audit form with depth selector (`fast / default / deep / full` = 20/50/100/200), trust badges.
- **Features** — 5 pillars: Technical SEO Audit, AI Content Engine, Keyword Research, Rank Tracking, Outbound Link Explorer.
- **Comparison** — BACKR vs Semrush vs SurferSEO table with check/cross icons.
- **Pricing** — 3 tiers: Free (€0), Pro (€49/mo), Agency (€99/mo). Pro is highlighted as "Popular".
- **FAQ** — 4 accordion questions (animated open/close).
- **CTA** — final conversion block.
- **Footer** — links + branding.

### SEO Audit Engine
- Accepts any URL (auto-prepends `https://` if missing).
- Server fetches the page with a browser User-Agent.
- Extracts: `<title>`, meta description, all `<h1>`/`<h2>`, all `<a>` links, word count, link count.
- Sends a structured prompt to **Gemini (`gemini-3.5-flash`)** requesting a Markdown report with:
  1. Overall Score (0–100) + summary
  2. On-Page SEO Analysis
  3. Content Analysis
  4. Top 3 Actionable Recommendations
  5. AI Content Strategy
- Returns metrics + raw Markdown report.
- **Report page** renders the Markdown (with `react-markdown`) and shows metric cards (Word Count, H1, H2, Total Links).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router DOM 7, Motion (`motion/react`), Tailwind CSS v4, lucide-react icons |
| Backend | Express 4 (SSR/dev middleware via Vite), Node 22 |
| AI | Google GenAI SDK (`@google/genai`), Gemini Flash |
| Scraping | cheerio (server-side HTML parsing) |
| Build | Vite 6, esbuild (server bundle), TypeScript 5 |
| Markdown | react-markdown (report rendering) |

---

## Project Structure

```
BackR-/
├── index.html              # Vite entry
├── server.ts               # Express server + /api/audit + Vite middleware
├── vite.config.ts          # Vite + React + Tailwind + @ alias
├── package.json
├── tsconfig.json
├── metadata.json           # AI Studio capability declaration
├── .env.example            # GEMINI_API_KEY, APP_URL
└── src/
    ├── main.tsx            # React root
    ├── App.tsx             # Router: "/" + "/report"
    ├── index.css           # Tailwind + design tokens
    ├── components/
    │   ├── Navbar.tsx
    │   ├── Hero.tsx        # Audit form lives here
    │   ├── Features.tsx
    │   ├── Comparison.tsx
    │   ├── Pricing.tsx
    │   ├── Faq.tsx
    │   ├── Cta.tsx
    │   ├── Footer.tsx
    │   └── (ui pieces inline)
    └── pages/
        └── ReportPage.tsx  # Renders audit result (metrics + Markdown)
```

---

## How It Works (Architecture)

```
Browser (React)
   │  POST /api/audit { url, depth }
   ▼
Express server (server.ts)
   │  1. fetch(targetUrl) with browser UA
   │  2. cheerio.load(html)
   │  3. extract title / meta / h1 / h2 / links / wordCount
   │  4. GoogleGenAI.models.generateContent(gemini-3.5-flash, prompt)
   ▼
JSON { url, metrics, report(markdown) }
   │
   ▼
React Router → navigate('/report', { state: { reportData } })
   │
   ▼
ReportPage renders metric cards + <ReactMarkdown>{report}</ReactMarkdown>
```

**Dev mode:** Vite runs in middleware mode inside Express (`appType: 'spa'`), so a single `tsx server.ts` serves both API and HMR frontend.

**Prod mode:** `vite build` + esbuild bundle `server.ts` → `dist/server.cjs`, which serves the static `dist/` SPA.

---

## Getting Started

### Prerequisites
- Node.js 22+ (or Bun)
- A Google Gemini API key

### Local Development

```bash
# 1. Clone
git clone https://github.com/RyzenAdvanced/BackR-.git
cd BackR-

# 2. Install dependencies
npm install
# or: bun install

# 3. Configure environment
cp .env.example .env
# edit .env and set:
#   GEMINI_API_KEY=your_key_here
#   APP_URL=http://localhost:3000

# 4. Run (starts Express + Vite HMR on :3000)
npm run dev
```

Open **http://localhost:3000** — enter a URL in the hero form and click **"Audit my site free"**.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Google Gemini API key used for audit analysis. |
| `APP_URL` | ⬜ | Public URL of the app (used for self-links / OAuth in AI Studio). |
| `NODE_ENV` | ⬜ | Set to `production` to serve the built SPA instead of Vite middleware. |
| `PORT` | ⬜ | Server port (default `3000` in `server.ts`). |

> In **Google AI Studio**, `GEMINI_API_KEY` and `APP_URL` are injected automatically from the Secrets panel at runtime — no `.env` needed there.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run `tsx server.ts` — Express + Vite HMR dev server on port 3000. |
| `npm run build` | `vite build` (frontend) + esbuild bundle server to `dist/server.cjs`. |
| `npm run start` | Run the production server (`node dist/server.cjs`). |
| `npm run preview` | Vite preview of the built frontend. |
| `npm run clean` | Remove `dist/` and `server.js`. |
| `npm run lint` | Type-check with `tsc --noEmit`. |

---

## API Reference

### `POST /api/audit`

Runs a server-side SEO audit on a given URL.

**Request body**
```json
{
  "url": "example.com",
  "depth": "50"
}
```
- `url` (string, required): target URL. `http(s)://` is auto-prepended.
- `depth` (string, optional): `20` (fast) / `50` (default) / `100` (deep) / `200` (full). Currently influences the prompt, not crawl depth.

**Success response** `200`
```json
{
  "url": "https://example.com",
  "metrics": {
    "title": "Example Domain",
    "metaDescription": "",
    "h1Count": 1,
    "h2Count": 0,
    "wordCount": 24,
    "linkCount": 1
  },
  "report": "## Overall Score: 72/100\n..."
}
```

**Error responses**
- `400` — `{ "error": "URL is required" }` or fetch failure.
- `500` — internal audit error.

---

## Deployment

### As a Google AI Studio app
The repo is already structured as an AI Studio applet (`metadata.json` + `.env.example`). Push to the connected repo and deploy via the AI Studio UI; secrets are injected automatically.

### As a standalone Node service
```bash
npm install
npm run build
export GEMINI_API_KEY=your_key
export NODE_ENV=production
npm run start
# serves on :3000
```

Reverse-proxy behind nginx/Caddy as needed (the app binds `0.0.0.0:3000`).

---

## Roadmap

Per the FAQ and Comparison copy, the following are **explicitly planned** (currently "Coming soon"):
- Keyword Research + clustering (no per-query pricing)
- Rank Tracking (500 keywords on Pro, unlimited on Agency)
- White-label reports & API access (Agency tier)
- Backlink analysis via Google Search Console (legitimate, free)

---

## License

This repository is provided as-is for exploration and educational use. See repository settings for license details. The original AI Studio `README.md` (auto-generated run instructions) is preserved separately in the repo root.
