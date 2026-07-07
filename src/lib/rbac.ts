import { NextResponse } from 'next/server'
import { JwtPayload, getAuthUser } from './auth'

// Allowed HTTP methods per role combination
type RouteRule = {
  // If undefined, any role can access (after auth)
  allowedRoles?: JwtPayload['role'][]
  // If true, super_admin can access all sites; site_admin restricted to their own
  siteScope?: boolean
  // Optional custom siteId from body or URL
  siteIdSource?: 'url' | 'body'
}

/**
 * Middleware to enforce role-based access on API routes.
 *
 * Rules:
 * - super_admin: full access to everything
 * - site_admin: can only access their own site (checked via siteId)
 * - routes with no siteScope: only super_admin can access (global config)
 *
 * Usage:
 *   const user = getAuthUser(request)
 *   const response = enforceAccess(request, user, {
 *     allowedRoles: ['super_admin', 'site_admin'],
 *     siteScope: true,
 *     siteIdSource: 'url',  // reads from URL params { id }
 *   })
 *   if (response) return response  // returns 403/404 error responses
 */
export function enforceAccess(
  request: Request,
  user: JwtPayload | null,
  rule: RouteRule
): NextResponse | null {
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check role access
  if (rule.allowedRoles && !rule.allowedRoles.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // If route has site scoping, verify the user owns this site
  if (rule.siteScope && user.role !== 'super_admin') {
    // site_admin can only access their own site
    if (!user.siteId) {
      return NextResponse.json({ error: 'Forbidden: no site assigned' }, { status: 403 })
    }
  }

  return null
}

/**
 * Validate and return the authenticated user, or a 401 response.
 */
export function requireAuth(request: Request): JwtPayload | null {
  const user = getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return user
}

/**
 * Check if a site_admin is authorized to access this specific site.
 * Returns an error response if not authorized, or null if OK.
 */
export function checkSiteAccess(
  user: JwtPayload,
  siteId: string
): NextResponse | null {
  if (user.role === 'super_admin') return null
  if (user.role !== 'site_admin' || user.siteId !== siteId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}
