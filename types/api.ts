export type AccountStatus = "ACTIVE" | "INACTIVE" | "BLOCKED"
export type SimpleStatus = "ACTIVE" | "INACTIVE"
export type Gender = "MALE" | "FEMALE" | "OTHER" | "NOT_INFORMED"
export type TicketBatchStatus = "ACTIVE" | "CANCELED" | "FINISHED"
export type TicketStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "CONFIRMED"
  | "ATTENDED"
  | "CANCELED"
  | "NO_SHOW"
  | "TRANSFERRED"
  | "EXPIRED"

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResult<T> {
  data: T[]
  meta: PaginationMeta
}

export interface RoleSummary {
  id: string
  name: string
}

export interface User {
  id: string
  name: string
  email: string
  status: AccountStatus
  role: RoleSummary
  createdAt: string
  updatedAt: string
}

export interface Permission {
  id: string
  key: string
  description: string
}

export interface Role {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  permissions: Permission[]
  createdAt: string
  updatedAt: string
}

export interface Patient {
  id: string
  fullName: string
  cpf: string
  rg: string | null
  birthDate: string
  gender: Gender
  motherName: string | null
  fatherName: string | null
  susCard: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  zipCode: string | null
  state: string | null
  city: string | null
  neighborhood: string | null
  street: string | null
  number: string | null
  complement: string | null
  referencePoint: string | null
  status: AccountStatus
  createdAt: string
  updatedAt: string
}

export interface Specialty {
  id: string
  code: string
  name: string
  description: string | null
  status: SimpleStatus
  createdAt: string
  updatedAt: string
}

export interface SpecialtySummary {
  id: string
  name: string
}

export interface Professional {
  id: string
  fullName: string
  cpf: string
  councilType: string | null
  councilNumber: string | null
  councilState: string | null
  phone: string | null
  email: string | null
  status: SimpleStatus
  specialties: SpecialtySummary[]
  createdAt: string
  updatedAt: string
}

export interface HealthUnit {
  id: string
  name: string
  code: string
  phone: string | null
  zipCode: string | null
  state: string | null
  city: string | null
  neighborhood: string | null
  street: string | null
  number: string | null
  complement: string | null
  status: SimpleStatus
  cnpj: string | null
  logoUrl: string | null
  institutionName: string | null
  stateName: string | null
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface TicketBatch {
  id: string
  description: string | null
  specialtyId: string
  specialty: Specialty
  professionalId: string
  professional: Professional
  healthUnitId: string
  healthUnit: HealthUnit
  serviceDate: string
  totalTickets: number
  startTime: string | null
  endTime: string | null
  arrivalInstruction: string
  status: TicketBatchStatus
  createdAt: string
  updatedAt: string
}

export interface TicketBatchDetail extends TicketBatch {
  ticketsByStatus: Record<string, number>
}

export interface Ticket {
  id: string
  ticketNumber: number
  batchId: string | null
  specialtyId: string
  specialty?: Specialty
  professionalId: string
  professional?: Professional
  healthUnitId: string
  healthUnit?: HealthUnit
  patientId: string | null
  patient?: Patient | null
  batch?: TicketBatch | null
  serviceDate: string
  scheduledTime: string | null
  arrivalInstruction: string
  status: TicketStatus
  reservedAt: string | null
  confirmedAt: string | null
  attendedAt: string | null
  canceledAt: string | null
  canceledReason: string | null
  transferredAt: string | null
  createdAt: string
  updatedAt: string
}

export interface TicketMovement {
  id: string
  ticketId: string
  fromStatus: TicketStatus | null
  toStatus: TicketStatus
  action: string
  description: string | null
  performedByUserId: string | null
  performedByPatientId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse extends AuthTokens {
  user: User
  type: "USER" | "PATIENT"
}

export interface ReportsSummary {
  total: number
  byStatus: Record<TicketStatus, number>
  attendanceRate: number
}

export interface AttendanceRate {
  attended: number
  noShow: number
  totalConcluded: number
  attendanceRate: number
  noShowRate: number
}
