import { api } from "./client"
import { toQueryString } from "./query"
import type { PaginatedResult, Role } from "@/types/api"

export interface RolesQuery {
  page?: number
  pageSize?: number
  search?: string
}

export interface RolePayload {
  name: string
  description?: string
}

export const rolesApi = {
  list: (query: RolesQuery = {}) => api.get<PaginatedResult<Role>>(`/roles${toQueryString(query)}`),
  get: (id: string) => api.get<Role>(`/roles/${id}`),
  create: (payload: RolePayload) => api.post<Role>("/roles", payload),
  update: (id: string, payload: Partial<RolePayload>) => api.patch<Role>(`/roles/${id}`, payload),
  remove: (id: string) => api.delete<{ message: string }>(`/roles/${id}`),
  setPermissions: (id: string, permissionIds: string[]) =>
    api.patch<Role>(`/roles/${id}/permissions`, { permissionIds }),
}
