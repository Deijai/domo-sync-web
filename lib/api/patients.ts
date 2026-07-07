import { api } from "./client"
import { toQueryString } from "./query"
import type { AccountStatus, Gender, PaginatedResult, Patient } from "@/types/api"

export interface PatientsQuery {
  page?: number
  pageSize?: number
  search?: string
  status?: string
}

export interface PatientPayload {
  fullName: string
  cpf: string
  rg?: string
  birthDate: string
  gender?: Gender
  motherName?: string
  fatherName?: string
  susCard?: string
  phone?: string
  whatsapp?: string
  email?: string
  password?: string
  zipCode?: string
  state?: string
  city?: string
  neighborhood?: string
  street?: string
  number?: string
  complement?: string
  referencePoint?: string
  status?: AccountStatus
}

export const patientsApi = {
  list: (query: PatientsQuery = {}) => api.get<PaginatedResult<Patient>>(`/patients${toQueryString(query)}`),
  get: (id: string) => api.get<Patient>(`/patients/${id}`),
  create: (payload: PatientPayload) => api.post<Patient>("/patients", payload),
  update: (id: string, payload: Partial<PatientPayload>) => api.patch<Patient>(`/patients/${id}`, payload),
  remove: (id: string) => api.delete<{ message: string }>(`/patients/${id}`),
  print: (id: string) => api.getBlob(`/patients/${id}/print`),
}
