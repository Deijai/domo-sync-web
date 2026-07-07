"use client"

import { useHasPermission } from "@/hooks/use-permission"

interface PermissionGateProps {
  permission: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const allowed = useHasPermission(permission)
  return <>{allowed ? children : fallback}</>
}
