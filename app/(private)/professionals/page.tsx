"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { DataTable } from "@/components/data-table"
import { StatusBadge } from "@/components/status-badge"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { PermissionGate } from "@/components/permission-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ApiError } from "@/lib/api/client"
import { professionalsApi } from "@/lib/api/professionals"
import { specialtiesApi } from "@/lib/api/specialties"
import { SIMPLE_STATUS_COLOR, SIMPLE_STATUS_LABEL } from "@/lib/status-labels"
import { PERMISSIONS } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import type { Professional, SimpleStatus } from "@/types/api"

const formSchema = z.object({
  fullName: z.string().min(1, "Obrigatório"),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve ter 11 dígitos"),
  councilType: z.string().optional(),
  councilNumber: z.string().optional(),
  councilState: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"]),
})

type FormData = z.infer<typeof formSchema>
const emptyForm: FormData = { fullName: "", cpf: "", status: "ACTIVE" }

export default function ProfessionalsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Professional | null>(null)
  const [deleting, setDeleting] = useState<Professional | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedSpecialtyIds, setSelectedSpecialtyIds] = useState<Set<string>>(new Set())

  const query = useQuery({
    queryKey: ["professionals", { page, search }],
    queryFn: () => professionalsApi.list({ page, pageSize: 10, search: search || undefined }),
  })

  const specialtiesQuery = useQuery({
    queryKey: ["specialties", "all"],
    queryFn: () => specialtiesApi.list({ pageSize: 100 }),
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(formSchema), defaultValues: emptyForm })

  function openCreate() {
    setEditing(null)
    reset(emptyForm)
    setSelectedSpecialtyIds(new Set())
    setSheetOpen(true)
  }

  function openEdit(professional: Professional) {
    setEditing(professional)
    reset({
      fullName: professional.fullName,
      cpf: professional.cpf,
      councilType: professional.councilType ?? "",
      councilNumber: professional.councilNumber ?? "",
      councilState: professional.councilState ?? "",
      phone: professional.phone ?? "",
      email: professional.email ?? "",
      status: professional.status,
    })
    setSelectedSpecialtyIds(new Set(professional.specialties.map((s) => s.id)))
    setSheetOpen(true)
  }

  function toggleSpecialty(id: string) {
    setSelectedSpecialtyIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function onSubmit(data: FormData) {
    setSaving(true)
    try {
      const payload = { ...data, email: data.email || undefined }
      const professional = editing
        ? await professionalsApi.update(editing.id, payload)
        : await professionalsApi.create(payload)
      await professionalsApi.setSpecialties(professional.id, Array.from(selectedSpecialtyIds))
      toast.success(editing ? "Profissional atualizado" : "Profissional criado")
      queryClient.invalidateQueries({ queryKey: ["professionals"] })
      setSheetOpen(false)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar profissional")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    setSaving(true)
    try {
      await professionalsApi.remove(deleting.id)
      toast.success("Profissional removido")
      queryClient.invalidateQueries({ queryKey: ["professionals"] })
      setDeleting(null)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover profissional")
    } finally {
      setSaving(false)
    }
  }

  const status = watch("status")

  return (
    <div>
      <PageHeader
        title="Profissionais"
        description="Gerencie os profissionais e suas especialidades."
        actions={
          <PermissionGate permission={PERMISSIONS.PROFESSIONALS_CREATE}>
            <Button onClick={openCreate}>
              <Plus className="mr-2 size-4" /> Novo profissional
            </Button>
          </PermissionGate>
        }
      />

      <DataTable<Professional>
        data={query.data?.data ?? []}
        isLoading={query.isLoading}
        searchPlaceholder="Buscar por nome ou CPF..."
        searchValue={search}
        onSearch={(value) => {
          setSearch(value)
          setPage(1)
        }}
        page={query.data?.meta.page ?? 1}
        totalPages={query.data?.meta.totalPages ?? 1}
        onPageChange={setPage}
        columns={[
          { key: "fullName", header: "Nome", cell: (row) => row.fullName },
          {
            key: "specialties",
            header: "Especialidades",
            cell: (row) => (
              <div className="flex flex-wrap gap-1">
                {row.specialties.length === 0 ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  row.specialties.map((s) => (
                    <Badge key={s.id} variant="secondary" className="text-[10px]">
                      {s.name}
                    </Badge>
                  ))
                )}
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (row) => (
              <StatusBadge label={SIMPLE_STATUS_LABEL[row.status]} className={SIMPLE_STATUS_COLOR[row.status]} />
            ),
          },
          {
            key: "actions",
            header: "",
            className: "text-right",
            cell: (row) => (
              <div className="flex justify-end gap-1">
                <PermissionGate permission={PERMISSIONS.PROFESSIONALS_UPDATE}>
                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(row)} aria-label="Editar">
                    <Pencil className="size-4" />
                  </Button>
                </PermissionGate>
                <PermissionGate permission={PERMISSIONS.PROFESSIONALS_DELETE}>
                  <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(row)} aria-label="Remover">
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </PermissionGate>
              </div>
            ),
          },
        ]}
      />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editing ? "Editar profissional" : "Novo profissional"}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="fullName">Nome completo</Label>
                <Input id="fullName" {...register("fullName")} />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" {...register("cpf")} disabled={!!editing} />
                {errors.cpf && <p className="text-xs text-destructive">{errors.cpf.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" {...register("phone")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="councilType">Conselho</Label>
                <Input id="councilType" placeholder="CRM" {...register("councilType")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="councilNumber">Número do conselho</Label>
                <Input id="councilNumber" {...register("councilNumber")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="councilState">UF do conselho</Label>
                <Input id="councilState" placeholder="SP" {...register("councilState")} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => value && setValue("status", value as SimpleStatus)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SIMPLE_STATUS_LABEL) as SimpleStatus[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {SIMPLE_STATUS_LABEL[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Especialidades</Label>
              <div className="flex flex-wrap gap-2">
                {specialtiesQuery.data?.data.map((specialty) => {
                  const active = selectedSpecialtyIds.has(specialty.id)
                  return (
                    <button
                      key={specialty.id}
                      type="button"
                      onClick={() => toggleSpecialty(specialty.id)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {specialty.name}
                    </button>
                  )
                })}
              </div>
            </div>
          </form>
          <SheetFooter>
            <Button onClick={handleSubmit(onSubmit)} disabled={saving}>
              {editing ? "Salvar alterações" : "Criar profissional"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Remover profissional"
        description={`Tem certeza que deseja remover ${deleting?.fullName}?`}
        confirmLabel="Remover"
        destructive
        isLoading={saving}
        onConfirm={handleDelete}
      />
    </div>
  )
}
