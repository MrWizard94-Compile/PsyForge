# PsyForge Local Service Runbook

## Scope

This runbook operates the P0–P6 local vertical slices only: credential-bound local sessions, consented telemetry intake, deterministic features, a descriptive baseline, human review, a metadata-only evidence registry with approved-source revocation, and a synthetic structural graph kernel. It is not a hosted service, telemetry SDK, local-LLM runtime, game integration, corpus store, retrieval system, inference engine, or production-control plane.

## Requirements and start

Use Node.js 22 or newer and npm 11.8.0 or newer. The service binds only to `127.0.0.1` on port `4317` by default.

```powershell
npm ci
npm run build
npm run start:server
```

The first start creates ignored local operational data under `data/`: `psyforge.sqlite` and the private credential file `.psyforge-local-actors.json`. The service never prints a token. Read [LOCAL-ACTOR-CREDENTIALS.md](LOCAL-ACTOR-CREDENTIALS.md) before opening a session or distributing a credential. Existing legacy `.psyforge-local-token` files are not consulted by the current service and must not be treated as valid credentials.

For isolated local testing, set `PSYFORGE_DATA_DIR` to a trusted local directory. `PSYFORGE_PORT` may select a loopback port from 1024 through 65535. No environment variable supplies a generic all-role token.

## Local authentication and routes

Create a short-lived local session by posting one configured actor token to `POST /v1/session`. The returned `HttpOnly`, `SameSite=Strict` cookie lasts at most eight hours and exists only in memory, so it expires on service restart. The development dashboard proxies `/api/*` to this local service; the production service serves the built `dist/` dashboard and exposes `/v1/*` directly.

Every authenticated request uses either the session cookie or the fixed actor credential:

```text
X-PsyForge-API-Token: token-from-data/.psyforge-local-actors.json
```

The server resolves actor ID, tenant ID, and role from that token. It does not accept those attributes from request headers, so headers cannot elevate a local operator into a reviewer. This is an enforced local workflow boundary, not person-level or enterprise authentication; access to the local OS account or credential file remains trusted.

Every API write requires `Content-Type: application/json`, is limited to 64 KiB, and rejects unknown fields.

| Method | Route | Credential-bound role | Purpose |
|---|---|---|---|
| `GET` | `/health` | none | loopback liveness only |
| `POST` / `DELETE` | `/v1/session` | configured actor token / session | issue or clear a local session |
| `POST` | `/v1/consents` | operator | grant behavioral-analysis consent |
| `POST` | `/v1/consents/revoke` | operator | revoke and purge operational subject data |
| `POST` | `/v1/events` | ingestor | submit one consented, versioned event |
| `POST` | `/v1/features/recompute` | operator | recompute approved seven-day features |
| `POST` | `/v1/models/baseline` | operator | compute descriptive baseline |
| `POST` | `/v1/recommendations` | operator | create a pending human-review item |
| `GET` / `POST` | `/v1/recommendations/{id}` and `/decisions` | operator/reviewer/ethics reviewer | inspect or make one terminal decision |
| `GET` | `/v1/audit` | operator | inspect immutable tenant audit history |
| `POST` | `/v1/evidence/sources` | operator | register metadata and transient source text for hashing only |
| `GET` | `/v1/evidence/sources` | operator/evidence reviewer | inspect source metadata, hash, and status without source text |
| `POST` | `/v1/evidence/sources/{id}/reviews` | evidence reviewer | record one terminal source-rights decision |
| `POST` | `/v1/evidence/sources/{id}/revoke` | evidence reviewer | revoke one approved source-rights record |
| POST | /v1/graph/assertions | operator | create one approved-synthetic structural assertion |
| GET | /v1/graph/assertions | operator/evidence reviewer | inspect provenance and invalidation state without source text |

## Timestamp contract

Every external P0–P6 timestamp field—including consent grant/expiry, telemetry occurrence, evidence publication, and feature-command window end—uses one deterministic extended ISO-8601 profile:

```text
YYYY-MM-DDTHH:mm:ss[.fraction](Z|+HH:MM|-HH:MM)
```

An explicit UTC designator or numeric offset is required. Calendar values, clock fields, offsets, and one-to-three-digit fractional precision are validated before parsing; date-only strings, local-time strings, impossible dates, and more than three fractional digits are rejected. Accepted values are normalized and stored as `YYYY-MM-DDTHH:mm:ss.SSSZ` UTC, so comparisons, replays, and audit records are deterministic.
## Retention and recovery

P0 consent revocation synchronously removes raw telemetry, materialized features, unreviewed recommendations, and model rows no longer referenced by a completed review. A completed review remains immutable for governance, but its recommendation/model subject link and source feature snapshot are scrubbed. Historical audit entries are retained as the minimum P0 governance record.

P5 source revocation keeps metadata, immutable review/revocation facts, and audit history but does not retain raw source text. For P6, the same transaction writes immutable invalidations for every active graph assertion referencing that source. The assertions remain inspectable as inactive governance history, are excluded from fixture export, and cannot support a new graph write.

SQLite uses WAL mode. Stop the service cleanly before copying the data directory for a local backup. A restore is accepted only after an operator verifies a read-only copy with the automated tests and checks that the audit table remains immutable. There is no remote replication or automatic backup in this slice. This is not a general legal-retention policy; establish one before processing real data.

## Verification

```powershell
npm run lint
npm run test
npm run build
npm run benchmark:local
```

The test suite uses synthetic, non-personal data and covers strict credential parsing, forged-role-header resistance, session binding, consent, rejection, replay handling, local persistence, purge/scrubbing, immutable audit/review/revocation history, tenant isolation, and the HTTP contract.

`server/fixtures.ts` is the reusable synthetic P1 fixture generator. It is deliberately not a live-data importer or production seed command. The reproducible local P2 feature command is documented in [FEATURE-ENGINE.md](FEATURE-ENGINE.md). `server/import-evidence.ts` is a separate bounded P5 fixture importer; its full source, rights, and retention boundary is documented in [EVIDENCE-REGISTRY.md](EVIDENCE-REGISTRY.md). `npm run graph:fixture` imports or exports only bounded synthetic P6 assertions; see [NEXT-PHASE-PLAN.md](NEXT-PHASE-PLAN.md).
