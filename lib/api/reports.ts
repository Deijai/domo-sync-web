import { api } from "./client"
import { toQueryString } from "./query"
import type { AttendanceRate, ReportsSummary } from "@/types/api"

export interface ReportsFilters {
  startDate?: string
  endDate?: string
  specialtyId?: string
  professionalId?: string
  healthUnitId?: string
  patientId?: string
  status?: string
}

const toQuery = toQueryString

export const reportsApi = {
  summary: (filters: ReportsFilters = {}) => api.get<ReportsSummary>(`/reports/summary${toQuery(filters)}`),
  ticketsByStatus: (filters: ReportsFilters = {}) =>
    api.get<{ status: string; total: number }[]>(`/reports/tickets-by-status${toQuery(filters)}`),
  ticketsBySpecialty: (filters: ReportsFilters = {}) =>
    api.get<{ specialtyId: string; specialtyName: string | null; total: number }[]>(
      `/reports/tickets-by-specialty${toQuery(filters)}`,
    ),
  ticketsByProfessional: (filters: ReportsFilters = {}) =>
    api.get<{ professionalId: string; professionalName: string | null; total: number }[]>(
      `/reports/tickets-by-professional${toQuery(filters)}`,
    ),
  ticketsByUnit: (filters: ReportsFilters = {}) =>
    api.get<{ healthUnitId: string; healthUnitName: string | null; total: number }[]>(
      `/reports/tickets-by-unit${toQuery(filters)}`,
    ),
  ticketsByPatient: (filters: ReportsFilters = {}) =>
    api.get<{ patientId: string; patientName: string | null; total: number }[]>(
      `/reports/tickets-by-patient${toQuery(filters)}`,
    ),
  attendanceRate: (filters: ReportsFilters = {}) =>
    api.get<AttendanceRate>(`/reports/attendance-rate${toQuery(filters)}`),

  printAttendance: (filters: ReportsFilters = {}) => api.getBlob(`/reports/attendance/print${toQuery(filters)}`),
  printProductivity: (filters: ReportsFilters = {}) => api.getBlob(`/reports/productivity/print${toQuery(filters)}`),
  printVolume: (filters: ReportsFilters = {}) => api.getBlob(`/reports/volume/print${toQuery(filters)}`),
  printQueue: (filters: ReportsFilters = {}) => api.getBlob(`/reports/queue/print${toQuery(filters)}`),
}
