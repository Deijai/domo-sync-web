"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { LoadingState, ErrorState } from "@/components/feedback-states"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ticketsApi } from "@/lib/api/tickets"
import {
  TICKET_BATCH_STATUS_COLOR,
  TICKET_BATCH_STATUS_LABEL,
  TICKET_STATUS_COLOR,
  TICKET_STATUS_LABEL,
} from "@/lib/status-labels"
import { cn } from "@/lib/utils"
import type { TicketStatus } from "@/types/api"

export default function TicketBatchDetailPage() {
  const params = useParams<{ id: string }>()

  const batchQuery = useQuery({
    queryKey: ["ticket-batches", params.id],
    queryFn: () => ticketsApi.getBatch(params.id),
  })

  const ticketsQuery = useQuery({
    queryKey: ["tickets", "by-batch", params.id],
    queryFn: () => ticketsApi.list({ batchId: params.id, pageSize: 200 }),
    enabled: !!batchQuery.data,
  })

  if (batchQuery.isLoading) return <LoadingState label="Carregando lote..." />
  if (batchQuery.isError || !batchQuery.data) return <ErrorState description="Lote não encontrado." />

  const batch = batchQuery.data

  return (
    <div>
      <PageHeader
        title={batch.description || `Lote de ${batch.specialty.name}`}
        description={`${batch.professional.fullName} · ${batch.healthUnit.name} · ${new Date(
          batch.serviceDate,
        ).toLocaleDateString("pt-BR")}`}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Status do lote</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge
              label={TICKET_BATCH_STATUS_LABEL[batch.status]}
              className={TICKET_BATCH_STATUS_COLOR[batch.status]}
            />
          </CardContent>
        </Card>
        {(Object.keys(TICKET_STATUS_LABEL) as TicketStatus[])
          .filter((status) => (batch.ticketsByStatus[status] ?? 0) > 0)
          .map((status) => (
            <Card key={status}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {TICKET_STATUS_LABEL[status]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{batch.ticketsByStatus[status] ?? 0}</div>
              </CardContent>
            </Card>
          ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fichas do lote</CardTitle>
        </CardHeader>
        <CardContent>
          {ticketsQuery.isLoading ? (
            <LoadingState label="Carregando fichas..." />
          ) : (
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
              {ticketsQuery.data?.data
                .slice()
                .sort((a, b) => a.ticketNumber - b.ticketNumber)
                .map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-md text-sm font-semibold transition-transform hover:scale-105",
                      TICKET_STATUS_COLOR[ticket.status],
                    )}
                    title={`Ficha #${ticket.ticketNumber} — ${TICKET_STATUS_LABEL[ticket.status]}`}
                  >
                    {ticket.ticketNumber}
                  </Link>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
