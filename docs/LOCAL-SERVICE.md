# PsyForge Local Service Runbook

## Scope

This runbook operates the P0–P4 local vertical slice only: consented telemetry intake, deterministic features, a descriptive baseline, and human review. It is not a hosted service, telemetry SDK, local-LLM runtime, game integration, or production-control plane.

## Requirements and start

Use Node.js 22 or newer and npm 11.8.0 or newer. The service binds only to `127.0.0.1` on port `4317` by default.

```powershell
npm ci
npm run build
npm run start:server
```

The first start creates `data/psyforge.sqlite` and a 64-hex-character local token at `data/.psyforge-local-token`. Both are intentionally ignored by Git. Read that file only on the local workstation; do not paste its value into source, screenshots, issue trackers, or logs. The service never prints the token.

For isolated testing, set `PSYFORGE_DATA_DIR` to a trusted local directory. `PSYFORGE_PORT` may select a loopback port from 1024 through 65535. `PSYFORGE_LOCAL_TOKEN` can supply a 64-character hexadecimal token for an ephemeral session, but the normal local-file token is preferred.

## Local authentication and routes

Create a short-lived local session by posting the local token and operator identity to `POST /v1/session`. The returned `HttpOnly`, `SameSite=Strict` cookie lasts at most eight hours and exists only in memory, so it expires on service restart. The development dashboard proxies `/api/*` to this local service; the production service serves the built `dist/` dashboard and exposes `/v1/*` directly.

Every API write requires `Content-Type: application/json`, is limited to 64 KiB, and rejects unknown fields. Actor headers are required only to create a session:

```text
X-PsyForge-API-Token: local-token-from-file
X-PsyForge-Actor-Id: local-operator-id
X-PsyForge-Role: operator | ingestor | reviewer | ethics_reviewer
X-PsyForge-Tenant-Id: studio-alpha
```

Available P0–P4 routes:

| Method | Route | Authorized role | Purpose |
|---|---|---|---|
| `GET` | `/health` | none | loopback liveness only |
| `POST` / `DELETE` | `/v1/session` | token headers / session | issue or clear local session |
| `POST` | `/v1/consents` | operator | grant behavioral-analysis consent |
| `POST` | `/v1/consents/revoke` | operator | revoke and purge operational subject data |
| `POST` | `/v1/events` | ingestor | submit one consented, versioned event |
| `POST` | `/v1/features/recompute` | operator | recompute approved seven-day features |
| `POST` | `/v1/models/baseline` | operator | compute descriptive baseline |
| `POST` | `/v1/recommendations` | operator | create a pending human-review item |
| `GET` / `POST` | `/v1/recommendations/{id}` and `/decisions` | operator/reviewer/ethics reviewer | inspect or make one terminal decision |
| `GET` | `/v1/audit` | operator | inspect immutable tenant audit history |

## Retention and recovery

Revocation synchronously removes raw telemetry, materialized features, unreviewed recommendations, and model rows no longer referenced by a completed review. A completed review remains immutable for governance, but its recommendation/model subject link and source feature snapshot are scrubbed. Historical audit entries are retained as the minimum P0 governance record. This is not a general legal-retention policy; deployers must establish one before processing real data.

SQLite uses WAL mode. Stop the service cleanly before copying the data directory for a local backup. A restore is accepted only after an operator verifies a read-only copy with the automated tests and checks that the audit table remains immutable. There is no remote replication or automatic backup in this slice.

## Verification

```powershell
npm run lint
npm run test
npm run build
```

The test suite uses synthetic, non-personal data and covers consent, rejection, replay handling, local persistence, purge/scrubbing, immutable audit/review history, review authorization, and the HTTP session contract.

`server/fixtures.ts` is the reusable synthetic P1 fixture generator. It is deliberately not a live-data importer or a production seed command.
