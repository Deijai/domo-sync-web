# CLAUDE.md — Web Admin

## Stack

- Next.js App Router
- TypeScript
- Zustand
- Shadcn UI (`base-nova`, sobre `@base-ui/react` — não é Radix)
- TailwindCSS v4
- Tema dark/light

## Estrutura

```txt
app
├── (auth)/login
└── (private)
    ├── dashboard
    ├── users
    ├── roles            # perfis + permissões
    ├── patients
    ├── specialties
    ├── professionals    # não "doctors"
    ├── health-units
    ├── tickets           # lista (fichas + lotes), tickets/[id], tickets/batches/new, tickets/batches/[id]
    ├── reports
    └── settings

components
├── ui                # primitivas shadcn (base-ui)
├── layout             # app-sidebar, header
└── *.tsx              # PageHeader, DataTable, StatusBadge, ConfirmDialog, PermissionGate, feedback-states

lib
├── api                # um arquivo por recurso, client.ts central com refresh automático
├── permissions.ts      # espelha as chaves de permissão do backend
├── status-labels.ts
└── jwt.ts              # decode client-side (só para UI, não para validar)

hooks, stores, types
```

## Regras

- Server Components quando fizer sentido; Client Components para interação.
- Zustand para estado global (`stores/auth.store.ts`: user, tokens, permissions).
- Shadcn/base-ui para UI — **atenção**: este setup usa `@base-ui/react`, não Radix.
  - Polimorfismo é via prop `render`, não `asChild` (ex.: `<Button render={<Link href="..." />} nativeButton={false}>`).
  - `Select`/`Tabs` `onValueChange` recebe `value: string | null` — sempre guardar com `value && ...`.
  - Sempre dar `defaultValues` completos no `useForm` para campos ligados a `Select` (senão o Base UI acusa "uncontrolled to controlled").
- Formulários com React Hook Form + Zod.
- Tabelas com busca, paginação (componente `DataTable` genérico).
- Tema dark/light via `next-themes` (`ThemeProvider`/`ThemeToggle` já prontos).
- Não duplicar lógica de API — services em `lib/api/*.ts`, um por recurso do backend.
- Permissões: `PermissionGate` no componente, filtro de menu em `app-sidebar.tsx`, ambos lendo `useAuthStore().permissions` (extraído do JWT no login/refresh, não vem do `/auth/me`).

## Backend

Endpoints e modelos batem com `domo-sync-api` reescrita em 2026-07-06 (ver `api/ENDPOINTS_SPEC.md` e `database/DATABASE_SPEC.md` na raiz do monorepo de specs). Não presumir os campos/rotas da versão antiga (doctors, ticket-batches, appointment-tickets) — isso mudou.
