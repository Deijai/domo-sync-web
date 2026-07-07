"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ApiError } from "@/lib/api/client"

interface Options<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>
  successMessage?: string | ((variables: TVariables) => string)
  invalidateKeys?: string[][]
  onSuccess?: (data: TData) => void
}

export function useToastMutation<TData = unknown, TVariables = void>({
  mutationFn,
  successMessage,
  invalidateKeys = [],
  onSuccess,
}: Options<TData, TVariables>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      if (successMessage) {
        const msg = typeof successMessage === "function" ? successMessage(variables) : successMessage
        toast.success(msg)
      }
      invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }))
      onSuccess?.(data)
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : "Ocorreu um erro inesperado"
      toast.error(msg)
    },
  })
}
