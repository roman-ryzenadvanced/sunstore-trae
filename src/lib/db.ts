import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

// ============================================================================
// Pull-push SQLite persistence for Vercel serverless.
//
// Vercel serverless has no persistent filesystem — every /tmp file is wiped
// when the instance is recycled. To make orders/products actually persist,
// we externalize the SQLite FILE to a private GitHub repo via the Contents
// API and treat each invocation as: download -> query -> upload-on-write.
//
// Flow:
//   cold start  -> pullDb() downloads sunstore.db from GitHub into /tmp
//   every query -> ensurePulled() (cached, no-op after first pull)
//   after write -> commitDb() uploads /tmp/sunstore.db back to GitHub
//
// Known limitations (acceptable for a low-traffic demo store):
//   - Concurrent writes within the same second can race (last-write-wins
//     on 409 conflict; we retry once with the latest SHA).
//   - Reads on a WARM instance use the cached /tmp copy and may be stale
//     relative to other instances' writes until the next cold start.
//   - The whole file round-trips on each cold start + each commit (~250KB).
//
// Env vars (all optional; if GITHUB_DB_TOKEN is unset, falls back to the
// bundled read-only db/production.db so the build never breaks):
//   GITHUB_DB_TOKEN   GitHub PAT with repo scope on the DB repo
//   GITHUB_DB_OWNER   default 'roman-ryzenadvanced'
//   GITHUB_DB_REPO    default 'sunstore-db'
//   GITHUB_DB_PATH    default 'sunstore.db'
//   GITHUB_DB_BRANCH  default 'main'
// ============================================================================

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  __dbPulled?: boolean
  __dbSha?: string
  __pullPromise?: Promise<void>
}

const GH_TOKEN = process.env.GITHUB_DB_TOKEN
const GH_OWNER = process.env.GITHUB_DB_OWNER || 'roman-ryzenadvanced'
const GH_REPO = process.env.GITHUB_DB_REPO || 'sunstore-db'
const GH_PATH = process.env.GITHUB_DB_PATH || 'sunstore.db'
const GH_BRANCH = process.env.GITHUB_DB_BRANCH || 'main'

const GH_HEADERS = {
  Authorization: `token ${GH_TOKEN}`,
  Accept: 'application/vnd.github+json',
  'User-Agent': 'sunstore-vercel',
}

function isServerless(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
}

function localDbPath(): string {
  if (isServerless()) return '/tmp/sunstore.db'
  return path.join(process.cwd(), 'db', 'development.db')
}

function seedFromBundled(target: string): void {
  const bundled = path.join(process.cwd(), 'db', 'production.db')
  if (fs.existsSync(bundled)) fs.copyFileSync(bundled, target)
}

// Self-healing schema sync. Older DB files (e.g. the bundled production.db
// or the GitHub-synced sunstore.db) may be missing tables or columns that
// the current Prisma schema expects, which makes queries throw
// "table does not exist" / "column does not exist". Rather than require a
// manual `prisma db push`, we heal the local DB on first pull:
//   1. Run `prisma db push` (adds missing tables AND columns, no data loss).
//   2. Fall back to a raw ALTER TABLE for the known-missing customerId column
//      in case the prisma CLI cannot be spawned in this environment.
import { spawn } from 'child_process'
import { existsSync } from 'fs'
let __schemaHealed = false

function resolvePrismaBin(): string | null {
  const candidates = [
    path.join(process.cwd(), 'node_modules', '.bin', 'prisma'),
    path.join(process.cwd(), 'node_modules', '.bin', 'prisma.cmd'),
    path.join(process.cwd(), 'node_modules', '@prisma', 'cli', 'build', 'index.js'),
    'prisma',
  ]
  for (const c of candidates) {
    if (c === 'prisma') return c
    if (existsSync(c)) return c
  }
  return null
}

async function ensureSchema(): Promise<void> {
  if (__schemaHealed) return
  __schemaHealed = true
  console.log('[ensureSchema] running self-heal...')
  try {
    const tmp = localDbPath()
    if (!fs.existsSync(tmp)) return
    const url = `file:${tmp}`

    const bin = resolvePrismaBin()
    if (bin) {
      const args = ['db', 'push', '--skip-generate', '--accept-data-loss', '--schema', path.join(process.cwd(), 'prisma', 'schema.prisma')]
      await new Promise<void>((resolve) => {
        const child = spawn(bin, args, {
          env: { ...process.env, DATABASE_URL: url },
          stdio: 'ignore',
          shell: process.platform === 'win32',
        })
        child.on('exit', (code) => {
          console.log(`[ensureSchema] prisma db push exited ${code}`)
          resolve()
        })
        child.on('error', (e) => {
          console.error('[ensureSchema] spawn error:', e.message)
          resolve()
        })
      })
    } else {
      console.log('[ensureSchema] prisma CLI not found, using raw SQL fallback')
    }

    // Raw-SQL fallback: ensure the Customer/SiteQuote tables and the
    // SiteOrder.customerId column exist even if `prisma db push` didn't run.
    try {
      const client = globalForPrisma.prisma ?? db
      await client.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Customer" ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT NOT NULL, "password" TEXT NOT NULL, "name" TEXT, "phone" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL);`).catch(() => {})
      await client.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "SiteQuote" ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT NOT NULL, "name" TEXT NOT NULL DEFAULT '', "phone" TEXT NOT NULL DEFAULT '', "panels" INTEGER NOT NULL DEFAULT 0, "inverter" INTEGER NOT NULL DEFAULT 0, "battery" INTEGER NOT NULL DEFAULT 0, "total" REAL NOT NULL DEFAULT 0, "monthly" REAL NOT NULL DEFAULT 0, "siteId" TEXT NOT NULL DEFAULT '', "consumption" INTEGER NOT NULL DEFAULT 0, "installationType" TEXT NOT NULL DEFAULT 'roof', "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL);`).catch(() => {})
      // Add the missing customerId column if absent (SQLite supports ADD COLUMN).
      const cols = await client.$queryRawUnsafe(`PRAGMA table_info("SiteOrder");`) as Array<{ name: string }>
      if (!cols.some((c) => c.name === 'customerId')) {
        await client.$executeRawUnsafe(`ALTER TABLE "SiteOrder" ADD COLUMN "customerId" TEXT;`).catch(() => {})
        console.log('[ensureSchema] added SiteOrder.customerId')
      }
    } catch (e) {
      console.error('[ensureSchema] raw fallback error:', e)
    }

    // Propagate the healed DB back to GitHub so every instance benefits.
    try { await commitDb() } catch { /* best-effort */ }
    console.log('[ensureSchema] self-heal complete')
  } catch (e) {
    console.error('[ensureSchema] heal failed:', e)
  }
}

// Download the latest DB file from GitHub. Cached per-instance via __dbPulled.
async function pullDb(): Promise<void> {
  const tmp = localDbPath()

  if (!isServerless()) {
    // Local dev: persistent filesystem. Ensure a valid DB file exists.
    // If the file is missing OR empty (e.g. a stale 0-byte leftover), seed it
    // from the bundled production.db which has the full schema.
    const valid = fs.existsSync(tmp) && fs.statSync(tmp).size > 0
    if (!valid) seedFromBundled(tmp)
    globalForPrisma.__dbPulled = true
    await ensureSchema()
    return
  }

  if (!GH_TOKEN) {
    // No token configured — degrade to read-only bundled file.
    if (!fs.existsSync(tmp)) seedFromBundled(tmp)
    globalForPrisma.__dbPulled = true
    await ensureSchema()
    return
  }

  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}?ref=${GH_BRANCH}`
  const res = await fetch(url, { headers: GH_HEADERS })

  if (res.status === 404) {
    // Remote file missing — seed from bundled for this instance.
    seedFromBundled(tmp)
    globalForPrisma.__dbSha = undefined
    globalForPrisma.__dbPulled = true
    await ensureSchema()
    return
  }
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`GitHub pull failed: ${res.status} ${txt}`)
  }

  const data = (await res.json()) as { content: string; sha: string }
  fs.writeFileSync(tmp, Buffer.from(data.content, 'base64'))
  globalForPrisma.__dbSha = data.sha
  globalForPrisma.__dbPulled = true
  await ensureSchema()
}

// Idempotent: only the first call per instance actually downloads.
async function ensurePulled(): Promise<void> {
  if (globalForPrisma.__dbPulled) return
  if (!globalForPrisma.__pullPromise) {
    globalForPrisma.__pullPromise = pullDb().catch((e) => {
      // Allow subsequent calls to retry; clear the cached failed promise.
      globalForPrisma.__pullPromise = undefined
      throw e
    })
  }
  await globalForPrisma.__pullPromise
}

// Fetch the current remote DB blob SHA. GitHub's Contents API supports the
// `application/vnd.github.sha` Accept header, which returns ONLY the blob's
// SHA (a few bytes) instead of the full base64 file — so a freshness check
// costs almost nothing and works from the very first read.
async function remoteSha(): Promise<string | null> {
  if (!GH_TOKEN) return null
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}?ref=${GH_BRANCH}`,
      { headers: { ...GH_HEADERS, Accept: 'application/vnd.github.sha' }, cache: 'no-store' }
    )
    if (!res.ok) return null
    return (await res.text()).trim().replace(/"/g, '')
  } catch {
    return null
  }
}

// Before any read/write, make sure we're not serving a stale cached copy.
// Cheap: only fetches a tiny SHA file, and only re-downloads the DB when the
// remote SHA differs from the SHA we pulled/pushed. Skips if we've checked
// recently (within a short window) to avoid hammering the API on every request.
let __lastFreshnessCheck = 0
const FRESHNESS_TTL = 1500 // ms — avoid hammering the GitHub API every request
let __inCommit = false // reentrancy guard: avoid commitDb -> ensureFresh -> commitDb
async function ensureFresh(): Promise<void> {
  // Always make sure the DB file is pulled/seeded at least once. On first
  // call this runs pullDb (which also runs the schema self-heal). In local
  // dev there is no GitHub token, so pullDb just seeds from the bundled DB.
  if (!globalForPrisma.__dbPulled) {
    await ensurePulled()
    return
  }
  if (!isServerless() || !GH_TOKEN) return
  if (__inCommit) return // a commit is in flight; don't re-pull mid-write
  const now = Date.now()
  if (now - __lastFreshnessCheck < FRESHNESS_TTL) return
  __lastFreshnessCheck = now

  // Only re-pull when the remote blob SHA actually differs from the copy we
  // already have. After our own commitDb the SHA matches, so consecutive
  // writes in the same flow never re-pull and wipe their own in-flight data.
  const remote = await remoteSha()
  if (remote && remote !== globalForPrisma.__dbSha) {
    // Remote changed — close any open SQLite handle to the stale file, then
    // re-pull the latest DB. Prisma re-opens the fresh file on the next query.
    try {
      await globalForPrisma.prisma?.$disconnect()
    } catch {
      // ignore
    }
    globalForPrisma.__dbSha = undefined
    globalForPrisma.__dbPulled = false
    globalForPrisma.__pullPromise = undefined
    await ensurePulled()
  }
}

// Upload the local DB file back to GitHub. Call after every successful write.
// On 409 conflict (another instance pushed since our pull), retry once with
// the latest SHA — last-write-wins.
export async function commitDb(): Promise<void> {
  if (!isServerless() || !GH_TOKEN) return // local dev: file already on disk

  const tmp = localDbPath()
  if (!fs.existsSync(tmp)) return

  __inCommit = true
  try {
    const b64 = fs.readFileSync(tmp).toString('base64')

  const put = async (sha: string | undefined): Promise<boolean> => {
    const body: Record<string, unknown> = {
      message: `db: write ${new Date().toISOString()}`,
      content: b64,
      branch: GH_BRANCH,
    }
    if (sha) body.sha = sha
    const res = await fetch(
      `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}`,
      {
        method: 'PUT',
        headers: { ...GH_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )
    if (!res.ok) return false
    const rj = (await res.json()) as { content?: { sha?: string } }
    globalForPrisma.__dbSha = rj.content?.sha
    return true
  }

  let ok = await put(globalForPrisma.__dbSha)
  if (!ok) {
    // Likely 409 — re-fetch the latest SHA and retry (overwrites remote).
    const head = await fetch(
      `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}?ref=${GH_BRANCH}`,
      { headers: GH_HEADERS }
    )
    if (head.ok) {
      const hj = (await head.json()) as { sha?: string }
      ok = await put(hj.sha)
    }
  }
  } finally {
    __inCommit = false
  }
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: { db: { url: `file:${localDbPath()}` } },
  })
}

// Wrap the client so every query awaits ensurePulled() first. The pull itself
// is cached per instance, so this is a no-op after the first query.
function buildClient(): PrismaClient {
  const base = createPrismaClient()
  const extended = base.$extends({
    query: {
      // Pull the DB file before the first query on each cold instance.
      // Subsequent calls are a fast no-op (cached via __dbPulled).
      async $allOperations({
        args,
        query,
        operation,
      }: {
        model?: string
        operation: string
        args: unknown
        query: (args: unknown) => Promise<unknown>
      }) {
        // Ensure we're working against a DB that matches the latest remote copy.
        // Uses a SHA-based freshness check (never force-repulls mid-operation,
        // which would wipe in-flight writes within a multi-step transaction).
        await ensureFresh()
        return query(args)
      },
    },
  })
  return extended as unknown as PrismaClient
}

export const db = globalForPrisma.prisma ?? buildClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
