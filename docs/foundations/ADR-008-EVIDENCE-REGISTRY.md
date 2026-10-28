# ADR-008: Retain evidence metadata and hash, not source text

- Status: Accepted and implemented for P5 on 2026-08-21
- Decision owner: PsyForge local-service boundary
- Implements: `server/evidence/local-source-import.ts`, `server/import-evidence.ts`, `server/domain/validation.ts`, `server/auth/local-credentials.ts`, `server/persistence/repository.ts`, and `server/application/psyforge-service.ts`

## Context

The first corpus-adjacent capability must establish provenance and rights controls before graph, embedding, retrieval, simulation, or agent work begins. A registry that persists arbitrary source text would expand copyright, retention, breach, and accidental-provider-transfer risk before a source policy and encryption-at-rest decision exist. A role label supplied by a shared local token would also let an importing caller self-select the evidence-review role, defeating even a bounded workflow separation.

## Decision

P5 accepts one bounded, local fixture directory at a time; validates a closed manifest schema; calculates SHA-256 over its UTF-8 source text; and persists only source metadata, the digest, byte count, source status, and immutable human workflow records. The raw source text is discarded after registration, the dashboard clears the successful registration form's content, and text is never returned by the API, stored in SQLite, embedded, sent to a provider, or offered to an agent.

The registry accepts only explicit, allow-listed rights bases: public domain, CC BY 4.0, CC BY-SA 4.0, organization-owned, written permission, and synthetic. Registration is an `operator` action. Distinct private local tokens bind the operator and `evidence_reviewer` workflow identities; the HTTP server derives actor, tenant, and role from the token and ignores caller-supplied role headers. Only the evidence-reviewer credential may approve/reject a pending source or revoke an approved source, each with a required 10–2000-character rationale. Review and revocation records are terminal and immutable. Source status transitions are `pending_review → approved|rejected` and `approved → revoked`.

This is local credential-bound workflow separation, not proof of separate human identities. The local OS account and credential file remain trusted. A real multi-user approval authority needs a separately approved identity design.

## Consequences

- Provenance can be reconstructed from the source key/version, stable citation, publisher, rights reference, hash, byte count, source status, audit history, and review/revocation rationale.
- The database does not become an ungoverned corpus store; source retention and encryption-at-rest remain explicit future decisions.
- A re-import of the same tenant/source/version fails closed. A changed body under that immutable version produces an explicit hash-mismatch rejection and an audit event rather than silently replacing the registered record.
- Revocation records a terminal rights withdrawal without a payload-deletion action because P5 has no retained payload. P6 now defines immutable downstream graph invalidation in [ADR-009](ADR-009-SYNTHETIC-GRAPH-KERNEL.md); broader derived-artifact policy remains unapproved.
- This is not corpus ingestion. It provides neither source retrieval nor approval to create graph entities, embeddings, model inputs, simulations, recommendations, or agent access.

## Alternatives considered

1. **Persist local source text at P5.** Rejected: the first implementation would inherit copyright, access-control, retention, backup, and encryption obligations without an approved source policy.
2. **Hash only after parsing, indexing, or embedding.** Rejected: it would allow a changed or unsafe input to influence derived state before provenance is fixed.
3. **Let the importing operator self-approve through caller-supplied role headers.** Rejected: it defeats the credential-bound workflow separation and provides no meaningful local control.
4. **Fetch public URLs or use a hosted research/LLM service.** Rejected: P5 is deliberately local-only, deterministic, and provider-free.