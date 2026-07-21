import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/adminAuth'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

function getUploadDir(): string {
  return path.join(process.cwd(), 'public', 'uploads')
}

/** DELETE /api/admin/upload/delete?file=<filename> */
export async function DELETE(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
  }

  const filename = request.nextUrl.searchParams.get('file')

  if (!filename) {
    return NextResponse.json({ error: 'Укажите имя файла (параметр file)' }, { status: 400 })
  }

  // Path traversal guard
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return NextResponse.json({ error: 'Недопустимое имя файла' }, { status: 400 })
  }

  try {
    const filePath = path.join(getUploadDir(), filename)

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 404 })
    }

    fs.unlinkSync(filePath)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Delete upload error:', err)
    return NextResponse.json({ error: 'Ошибка при удалении файла' }, { status: 500 })
  }
}
