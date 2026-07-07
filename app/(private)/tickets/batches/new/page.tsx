"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ApiError } from "@/lib/api/client"
import { ticketsApi } from "@/lib/api/tickets"
import { specialtiesApi } from "@/lib/api/specialties"
import { professionalsApi } from "@/lib/api/professionals"
import { healthUnitsApi } from "@/lib/api/health-units"

const formSchema = z.object({
  specialtyId: z.string().min(1, "Selecione uma especialidade"),
  professionalId: z.string().min(1, "Selecione um profissional"),
  healthUnitId: z.string().min(1, "Selecione uma unidade"),
  serviceDate: z.string().min(1, "Obrigatório"),
  totalTickets: z.number().int().min(1, "Mínimo de 1 ficha"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  arrivalInstruction: z.string().optional(),
  description: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

export default function NewTicketBatchPage() {
  const router = useRouter()

  const specialtiesQuery = useQuery({
    queryKey: ["specialties", "all"],
    queryFn: () => specialtiesApi.list({ pageSize: 100, status: "ACTIVE" }),
  })
  const professionalsQuery = useQuery({
    queryKey: ["professionals", "all"],
    queryFn: () => professionalsApi.list({ pageSize: 100, status: "ACTIVE" }),
  })
  const healthUnitsQuery = useQuery({
    queryKey: ["health-units", "all"],
    queryFn: () => healthUnitsApi.list({ pageSize: 100, status: "ACTIVE" }),
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      specialtyId: "",
      professionalId: "",
      healthUnitId: "",
      totalTickets: 50,
      arrivalInstruction: "Compareça com 1 hora de antecedência.",
    },
  })

  const specialtyId = watch("specialtyId")
  const professionalId = watch("professionalId")
  const healthUnitId = watch("healthUnitId")

  const compatibleProfessionals = useMemo(() => {
    const all = professionalsQuery.data?.data ?? []
    if (!specialtyId) return all
    return all.filter((professional) => professional.specialties.some((s) => s.id === specialtyId))
  }, [professionalsQuery.data, specialtyId])

  async function onSubmit(data: FormData) {
    try {
      const batch = await ticketsApi.createBatch(data)
      toast.success(`Lote criado com ${data.totalTickets} fichas`)
      router.push(`/tickets/batches/${batch.id}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao criar lote")
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Criar lote de fichas" description="As fichas serão geradas automaticamente, numeradas de 1 até a quantidade informada." />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Especialidade</Label>
              <Select value={specialtyId} onValueChange={(v) => v && setValue("specialtyId", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a especialidade" />
                </SelectTrigger>
                <SelectContent>
                  {specialtiesQuery.data?.data.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.specialtyId && <p className="text-xs text-destructive">{errors.specialtyId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Profissional</Label>
              <Select value={professionalId} onValueChange={(v) => v && setValue("professionalId", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o profissional" />
                </SelectTrigger>
                <SelectContent>
                  {compatibleProfessionals.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.professionalId && (
                <p className="text-xs text-destructive">{errors.professionalId.message}</p>
              )}
              {specialtyId && compatibleProfessionals.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nenhum profissional ativo atende essa especialidade ainda.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Unidade de Saúde</Label>
              <Select value={healthUnitId} onValueChange={(v) => v && setValue("healthUnitId", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {healthUnitsQuery.data?.data.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.healthUnitId && <p className="text-xs text-destructive">{errors.healthUnitId.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="serviceDate">Data do atendimento</Label>
                <Input id="serviceDate" type="date" {...register("serviceDate")} />
                {errors.serviceDate && <p className="text-xs text-destructive">{errors.serviceDate.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="totalTickets">Quantidade de fichas</Label>
                <Input
                  id="totalTickets"
                  type="number"
                  min={1}
                  {...register("totalTickets", { valueAsNumber: true })}
                />
                {errors.totalTickets && <p className="text-xs text-destructive">{errors.totalTickets.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="startTime">Horário inicial</Label>
                <Input id="startTime" type="time" {...register("startTime")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endTime">Horário final</Label>
                <Input id="endTime" type="time" {...register("endTime")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Input id="description" {...register("description")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="arrivalInstruction">Instrução de chegada</Label>
              <Textarea id="arrivalInstruction" rows={2} {...register("arrivalInstruction")} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.push("/tickets")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Criar lote
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
