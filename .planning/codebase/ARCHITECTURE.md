# Architecture

## High-Level Pattern

- The repository follows a monorepo split by delivery surface:
  - `packages/server` for API
  - `packages/web` for UI
  - `packages/shared` for contracts
- Backend uses a layered architecture with domain, application, and infrastructure boundaries.
- Frontend uses route-level pages plus feature-oriented components and shared UI primitives.

## Backend Layering

### Domain Layer

- Entities live in `packages/server/src/domain/entities/`.
- Repository interfaces live in `packages/server/src/domain/repositories/`.
- Domain services and value objects live in `packages/server/src/domain/services/` and `packages/server/src/domain/value-objects/`.
- Domain errors are centralized in `packages/server/src/domain/errors/`.

### Application Layer

- Use cases sit in `packages/server/src/application/use-cases/`.
- DTO mappers live in `packages/server/src/application/mappers/`.
- Application layer orchestrates repositories and returns domain entities that controllers map to DTOs.

### Infrastructure Layer

- HTTP modules and controllers live in `packages/server/src/infra/http/`.
- Database bindings and Prisma repositories live in `packages/server/src/infra/database/`.
- Concrete services such as password hashing and mock email live in `packages/server/src/infra/service/`.

## Backend Entry Points

- App bootstraps from `packages/server/src/main.ts`.
- Top-level module wiring happens in `packages/server/src/app.module.ts`.
- Feature modules wire controller + use case + repository dependencies under `packages/server/src/infra/http/*.module.ts`.

## Frontend Shape

- App provider composition and routes live in `packages/web/src/App.tsx`.
- Route-level pages live in `packages/web/src/pages/`.
- Feature components are grouped under:
  - `packages/web/src/components/booking/`
  - `packages/web/src/components/dashboard/`
  - `packages/web/src/components/client/`
- Reusable primitives live in `packages/web/src/components/ui/`.
- Cross-cutting state is minimal and currently centered around auth in `packages/web/src/contexts/AuthContext.tsx`.

## Data Flow

### Provider Dashboard Flow

- UI page triggers React Query or mutation in page/component.
- Request goes through `packages/web/src/lib/api.ts`.
- Vite proxy forwards `/api/*` to the Nest server from `packages/web/vite.config.ts`.
- Controller validates input with shared or local Zod schema.
- Use case executes business logic through repository interfaces.
- Prisma repository persists or reads PostgreSQL data.
- Mapper returns DTO consumed by the frontend.

### Public Booking Flow

- Public page `packages/web/src/pages/Index.tsx` loads provider and slots from public endpoints.
- Booking mutation posts customer data to `packages/server/src/infra/http/controllers/public.controller.ts`.
- Public controller resolves provider by slug and delegates appointment creation to a use case.

## Shared Contract Boundary

- `packages/shared` acts as the typed boundary across frontend and backend.
- Shared DTOs reduce drift, but some backend responses still return lower-level shapes that force the UI to compose view data manually.

## Cross-Cutting Concerns

- Auth is JWT-based and enforced at the Nest guard level.
- Validation is mostly Zod-based on the server.
- Frontend async state is mostly screen-local with React Query.
- Error handling is controller-level on the server and ad hoc toast-level on the client.

## Main Architectural Strengths

- Clear backend separation of concerns.
- Shared contract package already established.
- Public and private flows are separated cleanly in backend controllers.
- Monorepo scripts make full-stack local dev and e2e execution straightforward.

## Main Architectural Frictions

- Some frontend screens still mix presentational logic with request orchestration.
- Some screens are only partially integrated and still rely on local mock state.
- Backend endpoints are not consistently view-model oriented, which pushes composition work into the frontend.
- Availability saving is modeled as many per-day writes instead of a transaction-like weekly update.
