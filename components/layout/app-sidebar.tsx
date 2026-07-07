"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  UserRound,
  Stethoscope,
  BriefcaseMedical,
  Building2,
  Ticket,
  Volume2,
  BarChart3,
  Settings,
  LogOut,
  HeartPulse,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/use-auth"
import { useAuthStore } from "@/stores/auth.store"
import { PERMISSIONS } from "@/lib/permissions"

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", permission: null },
  { label: "Usuários", icon: Users, href: "/users", permission: PERMISSIONS.USERS_READ },
  { label: "Perfis e Permissões", icon: ShieldCheck, href: "/roles", permission: PERMISSIONS.ROLES_READ },
  { label: "Pacientes", icon: UserRound, href: "/patients", permission: PERMISSIONS.PATIENTS_READ },
  { label: "Especialidades", icon: Stethoscope, href: "/specialties", permission: PERMISSIONS.SPECIALTIES_READ },
  {
    label: "Profissionais",
    icon: BriefcaseMedical,
    href: "/professionals",
    permission: PERMISSIONS.PROFESSIONALS_READ,
  },
  { label: "Unidades de Saúde", icon: Building2, href: "/health-units", permission: PERMISSIONS.HEALTH_UNITS_READ },
  { label: "Fichas", icon: Ticket, href: "/tickets", permission: PERMISSIONS.TICKETS_READ },
  {
    label: "Fila de Atendimento",
    icon: Volume2,
    href: "/queue",
    permission: [PERMISSIONS.TICKETS_CALL, PERMISSIONS.TICKETS_ATTEND],
  },
  { label: "Relatórios", icon: BarChart3, href: "/reports", permission: PERMISSIONS.REPORTS_READ },
  { label: "Configurações", icon: Settings, href: "/settings", permission: null },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const permissions = useAuthStore((state) => state.permissions)

  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "AD"

  const visibleItems = navItems.filter((item) => {
    if (!item.permission) return true
    const required = Array.isArray(item.permission) ? item.permission : [item.permission]
    return required.some((permission) => permissions.includes(permission))
  })

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HeartPulse className="size-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">Poupa Fila DMA</span>
            <span className="text-xs text-muted-foreground">Painel Admin</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarMenu>
            {visibleItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={active}
                    className="flex items-center gap-2"
                  >
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-3">
        <div className="flex items-center gap-3 rounded-lg p-2">
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name ?? "Usuário"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.role?.name ?? "Admin"}</p>
          </div>
          <button
            onClick={logout}
            className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
            aria-label="Sair"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
