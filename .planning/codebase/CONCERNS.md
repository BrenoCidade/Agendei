# Concerns

## Architectural Concerns

- The frontend/backend contract is only partially UI-oriented. For example, dashboard appointments currently expose IDs and force the frontend to derive customer/service presentation instead of receiving a ready-to-render view model.
- Some frontend routes are fully integrated while others remain mock-driven, which creates uneven confidence across the product.
- Public controller code in `packages/server/src/infra/http/controllers/public.controller.ts` is doing some aggregation work that might eventually deserve dedicated read models or query services.

## Product Consistency Concerns

- `packages/web/src/pages/DashboardClients.tsx` is still hardcoded with mock client data, so the product is not yet fully dynamic.
- `packages/web/src/pages/DashboardSettings.tsx` includes local-only `address` handling and notification toggles without backend persistence, which risks false affordances.
- `INTEGRATION_STATUS.md` reports broad integration completeness, but the current UI still contains obvious placeholders and partial contracts.

## Resilience Concerns

- Frontend read queries often handle loading but not explicit error or empty states, especially in `packages/web/src/pages/Dashboard.tsx` and `packages/web/src/pages/Index.tsx`.
- Global 401 handling in `packages/web/src/lib/api.ts` redirects immediately, which may produce abrupt UX and hard-to-debug request races.
- Availability saving in `packages/web/src/components/dashboard/AvailabilitySettings.tsx` performs many per-day requests, increasing the chance of partial success under unstable networks.
- There is no app-level error boundary or React Query error reset wiring in `packages/web/src/App.tsx`.

## Type Safety Concerns

- Frontend TypeScript settings are relaxed in `packages/web/tsconfig.json`, reducing the value of the otherwise good shared DTO setup.
- Some public DTOs are re-declared locally in the frontend or backend controller instead of reusing shared contracts, which can drift over time.

## Security Concerns

- JWT is stored in `localStorage` in `packages/web/src/lib/api.ts` and `packages/web/src/contexts/AuthContext.tsx`, which increases XSS sensitivity.
- Mock email infrastructure in `packages/server/src/infra/service/MockEmailGateway.ts` is fine for development but means password recovery is not production-ready as-is.
- Public appointment lookup by phone number in `packages/server/src/infra/http/controllers/public.controller.ts` should be monitored for abuse controls and privacy expectations.

## Performance Concerns

- Dashboard page currently issues separate appointments and services requests, then joins them client-side.
- Public booking page fetches provider and slots separately and has no prefetch strategy yet.
- No realtime update path was found, so provider dashboards likely rely on manual refresh to notice new bookings.

## Maintainability Concerns

- Frontend data fetching is page-local and not yet abstracted into shared domain hooks, which will make consistency harder as the app grows.
- Backend controllers repeat similar try/catch exception mapping blocks, which may benefit from shared exception filters later.
- The codebase contains both mature flows and half-finished UX surfaces, so roadmap initialization should distinguish validated behavior from aspirational UI.

## Recommended Watch List

- Finish the remaining mock-to-dynamic migrations first.
- Harden async UX with explicit loading, error, and empty states.
- Revisit DTO/view-model design for dashboard and client screens.
- Tighten frontend TypeScript settings once the current integration wave stabilizes.
