import { AlertTriangle, Inbox, Loader2 } from "lucide-react"

export function LoadingState({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
      <Loader2 className="size-6 animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function EmptyState({
  title = "Nenhum registro encontrado",
  description,
}: {
  title?: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center text-muted-foreground">
      <Inbox className="size-6" />
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="text-xs">{description}</p>}
    </div>
  )
}

export function ErrorState({
  title = "Não foi possível carregar os dados",
  description,
}: {
  title?: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 py-16 text-center text-destructive">
      <AlertTriangle className="size-6" />
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="text-xs text-destructive/80">{description}</p>}
    </div>
  )
}
