import { useAuthStore } from "@/stores/auth.store"
import { decodeJwtPayload } from "@/lib/jwt"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333"

function readAuthStorage(): { accessToken: string | null; refreshToken: string | null } {
  if (typeof window === "undefined") return { accessToken: null, refreshToken: null }
  try {
    const raw = localStorage.getItem("auth-storage")
    if (!raw) return { accessToken: null, refreshToken: null }
    const parsed = JSON.parse(raw)
    return {
      accessToken: parsed?.state?.accessToken ?? null,
      refreshToken: parsed?.state?.refreshToken ?? null,
    }
  } catch {
    return { accessToken: null, refreshToken: null }
  }
}

function writeTokens(accessToken: string, refreshToken: string) {
  if (typeof window === "undefined") return
  try {
    const raw = localStorage.getItem("auth-storage")
    const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 }
    const payload = decodeJwtPayload<{ permissions?: string[] }>(accessToken)
    parsed.state = { ...parsed.state, accessToken, refreshToken, permissions: payload?.permissions ?? [] }
    localStorage.setItem("auth-storage", JSON.stringify(parsed))
    document.cookie = `access-token=${accessToken}; path=/; max-age=900; SameSite=Lax`
    useAuthStore.setState({ accessToken, refreshToken, permissions: payload?.permissions ?? [] })
  } catch {
    // ignora falha de persistência; próxima chamada volta a exigir refresh
  }
}

function clearAuthAndRedirect() {
  if (typeof window === "undefined") return
  localStorage.removeItem("auth-storage")
  document.cookie = "access-token=; path=/; max-age=0"
  useAuthStore.setState({ user: null, accessToken: null, refreshToken: null, permissions: [] })
  window.location.href = "/login"
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public error?: string,
  ) {
    super(message)
  }
}

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken } = readAuthStorage()
  if (!refreshToken) return null

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return null
        const tokens = await res.json()
        writeTokens(tokens.accessToken, tokens.refreshToken)
        return tokens.accessToken as string
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

async function request<T>(path: string, init: RequestInit = {}, isRetry = false): Promise<T> {
  const { accessToken } = readAuthStorage()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  }
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`

  const res = await fetch(`${API_URL}${path}`, { ...init, headers })

  if (res.status === 401) {
    if (!isRetry && path !== "/auth/refresh" && path !== "/auth/login") {
      const newToken = await refreshAccessToken()
      if (newToken) return request<T>(path, init, true)
    }
    clearAuthAndRedirect()
    throw new ApiError(401, "Não autorizado")
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const msg = Array.isArray(body.message) ? body.message.join(", ") : (body.message ?? "Erro desconhecido")
    throw new ApiError(res.status, msg, body.error)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

async function requestBlob(path: string, isRetry = false): Promise<Blob> {
  const { accessToken } = readAuthStorage()
  const headers: Record<string, string> = {}
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`

  const res = await fetch(`${API_URL}${path}`, { headers })

  if (res.status === 401) {
    if (!isRetry) {
      const newToken = await refreshAccessToken()
      if (newToken) return requestBlob(path, true)
    }
    clearAuthAndRedirect()
    throw new ApiError(401, "Não autorizado")
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const msg = Array.isArray(body.message) ? body.message.join(", ") : (body.message ?? "Erro desconhecido")
    throw new ApiError(res.status, msg, body.error)
  }

  return res.blob()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  getBlob: (path: string) => requestBlob(path),
}
