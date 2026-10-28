# P7 Planning: Governed Structural Vocabulary Expansion

- Status: Planning only — no P7 code, migration, fixture, or behavior is authorized by this document.
- Depends on: P6 verified synthetic structural graph kernel and [ADR-009](foundations/ADR-009-SYNTHETIC-GRAPH-KERNEL.md).
- Purpose: determine whether the graph may safely grow beyond the one P6 relationship without admitting real corpus material, causal claims, inference, retrieval, models, simulations, agents, or recommendations.

## Why P7 is separate

P6 proves immutable provenance, rights-revocation invalidation, tenant scoping, fixture determinism, and read-only inspection for one deliberately narrow Volume III structural relation. It does **not** authorize silent catalog expansion. Under Volume III `REQ-GRAPH-001`, `REQ-GRAPH-002`, `REQ-GRAPH-003`, and `REQ-GRAPH-007`, a new type must be deliberate, documented, and tested before it enters the local graph.

## Candidate scope for director review

The recommended planning candidate is a second synthetic-only structural relation from the existing Volume III catalog:

```text
Behavior → Part_Of → Domain Entity
```

It would remain an `observed` assertion, require an approved non-revoked P5 synthetic source, use the same immutable provenance/revocation rules as P6, and have no causal, predictive, or player-specific interpretation. This is a candidate—not an approved P7 vocabulary.

## Decisions required before implementation

1. **Vocabulary:** approve the candidate above, select another existing Volume III structural pair, or retain P6 unchanged.
2. **Identity policy:** decide whether a graph node key may aggregate multiple approved synthetic sources, or whether P7 retains P6’s one-node/one-provenance identity rule.
3. **Assertion lifecycle:** decide whether a later structural assertion may supersede an earlier active assertion, and if so define the exact immutable validity-interval and export behavior.
4. **Source boundary:** confirm that P7 remains synthetic-only. Real or licensed corpus admission is expressly outside this plan until a source policy, encryption-at-rest, backup/retention, access-control, and legal-review design is accepted.
5. **Review authority:** decide whether operator-only creation remains sufficient for a non-causal structural relation or whether a separate graph-review role is required before any catalog expansion.

## Dependency-ordered implementation plan after approval

1. Amend the P7 ADR and glossary with the approved canonical vocabulary and explicit semantic non-claim.
2. Extend the closed parser, schema `CHECK` constraints, and migrations with a versioned catalog amendment; preserve all P6 rows and migrations.
3. Define source/target compatibility, identity, duplicate, supersession, and revocation-invalidation rules before writing a repository method.
4. Add transactional write/read/export/import behavior and immutable audit records; ensure P5 rights revocation covers every newly allowed assertion.
5. Extend the inspector only as a read-only provenance view; it must not become a graph authoring or recommendation surface.
6. Add unit, persistence, transport, negative-path, revocation, migration, deterministic-fixture, resource, and compiled-artifact tests.
7. Update traceability, ADR index, threat model, acceptance plan, runbooks, audit, and manifest in the same reviewable change.

## Explicit P7 non-goals

- No real source, protected work, human-subject data, URL fetch, retained corpus text, encryption bypass, cloud sync, or provider integration.
- No `Causes`, `Correlates_With`, inference tier, confidence estimation, embedding, retrieval, entity-resolution similarity matching, model feature, simulation input, agent tool, or recommendation use.
- No actor-identity redesign beyond an explicit approved decision.

## Approval package required to start P7 code

A director response must select all five decisions above. The implementation delivery must then pass clean install, zero-warning lint/typecheck, full behavior/security/persistence/migration tests, production build, bounded resource benchmark, dependency audit, Constitution integrity/mechanical checks, traceability regeneration, documentation inventory, and a compiled local artifact run.