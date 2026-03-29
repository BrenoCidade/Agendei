# Conventions

## Backend Coding Style

- Backend code uses path alias imports like `@/application/...` and `@/domain/...`.
- Controllers are thin-ish wrappers around use cases, even if some public DTO shaping still happens inline.
- Request validation is strongly biased toward Zod via `ZodValidationPipe` in `packages/server/src/infra/http/pipes/zod-validation.pipe.ts`.
- Error translation follows a common pattern:
  - use case throws domain error
  - controller catches and maps to Nest HTTP exception
- DTO conversion is usually delegated to mapper classes such as:
  - `packages/server/src/application/mappers/appointment-response.mapper.ts`
  - `packages/server/src/application/mappers/service-response.mapper.ts`
  - `packages/server/src/application/mappers/user-response.mapper.ts`

## Frontend Coding Style

- Frontend imports commonly use the `@/` alias from `packages/web/tsconfig.json`.
- Route files often own the data fetching for their screen instead of using dedicated hooks.
- React Query is used directly in pages and some feature components.
- Axios is centralized in `packages/web/src/lib/api.ts`.
- User feedback favors toast notifications over inline status views for mutations.
- UI composition heavily uses shadcn/Radix wrappers from `packages/web/src/components/ui/`.

## State Management Conventions

- Global state is intentionally small; auth is the main context in `packages/web/src/contexts/AuthContext.tsx`.
- Async remote state is expected to live in React Query rather than custom stores.
- Local view state remains in component state with `useState`, even when screens get moderately complex.

## Naming And File Organization

- Backend classes use explicit suffixes such as `Controller`, `UseCase`, `Mapper`, `Repository`, `Service`.
- Frontend components use descriptive PascalCase file names.
- Shared contract modules use DTO-oriented filenames.
- Dashboard-related components are grouped under the `dashboard` feature folder instead of colocating by route only.

## Error Handling Conventions

- Server catches broad errors per controller and frequently falls back to generic `BadRequestException('An unexpected error occurred')`.
- Frontend query error handling is inconsistent; many reads only branch on `isLoading`.
- Mutation failures usually surface through `toast` or `sonner`.
- Global auth failure handling is implemented as a hard redirect on 401 in `packages/web/src/lib/api.ts`.

## Contract Conventions

- Shared DTOs are defined with Zod first and exported as inferred TypeScript types.
- Backend usually returns DTOs typed from `@saas/shared`.
- Not every response is shaped for the final UI; some contracts expose IDs and force the UI to rehydrate labels.

## Testing Conventions

- Backend unit tests use in-memory repositories under `packages/server/test/repositories/`.
- Backend integration confidence comes mostly from e2e coverage rather than controller-level isolated tests.
- Frontend confidence comes mostly from Playwright workflow coverage rather than component unit tests.

## Style Quality Notes

- Type strictness is stronger on the server than on the web package.
- Frontend code mixes Portuguese UI copy with English identifiers and DTO naming.
- There are signs of generated UI scaffolding under `packages/web/src/components/ui/`, which means consistency is good but intentional pruning may still be needed.
