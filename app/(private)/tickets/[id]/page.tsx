"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowLeft, Printer } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { PermissionGate } from "@/components/permission-gate"
import { LoadingState, ErrorState } from "@/components/feedback-states"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from "@/components/ui/combobox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ApiError } from "@/lib/api/client"
import { ticketsApi } from "@/lib/api/tickets"
import { professionalsApi } from "@/lib/api/professionals"
import { patientsApi } from "@/lib/api/patients"
import { TICKET_STATUS_COLOR, TICKET_STATUS_LABEL } from "@/lib/status-labels"
import { PERMISSIONS } from "@/lib/permissions"
import { openPdfBlob } from "@/lib/open-pdf"

const cancelSchema = z.object({ reason: z.string().min(1, "Informe o motivo") })
const changeDateSchema = z.object({ newServiceDate: z.string().min(1, "Obrigatório"), newScheduledTime: z.string().optional() })
const transferSchema = z.object({
  newProfessionalId: z.string().optional(),
  newServiceDate: z.string().optional(),
  newPatientId: z.string().optional(),
  reason: z.string().optional(),
})

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [dialog, setDialog] = useState<"cancel" | "transfer" | "change-date" | null>(null)
  const [confirmAction, setConfirmAction] = useState<"confirm-presence" | "attend" | "no-show" | "reopen" | null>(
    null,
  )
  const [actionLoading, setActionLoading] = useState(false)
  const [printLoading, setPrintLoading] = useState(false)
  const [patientSearch, setPatientSearch] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<{ value: string; label: string } | null>(null)
  const [professionalSearch, setProfessionalSearch] = useState("")
  const [selectedProfessional, setSelectedProfessional] = useState<{ value: string; label: string } | null>(null)

  const ticketQuery = useQuery({
    queryKey: ["tickets", params.id],
    queryFn: () => ticketsApi.get(params.id),
  })

  const movementsQuery = useQuery({
    queryKey: ["tickets", params.id, "movements"],
    queryFn: () => ticketsApi.movements(params.id, { pageSize: 50 }),
  })

  const professionalsQuery = useQuery({
    queryKey: ["professionals", "search", professionalSearch],
    queryFn: () => professionalsApi.list({ search: professionalSearch || undefined, pageSize: 20, status: "ACTIVE" }),
    enabled: dialog === "transfer",
  })

  const professionalOptions = (professionalsQuery.data?.data ?? []).map((p) => ({
    value: p.id,
    label: p.fullName,
  }))

  const patientsQuery = useQuery({
    queryKey: ["patients", "search", patientSearch],
    queryFn: () => patientsApi.list({ search: patientSearch || undefined, pageSize: 20 }),
    enabled: dialog === "transfer",
  })

  const patientOptions = (patientsQuery.data?.data ?? []).map((p) => ({
    value: p.id,
    label: `${p.fullName} — CPF ${p.cpf}`,
  }))

  const cancelForm = useForm<z.infer<typeof cancelSchema>>({ resolver: zodResolver(cancelSchema) })
  const changeDateForm = useForm<z.infer<typeof changeDateSchema>>({ resolver: zodResolver(changeDateSchema) })
  const transferForm = useForm<z.infer<typeof transferSchema>>({
    resolver: zodResolver(transferSchema),
    defaultValues: { newProfessionalId: "", newServiceDate: "", newPatientId: "", reason: "" },
  })

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["tickets", params.id] })
    queryClient.invalidateQueries({ queryKey: ["tickets", params.id, "movements"] })
  }

  async function runAction<T>(action: () => Promise<T>, successMessage: string, onSuccess?: (result: T) => void) {
    setActionLoading(true)
    try {
      const result = await action()
      toast.success(successMessage)
      refresh()
      setDialog(null)
      setConfirmAction(null)
      onSuccess?.(result)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao executar ação")
    } finally {
      setActionLoading(false)
    }
  }

  async function handlePrint() {
    setPrintLoading(true)
    try {
      const blob = await ticketsApi.print(params.id)
      openPdfBlob(blob)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao gerar PDF da ficha")
    } finally {
      setPrintLoading(false)
    }
  }

  if (ticketQuery.isLoading) return <LoadingState label="Carregando ficha..." />
  if (ticketQuery.isError || !ticketQuery.data) return <ErrorState description="Ficha não encontrada." />

  const ticket = ticketQuery.data
  const status = ticket.status

  const canCancel = status === "AVAILABLE" || status === "RESERVED"
  const canTransfer = status === "AVAILABLE" || status === "RESERVED" || status === "CONFIRMED"
  const canChangeDate = canTransfer
  const canConfirmPresence = status === "RESERVED"
  const canAttend = status === "CONFIRMED"
  const canNoShow = status === "RESERVED" || status === "CONFIRMED"
  const canReopen = status === "CANCELED"

  const confirmActionConfig = {
    "confirm-presence": {
      title: "Confirmar presença",
      description: "Confirmar que o paciente compareceu para esta ficha?",
      run: () => runAction(() => ticketsApi.confirmPresence(ticket.id), "Presença confirmada"),
    },
    attend: {
      title: "Marcar atendimento",
      description: "Marcar esta ficha como atendida?",
      run: () => runAction(() => ticketsApi.attend(ticket.id), "Atendimento registrado"),
    },
    "no-show": {
      title: "Marcar falta",
      description: "Marcar que o paciente não compareceu?",
      run: () => runAction(() => ticketsApi.noShow(ticket.id), "Falta registrada"),
    },
    reopen: {
      title: "Reabrir ficha",
      description: "Reabrir esta ficha cancelada, tornando-a disponível novamente?",
      run: () => runAction(() => ticketsApi.reopen(ticket.id), "Ficha reaberta"),
    },
  } as const

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-2" onClick={() => router.push("/tickets")}>
        <ArrowLeft className="mr-2 size-4" /> Voltar
      </Button>

      <PageHeader
        title={`Ficha #${ticket.ticketNumber}`}
        description={ticket.specialty?.name}
        actions={<StatusBadge label={TICKET_STATUS_LABEL[status]} className={TICKET_STATUS_COLOR[status]} />}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Detalhes</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Especialidade" value={ticket.specialty?.name} />
            <Info label="Profissional" value={ticket.professional?.fullName} />
            <Info label="Unidade" value={ticket.healthUnit?.name} />
            <Info label="Paciente" value={ticket.patient?.fullName ?? "Não reservada"} />
            <Info label="Data" value={new Date(ticket.serviceDate).toLocaleDateString("pt-BR")} />
            <Info label="Horário" value={ticket.scheduledTime ?? "—"} />
            <Info label="Instrução" value={ticket.arrivalInstruction} className="col-span-2" />
            {ticket.canceledReason && (
              <Info label="Motivo do cancelamento" value={ticket.canceledReason} className="col-span-2" />
            )}
            {ticket.batchId && (
              <div className="col-span-2">
                <Link href={`/tickets/batches/${ticket.batchId}`} className="text-sm text-primary underline">
                  Ver lote de origem
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ações</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <PermissionGate permission={PERMISSIONS.TICKETS_PRINT}>
              <Button variant="outline" onClick={handlePrint} disabled={printLoading}>
                <Printer className="mr-2 size-4" /> Imprimir ficha
              </Button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.TICKETS_CONFIRM_PRESENCE}>
              {canConfirmPresence && (
                <Button variant="outline" onClick={() => setConfirmAction("confirm-presence")}>
                  Confirmar presença
                </Button>
              )}
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.TICKETS_ATTEND}>
              {canAttend && (
                <Button variant="outline" onClick={() => setConfirmAction("attend")}>
                  Marcar atendimento
                </Button>
              )}
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.TICKETS_NO_SHOW}>
              {canNoShow && (
                <Button variant="outline" onClick={() => setConfirmAction("no-show")}>
                  Marcar falta
                </Button>
              )}
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.TICKETS_CHANGE_DATE}>
              {canChangeDate && (
                <Button
                  variant="outline"
                  onClick={() => {
                    changeDateForm.reset({ newServiceDate: "", newScheduledTime: ticket.scheduledTime ?? "" })
                    setDialog("change-date")
                  }}
                >
                  Alterar data
                </Button>
              )}
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.TICKETS_TRANSFER}>
              {canTransfer && (
                <Button
                  variant="outline"
                  onClick={() => {
                    transferForm.reset({ newProfessionalId: "", newServiceDate: "", newPatientId: "", reason: "" })
                    setPatientSearch("")
                    setSelectedPatient(null)
                    setProfessionalSearch("")
                    setSelectedProfessional(null)
                    setDialog("transfer")
                  }}
                >
                  Transferir
                </Button>
              )}
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.TICKETS_REOPEN}>
              {canReopen && (
                <Button variant="outline" onClick={() => setConfirmAction("reopen")}>
                  Reabrir ficha
                </Button>
              )}
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.TICKETS_CANCEL}>
              {canCancel && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    cancelForm.reset({ reason: "" })
                    setDialog("cancel")
                  }}
                >
                  Cancelar ficha
                </Button>
              )}
            </PermissionGate>
            {!canCancel && !canTransfer && !canConfirmPresence && !canAttend && !canNoShow && !canReopen && (
              <p className="text-sm text-muted-foreground">Nenhuma ação disponível para este status.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Histórico de movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          {movementsQuery.isLoading ? (
            <LoadingState label="Carregando histórico..." />
          ) : (
            <ul className="space-y-3">
              {movementsQuery.data?.data.map((movement) => (
                <li key={movement.id} className="flex items-start justify-between border-b pb-2 text-sm last:border-0">
                  <div>
                    <p className="font-medium">{movement.action}</p>
                    {movement.description && (
                      <p className="text-xs text-muted-foreground">{movement.description}</p>
                    )}
                    {typeof movement.metadata?.transferredToTicketId === "string" && (
                      <Link
                        href={`/tickets/${movement.metadata.transferredToTicketId}`}
                        className="text-xs text-primary underline"
                      >
                        Ver ficha gerada pela transferência
                      </Link>
                    )}
                    {typeof movement.metadata?.transferredFromTicketId === "string" && (
                      <Link
                        href={`/tickets/${movement.metadata.transferredFromTicketId}`}
                        className="text-xs text-primary underline"
                      >
                        Ver ficha de origem da transferência
                      </Link>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(movement.createdAt).toLocaleString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Cancelar */}
      <Dialog open={dialog === "cancel"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar ficha</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={cancelForm.handleSubmit((data) =>
              runAction(() => ticketsApi.cancel(ticket.id, data.reason), "Ficha cancelada"),
            )}
            className="space-y-3 px-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="reason">Motivo</Label>
              <Textarea id="reason" rows={3} {...cancelForm.register("reason")} />
              {cancelForm.formState.errors.reason && (
                <p className="text-xs text-destructive">{cancelForm.formState.errors.reason.message}</p>
              )}
            </div>
          </form>
          <DialogFooter>
            <Button
              variant="destructive"
              disabled={actionLoading}
              onClick={cancelForm.handleSubmit((data) =>
                runAction(() => ticketsApi.cancel(ticket.id, data.reason), "Ficha cancelada"),
              )}
            >
              Confirmar cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alterar data */}
      <Dialog open={dialog === "change-date"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar data da ficha</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 px-4">
            <div className="space-y-1.5">
              <Label htmlFor="newServiceDate">Nova data</Label>
              <Input id="newServiceDate" type="date" {...changeDateForm.register("newServiceDate")} />
              {changeDateForm.formState.errors.newServiceDate && (
                <p className="text-xs text-destructive">
                  {changeDateForm.formState.errors.newServiceDate.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newScheduledTime">Novo horário (opcional)</Label>
              <Input id="newScheduledTime" type="time" {...changeDateForm.register("newScheduledTime")} />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={actionLoading}
              onClick={changeDateForm.handleSubmit((data) =>
                runAction(
                  () => ticketsApi.changeDate(ticket.id, data.newServiceDate, data.newScheduledTime),
                  "Data alterada",
                ),
              )}
            >
              Salvar nova data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transferir */}
      <Dialog open={dialog === "transfer"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir ficha</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 px-4">
            <div className="space-y-1.5">
              <Label htmlFor="newProfessionalId">Novo profissional (opcional)</Label>
              <Combobox<{ value: string; label: string }>
                items={professionalOptions}
                filter={null}
                inputValue={professionalSearch}
                onInputValueChange={setProfessionalSearch}
                value={selectedProfessional}
                onValueChange={(professional) => {
                  setSelectedProfessional(professional)
                  transferForm.setValue("newProfessionalId", professional?.value ?? "")
                }}
              >
                <ComboboxInputGroup>
                  <ComboboxInput id="newProfessionalId" placeholder="Manter profissional atual — buscar por nome..." />
                </ComboboxInputGroup>
                <ComboboxPopup>
                  <ComboboxEmpty>
                    {professionalsQuery.isLoading
                      ? "Buscando..."
                      : professionalsQuery.isError
                        ? professionalsQuery.error instanceof ApiError && professionalsQuery.error.statusCode === 403
                          ? "Você não tem permissão para buscar profissionais."
                          : "Erro ao buscar profissionais."
                        : "Nenhum profissional encontrado."}
                  </ComboboxEmpty>
                  <ComboboxList>
                    {(item) => (
                      <ComboboxItem key={item.value} value={item}>
                        {item.label}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxPopup>
              </Combobox>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newServiceDateTransfer">Nova data (opcional)</Label>
              <Input id="newServiceDateTransfer" type="date" {...transferForm.register("newServiceDate")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPatientId">Novo paciente (opcional)</Label>
              <Combobox<{ value: string; label: string }>
                items={patientOptions}
                filter={null}
                inputValue={patientSearch}
                onInputValueChange={setPatientSearch}
                value={selectedPatient}
                onValueChange={(patient) => {
                  setSelectedPatient(patient)
                  transferForm.setValue("newPatientId", patient?.value ?? "")
                }}
              >
                <ComboboxInputGroup>
                  <ComboboxInput id="newPatientId" placeholder="Buscar paciente por nome ou CPF..." />
                </ComboboxInputGroup>
                <ComboboxPopup>
                  <ComboboxEmpty>
                    {patientsQuery.isLoading
                      ? "Buscando..."
                      : patientsQuery.isError
                        ? patientsQuery.error instanceof ApiError && patientsQuery.error.statusCode === 403
                          ? "Você não tem permissão para buscar pacientes."
                          : "Erro ao buscar pacientes."
                        : "Nenhum paciente encontrado."}
                  </ComboboxEmpty>
                  <ComboboxList>
                    {(item) => (
                      <ComboboxItem key={item.value} value={item}>
                        {item.label}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxPopup>
              </Combobox>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="transferReason">Motivo (opcional)</Label>
              <Textarea id="transferReason" rows={2} {...transferForm.register("reason")} />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={actionLoading}
              onClick={transferForm.handleSubmit((data) => {
                if (!data.newProfessionalId && !data.newServiceDate && !data.newPatientId) {
                  toast.error("Informe ao menos um destino de transferência")
                  return
                }
                const payload = {
                  newProfessionalId: data.newProfessionalId || undefined,
                  newServiceDate: data.newServiceDate || undefined,
                  newPatientId: data.newPatientId || undefined,
                  reason: data.reason || undefined,
                }
                runAction(() => ticketsApi.transfer(ticket.id, payload), "Ficha transferida", (newTicket) =>
                  router.push(`/tickets/${newTicket.id}`),
                )
              })}
            >
              Confirmar transferência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmAction ? confirmActionConfig[confirmAction].title : ""}
        description={confirmAction ? confirmActionConfig[confirmAction].description : ""}
        isLoading={actionLoading}
        onConfirm={() => confirmAction && confirmActionConfig[confirmAction].run()}
      />
    </div>
  )
}

function Info({ label, value, className }: { label: string; value?: string | null; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  )
}
