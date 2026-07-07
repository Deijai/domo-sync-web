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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useToastMutation } from "@/hooks/use-toast-mutation"
import { usersApi } from "@/lib/api/users"
import { rolesApi } from "@/lib/api/roles"
import { ACCOUNT_STATUS_COLOR, ACCOUNT_STATUS_LABEL } from "@/lib/status-labels"
import { PERMISSIONS } from "@/lib/permissions"
import type { AccountStatus, User } from "@/types/api"

const formSchema = z.object({
  name: z.string().min(1, "Obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: z.string().optional(),
  roleId: z.string().min(1, "Selecione um perfil"),
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]),
})

type FormData = z.infer<typeof formSchema>

const emptyForm: FormData = { name: "", email: "", password: "", roleId: "", status: "ACTIVE" }

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [deleting, setDeleting] = useState<User | null>(null)

  const usersQuery = useQuery({
    queryKey: ["users", { page, search }],
    queryFn: () => usersApi.list({ page, pageSize: 10, search: search || undefined }),
  })

  const rolesQuery = useQuery({
    queryKey: ["roles", "all"],
    queryFn: () => rolesApi.list({ pageSize: 100 }),
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
    mutationFn: (data: FormData) => {
      const payload = { ...data, password: data.password || undefined }
      return editing ? usersApi.update(editing.id, payload) : usersApi.create({ ...payload, roleId: data.roleId })
    },
    successMessage: editing ? "Usuário atualizado" : "Usuário criado",
    invalidateKeys: [["users"]],
    onSuccess: () => setSheetOpen(false),
  })

  const deleteMutation = useToastMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    successMessage: "Usuário removido",
    invalidateKeys: [["users"]],
    onSuccess: () => setDeleting(null),
  })

  function openCreate() {
    setEditing(null)
    reset(emptyForm)
    setSheetOpen(true)
  }

  function openEdit(user: User) {
    setEditing(user)
    reset({ name: user.name, email: user.email, password: "", roleId: user.role.id, status: user.status })
    setSheetOpen(true)
  }

  const status = watch("status")
  const roleId = watch("roleId")

  return (
    <div>
      <PageHeader
        title="Usuários"
        description="Gerencie os usuários internos do sistema."
        actions={
          <PermissionGate permission={PERMISSIONS.USERS_CREATE}>
            <Button onClick={openCreate}>
              <Plus className="mr-2 size-4" /> Novo usuário
            </Button>
          </PermissionGate>
        }
      />

      <DataTable<User>
        data={usersQuery.data?.data ?? []}
        isLoading={usersQuery.isLoading}
        searchPlaceholder="Buscar por nome ou e-mail..."
        searchValue={search}
        onSearch={(value) => {
          setSearch(value)
          setPage(1)
        }}
        page={usersQuery.data?.meta.page ?? 1}
        totalPages={usersQuery.data?.meta.totalPages ?? 1}
        onPageChange={setPage}
        columns={[
          { key: "name", header: "Nome", cell: (row) => row.name },
          { key: "email", header: "E-mail", cell: (row) => row.email },
          { key: "role", header: "Perfil", cell: (row) => row.role.name },
          {
            key: "status",
            header: "Status",
            cell: (row) => (
              <StatusBadge label={ACCOUNT_STATUS_LABEL[row.status]} className={ACCOUNT_STATUS_COLOR[row.status]} />
            ),
          },
          {
            key: "actions",
            header: "",
            className: "text-right",
            cell: (row) => (
              <div className="flex justify-end gap-1">
                <PermissionGate permission={PERMISSIONS.USERS_UPDATE}>
                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(row)} aria-label="Editar">
                    <Pencil className="size-4" />
                  </Button>
                </PermissionGate>
                <PermissionGate permission={PERMISSIONS.USERS_DELETE}>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleting(row)}
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
            <SheetTitle>{editing ? "Editar usuário" : "Novo usuário"}</SheetTitle>
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
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{editing ? "Nova senha (opcional)" : "Senha"}</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Perfil</Label>
              <Select value={roleId} onValueChange={(value) => value && setValue("roleId", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um perfil" />
                </SelectTrigger>
                <SelectContent>
                  {rolesQuery.data?.data.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.roleId && <p className="text-xs text-destructive">{errors.roleId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(value) => value && setValue("status", value as AccountStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ACCOUNT_STATUS_LABEL) as AccountStatus[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {ACCOUNT_STATUS_LABEL[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </form>
          <SheetFooter>
            <Button onClick={handleSubmit((data) => saveMutation.mutate(data))} disabled={saveMutation.isPending}>
              {editing ? "Salvar alterações" : "Criar usuário"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Remover usuário"
        description={`Tem certeza que deseja remover ${deleting?.name}? Essa ação pode ser revertida por um administrador.`}
        confirmLabel="Remover"
        destructive
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  )
}
