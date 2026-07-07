"use client"

import { useAuthStore } from "@/stores/auth.store"

export function useHasPermission(permission: string): boolean {
  return useAuthStore((state) => state.permissions.includes(permission))
}

export function useHasAnyPermission(permissions: string[]): boolean {
  return useAuthStore((state) => permissions.some((permission) => state.permissions.includes(permission)))
}
