import type { AccountStatus, SimpleStatus, TicketBatchStatus, TicketStatus } from "@/types/api"

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  AVAILABLE: "Disponível",
  RESERVED: "Reservada",
  CONFIRMED: "Confirmada",
  CALLED: "Chamada",
  ATTENDED: "Atendida",
  CANCELED: "Cancelada",
  NO_SHOW: "Falta",
  TRANSFERRED: "Transferida",
  EXPIRED: "Expirada",
}

export const TICKET_STATUS_COLOR: Record<TicketStatus, string> = {
  AVAILABLE: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  RESERVED: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  CONFIRMED: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  CALLED: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  ATTENDED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  CANCELED: "bg-muted text-muted-foreground",
  NO_SHOW: "bg-red-500/10 text-red-600 dark:text-red-400",
  TRANSFERRED: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  EXPIRED: "bg-muted text-muted-foreground",
}

export const TICKET_BATCH_STATUS_LABEL: Record<TicketBatchStatus, string> = {
  ACTIVE: "Ativo",
  CANCELED: "Cancelado",
  FINISHED: "Finalizado",
}

export const TICKET_BATCH_STATUS_COLOR: Record<TicketBatchStatus, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  CANCELED: "bg-red-500/10 text-red-600 dark:text-red-400",
  FINISHED: "bg-muted text-muted-foreground",
}

export const ACCOUNT_STATUS_LABEL: Record<AccountStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  BLOCKED: "Bloqueado",
}

export const ACCOUNT_STATUS_COLOR: Record<AccountStatus, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  INACTIVE: "bg-muted text-muted-foreground",
  BLOCKED: "bg-red-500/10 text-red-600 dark:text-red-400",
}

export const SIMPLE_STATUS_LABEL: Record<SimpleStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
}

export const SIMPLE_STATUS_COLOR: Record<SimpleStatus, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  INACTIVE: "bg-muted text-muted-foreground",
}

export const GENDER_LABEL: Record<string, string> = {
  MALE: "Masculino",
  FEMALE: "Feminino",
  OTHER: "Outro",
  NOT_INFORMED: "Não informado",
}

/**
 * Mesma senha exibida no painel público, na fila de atendimento e no app do
 * paciente (código da especialidade + número da ficha, ex.: DERM003) — não é
 * o número cru da ficha, que sozinho reinicia a cada lote e pode se repetir.
 */
export function formatTicketSenha(ticket: { ticketNumber: number; specialty?: { code?: string } | null }): string {
  const code = ticket.specialty?.code ?? ""
  return `${code}${String(ticket.ticketNumber).padStart(3, "0")}`
}
