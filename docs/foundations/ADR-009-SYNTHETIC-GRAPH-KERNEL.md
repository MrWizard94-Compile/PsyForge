# ADR-009: Synthetic, provenance-bound structural graph kernel

- Status: Accepted and implemented for P6 on 2026-08-21
- Decision owner: PsyForge director approval
- Implements: `server/domain/graph.ts`, `server/graph/`, `server/application/psyforge-service.ts`, `server/persistence/repository.ts`, `server/transport/http-server.ts`, and the P6 Graph Inspector

## Context

P5 established a metadata-only evidence provenance and rights boundary. P6 must prove a graph assertion can reference approved provenance without retaining source text, inventing a causal claim, adding retrieval or embedding capabilities, or treating an approved source as permission for broader corpus use.

## Decision

The director-approved P6 vocabulary is exactly one structural relationship: `Corpus Concept → Belongs_To → Domain Entity`. Its code identifiers are `corpus_concept`, `belongs_to`, and `domain_entity`; no other Volume III type is implemented. An assertion must be explicitly `observed`, has confidence `1`, and is authored only by the credential-bound `operator` role. P6 accepts only a P5 source that is simultaneously `approved`, non-revoked, `synthetic_test`, and `synthetic`; no real, licensed, protected, human-subject, or externally fetched source is admitted.

Nodes, assertions, invalidations, and their audit records are tenant-scoped SQLite facts. Node identities, assertion records, invalidation rows, source review rows, and audit rows are immutable at the database layer. Each assertion records its source ID/version/hash, author/role, epistemic tier, correlation ID, and creation time. The read-only inspector exposes that provenance and source status, never source content.

When a P5 evidence reviewer revokes an approved source, the same local transaction records the rights revocation and inserts immutable `evidence_rights_revoked` invalidations for every active P6 assertion backed by that source. The assertion remains available for governance inspection but is excluded from active fixture exports and cannot support a new write.

Synthetic graph fixtures are bounded to 128 assertions and 64 KiB, accept exact JSON only from a regular local file, import as one transaction, export deterministic UTF-8 JSON without overwriting a file, and require that referenced P5 provenance already exists in the same tenant.

## Consequences

- P6 provides a controlled, reconstructible graph foundation but not a general knowledge graph, corpus, retrieval engine, causal model, agent tool, model input, simulation input, or recommendation source.
- An approved non-synthetic P5 record deliberately fails closed; future corpus admission needs a distinct policy, encryption-at-rest decision, and director approval.
- Rights withdrawal produces explicit downstream invalidation rather than deletion or silent continued use.
- Source text remains absent from graph tables, graph APIs, fixture exports, dashboard state, logs, and provider traffic.

## Alternatives considered

1. **Implement the full Volume III catalog.** Rejected: it would imply unresolved semantics, causal-evidence policy, and broader handling not authorized for P6.
2. **Permit all P5 approved rights bases.** Rejected: approval of metadata/rights does not authorize corpus or graph use without a source policy.
3. **Delete graph assertions on revocation.** Rejected: immutable governance history must show that an assertion existed and became unusable.
4. **Make the dashboard a graph authoring surface.** Rejected: P6 requires a read-only inspector; writes remain strict local API/fixture operations.