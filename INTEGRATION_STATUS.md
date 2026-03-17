P# Agendei — Status da Integração Monorepo

## Estrutura Atual

```
Agendei/
├── .env                         ← Vars postgres para o docker-compose
├── docker-compose.yml           ← Postgres 16 Alpine
├── package.json                 ← Scripts de root (dev:all, build, lint)
├── pnpm-workspace.yaml
└── packages/
    ├── server/                  ← NestJS API (porta 3333)
    │   ├── .env                 ← DATABASE_URL, JWT_SECRET, PORT
    │   ├── prisma/schema.prisma
    │   └── src/
    │       ├── app.module.ts
    │       ├── main.ts
    │       ├── application/     ← Use cases
    │       ├── domain/          ← Entities e interfaces de repositório
    │       └── infra/
    │           ├── database/    ← PrismaService + repositórios
    │           └── http/        ← Controllers e módulos NestJS
    ├── shared/                  ← @saas/shared: tipos e schemas Zod
    │   └── src/
    │       └── dtos/            ← DTOs compartilhados (appointment, customer, etc.)
    └── web/                     ← @saas/web: Vite + React (porta 8080)
        ├── vite.config.ts       ← Proxy /api → localhost:3333
        └── src/
```

---

## ✅ O que já foi feito

### Monorepo (Infraestrutura)
- [x] Movido `schedule-swiftly-app` → `packages/web`
- [x] Renomeado para `@saas/web` no `package.json`
- [x] Adicionado `@saas/shared: workspace:*` como dependência do frontend
- [x] Scripts root: `dev:all`, `dev`, `start:dev` (rodam backend e frontend em paralelo)
- [x] Script `dev` adicionado ao `packages/server/package.json`
- [x] `pnpm install` na raiz — todos os workspaces linkados corretamente

### Banco de Dados
- [x] `docker-compose.yml` com Postgres 16 Alpine já existia; configurado com `.env`
- [x] `.env` criado em `Agendei/` (vars do docker-compose)
- [x] `.env` criado em `packages/server/` (DATABASE_URL, JWT_SECRET, PORT)
- [x] `prisma generate` executado — Prisma Client gerado
- [x] `prisma migrate dev` executado — schema aplicado ao banco local

### Type Safety
- [x] `packages/shared/src/dtos/health.dto.ts` criado com `HealthCheckSchema` e `HealthCheckResponse`
- [x] Exportado em `packages/shared/src/index.ts`
- [x] `@saas/shared` buildado com sucesso (`tsc`)

### Backend
- [x] `HealthController` criado em `packages/server/src/infra/http/controllers/health.controller.ts`
  - Rota: `GET /api/health` → retorna `{ status: "ok", timestamp: "..." }`
  - Usa `HealthCheckResponse` de `@saas/shared`
- [x] `HealthController` registrado no `AppModule`
- [x] Endpoints públicos para cliente criados em `PublicController`
  - `GET /api/public/:slug/appointments?phone=...` (consulta por telefone)
  - `PATCH /api/public/:slug/appointments/:id/cancel` (cancelamento pelo cliente)
- [x] Build do server sem erros (`nest build`)

### Frontend
- [x] Proxy Vite configurado: qualquer chamada a `/api` é redirecionada para `http://localhost:3333`
- [x] Build do frontend sem erros (`vite build` — 2588 módulos)

---

## 🔲 O que ainda precisa ser feito

### Integração das Telas (Em andamento)

#### Infraestrutura de chamadas de API
- [x] Criar cliente HTTP do frontend (Axios) em `packages/web/src/lib/api.ts`
- [x] Configurar interceptors de autenticação (JWT token no header `Authorization`)
- [x] Configurar React Query (`QueryClientProvider`) no `App.tsx`

#### Autenticação
- [x] Integrar tela de Login com `POST /api/auth/login`
- [x] Salvar JWT no `localStorage`
- [x] Implementar `AuthContext` / `AuthProvider` no frontend
- [x] Proteger rotas autenticadas com `PrivateRoute`
- [x] Integrar tela de Cadastro com `POST /api/auth/register`

#### Perfil e Serviços
- [x] Integrar tela de Perfil (Visualização em Configurações) com `GET /api/profile/me`
- [x] Integrar atualização de Perfil de Negócio com `PATCH /api/profile/business`
- [x] Integrar CRUD de Serviços com `/api/services` (listagem, criação, edição e exclusão)

#### Agendamentos
- [x] Integrar tela de Dashboard principal com `GET /api/appointments` (Agenda do dia e stats)
- [x] Integrar tela de Meus Agendamentos (Cliente)
- [x] Integrar criação de agendamento (Fluxo de reserva)
- [x] Integrar tela de agenda pública

#### Disponibilidade
- [x] Integrar configuração de disponibilidade com `/api/availability`

### DevX / Qualidade
- [x] Configurar CORS no backend (`app.enableCors()` no `main.ts`)
- [x] Criar arquivo `.env.example`
- [x] Adicionar `concurrently` na raiz para o script `dev:all`

### Próximos passos
- [x] Integrar Dashboard com dados reais de `/api/appointments` (remover mocks de agenda e cards)
- [x] Adicionar paginação e filtros na tela de Meus Agendamentos (cliente)
- [ ] Organizar e gerar commit das mudanças de integração já concluídas


---

## 🚀 Como rodar localmente

```bash
# 1. Subir o banco
cd Agendei/
docker compose up -d

# 2. Instalar dependências (se necessário)
pnpm install

# 3. Rodar backend e frontend juntos
pnpm dev:all

# Ou separadamente:
pnpm --filter server dev      # http://localhost:3333/api
pnpm --filter @saas/web dev   # http://localhost:8080
```

### Validar a integração
Abra `http://localhost:8080` ou acesse diretamente:
```
GET http://localhost:3333/api/health
→ { "status": "ok", "timestamp": "..." }
```
