import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'sunstore-super-secret-key-2024'

export interface JwtPayload {
  sub: string
  role: 'super_admin' | 'site_admin' | 'customer'
  siteId?: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

export function getAuthUser(request: Request): JwtPayload | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null

  let token = authHeader.trim()

  // Strip common prefixes
  if (token.startsWith('Bearer ') || token.startsWith('bearer ')) {
    token = token.slice(7).trim()
  } else if (token.startsWith('token ') || token.startsWith('Token ')) {
    token = token.slice(6).trim()
  }

  // If after stripping prefix it's empty, try the raw header as token
  if (!token) {
    token = authHeader.trim()
  }

  if (!token) return null
  return verifyToken(token)
}
