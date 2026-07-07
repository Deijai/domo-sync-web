"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Pencil, Trash2, Printer } from "lucide-react"
import { toast } from "sonner"
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
import { useToastMutation } from "@/hooks/use-toast-mutation"
import { ApiError } from "@/lib/api/client"
import { patientsApi } from "@/lib/api/patients"
import { ACCOUNT_STATUS_COLOR, ACCOUNT_STATUS_LABEL, GENDER_LABEL } from "@/lib/status-labels"
import { PERMISSIONS } from "@/lib/permissions"
import { openPdfBlob } from "@/lib/open-pdf"
import type { AccountStatus, Gender, Patient } from "@/types/api"

const formSchema = z.object({
  fullName: z.string().min(1, "Obrigatório"),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve ter 11 dígitos"),
  birthDate: z.string().min(1, "Obrigatório"),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "NOT_INFORMED"]),
  rg: z.string().optional(),
  motherName: z.string().optional(),
  fatherName: z.string().optional(),
  susCard: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  password: z.string().optional(),
  zipCode: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  referencePoint: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]),
})

type FormData = z.infer<typeof formSchema>

const emptyForm: FormData = {
  fullName: "",
  cpf: "",
  birthDate: "",
  gender: "NOT_INFORMED",
  status: "ACTIVE",
}

export default function PatientsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Patient | null>(null)
  const [deleting, setDeleting] = useState<Patient | null>(null)
  const [printingId, setPrintingId] = useState<string | null>(null)

  const patientsQuery = useQuery({
    queryKey: ["patients", { page, search }],
    queryFn: () => patientsApi.list({ page, pageSize: 10, search: search || undefined }),
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
      const payload = { ...data, password: data.password || undefined, email: data.email || undefined }
      return editing ? patientsApi.update(editing.id, payload) : patientsApi.create(payload)
    },
    successMessage: editing ? "Paciente atualizado" : "Paciente criado",
    invalidateKeys: [["patients"]],
    onSuccess: () => setSheetOpen(false),
  })

  const deleteMutation = useToastMutation({
    mutationFn: (id: string) => patientsApi.remove(id),
    successMessage: "Paciente removido",
    invalidateKeys: [["patients"]],
    onSuccess: () => setDeleting(null),
  })

  async function handlePrint(patient: Patient) {
    setPrintingId(patient.id)
    try {
      const blob = await patientsApi.print(patient.id)
      openPdfBlob(blob)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao gerar PDF do cadastro")
    } finally {
      setPrintingId(null)
    }
  }

  function openCreate() {
    setEditing(null)
    reset(emptyForm)
    setSheetOpen(true)
  }

  function openEdit(patient: Patient) {
    setEditing(patient)
    reset({
      fullName: patient.fullName,
      cpf: patient.cpf,
      birthDate: patient.birthDate.slice(0, 10),
      gender: patient.gender,
      rg: patient.rg ?? "",
      motherName: patient.motherName ?? "",
      fatherName: patient.fatherName ?? "",
      susCard: patient.susCard ?? "",
      phone: patient.phone ?? "",
      whatsapp: patient.whatsapp ?? "",
      email: patient.email ?? "",
      password: "",
      zipCode: patient.zipCode ?? "",
      state: patient.state ?? "",
      city: patient.city ?? "",
      neighborhood: patient.neighborhood ?? "",
      street: patient.street ?? "",
      number: patient.number ?? "",
      complement: patient.complement ?? "",
      referencePoint: patient.referencePoint ?? "",
      status: patient.status,
    })
    setSheetOpen(true)
  }

  const gender = watch("gender")
  const status = watch("status")

  return (
    <div>
      <PageHeader
        title="Pacientes"
        description="Gerencie o cadastro de pacientes."
        actions={
          <PermissionGate permission={PERMISSIONS.PATIENTS_CREATE}>
            <Button onClick={openCreate}>
              <Plus className="mr-2 size-4" /> Novo paciente
            </Button>
          </PermissionGate>
        }
      />

      <DataTable<Patient>
        data={patientsQuery.data?.data ?? []}
        isLoading={patientsQuery.isLoading}
        searchPlaceholder="Buscar por nome, CPF ou e-mail..."
        searchValue={search}
        onSearch={(value) => {
          setSearch(value)
          setPage(1)
        }}
        page={patientsQuery.data?.meta.page ?? 1}
        totalPages={patientsQuery.data?.meta.totalPages ?? 1}
        onPageChange={setPage}
        columns={[
          { key: "fullName", header: "Nome", cell: (row) => row.fullName },
          { key: "cpf", header: "CPF", cell: (row) => row.cpf },
          { key: "phone", header: "Telefone", cell: (row) => row.phone ?? "—" },
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
                <PermissionGate permission={PERMISSIONS.PATIENTS_PRINT}>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handlePrint(row)}
                    disabled={printingId === row.id}
                    aria-label="Imprimir cadastro"
                  >
                    <Printer className="size-4" />
                  </Button>
                </PermissionGate>
                <PermissionGate permission={PERMISSIONS.PATIENTS_UPDATE}>
                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(row)} aria-label="Editar">
                    <Pencil className="size-4" />
                  </Button>
                </PermissionGate>
                <PermissionGate permission={PERMISSIONS.PATIENTS_DELETE}>
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
            <SheetTitle>{editing ? "Editar paciente" : "Novo paciente"}</SheetTitle>
          </SheetHeader>
          <form
            onSubmit={handleSubmit((data) => saveMutation.mutate(data))}
            className="flex flex-1 flex-col gap-5 overflow-y-auto px-4"
          >
            <section className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Dados pessoais</p>
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
                  <Label htmlFor="rg">RG</Label>
                  <Input id="rg" {...register("rg")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="birthDate">Nascimento</Label>
                  <Input id="birthDate" type="date" {...register("birthDate")} />
                  {errors.birthDate && <p className="text-xs text-destructive">{errors.birthDate.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Sexo</Label>
                  <Select value={gender} onValueChange={(value) => value && setValue("gender", value as Gender)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(GENDER_LABEL) as Gender[]).map((key) => (
                        <SelectItem key={key} value={key}>
                          {GENDER_LABEL[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="motherName">Nome da mãe</Label>
                  <Input id="motherName" {...register("motherName")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fatherName">Nome do pai</Label>
                  <Input id="fatherName" {...register("fatherName")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="susCard">Cartão SUS</Label>
                  <Input id="susCard" {...register("susCard")} />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Contato e acesso</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" {...register("phone")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input id="whatsapp" {...register("whatsapp")} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" {...register("email")} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="password">{editing ? "Nova senha (opcional)" : "Senha"}</Label>
                  <Input id="password" type="password" {...register("password")} />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Endereço</p>
              <div className="grid grid-cols-2 gap-3">
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
                  <Label htmlFor="referencePoint">Ponto de referência</Label>
                  <Input id="referencePoint" {...register("referencePoint")} />
                </div>
              </div>
            </section>

            <section className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(value) => value && setValue("status", value as AccountStatus)}>
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
            </section>
          </form>
          <SheetFooter>
            <Button onClick={handleSubmit((data) => saveMutation.mutate(data))} disabled={saveMutation.isPending}>
              {editing ? "Salvar alterações" : "Criar paciente"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Remover paciente"
        description={`Tem certeza que deseja remover ${deleting?.fullName}?`}
        confirmLabel="Remover"
        destructive
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  )
}
