import { api } from "./client"
import { toQueryString } from "./query"
import type { AccountStatus, PaginatedResult, User } from "@/types/api"

export interface UsersQuery {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  roleId?: string
}

export interface UserPayload {
  name: string
  email: string
  password?: string
  roleId: string
  status?: AccountStatus
  professionalId?: string
}

export const usersApi = {
  list: (query: UsersQuery = {}) => api.get<PaginatedResult<User>>(`/users${toQueryString(query)}`),
  get: (id: string) => api.get<User>(`/users/${id}`),
  create: (payload: UserPayload) => api.post<User>("/users", payload),
  update: (id: string, payload: Partial<UserPayload>) => api.patch<User>(`/users/${id}`, payload),
  remove: (id: string) => api.delete<{ message: string }>(`/users/${id}`),
}
