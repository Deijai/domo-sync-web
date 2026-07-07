"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, AuthTokens } from "@/types/api"

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  permissions: string[]
  setAuth: (tokens: AuthTokens, user: User, permissions: string[]) => void
  setUser: (user: User) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      permissions: [],
      setAuth: (tokens, user, permissions) =>
        set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user, permissions }),
      setUser: (user) => set({ user }),
      clear: () => set({ user: null, accessToken: null, refreshToken: null, permissions: [] }),
    }),
    { name: "auth-storage" },
  ),
)
