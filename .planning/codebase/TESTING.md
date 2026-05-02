# Testing

## Overview

- Testing is strongest at end-to-end boundaries.
- Backend uses Jest for unit and e2e testing in `packages/server`.
- Frontend uses Playwright for browser-level flows in `packages/web`.
- There is no obvious frontend unit test suite in the current web package.

## Backend Test Structure

- Jest scripts are defined in `packages/server/package.json`.
- E2E config lives in `packages/server/test/jest-e2e.json`.
- E2E specs are grouped by domain in `packages/server/test/e2e/`:
  - `auth.e2e-spec.ts`
  - `services.e2e-spec.ts`
  - `availability.e2e-spec.ts`
  - `appointments.e2e-spec.ts`
  - `public.e2e-spec.ts`
  - `profile.e2e-spec.ts`
  - `regression.e2e-spec.ts`
- Test helper files live in `packages/server/test/e2e/helpers/`.

## Backend Unit Testing Pattern

- Use case and domain behavior unit tests live under `packages/server/test/unit/`.
- In-memory repository doubles live under `packages/server/test/repositories/`.
- This suggests business logic is intended to be testable without Prisma or Nest bootstrapping.

## Frontend Test Structure

- Playwright config lives in `packages/web/playwright.config.ts`.
- Browser tests live in `packages/web/e2e/`.
- Current suites cover:
  - smoke
  - auth
  - protected routes
  - services
  - availability
  - appointments
  - public booking flow
- Shared fixtures and test data live under:
  - `packages/web/e2e/fixtures/`
  - `packages/web/e2e/utils/`

## Full-Stack Execution Pattern

- Playwright spins up both backend and frontend automatically via `webServer` config in `packages/web/playwright.config.ts`.
- Root scripts combine execution:
  - `pnpm run e2e:backend`
  - `pnpm run e2e:web`
  - `pnpm run e2e:all`
- Operational runbook exists at `docs/testing/e2e-runbook.md`.

## Strengths

- Backend and frontend both have automated e2e coverage for major happy paths.
- Backend domain logic appears unit-testable because repositories are abstracted.
- Playwright setup is realistic because it exercises both servers together.

## Gaps

- No visible frontend component or hook unit tests.
- No dedicated contract tests asserting shared DTO compatibility across packages.
- Limited evidence of negative-path UI testing for network failures, malformed payloads, or auth expiry mid-session.
- Current testing emphasis appears stronger on "green path works" than on resilience cases.

## Practical Testing Entry Points

- Start backend test review at `packages/server/test/e2e/appointments.e2e-spec.ts`.
- Start frontend test review at `packages/web/e2e/public-flow.spec.ts`.
- Review local run commands in the root `package.json`.
