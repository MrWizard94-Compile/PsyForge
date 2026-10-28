# Local Evidence Registry Runbook

## Scope

P5 is a local provenance and rights-workflow foundation. It accepts a bounded local source only long enough to validate and SHA-256 hash it, then retains only allow-listed metadata, byte count, digest, terminal review/revocation state, and immutable audit records. It is not a corpus store, web fetcher, embedding pipeline, retrieval system, model input, simulation, agent capability, or production-control surface. The only P6 consumer is a synthetic structural assertion after an explicit approved-source check.

Raw source text is never written to SQLite, audit rows, API responses, UI state after registration, logs, an embedding, or a provider request. The registry has no external-network capability.

## Local actor credentials and roles

Start the local service once. On first launch it creates the ignored secret file `data/.psyforge-local-actors.json` with distinct 64-character tokens bound to these fixed local workflow actors in tenant `studio-alpha`: `local-operator`, `local-ingestor`, `local-reviewer`, `local-ethics-reviewer`, and `local-evidence-reviewer`.

Give the dashboard or API only the intended actor token in `X-PsyForge-API-Token`; do not send actor, tenant, or role headers. The service derives all three from the credential and ignores any caller-supplied role header. A token therefore cannot self-elevate from `operator` to `evidence_reviewer`. The credential file is a local secret and must not be committed, logged, copied to an untrusted browser profile, or shared casually.

This is a local workflow boundary, not an enterprise identity provider or proof that two credentials represent two different people. The local OS account and access to the credential file remain trusted. Real multi-user evidence governance requires a separately approved identity, credential-distribution, and audit-retention design.

| Method | Route | Credential-bound role | Result |
|---|---|---|---|
| `POST` | `/v1/evidence/sources` | `operator` | Validates metadata plus transient content, stores metadata/hash only, and creates a pending source. |
| `GET` | `/v1/evidence/sources` | `operator` or `evidence_reviewer` | Lists metadata, hash, byte count, and status; never source text. |
| `POST` | `/v1/evidence/sources/{sourceId}/reviews` | `evidence_reviewer` | Records one terminal `approved` or `rejected` decision and a 10–2000-character rationale. |
| `POST` | `/v1/evidence/sources/{sourceId}/revoke` | `evidence_reviewer` | Records one terminal rights revocation with a 10–2000-character rationale; only an approved source can be revoked. |

All write boundaries require an authenticated local session or configured token, exact JSON keys, tenant-constrained source lookup, and a 64-KiB HTTP-body limit. Review and revocation rows are immutable at the SQLite layer; source status transitions are `pending_review → approved|rejected` and `approved → revoked` only.

## Registration contract

The registration body has exactly these fields:

```text
tenantId, sourceKey, version, title, stableCitation, publisher,
publishedAt, domain, licenseBasis, rightsReference, content
```

`sourceKey`, `version`, citations, publisher, and rights reference are bounded strings. `content` is UTF-8 text limited to 48 KiB and is hashed at the local service boundary. The only accepted domains are `game_psychology`, `behavioral_economics`, `motivation_theory`, `cognitive_science`, `game_design`, `social_dynamics`, `ux_research`, `marketing_science`, `education_psychology`, `decision_theory`, and `synthetic_test`. The only accepted rights bases are `public_domain`, `cc_by_4_0`, `cc_by_sa_4_0`, `organization_owned`, `written_permission`, and `synthetic`.

The unique key is `(tenantId, sourceKey, version)`. Re-registering that key fails closed: the same body is rejected as a duplicate and changed content is rejected with an immutable-hash-mismatch audit event. A source owner cannot use the `operator` credential to review or revoke a source because that credential is bound to the operator role.

## Bounded local importer

The importer reads exactly two regular files from one local directory:

```text
source-manifest.json
source.txt
```

The manifest has a closed schema and must contain the same metadata fields as registration except `tenantId` and `content`. It rejects traversal, symlinks/non-regular files, unsafe/unknown fields, oversized content, malformed JSON, and unapproved rights metadata before it calls the registry.

Run it after a normal install:

```powershell
npm run import:evidence -- --data-dir .\data --source-dir .\fixture --tenant-id studio-alpha
```

The command writes only a compact JSON receipt with the generated source ID, pending status, hash, and byte count. It never prints source text. It is a local operator fixture importer, not a source-policy approval tool.

## Rights revocation and retention

A credential-bound `evidence_reviewer` may revoke an approved source when its rights basis becomes invalid by posting exactly `{ "rationale": "..." }` to the revoke route. The service changes the source status to `revoked`, writes an immutable `evidence_source_revocations` record, and appends `evidence.source_revoked` to the tenant audit trail. A rejected, pending, or already revoked source cannot be revoked, and no record can be overwritten or deleted through SQLite.

Because P5 never retains raw content, revocation still needs no payload deletion. P6 now adds the only allowed downstream consumer: in the same revocation transaction it records immutable invalidations for each active synthetic graph assertion referencing the source. Those assertions stay visible as inactive governance history, are excluded from exports, and cannot authorize a new write. No corpus, model, simulation, agent, or recommendation consumer exists.

## Verification

```powershell
npm run lint
npm run test
npm run build
npm run import:evidence -- --data-dir .\data --source-dir .\fixture --tenant-id studio-alpha
```

The automated suite covers metadata-only storage, strict local credential parsing, ignored forged role headers, credential-bound sessions, tenant isolation, independent role authorization, duplicate and changed-content hash-mismatch rejection, immutable reviews and revocations, rejection/revocation audit events, strict manifests, traversal-resistant local paths, and rejection of a non-regular source path. The release verification also exercises the compiled importer with a synthetic fixture.