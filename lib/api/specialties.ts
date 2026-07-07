import { api } from "./client"
import { toQueryString } from "./query"
import type { PaginatedResult, SimpleStatus, Specialty } from "@/types/api"

export interface SpecialtiesQuery {
  page?: number
  pageSize?: number
  search?: string
  status?: string
}

export interface SpecialtyPayload {
  code: string
  name: string
  description?: string
  status?: SimpleStatus
}

export const specialtiesApi = {
  list: (query: SpecialtiesQuery = {}) =>
    api.get<PaginatedResult<Specialty>>(`/specialties${toQueryString(query)}`),
  get: (id: string) => api.get<Specialty>(`/specialties/${id}`),
  create: (payload: SpecialtyPayload) => api.post<Specialty>("/specialties", payload),
  update: (id: string, payload: Partial<SpecialtyPayload>) => api.patch<Specialty>(`/specialties/${id}`, payload),
  remove: (id: string) => api.delete<{ message: string }>(`/specialties/${id}`),
}
