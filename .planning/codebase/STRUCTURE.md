# Structure

## Repository Layout

- Root orchestration files:
  - `package.json`
  - `pnpm-workspace.yaml`
  - `docker-compose.yml`
  - `INTEGRATION_STATUS.md`
- Main source packages:
  - `packages/server`
  - `packages/web`
  - `packages/shared`

## Backend Directory Layout

- `packages/server/src/main.ts` bootstraps Nest.
- `packages/server/src/app.module.ts` wires the top-level modules.
- `packages/server/src/application/`
  - `mappers/` for domain-to-DTO mapping
  - `use-cases/` grouped by bounded area such as `appointment`, `availability`, `service`, `user`
- `packages/server/src/domain/`
  - `entities/`
  - `errors/`
  - `gateways/`
  - `repositories/`
  - `services/`
  - `types/`
  - `value-objects/`
- `packages/server/src/infra/`
  - `database/` for module wiring and Prisma implementations
  - `http/` for modules, controllers, guards, pipes
  - `service/` for infrastructure service implementations

## Backend Supporting Files

- Prisma schema is in `packages/server/prisma/schema.prisma`.
- Jest config is in `packages/server/test/jest-e2e.json` plus package-level config in `packages/server/package.json`.
- Tests are split across:
  - `packages/server/test/e2e/`
  - `packages/server/test/unit/`
  - `packages/server/test/repositories/`

## Frontend Directory Layout

- `packages/web/src/main.tsx` mounts React.
- `packages/web/src/App.tsx` composes providers and router.
- `packages/web/src/pages/` contains route entries:
  - `Index.tsx`
  - `Login.tsx`
  - `Register.tsx`
  - `Dashboard*.tsx`
  - `ClientAppointments.tsx`
- `packages/web/src/components/booking/` contains public booking flow widgets.
- `packages/web/src/components/dashboard/` contains authenticated dashboard widgets.
- `packages/web/src/components/client/` contains customer self-service widgets.
- `packages/web/src/components/ui/` contains generic primitives.
- `packages/web/src/contexts/` currently contains auth context.
- `packages/web/src/hooks/` contains lightweight hooks.
- `packages/web/src/lib/` contains API and utility functions.
- Frontend e2e lives in `packages/web/e2e/`.

## Shared Package Layout

- `packages/shared/src/index.ts` re-exports DTO modules.
- DTOs are grouped flatly in `packages/shared/src/dtos/`:
  - `appointment.dto.ts`
  - `availability.dto.ts`
  - `customer.dto.ts`
  - `health.dto.ts`
  - `service.dto.ts`
  - `user.dto.ts`

## Naming Patterns

- Backend use cases follow `verb-subject.use-case.ts`.
- Controllers follow Nest naming such as `services.controller.ts`.
- Frontend route files use PascalCase page names.
- Feature UI components also use PascalCase names with colocated domain grouping.
- Shared DTO files use `<domain>.dto.ts`.

## Practical Navigation Shortcuts

- Start backend API exploration at `packages/server/src/app.module.ts`.
- Start frontend flow exploration at `packages/web/src/App.tsx`.
- Start schema and persistence exploration at `packages/server/prisma/schema.prisma`.
- Start contract exploration at `packages/shared/src/index.ts`.

## Structural Notes

- The codebase already has enough breadth to be treated as brownfield, not scaffold-stage.
- There is no `.planning/` project setup yet besides the codebase map being created now.
- `docs/` exists but currently holds operational notes and superpowers plan artifacts rather than a product roadmap.
