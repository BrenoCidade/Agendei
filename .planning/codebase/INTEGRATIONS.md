# Integrations

## Internal Package Integrations

- `packages/web` consumes DTOs from `@saas/shared` for request and response typing.
- `packages/server` also consumes `@saas/shared` for Zod validation and DTO return shapes.
- `packages/shared` is the main contract boundary between frontend and backend.

## Database

- PostgreSQL is the only configured external datastore in `docker-compose.yml`.
- Prisma is the ORM and query layer through `packages/server/src/infra/database/prisma/`.
- `PrismaService` is the backend integration point in `packages/server/src/infra/database/prisma/prisma.service.ts`.
- Repository implementations live under `packages/server/src/infra/database/prisma/repositories/`.

## HTTP API Surface

- Backend exposes JSON APIs with global prefix `/api` from `packages/server/src/main.ts`.
- Authenticated providers use routes from:
  - `packages/server/src/infra/http/controllers/auth.controller.ts`
  - `packages/server/src/infra/http/controllers/profile.controller.ts`
  - `packages/server/src/infra/http/controllers/services.controller.ts`
  - `packages/server/src/infra/http/controllers/availability.controller.ts`
  - `packages/server/src/infra/http/controllers/appointments.controller.ts`
- Public booking flows use `packages/server/src/infra/http/controllers/public.controller.ts`.
- Health check is available through `packages/server/src/infra/http/controllers/health.controller.ts`.

## Frontend To Backend Integration

- Axios client is configured in `packages/web/src/lib/api.ts`.
- JWT token is stored in `localStorage` and attached via request interceptor.
- React Query wraps the app in `packages/web/src/App.tsx`.
- Frontend screens already integrate with live endpoints in:
  - `packages/web/src/pages/Dashboard.tsx`
  - `packages/web/src/pages/DashboardServices.tsx`
  - `packages/web/src/pages/DashboardSettings.tsx`
  - `packages/web/src/pages/Index.tsx`
  - `packages/web/src/components/client/ClientAppointmentsManager.tsx`

## Authentication And Session

- Login endpoint is `POST /api/auth/login` in `packages/server/src/infra/http/controllers/auth.controller.ts`.
- Registration endpoint is `POST /api/auth/register` in the same controller.
- Protected endpoints rely on `JwtAuthGuard` from `packages/server/src/infra/http/jwt-auth.guard.ts`.
- Frontend auth state is managed in `packages/web/src/contexts/AuthContext.tsx`.
- Route protection is handled in `packages/web/src/components/PrivateRoute.tsx`.

## Validation Boundary

- Backend request validation is centralized with `ZodValidationPipe` in `packages/server/src/infra/http/pipes/zod-validation.pipe.ts`.
- Shared Zod schemas define request and response contracts in `packages/shared/src/dtos/`.
- Public controller also defines route-local schemas directly with `zod` for some public flows in `packages/server/src/infra/http/controllers/public.controller.ts`.

## Email And Notifications

- Email delivery is abstracted behind `IEmailGateway` in `packages/server/src/domain/gateways/IEmailGateway.ts`.
- Current implementation appears to be local/mock through `packages/server/src/infra/service/MockEmailGateway.ts`.
- Notification toggles shown in the frontend have no backend integration yet in `packages/web/src/pages/DashboardSettings.tsx`.

## PWA And Browser Features

- Frontend registers a PWA manifest via `vite-plugin-pwa` in `packages/web/vite.config.ts`.
- Install prompt UI exists in `packages/web/src/components/PwaInstallPrompt.tsx`.
- No realtime transport such as WebSocket or SSE was found in the current codebase.

## Test Harness Integrations

- Playwright starts both API and web servers through `packages/web/playwright.config.ts`.
- Backend e2e helpers seed and clean Prisma data in:
  - `packages/server/test/e2e/helpers/seed.ts`
  - `packages/server/test/e2e/helpers/cleanup.ts`

## Gaps And Partial Integrations

- Customer dashboard page remains mock-based in `packages/web/src/pages/DashboardClients.tsx`.
- Business settings UI includes fields not represented in shared DTOs, notably `address`, in `packages/web/src/pages/DashboardSettings.tsx`.
- Dashboard appointment cards currently reconstruct display labels from multiple API calls instead of receiving a view model directly.
