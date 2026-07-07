"use client"

import { useQuery } from "@tanstack/react-query"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Ticket, CircleDot, CalendarCheck, XCircle, UserX, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/stat-card"
import { PageHeader } from "@/components/page-header"
import { LoadingState, ErrorState, EmptyState } from "@/components/feedback-states"
import { reportsApi } from "@/lib/api/reports"
import { TICKET_STATUS_LABEL } from "@/lib/status-labels"
import { PERMISSIONS } from "@/lib/permissions"
import { useAuthStore } from "@/stores/auth.store"
import type { TicketStatus } from "@/types/api"

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export default function DashboardPage() {
  const today = todayIso()
  const canViewReports = useAuthStore((state) => state.permissions.includes(PERMISSIONS.REPORTS_READ))

  const summaryQuery = useQuery({
    queryKey: ["reports", "summary", "today", today],
    queryFn: () => reportsApi.summary({ startDate: today, endDate: today }),
    enabled: canViewReports,
  })

  const specialtyQuery = useQuery({
    queryKey: ["reports", "tickets-by-specialty"],
    queryFn: () => reportsApi.ticketsBySpecialty(),
    enabled: canViewReports,
  })

  if (!canViewReports) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Visão geral das fichas de hoje." />
        <EmptyState
          title="Sem indicadores pra mostrar aqui"
          description='Use "Fila de Atendimento" no menu lateral pra ver suas fichas.'
        />
      </div>
    )
  }

  if (summaryQuery.isLoading) return <LoadingState label="Carregando dashboard..." />
  if (summaryQuery.isError || !summaryQuery.data) {
    return <ErrorState description="Tente recarregar a página em instantes." />
  }

  const byStatus = summaryQuery.data.byStatus
  const chartData = (Object.keys(byStatus) as TicketStatus[]).map((status) => ({
    status: TICKET_STATUS_LABEL[status],
    total: byStatus[status],
  }))

  return (
    <div>
      <PageHeader title="Dashboard" description="Visão geral das fichas de hoje." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total hoje" value={summaryQuery.data.total} icon={Ticket} />
        <StatCard title="Disponíveis" value={byStatus.AVAILABLE} icon={CircleDot} />
        <StatCard title="Reservadas" value={byStatus.RESERVED} icon={CalendarCheck} />
        <StatCard title="Canceladas" value={byStatus.CANCELED} icon={XCircle} />
        <StatCard title="Faltas" value={byStatus.NO_SHOW} icon={UserX} />
        <StatCard
          title="Atendidas"
          value={byStatus.ATTENDED}
          description={`Taxa de comparecimento: ${summaryQuery.data.attendanceRate}%`}
          icon={CheckCircle2}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fichas de hoje por status</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="total" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fichas por especialidade (geral)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {specialtyQuery.isLoading ? (
              <LoadingState label="Carregando..." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={specialtyQuery.data ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="specialtyName" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="total" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
