"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Pencil, Trash2, KeyRound } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { PermissionGate } from "@/components/permission-gate"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useToastMutation } from "@/hooks/use-toast-mutation"
import { rolesApi } from "@/lib/api/roles"
import { permissionsApi } from "@/lib/api/permissions"
import { PERMISSIONS } from "@/lib/permissions"
import type { Permission, Role } from "@/types/api"

const formSchema = z.object({
  name: z.string().min(1, "Obrigatório"),
  description: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

function groupLabel(key: string) {
  const [group] = key.split(".")
  const labels: Record<string, string> = {
    users: "Usuários",
    roles: "Perfis",
    permissions: "Permissões",
    patients: "Pacientes",
    specialties: "Especialidades",
    professionals: "Profissionais",
    "health-units": "Unidades de Saúde",
    tickets: "Fichas",
    reports: "Relatórios",
  }
  return labels[group] ?? group
}

export default function RolesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [deleting, setDeleting] = useState<Role | null>(null)
  const [managingPermissions, setManagingPermissions] = useState<Role | null>(null)
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set())

  const rolesQuery = useQuery({
    queryKey: ["roles", { page, search }],
    queryFn: () => rolesApi.list({ page, pageSize: 10, search: search || undefined }),
  })

  const permissionsQuery = useQuery({
    queryKey: ["permissions", "all"],
    queryFn: () => permissionsApi.list(),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(formSchema), defaultValues: { name: "", description: "" } })

  const saveMutation = useToastMutation({
    mutationFn: (data: FormData) =>
      editing ? rolesApi.update(editing.id, data) : rolesApi.create(data),
    successMessage: editing ? "Perfil atualizado" : "Perfil criado",
    invalidateKeys: [["roles"]],
    onSuccess: () => setSheetOpen(false),
  })

  const deleteMutation = useToastMutation({
    mutationFn: (id: string) => rolesApi.remove(id),
    successMessage: "Perfil removido",
    invalidateKeys: [["roles"]],
    onSuccess: () => setDeleting(null),
  })

  const permissionsMutation = useToastMutation({
    mutationFn: (permissionIds: string[]) => rolesApi.setPermissions(managingPermissions!.id, permissionIds),
    successMessage: "Permissões atualizadas",
    invalidateKeys: [["roles"]],
    onSuccess: () => setManagingPermissions(null),
  })

  useEffect(() => {
    if (managingPermissions) {
      setSelectedPermissionIds(new Set(managingPermissions.permissions.map((p) => p.id)))
    }
  }, [managingPermissions])

  function openCreate() {
    setEditing(null)
    reset({ name: "", description: "" })
    setSheetOpen(true)
  }

  function openEdit(role: Role) {
    setEditing(role)
    reset({ name: role.name, description: role.description ?? "" })
    setSheetOpen(true)
  }

  function togglePermission(id: string) {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const groupedPermissions = (permissionsQuery.data?.data ?? []).reduce<Record<string, Permission[]>>(
    (acc, permission) => {
      const key = groupLabel(permission.key)
      acc[key] = acc[key] ? [...acc[key], permission] : [permission]
      return acc
    },
    {},
  )

  return (
    <div>
      <PageHeader
        title="Perfis e Permissões"
        description="Gerencie os perfis de acesso e suas permissões."
        actions={
          <PermissionGate permission={PERMISSIONS.ROLES_CREATE}>
            <Button onClick={openCreate}>
              <Plus className="mr-2 size-4" /> Novo perfil
            </Button>
          </PermissionGate>
        }
      />

      <DataTable<Role>
        data={rolesQuery.data?.data ?? []}
        isLoading={rolesQuery.isLoading}
        searchPlaceholder="Buscar perfil..."
        searchValue={search}
        onSearch={(value) => {
          setSearch(value)
          setPage(1)
        }}
        page={rolesQuery.data?.meta.page ?? 1}
        totalPages={rolesQuery.data?.meta.totalPages ?? 1}
        onPageChange={setPage}
        columns={[
          {
            key: "name",
            header: "Nome",
            cell: (row) => (
              <div className="flex items-center gap-2">
                <span className="font-medium">{row.name}</span>
                {row.isSystem && (
                  <Badge variant="secondary" className="text-[10px]">
                    Sistema
                  </Badge>
                )}
              </div>
            ),
          },
          { key: "description", header: "Descrição", cell: (row) => row.description ?? "—" },
          { key: "permissions", header: "Permissões", cell: (row) => `${row.permissions.length}` },
          {
            key: "actions",
            header: "",
            className: "text-right",
            cell: (row) => (
              <div className="flex justify-end gap-1">
                <PermissionGate permission={PERMISSIONS.ROLES_UPDATE}>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setManagingPermissions(row)}
                    aria-label="Gerenciar permissões"
                  >
                    <KeyRound className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(row)} aria-label="Editar">
                    <Pencil className="size-4" />
                  </Button>
                </PermissionGate>
                <PermissionGate permission={PERMISSIONS.ROLES_DELETE}>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleting(row)}
                    disabled={row.isSystem}
                    aria-label="Remover"
                  >
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
            <SheetTitle>{editing ? "Editar perfil" : "Novo perfil"}</SheetTitle>
          </SheetHeader>
          <form
            onSubmit={handleSubmit((data) => saveMutation.mutate(data))}
            className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" rows={3} {...register("description")} />
            </div>
          </form>
          <SheetFooter>
            <Button onClick={handleSubmit((data) => saveMutation.mutate(data))} disabled={saveMutation.isPending}>
              {editing ? "Salvar alterações" : "Criar perfil"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={!!managingPermissions} onOpenChange={(open) => !open && setManagingPermissions(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Permissões — {managingPermissions?.name}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 space-y-5 overflow-y-auto px-4">
            {Object.entries(groupedPermissions).map(([group, perms]) => (
              <div key={group} className="space-y-2">
                <p className="text-sm font-medium">{group}</p>
                <div className="space-y-1.5">
                  {perms.map((permission) => (
                    <label
                      key={permission.id}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Checkbox
                        checked={selectedPermissionIds.has(permission.id)}
                        onCheckedChange={() => togglePermission(permission.id)}
                      />
                      {permission.description}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <SheetFooter>
            <Button
              onClick={() => permissionsMutation.mutate(Array.from(selectedPermissionIds))}
              disabled={permissionsMutation.isPending}
            >
              Salvar permissões
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Remover perfil"
        description={`Tem certeza que deseja remover o perfil ${deleting?.name}?`}
        confirmLabel="Remover"
        destructive
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  )
}
