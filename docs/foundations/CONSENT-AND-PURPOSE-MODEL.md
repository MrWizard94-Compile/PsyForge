# PsyForge P0 Consent and Purpose Model

## Policy

The ingest client never self-attests consent. A local operator records a consent grant before events are accepted. Each grant binds one tenant, one opaque subject, one approved purpose, a policy version, grant time, and expiry time.

The sole P0 purpose is `behavioral_analysis`. It supports aggregate session and activity features for product-experience analysis. It does not permit individual targeting, marketing, price discrimination, monetization optimization, protected-class inference, or autonomous action.

## Enforcement rules

1. Event tenant and subject must match a non-revoked, unexpired grant.
2. The event purpose must equal an allowed grant purpose.
3. Every grant, revocation, accepted event, rejected event, feature computation, model result, and review decision writes an audit event.
4. Revocation blocks new ingestion immediately and deterministically purges the subject's telemetry, materialized features, unreviewed recommendations, and unreferenced model results within the same local transaction. A completed human review and its associated, scrubbed recommendation/model record remain as an immutable governance record; their subject link and feature snapshot are removed. Existing immutable audit rows are retained as the minimum P0 governance record.
5. Unknown consent state fails closed.

## Local operator roles

`operator` may create/revoke consent grants and inspect audit records. `reviewer` may decide recommendations only. `ingestor` may submit validated events only. The initial service has no unauthenticated network listener; API authorization is enforced in the transport adapter and domain services also receive an explicit actor role.
