"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { LoadingState } from "@/components/feedback-states"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Ticket, CheckCircle2, UserX, TrendingUp } from "lucide-react"
import { reportsApi } from "@/lib/api/reports"
import { specialtiesApi } from "@/lib/api/specialties"
import { professionalsApi } from "@/lib/api/professionals"
import { healthUnitsApi } from "@/lib/api/health-units"

const NONE = "__all__"

export default function ReportsPage() {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [specialtyId, setSpecialtyId] = useState(NONE)
  const [professionalId, setProfessionalId] = useState(NONE)
  const [healthUnitId, setHealthUnitId] = useState(NONE)

  const filters = {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    specialtyId: specialtyId === NONE ? undefined : specialtyId,
    professionalId: professionalId === NONE ? undefined : professionalId,
    healthUnitId: healthUnitId === NONE ? undefined : healthUnitId,
  }

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

  const summaryQuery = useQuery({
    queryKey: ["reports", "summary", filters],
    queryFn: () => reportsApi.summary(filters),
  })
  const attendanceQuery = useQuery({
    queryKey: ["reports", "attendance-rate", filters],
    queryFn: () => reportsApi.attendanceRate(filters),
  })
  const bySpecialtyQuery = useQuery({
    queryKey: ["reports", "by-specialty", filters],
    queryFn: () => reportsApi.ticketsBySpecialty(filters),
  })
  const byProfessionalQuery = useQuery({
    queryKey: ["reports", "by-professional", filters],
    queryFn: () => reportsApi.ticketsByProfessional(filters),
  })
  const byUnitQuery = useQuery({
    queryKey: ["reports", "by-unit", filters],
    queryFn: () => reportsApi.ticketsByUnit(filters),
  })
  const byPatientQuery = useQuery({
    queryKey: ["reports", "by-patient", filters],
    queryFn: () => reportsApi.ticketsByPatient(filters),
  })

  return (
    <div>
      <PageHeader title="Relatórios" description="Indicadores operacionais de fichas e atendimentos." />

      <Card className="mb-6">
        <CardContent className="grid grid-cols-2 gap-3 pt-6 sm:grid-cols-3 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label htmlFor="startDate">De</Label>
            <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="endDate">Até</Label>
            <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Especialidade</Label>
            <Select value={specialtyId} onValueChange={(v) => v && setSpecialtyId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Todas</SelectItem>
                {specialtiesQuery.data?.data.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Profissional</Label>
            <Select value={professionalId} onValueChange={(v) => v && setProfessionalId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Todos</SelectItem>
                {professionalsQuery.data?.data.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Unidade</Label>
            <Select value={healthUnitId} onValueChange={(v) => v && setHealthUnitId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Todas</SelectItem>
                {healthUnitsQuery.data?.data.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total de fichas" value={summaryQuery.data?.total ?? 0} icon={Ticket} />
        <StatCard
          title="Taxa de comparecimento"
          value={`${attendanceQuery.data?.attendanceRate ?? 0}%`}
          icon={CheckCircle2}
        />
        <StatCard title="Taxa de faltas" value={`${attendanceQuery.data?.noShowRate ?? 0}%`} icon={UserX} />
        <StatCard
          title="Atendidas / Faltas"
          value={`${attendanceQuery.data?.attended ?? 0} / ${attendanceQuery.data?.noShow ?? 0}`}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por especialidade</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {bySpecialtyQuery.isLoading ? (
              <LoadingState label="Carregando..." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bySpecialtyQuery.data ?? []}>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por profissional</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {byProfessionalQuery.isLoading ? (
              <LoadingState label="Carregando..." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byProfessionalQuery.data ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="professionalName" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="total" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por unidade</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody className="divide-y">
                {byUnitQuery.data?.map((row) => (
                  <tr key={row.healthUnitId}>
                    <td className="py-2">{row.healthUnitName ?? "—"}</td>
                    <td className="py-2 text-right font-medium">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top pacientes</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody className="divide-y">
                {byPatientQuery.data
                  ?.slice()
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 10)
                  .map((row) => (
                    <tr key={row.patientId}>
                      <td className="py-2">{row.patientName ?? "—"}</td>
                      <td className="py-2 text-right font-medium">{row.total}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
