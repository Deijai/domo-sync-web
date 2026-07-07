import { api } from "./client"
import { toQueryString } from "./query"
import type { HealthUnit, PaginatedResult, SimpleStatus } from "@/types/api"

export interface HealthUnitsQuery {
  page?: number
  pageSize?: number
  search?: string
  status?: string
}

export interface HealthUnitPayload {
  name: string
  code: string
  phone?: string
  zipCode?: string
  state?: string
  city?: string
  neighborhood?: string
  street?: string
  number?: string
  complement?: string
  status?: SimpleStatus
  cnpj?: string
  logoUrl?: string
  institutionName?: string
  stateName?: string
  isDefault?: boolean
}

export const healthUnitsApi = {
  list: (query: HealthUnitsQuery = {}) =>
    api.get<PaginatedResult<HealthUnit>>(`/health-units${toQueryString(query)}`),
  get: (id: string) => api.get<HealthUnit>(`/health-units/${id}`),
  create: (payload: HealthUnitPayload) => api.post<HealthUnit>("/health-units", payload),
  update: (id: string, payload: Partial<HealthUnitPayload>) =>
    api.patch<HealthUnit>(`/health-units/${id}`, payload),
  remove: (id: string) => api.delete<{ message: string }>(`/health-units/${id}`),
}
