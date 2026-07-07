"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { DataTable } from "@/components/data-table"
import { StatusBadge } from "@/components/status-badge"
import { PermissionGate } from "@/components/permission-gate"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ticketsApi } from "@/lib/api/tickets"
import { specialtiesApi } from "@/lib/api/specialties"
import { professionalsApi } from "@/lib/api/professionals"
import { healthUnitsApi } from "@/lib/api/health-units"
import {
  formatTicketSenha,
  TICKET_BATCH_STATUS_COLOR,
  TICKET_BATCH_STATUS_LABEL,
  TICKET_STATUS_COLOR,
  TICKET_STATUS_LABEL,
} from "@/lib/status-labels"
import { PERMISSIONS } from "@/lib/permissions"
import type { Ticket, TicketBatch, TicketStatus } from "@/types/api"

const NONE = "__all__"

export default function TicketsPage() {
  const [tab, setTab] = useState("tickets")
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string>(NONE)
  const [specialtyId, setSpecialtyId] = useState<string>(NONE)
  const [professionalId, setProfessionalId] = useState<string>(NONE)
  const [healthUnitId, setHealthUnitId] = useState<string>(NONE)

  const filtersApplied = {
    status: status === NONE ? undefined : status,
    specialtyId: specialtyId === NONE ? undefined : specialtyId,
    professionalId: professionalId === NONE ? undefined : professionalId,
    healthUnitId: healthUnitId === NONE ? undefined : healthUnitId,
  }

  const ticketsQuery = useQuery({
    queryKey: ["tickets", { page, ...filtersApplied }],
    queryFn: () => ticketsApi.list({ page, pageSize: 10, ...filtersApplied }),
    enabled: tab === "tickets",
  })

  const batchesQuery = useQuery({
    queryKey: ["ticket-batches", { page, ...filtersApplied }],
    queryFn: () => ticketsApi.listBatches({ page, pageSize: 10, ...filtersApplied }),
    enabled: tab === "batches",
  })

  const specialtiesQuery = useQuery({
    queryKey: ["specialties", "all"],
    queryFn: () => specialtiesApi.list({ pageSize: 100 }),
  })
  const professionalsQuery = useQuery({
    queryKey: ["professionals", "all"],
    queryFn: () => professionalsApi.list({ pageSize: 100 }),
  })
  const healthUnitsQuery = useQuery({
    queryKey: ["health-units", "all"],
    queryFn: () => healthUnitsApi.list({ pageSize: 100 }),
  })

  return (
    <div>
      <PageHeader
        title="Fichas"
        description="Acompanhe fichas individuais e lotes de atendimento."
        actions={
          <PermissionGate permission={PERMISSIONS.TICKETS_CREATE}>
            <Button render={<Link href="/tickets/batches/new" />} nativeButton={false}>
              <Plus className="mr-2 size-4" /> Criar lote de fichas
            </Button>
          </PermissionGate>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Select value={specialtyId} onValueChange={(v) => v && setSpecialtyId(v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Especialidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Todas as especialidades</SelectItem>
            {specialtiesQuery.data?.data.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={professionalId} onValueChange={(v) => v && setProfessionalId(v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Profissional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Todos os profissionais</SelectItem>
            {professionalsQuery.data?.data.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={healthUnitId} onValueChange={(v) => v && setHealthUnitId(v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Unidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Todas as unidades</SelectItem>
            {healthUnitsQuery.data?.data.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {tab === "tickets" && (
          <Select value={status} onValueChange={(v) => v && setStatus(v)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Todos os status</SelectItem>
              {(Object.keys(TICKET_STATUS_LABEL) as TicketStatus[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {TICKET_STATUS_LABEL[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(String(value))
          setPage(1)
        }}
      >
        <TabsList>
          <TabsTrigger value="tickets">Fichas</TabsTrigger>
          <TabsTrigger value="batches">Lotes</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="mt-4">
          <DataTable<Ticket>
            data={ticketsQuery.data?.data ?? []}
            isLoading={ticketsQuery.isLoading}
            page={ticketsQuery.data?.meta.page ?? 1}
            totalPages={ticketsQuery.data?.meta.totalPages ?? 1}
            onPageChange={setPage}
            columns={[
              { key: "ticketNumber", header: "Senha", cell: (row) => formatTicketSenha(row) },
              { key: "specialty", header: "Especialidade", cell: (row) => row.specialty?.name ?? "—" },
              { key: "professional", header: "Profissional", cell: (row) => row.professional?.fullName ?? "—" },
              { key: "patient", header: "Paciente", cell: (row) => row.patient?.fullName ?? "—" },
              {
                key: "serviceDate",
                header: "Data",
                cell: (row) => new Date(row.serviceDate).toLocaleDateString("pt-BR"),
              },
              {
                key: "status",
                header: "Status",
                cell: (row) => (
                  <StatusBadge label={TICKET_STATUS_LABEL[row.status]} className={TICKET_STATUS_COLOR[row.status]} />
                ),
              },
              {
                key: "actions",
                header: "",
                className: "text-right",
                cell: (row) => (
                  <Button variant="outline" size="sm" render={<Link href={`/tickets/${row.id}`} />} nativeButton={false}>
                    Ver detalhes
                  </Button>
                ),
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="batches" className="mt-4">
          <DataTable<TicketBatch>
            data={batchesQuery.data?.data ?? []}
            isLoading={batchesQuery.isLoading}
            page={batchesQuery.data?.meta.page ?? 1}
            totalPages={batchesQuery.data?.meta.totalPages ?? 1}
            onPageChange={setPage}
            columns={[
              { key: "description", header: "Descrição", cell: (row) => row.description ?? "—" },
              { key: "specialty", header: "Especialidade", cell: (row) => row.specialty.name },
              { key: "professional", header: "Profissional", cell: (row) => row.professional.fullName },
              {
                key: "serviceDate",
                header: "Data",
                cell: (row) => new Date(row.serviceDate).toLocaleDateString("pt-BR"),
              },
              { key: "totalTickets", header: "Fichas", cell: (row) => row.totalTickets },
              {
                key: "status",
                header: "Status",
                cell: (row) => (
                  <StatusBadge
                    label={TICKET_BATCH_STATUS_LABEL[row.status]}
                    className={TICKET_BATCH_STATUS_COLOR[row.status]}
                  />
                ),
              },
              {
                key: "actions",
                header: "",
                className: "text-right",
                cell: (row) => (
                  <Button variant="outline" size="sm" render={<Link href={`/tickets/batches/${row.id}`} />} nativeButton={false}>
                    Ver fichas
                  </Button>
                ),
              },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
