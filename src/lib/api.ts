'use client'

import { useAppStore } from '@/store/app-store'

// Shared fetch wrapper for authenticated API calls. Reads the JWT from the
// Zustand auth store and injects it as a Bearer token so dashboard requests
// are never sent unauthenticated (which would return 401 and show empty data).
export async function apiFetch(
  input: string,
  init: RequestInit = {}
): Promise<Response> {
  const token = useAppStore.getState().token
  const headers = new Headers(init.headers)
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }
  return fetch(input, { ...init, headers })
}
