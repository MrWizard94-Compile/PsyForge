# Local Actor Credential Runbook

## Purpose

The P0–P6 loopback service uses a private, role-bound local credential file so callers cannot choose an actor, tenant, or role in an HTTP header. This supports a bounded local workflow with auditable role separation; it is not a replacement for a multi-user identity system.

## First run and storage

After `npm run build`, start the service:

```powershell
npm run start:server
```

If it does not exist, the service creates `data/.psyforge-local-actors.json` with schema version `1.0` and five random 64-character actor tokens. The file and its containing `data/` directory are ignored by Git. The service never prints a token, serves the file, or stores it in browser state.

The generated records are bound to one tenant and one role:

| Actor ID | Role | Permitted local workflow |
|---|---|---|
| `local-operator` | `operator` | Consent, features, baseline/recommendation creation, audit inspection, and evidence registration. |
| `local-ingestor` | `ingestor` | Consented telemetry ingestion only. |
| `local-reviewer` | `reviewer` | Approved/rejected/modified recommendation decisions only. |
| `local-ethics-reviewer` | `ethics_reviewer` | Ethics veto only. |
| `local-evidence-reviewer` | `evidence_reviewer` | Evidence approval/rejection and approved-source revocation only. |

Use the token from the intended record in `X-PsyForge-API-Token` or paste it into a local dashboard session form. The HTTP server maps it to the fixed actor record, creates an eight-hour in-memory HttpOnly session, and does not trust `X-PsyForge-Actor-Id`, `X-PsyForge-Role`, or `X-PsyForge-Tenant-Id`.

## Security boundary and recovery

Treat every token as a local secret. Do not commit, share, log, or pass it to a remote service. Loopback-only binding, token-to-actor resolution, strict request schemas, tenant-scoped storage queries, and audit records protect the implemented local slice. Access to the local OS account or the credential file compromises this workflow boundary; the file does not prove person-level independence and is not suitable for remote or multi-user deployment.

To rotate all initial actor tokens for a local development instance, stop the service, move the exact `data/.psyforge-local-actors.json` file to a secure backup location outside the repository, and restart the service. This creates a new credential set while preserving the local SQLite database. Do not perform this rotation during an active review session. A production rotation/revocation protocol is outside P0–P6 and requires a separately approved identity design.

## Verification

`server/auth/local-credentials.test.ts` proves strict schema parsing, unique actor/token enforcement, and bootstrap round-trip. `server/http-server.test.ts` proves that a forged role header cannot turn an operator token into an evidence-review credential and that the resulting session identity is fixed by the configured token.