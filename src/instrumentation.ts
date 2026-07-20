// Next.js instrumentation - runs on cold start
import * as fs from 'fs'
import * as path from 'path'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // In Vercel serverless, copy bundled db to /tmp
    if (process.env.VERCEL) {
      const tmpPath = '/tmp/sunstore.db'
      if (!fs.existsSync(tmpPath)) {
        // Search for the bundled database
        const searchPaths = [
          path.join(process.cwd(), 'db', 'production.db'),
          path.join(process.cwd(), 'frontend', 'db', 'production.db'),
          path.join('/var/task', 'db', 'production.db'),
          path.join('/var/task', 'frontend', 'db', 'production.db'),
        ]
        
        for (const srcPath of searchPaths) {
          if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, tmpPath)
            console.log(`✅ Copied database to ${tmpPath} from ${srcPath}`)
            break
          }
        }
      }
    }
  }
}