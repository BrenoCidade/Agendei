# Research: Architecture

## Suggested Component Boundaries

- `packages/shared` remains the contract boundary for request/response schemas.
- `packages/server` should own richer read models for UI-facing screens where raw IDs are insufficient.
- `packages/web` should centralize domain data access around React Query hooks or at least consistent query key patterns per domain.

## Data Flow Guidance

- Provider actions should mutate backend state first, then invalidate or update query cache explicitly.
- Public booking should treat slot availability as derived backend truth, not frontend-calculated truth.
- Dashboard views should consume UI-oriented data models so the frontend mostly renders rather than reconstructs.

## Build Order Implications

1. Eliminate remaining provider-side mocks and incomplete contracts.
2. Stabilize the public booking flow on real data.
3. Harden UX around loading/error/empty states.
4. Finish with validation and homologation preparation.
