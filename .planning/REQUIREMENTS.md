# Requirements: Agendei

**Defined:** 2026-03-29
**Core Value:** Make the core scheduling flow work reliably in production with zero mocks and clear, resilient front/back integration.

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: Provider can create an account with email and password.
- [ ] **AUTH-02**: Provider can log in and access protected dashboard routes with a valid session.
- [ ] **AUTH-03**: Provider session survives app refresh and expires gracefully when invalid.

### Provider Setup

- [ ] **SETUP-01**: Provider can view and update real business profile data used by booking pages.
- [ ] **SETUP-02**: Provider can create services persisted in the database.
- [ ] **SETUP-03**: Provider can edit services persisted in the database.
- [ ] **SETUP-04**: Provider can delete services persisted in the database.
- [ ] **SETUP-05**: Provider can configure weekly availability persisted in the database.

### Public Booking

- [ ] **BOOK-01**: Client can access a provider public page using real provider data.
- [ ] **BOOK-02**: Client can view dynamically calculated available slots for a selected service and date.
- [ ] **BOOK-03**: Client can create an appointment that is persisted in the database.
- [ ] **BOOK-04**: Client can view and cancel their appointments through the public self-service flow.

### Dashboard And Visibility

- [ ] **DASH-01**: Provider dashboard shows real appointment data for the selected period.
- [ ] **DASH-02**: Provider dashboard shows booked appointments without mock placeholders or inconsistent labels.
- [ ] **DASH-03**: Customer-facing and provider-facing screens use the same real source of truth for appointment state.

### Resilience And UX

- [ ] **UX-01**: Every critical screen has explicit loading state.
- [ ] **UX-02**: Every critical screen has explicit empty state.
- [ ] **UX-03**: Every critical screen has visible and actionable error state.
- [ ] **UX-04**: Mutations provide clear success and failure feedback.
- [ ] **UX-05**: Frontend handles temporary network instability without silent failure or fake persistence.
- [ ] **UX-06**: Application has route- or app-level protection against white-screen failures in core flows.

### Integration Quality

- [ ] **INT-01**: Remaining mock data is removed from the v1 scheduling journey.
- [ ] **INT-02**: Shared DTOs and backend responses are rich enough to serve UI needs without frontend gambiarra.
- [ ] **INT-03**: No critical action appears to save successfully unless the backend persistence actually succeeded.
- [ ] **INT-04**: Full stack local execution works without a broken core flow.
- [ ] **INT-05**: E2E coverage exists for the critical provider setup and booking flows.
- [ ] **INT-06**: The app is ready to deploy to homologation for first real testers.

## v2 Requirements

### Enhancements

- **ENH-01**: Real-time appointment propagation through WebSocket or SSE.
- **ENH-02**: Advanced notification preferences with backend persistence.
- **ENH-03**: Broader provider CRM and customer analytics features.
- **ENH-04**: New acquisition or marketplace capabilities beyond the booking MVP.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Major feature expansion beyond the current booking journey | v1 is about stabilizing the existing MVP, not widening scope |
| Marketplace/discovery layer | Not required to validate the first provider scheduling workflow |
| Rich realtime infrastructure as a hard v1 dependency | Reliability and clear async UX come first |
| Advanced notification engine | Current priority is persistence and booking flow integrity |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 3 | Pending |
| SETUP-01 | Phase 1 | Pending |
| SETUP-02 | Phase 1 | Pending |
| SETUP-03 | Phase 1 | Pending |
| SETUP-04 | Phase 1 | Pending |
| SETUP-05 | Phase 1 | Pending |
| BOOK-01 | Phase 2 | Pending |
| BOOK-02 | Phase 2 | Pending |
| BOOK-03 | Phase 2 | Pending |
| BOOK-04 | Phase 2 | Pending |
| DASH-01 | Phase 1 | Pending |
| DASH-02 | Phase 1 | Pending |
| DASH-03 | Phase 2 | Pending |
| UX-01 | Phase 3 | Pending |
| UX-02 | Phase 3 | Pending |
| UX-03 | Phase 3 | Pending |
| UX-04 | Phase 3 | Pending |
| UX-05 | Phase 3 | Pending |
| UX-06 | Phase 3 | Pending |
| INT-01 | Phase 1 | Pending |
| INT-02 | Phase 1 | Pending |
| INT-03 | Phase 3 | Pending |
| INT-04 | Phase 4 | Pending |
| INT-05 | Phase 4 | Pending |
| INT-06 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0

---
*Requirements defined: 2026-03-29*
*Last updated: 2026-03-29 after initial definition*
