"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CentralSite } from "@/lib/multi-site/api";

interface CentralAuthState {
  token: string | null;
  username: string | null;
  hydrate: () => void;
  setSession: (token: string, username: string) => void;
  clear: () => void;
}

export const useCentralAuthStore = create<CentralAuthState>()(
  persist(
    (set) => ({
      token: null,
      username: null,
      hydrate: () => {},
      setSession: (token, username) => set({ token, username }),
      clear: () => set({ token: null, username: null }),
    }),
    { name: "sunstore-central-auth" }
  )
);

interface SiteSessionState {
  bySite: Record<string, { token: string; username: string }>;
  setSession: (slug: string, token: string, username: string) => void;
  clear: (slug: string) => void;
  get: (slug: string) => { token: string; username: string } | undefined;
}

export const useSiteSessionStore = create<SiteSessionState>()(
  persist(
    (set, get) => ({
      bySite: {},
      setSession: (slug, token, username) =>
        set((s) => ({ bySite: { ...s.bySite, [slug]: { token, username } } })),
      clear: (slug) =>
        set((s) => {
          const { [slug]: _omit, ...rest } = s.bySite;
          return { bySite: rest };
        }),
      get: (slug) => get().bySite[slug],
    }),
    { name: "sunstore-site-sessions" }
  )
);
