# PsyForge P0 Threat Model

## Assets and trust boundaries

Assets are consent grants, pseudonymous events, derived features, model/recommendation records, review decisions, audit records, database files, and runtime credentials. Trust boundaries are the HTTP request, local operator role, database adapter, filesystem data directory, and frontend/backend bridge.

| Threat | Primary controls | Verification |
|---|---|---|
| Malformed or oversized event | JSON size limit, strict allow-list parser, schema tests | invalid input suite |
| Cross-tenant/subject write | server-side grant lookup and tenant match | negative integration tests |
| Expired/revoked consent | fail-closed grant state and transactional check | time/revocation tests |
| Replay/duplicate event | immutable event ID uniqueness and idempotent result | duplicate test |
| Audit erasure/tampering | database triggers reject update/delete; restricted repository interface | mutation-attempt test |
| SQL injection | only prepared statements; no client-controlled SQL | code review and input tests |
| Local network exposure | loopback default, no CORS wildcard, explicit origin allow-list | server binding test |
| Secret leakage | generated/runtime secret reference only; redacted errors/logs | secret scan and response tests |
| Unauthorized recommendation approval | role check plus state-machine transition guard | state/role tests |

## Residual risk

A local single-user service cannot protect against a fully compromised workstation. The service reduces accidental cross-process exposure but does not claim hardware-attested security. Cloud, remote users, and regulated production deployment require a new threat model and access-control architecture.
