import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/adminAuth'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

function getUploadDir(): string {
  return path.join(process.cwd(), 'public', 'uploads')
}

/** GET /api/admin/upload/list — list all uploaded files */
export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
  }

  try {
    const uploadDir = getUploadDir()

    if (!fs.existsSync(uploadDir)) {
      return NextResponse.json({ files: [] })
    }

    const entries = fs.readdirSync(uploadDir)
    const files = entries
      .filter((name) => {
        // Skip hidden files and .gitkeep
        if (name.startsWith('.')) return false
        const fullPath = path.join(uploadDir, name)
        try {
          return fs.statSync(fullPath).isFile()
        } catch {
          return false
        }
      })
      .map((name) => {
        const filePath = path.join(uploadDir, name)
        const stat = fs.statSync(filePath)
        return {
          name,
          url: `/uploads/${name}`,
          size: stat.size,
          createdAt: stat.birthtime.toISOString(),
        }
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ files })
  } catch (err) {
    console.error('List upload error:', err)
    return NextResponse.json({ error: 'Ошибка при получении списка файлов' }, { status: 500 })
  }
}
