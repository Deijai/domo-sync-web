import { api } from "./client"
import { toQueryString } from "./query"
import type { PaginatedResult, Professional, SimpleStatus } from "@/types/api"

export interface ProfessionalsQuery {
  page?: number
  pageSize?: number
  search?: string
  status?: string
}

export interface ProfessionalPayload {
  fullName: string
  cpf: string
  councilType?: string
  councilNumber?: string
  councilState?: string
  phone?: string
  email?: string
  status?: SimpleStatus
}

export const professionalsApi = {
  list: (query: ProfessionalsQuery = {}) =>
    api.get<PaginatedResult<Professional>>(`/professionals${toQueryString(query)}`),
  get: (id: string) => api.get<Professional>(`/professionals/${id}`),
  create: (payload: ProfessionalPayload) => api.post<Professional>("/professionals", payload),
  update: (id: string, payload: Partial<ProfessionalPayload>) =>
    api.patch<Professional>(`/professionals/${id}`, payload),
  remove: (id: string) => api.delete<{ message: string }>(`/professionals/${id}`),
  setSpecialties: (id: string, specialtyIds: string[]) =>
    api.patch<Professional>(`/professionals/${id}/specialties`, { specialtyIds }),
}
