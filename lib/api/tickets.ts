import { api } from "./client"
import { toQueryString } from "./query"
import type { PaginatedResult, Ticket, TicketBatch, TicketBatchDetail, TicketMovement } from "@/types/api"

export interface TicketsQuery {
  page?: number
  pageSize?: number
  status?: string
  specialtyId?: string
  professionalId?: string
  healthUnitId?: string
  patientId?: string
  batchId?: string
  startDate?: string
  endDate?: string
}

export interface TicketBatchesQuery {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  specialtyId?: string
  professionalId?: string
  healthUnitId?: string
  startDate?: string
  endDate?: string
}

export interface CreateTicketBatchPayload {
  description?: string
  specialtyId: string
  professionalId: string
  healthUnitId: string
  serviceDate: string
  totalTickets: number
  startTime?: string
  endTime?: string
  arrivalInstruction?: string
}

export interface TransferTicketPayload {
  newPatientId?: string
  newProfessionalId?: string
  newServiceDate?: string
  reason?: string
}

export const ticketsApi = {
  list: (query: TicketsQuery = {}) => api.get<PaginatedResult<Ticket>>(`/tickets${toQueryString(query)}`),
  get: (id: string) => api.get<Ticket>(`/tickets/${id}`),
  movements: (id: string, query: { page?: number; pageSize?: number } = {}) =>
    api.get<PaginatedResult<TicketMovement>>(`/tickets/${id}/movements${toQueryString(query)}`),

  listBatches: (query: TicketBatchesQuery = {}) =>
    api.get<PaginatedResult<TicketBatch>>(`/tickets/batches${toQueryString(query)}`),
  getBatch: (id: string) => api.get<TicketBatchDetail>(`/tickets/batches/${id}`),
  createBatch: (payload: CreateTicketBatchPayload) => api.post<TicketBatch>("/tickets/batches", payload),

  print: (id: string) => api.getBlob(`/tickets/${id}/print`),
  cancel: (id: string, reason: string) => api.post<Ticket>(`/tickets/${id}/cancel`, { reason }),
  transfer: (id: string, payload: TransferTicketPayload) => api.post<Ticket>(`/tickets/${id}/transfer`, payload),
  changeDate: (id: string, newServiceDate: string, newScheduledTime?: string) =>
    api.post<Ticket>(`/tickets/${id}/change-date`, { newServiceDate, newScheduledTime }),
  confirmPresence: (id: string) => api.post<Ticket>(`/tickets/${id}/confirm-presence`, {}),
  attend: (id: string) => api.post<Ticket>(`/tickets/${id}/attend`, {}),
  noShow: (id: string) => api.post<Ticket>(`/tickets/${id}/no-show`, {}),
  reopen: (id: string) => api.post<Ticket>(`/tickets/${id}/reopen`, {}),
  assign: (id: string, patientId: string) => api.post<Ticket>(`/tickets/${id}/assign`, { patientId }),
  call: (id: string, counterLabel: string) => api.post<Ticket>(`/tickets/${id}/call`, { counterLabel }),
}
