export const PERMISSIONS = {
  USERS_CREATE: "users.create",
  USERS_READ: "users.read",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",

  ROLES_CREATE: "roles.create",
  ROLES_READ: "roles.read",
  ROLES_UPDATE: "roles.update",
  ROLES_DELETE: "roles.delete",

  PERMISSIONS_READ: "permissions.read",

  PATIENTS_CREATE: "patients.create",
  PATIENTS_READ: "patients.read",
  PATIENTS_UPDATE: "patients.update",
  PATIENTS_DELETE: "patients.delete",
  PATIENTS_PRINT: "patients.print",

  SPECIALTIES_CREATE: "specialties.create",
  SPECIALTIES_READ: "specialties.read",
  SPECIALTIES_UPDATE: "specialties.update",
  SPECIALTIES_DELETE: "specialties.delete",

  PROFESSIONALS_CREATE: "professionals.create",
  PROFESSIONALS_READ: "professionals.read",
  PROFESSIONALS_UPDATE: "professionals.update",
  PROFESSIONALS_DELETE: "professionals.delete",

  HEALTH_UNITS_CREATE: "health-units.create",
  HEALTH_UNITS_READ: "health-units.read",
  HEALTH_UNITS_UPDATE: "health-units.update",
  HEALTH_UNITS_DELETE: "health-units.delete",

  TICKETS_CREATE: "tickets.create",
  TICKETS_READ: "tickets.read",
  TICKETS_UPDATE: "tickets.update",
  TICKETS_RESERVE: "tickets.reserve",
  TICKETS_CANCEL: "tickets.cancel",
  TICKETS_TRANSFER: "tickets.transfer",
  TICKETS_CHANGE_DATE: "tickets.change-date",
  TICKETS_CONFIRM_PRESENCE: "tickets.confirm-presence",
  TICKETS_ATTEND: "tickets.attend",
  TICKETS_NO_SHOW: "tickets.no-show",
  TICKETS_REOPEN: "tickets.reopen",
  TICKETS_PRINT: "tickets.print",

  REPORTS_READ: "reports.read",
} as const

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
