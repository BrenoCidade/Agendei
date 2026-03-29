# Research: Pitfalls

## Common Failure Modes For This MVP

### Partial Integration Illusion

- Warning sign: UI looks functional but still relies on local arrays, local-only form state, or fake success toasts.
- Prevention: treat every critical screen as either fully real or explicitly unfinished.
- Best phase to address: Phase 1

### Thin DTOs Causing Frontend Workarounds

- Warning sign: frontend joins multiple responses just to render a label or invents placeholders like customer IDs.
- Prevention: enrich backend/shared contracts to fit the screen’s rendering needs.
- Best phase to address: Phase 1

### Weak Failure UX

- Warning sign: only loading is implemented; 500s, offline states, and auth expiry produce blank or confusing screens.
- Prevention: standardize query and mutation UX states and add boundaries for crash containment.
- Best phase to address: Phase 3

### False Release Confidence

- Warning sign: local happy path works, but E2E coverage does not prove provider setup plus booking flow end to end.
- Prevention: require E2E validation of the exact homologation journey before release.
- Best phase to address: Phase 4
