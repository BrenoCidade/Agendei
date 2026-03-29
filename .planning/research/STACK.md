# Research: Stack

## Current Fit

- React + Vite is appropriate for the current MVP because the product already ships browser-first flows and benefits from fast local iteration.
- NestJS + Prisma + PostgreSQL is a strong fit for a scheduling SaaS that needs authenticated APIs, validation, and relational consistency.
- `@tanstack/react-query` is the right async state foundation for this phase because the main work is not choosing a new client library, but applying one consistently to real integration flows.

## MVP Table Stakes For This Domain

- Shared data contracts between web and API
- Persisted service catalog and weekly availability
- Real-time-enough freshness through invalidation or refetch, even if not true sockets yet
- Clear mutation feedback for mobile-network conditions
- Full-stack validation via E2E before exposing to test users

## Recommended Direction

- Keep the current stack and avoid migration churn.
- Invest effort in contract quality, query/mutation consistency, and release resilience.
- Delay any stack expansion until after homologation proves the core booking loop.
