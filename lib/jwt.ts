export function decodeJwtPayload<T = unknown>(token: string): T | null {
  try {
    const payload = token.split(".")[1]
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
    const json =
      typeof window === "undefined"
        ? Buffer.from(normalized, "base64").toString("utf-8")
        : atob(normalized)
    return JSON.parse(json) as T
  } catch {
    return null
  }
}
