"use client"

import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { io } from "socket.io-client"
import { toast } from "sonner"
import { MonitorPlay, Volume2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { LoadingState } from "@/components/feedback-states"
import { PermissionGate } from "@/components/permission-gate"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ApiError } from "@/lib/api/client"
import { healthUnitsApi } from "@/lib/api/health-units"
import { queueApi, QUEUE_SOCKET_URL } from "@/lib/api/queue"
import { ticketsApi } from "@/lib/api/tickets"
import { PERMISSIONS } from "@/lib/permissions"
import type { Ticket } from "@/types/api"

const LAST_COUNTER_LABEL_KEY = "dma:last-counter-label"

function formatTicketNumber(ticket: Ticket) {
  const code = ticket.specialty?.code ?? ""
  return `${code}${String(ticket.ticketNumber).padStart(3, "0")}`
}

export default function QueuePage() {
  const queryClient = useQueryClient()
  const [healthUnitId, setHealthUnitId] = useState("")
  const [counterLabel, setCounterLabel] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const healthUnitsQuery = useQuery({
    queryKey: ["health-units", "all"],
    queryFn: () => healthUnitsApi.list({ pageSize: 100, status: "ACTIVE" }),
  })

  useEffect(() => {
    if (!healthUnitId && healthUnitsQuery.data?.data.length) {
      const preferred = healthUnitsQuery.data.data.find((u) => u.isDefault) ?? healthUnitsQuery.data.data[0]
      setHealthUnitId(preferred.id)
    }
  }, [healthUnitId, healthUnitsQuery.data])

  useEffect(() => {
    const lastLabel = typeof window !== "undefined" ? localStorage.getItem(LAST_COUNTER_LABEL_KEY) : null
    if (lastLabel) setCounterLabel(lastLabel)
  }, [])

  const queueQuery = useQuery({
    queryKey: ["queue", healthUnitId],
    queryFn: () => queueApi.get(healthUnitId),
    enabled: !!healthUnitId,
    refetchInterval: 20_000,
  })

  useEffect(() => {
    if (!healthUnitId) return
    const socket = io(QUEUE_SOCKET_URL, { query: { healthUnitId }, transports: ["websocket"] })
    socket.on("ticket.called", () => {
      queryClient.invalidateQueries({ queryKey: ["queue", healthUnitId] })
    })
    return () => {
      socket.disconnect()
    }
  }, [healthUnitId, queryClient])

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["queue", healthUnitId] })
  }

  function persistCounterLabel(label: string) {
    if (typeof window !== "undefined") localStorage.setItem(LAST_COUNTER_LABEL_KEY, label)
  }

  async function handleCallNext() {
    if (!counterLabel.trim()) {
      toast.error("Informe o guichê")
      return
    }
    setActionLoading("call-next")
    try {
      await queueApi.callNext(healthUnitId, counterLabel.trim())
      persistCounterLabel(counterLabel.trim())
      toast.success("Ficha chamada")
      refresh()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao chamar próxima ficha")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRecall(ticket: Ticket) {
    if (!counterLabel.trim()) {
      toast.error("Informe o guichê")
      return
    }
    setActionLoading(ticket.id)
    try {
      await ticketsApi.call(ticket.id, counterLabel.trim())
      persistCounterLabel(counterLabel.trim())
      toast.success("Ficha chamada novamente")
      refresh()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao chamar ficha")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleAttend(ticket: Ticket) {
    setActionLoading(ticket.id)
    try {
      await ticketsApi.attend(ticket.id)
      toast.success("Atendimento registrado")
      refresh()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao marcar atendimento")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleNoShow(ticket: Ticket) {
    setActionLoading(ticket.id)
    try {
      await ticketsApi.noShow(ticket.id)
      toast.success("Falta registrada")
      refresh()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao marcar falta")
    } finally {
      setActionLoading(null)
    }
  }

  const queue = queueQuery.data

  return (
    <div>
      <PageHeader
        title="Fila de Atendimento"
        description="Chame fichas confirmadas para o guichê de atendimento."
        actions={
          <Button
            variant="outline"
            disabled={!healthUnitId}
            onClick={() => window.open(`/painel/${healthUnitId}`, "_blank", "noopener,noreferrer")}
          >
            <MonitorPlay className="mr-2 size-4" /> Abrir painel
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Unidade de saúde</Label>
          <Select value={healthUnitId} onValueChange={(v) => v && setHealthUnitId(v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {healthUnitsQuery.data?.data.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="counterLabel">Guichê</Label>
          <Input
            id="counterLabel"
            placeholder="0001"
            value={counterLabel}
            onChange={(e) => setCounterLabel(e.target.value)}
          />
        </div>
        <PermissionGate permission={PERMISSIONS.TICKETS_CALL}>
          <div className="flex items-end">
            <Button
              className="w-full"
              onClick={handleCallNext}
              disabled={!healthUnitId || actionLoading === "call-next" || !queue?.waiting.length}
            >
              <Volume2 className="mr-2 size-4" /> Chamar próxima
            </Button>
          </div>
        </PermissionGate>
      </div>

      {queueQuery.isLoading ? (
        <LoadingState label="Carregando fila..." />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chamando agora ({queue?.calledNow.length ?? 0})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {queue?.calledNow.length ? (
                queue.calledNow.map((ticket) => (
                  <div key={ticket.id} className="rounded-md border p-3">
                    <p className="font-semibold">{formatTicketNumber(ticket)} — Guichê {ticket.counterLabel}</p>
                    <p className="text-sm text-muted-foreground">{ticket.patient?.fullName ?? "—"}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <PermissionGate permission={PERMISSIONS.TICKETS_CALL}>
                        <Button size="sm" variant="outline" disabled={actionLoading === ticket.id} onClick={() => handleRecall(ticket)}>
                          Chamar novamente
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission={PERMISSIONS.TICKETS_ATTEND}>
                        <Button size="sm" disabled={actionLoading === ticket.id} onClick={() => handleAttend(ticket)}>
                          Atender
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission={PERMISSIONS.TICKETS_NO_SHOW}>
                        <Button size="sm" variant="destructive" disabled={actionLoading === ticket.id} onClick={() => handleNoShow(ticket)}>
                          Faltou
                        </Button>
                      </PermissionGate>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma ficha sendo chamada no momento.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aguardando ({queue?.waiting.length ?? 0})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {queue?.waiting.length ? (
                queue.waiting.map((ticket, index) => (
                  <div key={ticket.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                    <span>
                      {index + 1}º — {formatTicketNumber(ticket)} · {ticket.patient?.fullName ?? "—"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma ficha aguardando.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Últimas chamadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {queue?.recentCalls.length ? (
                queue.recentCalls.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                    <span>
                      {formatTicketNumber(ticket)} — Guichê {ticket.counterLabel}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {ticket.calledAt ? new Date(ticket.calledAt).toLocaleTimeString("pt-BR") : "—"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma chamada registrada hoje.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
