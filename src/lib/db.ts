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

// Download the latest DB file from GitHub. Cached per-instance via __dbPulled.
async function pullDb(): Promise<void> {
  const tmp = localDbPath()

  if (!isServerless()) {
    // Local dev: persistent filesystem, just ensure a file exists.
    if (!fs.existsSync(tmp)) seedFromBundled(tmp)
    globalForPrisma.__dbPulled = true
    return
  }

  if (!GH_TOKEN) {
    // No token configured — degrade to read-only bundled file.
    if (!fs.existsSync(tmp)) seedFromBundled(tmp)
    globalForPrisma.__dbPulled = true
    return
  }

  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}?ref=${GH_BRANCH}`
  const res = await fetch(url, { headers: GH_HEADERS })

  if (res.status === 404) {
    // Remote file missing — seed from bundled for this instance.
    seedFromBundled(tmp)
    globalForPrisma.__dbSha = undefined
    globalForPrisma.__dbPulled = true
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

// Upload the local DB file back to GitHub. Call after every successful write.
// On 409 conflict (another instance pushed since our pull), retry once with
// the latest SHA — last-write-wins.
export async function commitDb(): Promise<void> {
  if (!isServerless() || !GH_TOKEN) return // local dev: file already on disk

  const tmp = localDbPath()
  if (!fs.existsSync(tmp)) return

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

  const ok = await put(globalForPrisma.__dbSha)
  if (ok) return

  // Likely 409 — re-fetch the latest SHA and retry (overwrites remote).
  const head = await fetch(
    `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}?ref=${GH_BRANCH}`,
    { headers: GH_HEADERS }
  )
  if (head.ok) {
    const hj = (await head.json()) as { sha?: string }
    await put(hj.sha)
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
      }: {
        model?: string
        operation: string
        args: unknown
        query: (args: unknown) => Promise<unknown>
      }) {
        await ensurePulled()
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
