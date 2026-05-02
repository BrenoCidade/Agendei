# Research Summary

## Stack

The current Agendei stack is already suitable for the MVP. The highest-leverage move is not changing libraries, but finishing the real integration path with the existing React, React Query, NestJS, Prisma, PostgreSQL, and shared DTO architecture.

## Table Stakes

- Real service and availability persistence
- Public booking with dynamic slots and stored appointments
- Provider dashboard reflecting real backend state
- Explicit async UX states on critical flows
- E2E validation of the main scheduling journey

## Watch Out For

- Remaining mocks hidden inside otherwise integrated screens
- Backend responses that are technically correct but not useful enough for the UI
- Mutation feedback that implies success before confirmed persistence
- Homologation confidence without true end-to-end proof
