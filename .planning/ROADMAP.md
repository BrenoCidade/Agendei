# Roadmap: Agendei

## Overview

This roadmap takes the current brownfield Agendei codebase from partially integrated scheduling app to a homologation-ready MVP for real providers. The path is intentionally narrow: remove remaining mocks, strengthen contracts between frontend and backend, harden async UX against unstable networks, and prove the core provider setup plus public booking flow through repeatable end-to-end validation.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions if needed later

- [ ] **Phase 1: Real Data Integration** - Remove remaining mocks and align backend contracts with provider dashboard and setup flows.
- [ ] **Phase 2: Public Booking Reliability** - Finish the public scheduling journey with real slot, booking, and customer self-service flows.
- [ ] **Phase 3: Resilient Async UX** - Standardize loading, empty, error, and feedback handling across critical screens.
- [ ] **Phase 4: Homologation Readiness** - Validate the stack end to end and prepare the MVP for first external testers.

## Phase Details

### Phase 1: Real Data Integration
**Goal**: Provider-facing setup and dashboard screens operate with real persisted data and UI-ready contracts, without remaining mock dependencies.
**Depends on**: Nothing (first phase)
**Requirements**: [AUTH-01, AUTH-02, SETUP-01, SETUP-02, SETUP-03, SETUP-04, SETUP-05, DASH-01, DASH-02, INT-01, INT-02]
**Success Criteria** (what must be TRUE):
  1. Provider can sign up, log in, and access the dashboard with real authenticated data.
  2. Provider can create, edit, and delete services persisted in the database.
  3. Provider can configure real availability persisted in the database.
  4. Dashboard and settings screens no longer rely on mock placeholders or fake local-only persistence.
  5. Backend DTOs and responses provide enough data for provider screens without frontend reconstruction hacks.
**Plans**: 3 plans

Plans:
- [ ] 01-01: Map remaining provider-side mocks and incomplete integrations
- [ ] 01-02: Enrich backend DTOs and wire provider setup flows to real persistence
- [ ] 01-03: Finish provider dashboard and customer list visibility with real data

### Phase 2: Public Booking Reliability
**Goal**: The public booking flow works end to end with real provider data, dynamic slots, persisted appointments, and customer self-service consistency.
**Depends on**: Phase 1
**Requirements**: [BOOK-01, BOOK-02, BOOK-03, BOOK-04, DASH-03]
**Success Criteria** (what must be TRUE):
  1. Client can open the public page and see real provider details and services.
  2. Client can view real available slots for a date and service combination.
  3. Client can create an appointment that is persisted and visible to the provider.
  4. Client self-service appointment lookup and cancellation use real backend state consistently.
**Plans**: 3 plans

Plans:
- [ ] 02-01: Harden public provider and slot loading
- [ ] 02-02: Finalize persisted appointment creation and dashboard reflection
- [ ] 02-03: Stabilize public self-service lookup and cancellation flow

### Phase 3: Resilient Async UX
**Goal**: Critical screens handle unstable networks gracefully with clear loading, empty, success, and error feedback.
**Depends on**: Phase 2
**Requirements**: [AUTH-03, UX-01, UX-02, UX-03, UX-04, UX-05, UX-06, INT-03]
**Success Criteria** (what must be TRUE):
  1. Every critical screen shows explicit loading, empty, and error states.
  2. Core mutations provide visible success and failure feedback without fake success states.
  3. Session expiry and transient network failures do not collapse the app into a white screen.
  4. React Query usage is standardized enough to support optimistic improvements where safe.
**Plans**: 3 plans

Plans:
- [ ] 03-01: Standardize query and mutation states across critical screens
- [ ] 03-02: Add application-level resilience with boundaries and better auth/error handling
- [ ] 03-03: Apply safe UX speedups such as optimistic updates and prefetching where useful

### Phase 4: Homologation Readiness
**Goal**: The MVP is verifiably stable, covered by core E2E tests, and ready for deployment to homologation and first testers.
**Depends on**: Phase 3
**Requirements**: [INT-04, INT-05, INT-06]
**Success Criteria** (what must be TRUE):
  1. Backend and frontend run together locally without a broken core flow.
  2. E2E coverage validates the critical provider setup and booking journey.
  3. Deployment preparation for homologation is documented and unblocked.
  4. Team has confidence that first testers will not hit obvious breakage in the main flow.
**Plans**: 2 plans

Plans:
- [ ] 04-01: Close validation gaps in full-stack execution and E2E coverage
- [ ] 04-02: Prepare homologation handoff and release checklist

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Real Data Integration | 0/3 | Not started | - |
| 2. Public Booking Reliability | 0/3 | Not started | - |
| 3. Resilient Async UX | 0/3 | Not started | - |
| 4. Homologation Readiness | 0/2 | Not started | - |
