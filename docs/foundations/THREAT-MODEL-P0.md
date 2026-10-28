# PsyForge P0–P6 Local-Slice Threat Model

## Assets and trust boundaries

Assets are credential-bound actor tokens, consent grants, pseudonymous events, derived features, model/recommendation records, evidence metadata/hashes, P6 synthetic graph nodes/assertions/invalidation facts, review/revocation decisions, audit records, database files, and the private filesystem data directory. Trust boundaries are the loopback HTTP request, the actor-token resolver, the database adapter, the local filesystem, and the frontend/backend bridge.

| Threat | Primary controls | Verification |
|---|---|---|
| Malformed or oversized request | JSON size limit, exact allow-list parsers, schema tests | invalid-input suite |
| Forged actor/role/tenant header | token resolves a fixed configured actor; supplied identity headers are ignored | HTTP role-forgery test |
| Cross-tenant write or evidence action | credential-bound tenant plus tenant-scoped queries | negative integration tests |
| Expired/revoked consent | fail-closed grant state and transactional check | time/revocation tests |
| Replay/duplicate event or source version | immutable event ID and tenant/source/version uniqueness | replay and P5 hash-mismatch tests |
| Audit, review, or rights-revocation erasure | SQLite triggers reject update/delete; restricted repository interface | direct-mutation tests |
| Source-content retention or accidental provider transfer | P5 hashes bounded local content then retains only metadata; no network/provider code | schema, importer, and response tests |
| Unreviewed, real, cross-tenant, or causal graph assertion | P6 exact schema, closed structural vocabulary, operator role, tenant check, approved synthetic-source check, and observed-only tier | P6 negative-path and HTTP tests |
| Continued graph use after source-rights withdrawal | same SQLite transaction writes immutable assertion invalidations; inspector marks history inactive and export excludes it | P6 revocation/persistence tests |
| Fixture traversal, oversized graph import, or partial graph import | regular-file check, 64-KiB/128-assertion limits, exact JSON schema, no overwrite export, atomic batch transaction | fixture round-trip and failure tests |
| SQL injection | prepared statements only; no client-controlled SQL | code review and input tests |
| Local network exposure | loopback binding and no CORS response headers | server contract/code review |
| Secret leakage | ignored credential file; tokens never printed, served, committed, or retained in browser state | ignore rule and credential/HTTP tests |
| Unauthorized recommendation/evidence action | credential-bound role checks plus terminal state-machine guards | state, role, revocation, and tenant tests |

## Residual risk

A local single-user service cannot protect against a fully compromised workstation, an attacker with access to `data/.psyforge-local-actors.json`, or a user who intentionally shares multiple actor credentials. The actor credentials prevent request-level self-escalation and preserve role-specific audit attribution, but do not prove that different credentials are controlled by different people. Cloud, remote users, real corpus material, broader graph vocabulary, causal claims, and regulated production deployment require a new threat model, identity/access-control architecture, encryption-at-rest decision, source/retention policy, and director approval.