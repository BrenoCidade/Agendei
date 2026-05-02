# Agendei

## What This Is

Agendei is a SaaS for service providers who need a reliable scheduling flow that works end to end with real data. The current v1 focus is not feature expansion, but finishing the existing product so providers can configure their business, clients can book real appointments, and the system is stable enough for homologation and first external testers.

## Core Value

Make the core scheduling flow work reliably in production with zero mocks and clear, resilient front/back integration.

## Requirements

### Validated

(None yet - ship to validate)

### Active

- [ ] Provider can sign up, authenticate, and access the protected dashboard with real backend data.
- [ ] Provider can create, edit, and delete real services persisted in the database.
- [ ] Provider can configure real availability persisted in the database.
- [ ] Public booking page loads provider data and real available slots dynamically.
- [ ] Client can complete an appointment that is persisted in the database.
- [ ] Provider can see newly created appointments reflected in the dashboard without inconsistencies.
- [ ] Critical screens expose explicit loading, empty, success, and error states.
- [ ] Frontend and backend contracts are shaped for the UI without mock fallbacks or fake persistence.
- [ ] Full stack is stable enough for homologation and first real testers.

### Out of Scope

- New feature expansion beyond the current scheduling MVP - focus is finishing and stabilizing the existing product first.
- Advanced growth features, marketplace ideas, or secondary workflows - they would dilute effort from getting the core booking loop production-ready.
- Real-time infrastructure as a hard requirement for v1 - reliability of the current request/response flow comes first.

## Definition of Done (v1)

O que eu considero suficiente para chamar essa v1 de pronta para homologação é:

Fluxo principal 100% real, sem mocks

O prestador consegue: se cadastrar e autenticar; cadastrar/editar/excluir serviços reais; configurar disponibilidade real no banco.

O cliente consegue: acessar a página pública; visualizar slots reais e atualizados; concluir um agendamento persistido no banco.

O prestador consegue: ver o agendamento refletido no dashboard sem inconsistência.

Resiliência mínima de produção

Toda tela crítica precisa ter: loading state claro; empty state claro; tratamento de erro visível e útil; feedback de sucesso/erro em ações; comportamento estável com falha temporária de rede.

Integração front/back confiável

Quero eliminar: dados mockados; contratos incompletos que forçam gambiarra no front; telas “meio integradas”; falsas ações que parecem salvar mas não persistem.

Qualidade para liberar primeiros testes reais

Antes de homologar, quero: backend e frontend rodando juntos sem fluxo quebrado; testes E2E cobrindo os fluxos centrais; ambiente preparado para subir em homologação; confiança de que os primeiros testadores não vão bater em tela quebrada logo no fluxo principal.

## Context

- The repository is a brownfield monorepo with `packages/web`, `packages/server`, and `packages/shared`.
- Frontend is React + Vite, already using `axios` and `@tanstack/react-query` in critical flows.
- Backend is Node.js with NestJS and Prisma over PostgreSQL.
- Shared DTOs and Zod schemas already exist in `packages/shared`, but some responses still expose low-level shapes that force UI workarounds.
- The codebase map in `.planning/codebase/` already identified the main gap pattern: partially integrated screens, remaining mocks, weak async UX, and some contracts that are not yet view-model oriented.
- The architectural direction for this MVP is to keep React Query as the async state layer, keep Node/Nest as the API boundary, and evolve DTOs so the frontend receives richer, UI-ready data where needed.

## Constraints

- **Product Scope**: Strict MVP only - no new capability expansion beyond stabilizing the current scheduling flow.
- **Tech Stack**: Keep the current stack - React frontend, Node.js/NestJS backend, Prisma/PostgreSQL, and shared DTO contracts.
- **Integration Strategy**: Prefer real API integration over temporary local state or new mocks.
- **Async UX**: Critical flows must tolerate unstable mobile network conditions for providers using 4G.
- **Release Goal**: This version must be suitable for homologation and first external testers, not just local demos.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep React Query as the async state foundation in the frontend | The stack is already in place and fits cache, mutation, invalidation, and resilient loading/error handling needs | - Pending |
| Keep Node.js/NestJS as the backend integration layer | Existing backend architecture is already organized around controllers, use cases, repositories, and Prisma | - Pending |
| Use enriched DTOs/shared contracts to serve UI needs | Current low-level payloads create frontend workarounds and inconsistent screens | - Pending |
| Prioritize real data and resilience over feature expansion | The immediate business goal is a usable MVP for homologation, not broader scope | - Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition**:
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone**:
1. Full review of all sections
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-29 after project initialization*
