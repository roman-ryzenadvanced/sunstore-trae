'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// SSR-safe storage: during server render localStorage doesn't exist,
// so fall back to an in-memory noop store to avoid "localStorage is not defined".
const safeStorage = createJSONStorage(() => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    }
  }
  return window.localStorage
})

interface AppState {
  // Auth
  isAuthenticated: boolean
  token: string | null
  user: { username: string; name: string } | null
  // Navigation
  currentView: string
  selectedSiteId: string | null
  selectedSiteSlug: string | null
  // Actions
  login: (token: string, username: string, name: string) => void
  logout: () => void
  navigate: (view: string, siteId?: string, slug?: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth defaults
      isAuthenticated: false,
      token: null,
      user: null,
      // Navigation defaults
      currentView: 'login',
      selectedSiteId: null,
      selectedSiteSlug: null,
      // Actions
      login: (token, username, name) =>
        set({
          isAuthenticated: true,
          token,
          user: { username, name },
          currentView: 'dashboard',
        }),
      logout: () =>
        set({
          isAuthenticated: false,
          token: null,
          user: null,
          currentView: 'login',
          selectedSiteId: null,
          selectedSiteSlug: null,
        }),
      navigate: (view, siteId, slug) =>
        set({
          currentView: view,
          ...(siteId !== undefined ? { selectedSiteId: siteId } : {}),
          ...(slug !== undefined ? { selectedSiteSlug: slug } : {}),
        }),
    }),
    {
      name: 'sunstore-auth',
      storage: safeStorage,
      // Bump version when the persisted shape changes so old localStorage
      // blobs from previous app versions are migrated/normalized instead of
      // crashing the UI (e.g. older builds stored `user` as a plain string).
      version: 2,
      migrate: (persisted: any, version: number) => {
        if (!persisted) return persisted
        const next = { ...persisted }
        // Normalize `user` into the expected { username, name } object.
        if (typeof next.user === 'string') {
          next.user = { username: next.user, name: next.user }
        } else if (next.user && typeof next.user !== 'object') {
          next.user = null
        }
        return next
      },
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        user: state.user,
      }),
    }
  )
)