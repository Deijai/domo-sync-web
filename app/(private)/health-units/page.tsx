"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Pencil, Trash2, MonitorPlay } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { DataTable } from "@/components/data-table"
import { StatusBadge } from "@/components/status-badge"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { PermissionGate } from "@/components/permission-gate"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { useToastMutation } from "@/hooks/use-toast-mutation"
import { healthUnitsApi } from "@/lib/api/health-units"
import { SIMPLE_STATUS_COLOR, SIMPLE_STATUS_LABEL } from "@/lib/status-labels"
import { PERMISSIONS } from "@/lib/permissions"
import type { HealthUnit, SimpleStatus } from "@/types/api"

const formSchema = z.object({
  name: z.string().min(1, "Obrigatório"),
  code: z.string().min(1, "Obrigatório"),
  phone: z.string().optional(),
  zipCode: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  cnpj: z.string().optional(),
  logoUrl: z.string().optional(),
  institutionName: z.string().optional(),
  stateName: z.string().optional(),
  isDefault: z.boolean().optional(),
})

type FormData = z.infer<typeof formSchema>
const emptyForm: FormData = { name: "", code: "", status: "ACTIVE", isDefault: false }

export default function HealthUnitsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<HealthUnit | null>(null)
  const [deleting, setDeleting] = useState<HealthUnit | null>(null)

  const query = useQuery({
    queryKey: ["health-units", { page, search }],
    queryFn: () => healthUnitsApi.list({ page, pageSize: 10, search: search || undefined }),
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
      editing ? healthUnitsApi.update(editing.id, data) : healthUnitsApi.create(data),
    successMessage: editing ? "Unidade atualizada" : "Unidade criada",
    invalidateKeys: [["health-units"]],
    onSuccess: () => setSheetOpen(false),
  })

  const deleteMutation = useToastMutation({
    mutationFn: (id: string) => healthUnitsApi.remove(id),
    successMessage: "Unidade removida",
    invalidateKeys: [["health-units"]],
    onSuccess: () => setDeleting(null),
  })

  function openCreate() {
    setEditing(null)
    reset(emptyForm)
    setSheetOpen(true)
  }

  function openEdit(unit: HealthUnit) {
    setEditing(unit)
    reset({
      name: unit.name,
      code: unit.code,
      phone: unit.phone ?? "",
      zipCode: unit.zipCode ?? "",
      state: unit.state ?? "",
      city: unit.city ?? "",
      neighborhood: unit.neighborhood ?? "",
      street: unit.street ?? "",
      number: unit.number ?? "",
      complement: unit.complement ?? "",
      status: unit.status,
      cnpj: unit.cnpj ?? "",
      logoUrl: unit.logoUrl ?? "",
      institutionName: unit.institutionName ?? "",
      stateName: unit.stateName ?? "",
      isDefault: unit.isDefault,
    })
    setSheetOpen(true)
  }

  const status = watch("status")
  const isDefault = watch("isDefault")

  return (
    <div>
      <PageHeader
        title="Unidades de Saúde"
        description="Gerencie as unidades de atendimento."
        actions={
          <PermissionGate permission={PERMISSIONS.HEALTH_UNITS_CREATE}>
            <Button onClick={openCreate}>
              <Plus className="mr-2 size-4" /> Nova unidade
            </Button>
          </PermissionGate>
        }
      />

      <DataTable<HealthUnit>
        data={query.data?.data ?? []}
        isLoading={query.isLoading}
        searchPlaceholder="Buscar unidade..."
        searchValue={search}
        onSearch={(value) => {
          setSearch(value)
          setPage(1)
        }}
        page={query.data?.meta.page ?? 1}
        totalPages={query.data?.meta.totalPages ?? 1}
        onPageChange={setPage}
        columns={[
          { key: "name", header: "Nome", cell: (row) => row.name },
          { key: "code", header: "Código", cell: (row) => row.code },
          { key: "city", header: "Cidade", cell: (row) => row.city ?? "—" },
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
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => window.open(`/painel/${row.id}`, "_blank", "noopener,noreferrer")}
                  aria-label="Abrir painel"
                  title="Abrir painel de senhas desta unidade"
                >
                  <MonitorPlay className="size-4" />
                </Button>
                <PermissionGate permission={PERMISSIONS.HEALTH_UNITS_UPDATE}>
                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(row)} aria-label="Editar">
                    <Pencil className="size-4" />
                  </Button>
                </PermissionGate>
                <PermissionGate permission={PERMISSIONS.HEALTH_UNITS_DELETE}>
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
            <SheetTitle>{editing ? "Editar unidade" : "Nova unidade"}</SheetTitle>
          </SheetHeader>
          <form
            onSubmit={handleSubmit((data) => saveMutation.mutate(data))}
            className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="code">Código</Label>
                <Input id="code" {...register("code")} />
                {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" {...register("phone")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="zipCode">CEP</Label>
                <Input id="zipCode" {...register("zipCode")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state">Estado</Label>
                <Input id="state" {...register("state")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" {...register("city")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input id="neighborhood" {...register("neighborhood")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="street">Rua</Label>
                <Input id="street" {...register("street")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="number">Número</Label>
                <Input id="number" {...register("number")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="complement">Complemento</Label>
                <Input id="complement" {...register("complement")} />
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
            </div>

            <div className="space-y-3 border-t pt-3">
              <p className="text-sm font-medium">Timbrado de documentos</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" {...register("cnpj")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="logoUrl">URL do logo</Label>
                  <Input id="logoUrl" {...register("logoUrl")} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="institutionName">Nome da instituição</Label>
                  <Input id="institutionName" placeholder="Prefeitura Municipal de..." {...register("institutionName")} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="stateName">Estado (exibido no timbrado)</Label>
                  <Input id="stateName" placeholder="Estado de São Paulo" {...register("stateName")} />
                </div>
                <div className="col-span-2 flex items-center justify-between">
                  <div>
                    <Label htmlFor="isDefault">Unidade padrão</Label>
                    <p className="text-xs text-muted-foreground">
                      Usada no timbrado de documentos de pacientes sem ficha associada.
                    </p>
                  </div>
                  <Switch
                    id="isDefault"
                    checked={!!isDefault}
                    onCheckedChange={(checked) => setValue("isDefault", checked)}
                  />
                </div>
              </div>
            </div>
          </form>
          <SheetFooter>
            <Button onClick={handleSubmit((data) => saveMutation.mutate(data))} disabled={saveMutation.isPending}>
              {editing ? "Salvar alterações" : "Criar unidade"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Remover unidade"
        description={`Tem certeza que deseja remover ${deleting?.name}?`}
        confirmLabel="Remover"
        destructive
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  )
}
