/**
 * Lightweight admin auth for the Sunstore back office.
 * Cookie-based gate (demo-grade). Set ADMIN_PASSWORD in env to change the password.
 */
import { NextRequest } from 'next/server'

export const ADMIN_COOKIE = 'ss_admin'
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'sunstore'
const TOKEN = 'sunstore-admin-authenticated'

export function isAdminAuthenticated(request: NextRequest): boolean {
  return request.cookies.get(ADMIN_COOKIE)?.value === TOKEN
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  }
}

export const ADMIN_TOKEN_VALUE = TOKEN
