"use client"

import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { io } from "socket.io-client"
import { toast } from "sonner"
import { MonitorPlay, Volume2, PhoneCall } from "lucide-react"
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
import { formatTicketSenha } from "@/lib/status-labels"
import { useAuthStore } from "@/stores/auth.store"
import type { Ticket } from "@/types/api"

const LAST_COUNTER_LABEL_KEY = "dma:last-counter-label"

function batchLabel(ticket: Ticket) {
  return ticket.batch?.description || ticket.professional?.fullName || "—"
}

export default function QueuePage() {
  const queryClient = useQueryClient()
  const professional = useAuthStore((state) => state.user?.professional)
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

  function requireCounterLabel(): string | null {
    const trimmed = counterLabel.trim()
    if (!trimmed) {
      toast.error("Informe o guichê antes de chamar")
      return null
    }
    return trimmed
  }

  async function handleCallNext() {
    const label = requireCounterLabel()
    if (!label) return
    setActionLoading("call-next")
    try {
      await queueApi.callNext(healthUnitId, label)
      persistCounterLabel(label)
      toast.success("Ficha chamada")
      refresh()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao chamar próxima ficha")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleCall(ticket: Ticket, successMessage: string) {
    const label = requireCounterLabel()
    if (!label) return
    setActionLoading(ticket.id)
    try {
      await ticketsApi.call(ticket.id, label)
      persistCounterLabel(label)
      toast.success(successMessage)
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
        title={professional ? "Meus Atendimentos" : "Fila de Atendimento"}
        description={
          professional
            ? `Fichas de ${professional.fullName} aguardando ou em atendimento.`
            : "Chame a próxima ficha confirmada para o seu guichê."
        }
        actions={
          <div className="flex items-center gap-2">
            <Select value={healthUnitId} onValueChange={(v) => v && setHealthUnitId(v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Unidade">
                  {(value: string | null) =>
                    healthUnitsQuery.data?.data.find((u) => u.id === value)?.name ?? "Unidade"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {healthUnitsQuery.data?.data.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              disabled={!healthUnitId}
              onClick={() => window.open(`/painel/${healthUnitId}`, "_blank", "noopener,noreferrer")}
            >
              <MonitorPlay className="mr-2 size-4" /> Abrir painel
            </Button>
          </div>
        }
      />

      <PermissionGate permission={PERMISSIONS.TICKETS_CALL}>
        <Card className="mb-6 border-primary/40 bg-primary/5">
          <CardContent className="flex flex-col items-end gap-3 pt-6 sm:flex-row">
            <div className="w-full space-y-1.5 sm:max-w-40">
              <Label htmlFor="counterLabel">Guichê</Label>
              <Input
                id="counterLabel"
                placeholder="0001"
                value={counterLabel}
                onChange={(e) => setCounterLabel(e.target.value)}
              />
            </div>
            <Button
              size="lg"
              className="w-full sm:w-auto"
              onClick={handleCallNext}
              disabled={!healthUnitId || actionLoading === "call-next" || !queue?.waiting.length}
            >
              <Volume2 className="mr-2 size-4" /> Chamar próxima ({queue?.waiting.length ?? 0} aguardando)
            </Button>
            <p className="text-sm text-muted-foreground sm:ml-2 sm:self-center">
              Chama a ficha que está esperando há mais tempo. Pra chamar uma ficha específica, use o botão na lista
              de "Aguardando".
            </p>
          </CardContent>
        </Card>
      </PermissionGate>

      {queueQuery.isLoading ? (
        <LoadingState label="Carregando fila..." />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Chamando agora</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {queue?.calledNow.length ? (
                queue.calledNow.map((ticket) => (
                  <div key={ticket.id} className="rounded-lg border-2 border-primary/50 bg-primary/5 p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-3xl font-bold">{formatTicketSenha(ticket)}</p>
                      <p className="text-xl font-semibold text-primary">Guichê {ticket.counterLabel}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {batchLabel(ticket)} · {ticket.patient?.fullName ?? "—"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <PermissionGate permission={PERMISSIONS.TICKETS_ATTEND}>
                        <Button size="sm" disabled={actionLoading === ticket.id} onClick={() => handleAttend(ticket)}>
                          Atender
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission={PERMISSIONS.TICKETS_NO_SHOW}>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={actionLoading === ticket.id}
                          onClick={() => handleNoShow(ticket)}
                        >
                          Faltou
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission={PERMISSIONS.TICKETS_CALL}>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading === ticket.id}
                          onClick={() => handleCall(ticket, "Ficha chamada novamente")}
                        >
                          Chamar novamente
                        </Button>
                      </PermissionGate>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma ficha sendo chamada. Use "Chamar próxima" acima para começar.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Aguardando ({queue?.waiting.length ?? 0})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {queue?.waiting.length ? (
                  queue.waiting.map((ticket, index) => (
                    <div key={ticket.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
                      <span className="min-w-0 flex-1 truncate">
                        {index + 1}º — {formatTicketSenha(ticket)} · {batchLabel(ticket)}
                      </span>
                      <PermissionGate permission={PERMISSIONS.TICKETS_CALL}>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Chamar esta ficha"
                          title="Chamar esta ficha"
                          disabled={actionLoading === ticket.id}
                          onClick={() => handleCall(ticket, "Ficha chamada")}
                        >
                          <PhoneCall className="size-4" />
                        </Button>
                      </PermissionGate>
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
                    <div key={ticket.id} className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate">
                        {formatTicketSenha(ticket)} — Guichê {ticket.counterLabel}
                      </span>
                      <span>{ticket.calledAt ? new Date(ticket.calledAt).toLocaleTimeString("pt-BR") : "—"}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma chamada registrada hoje.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
