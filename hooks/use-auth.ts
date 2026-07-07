"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuthStore } from "@/stores/auth.store"
import { authApi } from "@/lib/api/auth"
import { decodeJwtPayload } from "@/lib/jwt"
import { queryClient } from "@/lib/query-client"

export function useAuth() {
  const router = useRouter()
  const { user, setAuth, clear, refreshToken } = useAuthStore()

  async function login(email: string, password: string) {
    // Limpa qualquer dado em cache de uma sessão anterior nesta aba antes de
    // autenticar — sem isso, dados de outro usuário (ex.: fichas de outro
    // profissional) podem aparecer por alguns segundos até o refetch.
    queryClient.clear()
    const response = await authApi.login(email, password)
    const payload = decodeJwtPayload<{ permissions?: string[] }>(response.accessToken)
    setAuth(
      { accessToken: response.accessToken, refreshToken: response.refreshToken },
      response.user,
      payload?.permissions ?? [],
    )
    document.cookie = `access-token=${response.accessToken}; path=/; max-age=900; SameSite=Lax`
    // Profissionais não têm acesso aos relatórios do dashboard — mandamos direto pra fila deles.
    router.push(response.user.professional ? "/queue" : "/dashboard")
  }

  async function logout() {
    try {
      if (refreshToken) await authApi.logout(refreshToken)
    } catch {
      // token pode já ter expirado; segue com o logout local
    }
    clear()
    queryClient.clear()
    document.cookie = "access-token=; path=/; max-age=0"
    router.push("/login")
    toast.success("Logout realizado com sucesso")
  }

  return { user, login, logout }
}
