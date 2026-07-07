"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { DataTable } from "@/components/data-table"
import { StatusBadge } from "@/components/status-badge"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { PermissionGate } from "@/components/permission-gate"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useToastMutation } from "@/hooks/use-toast-mutation"
import { specialtiesApi } from "@/lib/api/specialties"
import { SIMPLE_STATUS_COLOR, SIMPLE_STATUS_LABEL } from "@/lib/status-labels"
import { PERMISSIONS } from "@/lib/permissions"
import type { SimpleStatus, Specialty } from "@/types/api"

const formSchema = z.object({
  code: z.string().min(1, "Obrigatório"),
  name: z.string().min(1, "Obrigatório"),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
})

type FormData = z.infer<typeof formSchema>
const emptyForm: FormData = { code: "", name: "", description: "", status: "ACTIVE" }

export default function SpecialtiesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Specialty | null>(null)
  const [deleting, setDeleting] = useState<Specialty | null>(null)

  const query = useQuery({
    queryKey: ["specialties", { page, search }],
    queryFn: () => specialtiesApi.list({ page, pageSize: 10, search: search || undefined }),
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(formSchema), defaultValues: emptyForm })

  const saveMutation = useToastMutation({
    mutationFn: (data: FormData) =>
      editing ? specialtiesApi.update(editing.id, data) : specialtiesApi.create(data),
    successMessage: editing ? "Especialidade atualizada" : "Especialidade criada",
    invalidateKeys: [["specialties"]],
    onSuccess: () => setSheetOpen(false),
  })

  const deleteMutation = useToastMutation({
    mutationFn: (id: string) => specialtiesApi.remove(id),
    successMessage: "Especialidade removida",
    invalidateKeys: [["specialties"]],
    onSuccess: () => setDeleting(null),
  })

  function openCreate() {
    setEditing(null)
    reset(emptyForm)
    setSheetOpen(true)
  }

  function openEdit(specialty: Specialty) {
    setEditing(specialty)
    reset({
      code: specialty.code,
      name: specialty.name,
      description: specialty.description ?? "",
      status: specialty.status,
    })
    setSheetOpen(true)
  }

  const status = watch("status")

  return (
    <div>
      <PageHeader
        title="Especialidades"
        description="Gerencie as especialidades médicas."
        actions={
          <PermissionGate permission={PERMISSIONS.SPECIALTIES_CREATE}>
            <Button onClick={openCreate}>
              <Plus className="mr-2 size-4" /> Nova especialidade
            </Button>
          </PermissionGate>
        }
      />

      <DataTable<Specialty>
        data={query.data?.data ?? []}
        isLoading={query.isLoading}
        searchPlaceholder="Buscar especialidade..."
        searchValue={search}
        onSearch={(value) => {
          setSearch(value)
          setPage(1)
        }}
        page={query.data?.meta.page ?? 1}
        totalPages={query.data?.meta.totalPages ?? 1}
        onPageChange={setPage}
        columns={[
          { key: "code", header: "Código", cell: (row) => row.code },
          { key: "name", header: "Nome", cell: (row) => row.name },
          { key: "description", header: "Descrição", cell: (row) => row.description ?? "—" },
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
                <PermissionGate permission={PERMISSIONS.SPECIALTIES_UPDATE}>
                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(row)} aria-label="Editar">
                    <Pencil className="size-4" />
                  </Button>
                </PermissionGate>
                <PermissionGate permission={PERMISSIONS.SPECIALTIES_DELETE}>
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
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editing ? "Editar especialidade" : "Nova especialidade"}</SheetTitle>
          </SheetHeader>
          <form
            onSubmit={handleSubmit((data) => saveMutation.mutate(data))}
            className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="code">Código</Label>
              <Input id="code" {...register("code")} />
              {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" rows={3} {...register("description")} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(value) => value && setValue("status", value as SimpleStatus)}>
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
          </form>
          <SheetFooter>
            <Button onClick={handleSubmit((data) => saveMutation.mutate(data))} disabled={saveMutation.isPending}>
              {editing ? "Salvar alterações" : "Criar especialidade"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Remover especialidade"
        description={`Tem certeza que deseja remover ${deleting?.name}?`}
        confirmLabel="Remover"
        destructive
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  )
}
