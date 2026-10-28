# ADR-007: Local Vertical-Slice Runtime and Persistence

**Status:** Accepted
**Date:** 2026-08-21
**Decision owner:** WPAI / PsyForge product direction
**Scope:** P0–P5 local runtime and persistence foundation

## Context

PsyForge must prove a consent-aware, explainable, human-reviewed behavioral workflow without sending data to a cloud provider or requiring an external service. The existing Vite application is a demonstrator only. The initial backend needs durable local storage, strict validation, auditable state, offline tests, and a Windows-friendly developer path.

## Decision

Implement the first vertical slice in TypeScript with:

- a local Node.js HTTP service bound by default to `127.0.0.1` only;
- private actor tokens bound to a fixed local actor/tenant/role rather than caller-selected role headers;
- a separate `server/` domain layer with no frontend or transport dependency;
- a file-backed SQLite database under an explicitly configured local data directory;
- a stable SQLite binding rather than Node's experimental `node:sqlite` module;
- a transactional repository that writes the domain event and its append-only audit record together;
- a versioned JSON contract validated with an allow-list parser at the trust boundary;
- no LLM, agent, cloud, telemetry SDK, production-game write, retained corpus, graph, or remote dependency in P0–P5.

## Options considered

| Option | Result |
|---|---|
| Browser-only persistence | Rejected: cannot provide server-side consent, audit, access, and review boundaries. |
| Node `node:sqlite` | Rejected for this slice: the installed Node 25.6.0 emits an `ExperimentalWarning`; shipping or hiding that warning violates `ENG-WARN-001`. |
| Hosted database/API | Rejected: violates local-first and adds credentials/network dependence before the core slice is proven. |
| SQLite native binding | Accepted: durable, transactional, offline, compact, and suitable for low-throughput local event ingestion. |
| Container-only first runtime | Deferred: Docker remains a deployment option, not a prerequisite for a local testable core. |

## Consequences

The service will run on supported Node versions with a documented version pin and requires native module installation support. Data remains on the operator workstation. SQLite's synchronous use is acceptable only for the initial bounded local workload; a throughput budget and benchmark gate precede any multi-user/service-scale claim. The repository owns migration and backup compatibility. A later server deployment may retain the domain contract while replacing the adapter.

## Security and recovery

The service accepts JSON only, enforces a small request-body maximum, rejects unknown fields, resolves actor/tenant/role only from a private configured token, validates tenant/consent/purpose before persistence, binds locally by default, and never logs raw payloads or source content. Audit rows are append-only at the database layer. The data directory is excluded from version control. Backup/export behavior is introduced only with a tested integrity path.

## Verification

1. Dependency installation completes without warnings or vulnerabilities.
2. A temporary local database can persist an event and matching audit event atomically.
3. Invalid, duplicate, cross-tenant, expired-consent, and purpose-denied cases leave no event row.
4. A forged actor/role/tenant header cannot elevate a configured local credential.
5. The service binds only to loopback unless an explicit future deployment configuration is approved.
