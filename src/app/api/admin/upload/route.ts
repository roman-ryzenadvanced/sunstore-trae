import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/adminAuth'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

function getUploadDir(): string {
  return path.join(process.cwd(), 'public', 'uploads')
}

function generateFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase().replace('.', '')
  const safeExt = ALLOWED_EXT.includes(ext) ? ext : 'png'
  const ts = Date.now()
  const rand = Math.random().toString(36).slice(2, 10)
  return `${ts}-${rand}.${safeExt}`
}

/** POST /api/admin/upload — upload a product image */
export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Неподдерживаемый формат. Разрешены: jpg, png, webp, gif, svg' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Файл слишком большой. Максимум 5 МБ' }, { status: 413 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const filename = generateFilename(file.name)
    const uploadDir = getUploadDir()

    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const filePath = path.join(uploadDir, filename)
    fs.writeFileSync(filePath, buffer)

    return NextResponse.json({
      ok: true,
      url: `/uploads/${filename}`,
      filename,
    })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Ошибка при загрузке файла' }, { status: 500 })
  }
}
