"use client"

import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"

const labels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/users": "Usuários",
  "/roles": "Perfis e Permissões",
  "/patients": "Pacientes",
  "/specialties": "Especialidades",
  "/professionals": "Profissionais",
  "/health-units": "Unidades de Saúde",
  "/tickets": "Fichas",
  "/reports": "Relatórios",
  "/settings": "Configurações",
}

export function Header() {
  const pathname = usePathname()
  const key = "/" + pathname.split("/")[1]
  const title = labels[key] ?? "Poupa Fila DMA"

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <span className="font-medium">{title}</span>
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  )
}
