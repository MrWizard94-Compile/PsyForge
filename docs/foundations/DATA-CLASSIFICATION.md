# PsyForge P0 Data Classification and Retention Model

## Scope

This applies only to the initial local telemetry slice. It deliberately excludes payment, precise location, real identity, chat, voice, protected characteristics, health data, and inferred vulnerability data.

| Class | Examples | Handling |
|---|---|---|
| Operational public | schema version, event type catalog | version-controlled and freely readable |
| Tenant-confidential | tenant ID, feature definitions, review decision metadata | tenant-scoped; audit access; no cross-tenant query |
| Pseudonymous behavioral | opaque subject ID, session/activity events, derived features | consent/purpose bound; local encrypted-volume responsibility; minimized export |
| Restricted governance | consent records, ethics scorecards, review/audit records | least privilege; append-only audit; retention/deletion workflow |
| Secrets | API tokens, encryption keys, credentials | never committed, logged, or sent to the browser |

## Initial data contract boundaries

The slice permits only opaque IDs and activity/session metadata needed for four non-sensitive aggregate behavioral features. It cannot ingest an email, name, IP address, payment, free text, location, demographic field, or a field presented as an inference about a vulnerable person.

## Retention and deletion

P0–P4 applies deletion only when an operator revokes consent: it synchronously removes raw telemetry, materialized features, unreviewed recommendations, and unreferenced model rows for that tenant/subject. A completed human review is retained only as a scrubbed governance record, and immutable audit rows remain without raw payload. Configurable retention periods, legal holds, external exports, and multi-region transfer are out of scope until separately designed.
