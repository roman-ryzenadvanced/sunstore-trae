'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        user: state.user,
      }),
    }
  )
)