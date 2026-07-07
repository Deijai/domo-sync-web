import { api } from "./client"
import type { AuthResponse, User } from "@/types/api"

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>("/auth/login", { email, password }),
  logout: (refreshToken: string) => api.post<{ message: string }>("/auth/logout", { refreshToken }),
  me: () => api.get<User>("/auth/me"),
}
