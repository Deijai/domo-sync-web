import { api } from "./client"
import { toQueryString } from "./query"
import type { PaginatedResult, Permission } from "@/types/api"

export const permissionsApi = {
  list: (query: { page?: number; pageSize?: number; search?: string } = {}) =>
    api.get<PaginatedResult<Permission>>(`/permissions${toQueryString({ pageSize: 100, ...query })}`),
}
