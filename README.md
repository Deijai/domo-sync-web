# Poupa Fila DMA — Web Admin

Painel administrativo do sistema **Poupa Fila DMA**: gestão de usuários, perfis e permissões, pacientes, especialidades, profissionais, unidades de saúde, fichas (lotes e ações) e relatórios.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui (estilo `base-nova`, sobre `@base-ui/react`)
- Zustand (auth store) + TanStack Query (dados remotos)
- React Hook Form + Zod
- Recharts (gráficos)

## Pré-requisitos

- Node.js 22+
- A API (`domo-sync-api`) rodando em `http://localhost:3333` (ver README da API)

## Como rodar

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Configure o `.env.local` (já existe um padrão apontando para `http://localhost:3333`; ajuste via `.env.example` se necessário).

3. Rode em modo desenvolvimento:

   ```bash
   npm run dev
   ```

4. Acesse `http://localhost:3000` — você será redirecionado para `/login`.

### Login inicial (mesmo seed da API)

- **E-mail:** `admin@poupafiladma.local`
- **Senha:** `Admin@123456`

## Scripts

```bash
npm run dev         # desenvolvimento
npm run build       # build de produção
npm run start       # roda o build de produção
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
```

## Estrutura

```txt
app/
├── (auth)/login/
└── (private)/
    ├── layout.tsx          # sidebar + header
    ├── dashboard/
    ├── users/
    ├── roles/              # perfis e permissões
    ├── patients/
    ├── specialties/
    ├── professionals/
    ├── health-units/
    ├── tickets/            # lista (fichas + lotes), criar lote, detalhe do lote, detalhe da ficha
    ├── reports/
    └── settings/
components/
├── ui/                     # primitivas shadcn
├── layout/                 # sidebar, header
└── *.tsx                   # PageHeader, DataTable, StatusBadge, ConfirmDialog, PermissionGate, etc.
lib/
├── api/                    # um arquivo por recurso, client HTTP central com refresh automático
├── permissions.ts          # chaves de permissão (espelha o backend)
└── status-labels.ts        # labels/cores de status em pt-BR
stores/
└── auth.store.ts           # usuário, tokens e permissões (Zustand + persist)
```

## Autenticação e permissões

- Login por e-mail/senha (`POST /auth/login`). O `accessToken` (JWT) é decodificado no cliente só para extrair a lista de permissões e controlar o que aparece na UI — a API sempre valida de novo no backend.
- Renovação automática de token em qualquer 401 (`lib/api/client.ts`), com fallback para logout se o refresh falhar.
- `PermissionGate` esconde botões de ação que o usuário não tem permissão para usar; o menu lateral também é filtrado pelas permissões do perfil.
