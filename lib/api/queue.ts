import { api, API_URL } from "./client"
import type { PublicQueuePanel, Ticket, TicketQueueState } from "@/types/api"

export const queueApi = {
  get: (healthUnitId: string) => api.get<TicketQueueState>(`/tickets/queue?healthUnitId=${healthUnitId}`),
  callNext: (healthUnitId: string, counterLabel: string) =>
    api.post<Ticket>(`/tickets/queue/call-next`, { healthUnitId, counterLabel }),
}

export const publicQueueApi = {
  getPanel: (healthUnitId: string) => api.get<PublicQueuePanel>(`/public/queue-panel/${healthUnitId}`),
}

export const QUEUE_SOCKET_URL = `${API_URL}/queue`
