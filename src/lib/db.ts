import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getDbPath(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpPath = '/tmp/sunstore.db'
    const bundledPath = path.join(process.cwd(), 'db', 'production.db')
    
    // Copy bundled database to /tmp if it doesn't exist
    if (!fs.existsSync(tmpPath) && fs.existsSync(bundledPath)) {
      try {
        fs.copyFileSync(bundledPath, tmpPath)
      } catch {
        // If copy fails, try with the public path
        const publicPath = path.join(process.cwd(), 'public', 'production.db')
        if (fs.existsSync(publicPath)) {
          fs.copyFileSync(publicPath, tmpPath)
        }
      }
    }
    return tmpPath
  }
  return undefined // Use default DATABASE_URL
}

function createPrismaClient() {
  const dbPath = getDbPath()
  if (dbPath) {
    return new PrismaClient({
      datasources: { db: { url: `file:${dbPath}` } }
    })
  }
  return new PrismaClient()
}

export const db =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db