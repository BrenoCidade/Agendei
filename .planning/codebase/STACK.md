# Stack

## Monorepo Shape

- Root workspace uses `pnpm` workspaces declared in `package.json` and `pnpm-workspace.yaml`.
- Runtime targets are split into `packages/server`, `packages/web`, and `packages/shared`.
- Shared type contracts are published internally as `@saas/shared`.

## Languages And Tooling

- Primary language is TypeScript across all packages: `packages/server`, `packages/web`, `packages/shared`.
- Root scripts orchestrate local development and validation from `package.json`.
- Formatting is handled with Prettier from `.prettierrc`.
- Linting exists per package, but configuration is package-local rather than centralized.

## Backend Runtime

- Backend is NestJS 11 in `packages/server/package.json`.
- HTTP server bootstraps from `packages/server/src/main.ts`.
- Config is loaded through `@nestjs/config` in `packages/server/src/app.module.ts`.
- Authentication uses `@nestjs/jwt`, `passport`, and `passport-jwt`.
- Persistence uses Prisma Client against PostgreSQL from `packages/server/prisma/schema.prisma`.
- Password hashing uses `bcryptjs` via `packages/server/src/infra/service/BcryptPasswordService.ts`.

## Frontend Runtime

- Frontend is React 18 + Vite 5 in `packages/web/package.json`.
- App entry is `packages/web/src/main.tsx` and routing shell is `packages/web/src/App.tsx`.
- Data fetching stack is `axios` plus `@tanstack/react-query`.
- UI kit is largely shadcn/Radix-based under `packages/web/src/components/ui/`.
- Styling uses Tailwind CSS and utility helpers such as `class-variance-authority`, `clsx`, and `tailwind-merge`.
- Offline/install shell is partially prepared with `vite-plugin-pwa` in `packages/web/vite.config.ts`.

## Shared Contracts

- DTOs and Zod schemas live in `packages/shared/src/dtos/`.
- Entry export file is `packages/shared/src/index.ts`.
- Shared package is built with `tsc` from `packages/shared/package.json`.

## Database And Local Infra

- Local database is PostgreSQL 16 via `docker-compose.yml`.
- Prisma datasource reads `DATABASE_URL` from `packages/server/.env`.
- Prisma models cover users, services, customers, appointments, and availability in `packages/server/prisma/schema.prisma`.

## Test Tooling

- Backend unit and e2e tests use Jest from `packages/server/package.json`.
- Frontend e2e tests use Playwright from `packages/web/playwright.config.ts`.
- Root scripts provide combined execution such as `pnpm run e2e:all`.

## Build And Dev Commands

- Full stack local dev runs via `pnpm dev:all` at the repo root.
- Backend dev server is `pnpm --filter server dev`.
- Frontend dev server is `pnpm --filter @saas/web dev`.
- Workspace build is `pnpm build`.
- Shared package can be rebuilt in isolation with `pnpm build:shared`.

## Notable Configuration Choices

- Frontend dev server proxies `/api` to `http://localhost:3333` in `packages/web/vite.config.ts`.
- Backend CORS defaults to `http://localhost:8080` in `packages/server/src/main.ts`.
- Frontend TypeScript is intentionally loose in `packages/web/tsconfig.json` with `allowJs`, `noImplicitAny: false`, and `strictNullChecks: false`.
- Root Node and pnpm versions are constrained in the root `package.json`.
