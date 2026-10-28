# P6 Typed Knowledge-Graph Kernel

## Decision record

Implemented on 2026-08-21 with director approval. P6 is a deterministic, local, typed structural graph kernel; it is not corpus ingestion, embedding, retrieval, agent, model, simulation, or recommendation capability.

| Director-controlled decision | Approved P6 boundary |
|---|---|
| Vocabulary | `Corpus Concept → Belongs_To → Domain Entity` only (`corpus_concept`, `belongs_to`, `domain_entity`). |
| Assertion authority | Credential-bound `operator` only; the assertion must be `observed`, structural, and synthetic. |
| Rights revocation | The revocation transaction writes immutable invalidations for every active assertion using the source; assertions remain inspectable but inactive and excluded from export. |
| Real-source admission | None. P6 requires an approved `synthetic_test` source with `synthetic` rights basis. A real corpus needs a separate source policy, encryption-at-rest plan, and director approval. |

## Implemented contract

```text
approved synthetic P5 metadata/hash
  → exact structural assertion request
  → closed node/edge validation + tenant checks
  → immutable nodes, assertion, and audit facts
  → rights revocation invalidates downstream assertions transactionally
  → read-only provenance inspector / deterministic fixture export
```

P6 stores source ID/version/hash, source review state, assertion author and role, correlation ID, creation timestamp, explicit observed tier, and immutable invalidation state. It never stores or returns source text. Graph fixture import is limited to a regular local JSON file of at most 64 KiB and 128 assertions, and its batch is all-or-nothing. Export is deterministic, bounded, active-only, and refuses to overwrite a file.

## Non-negotiable enforced exclusions

- No causal relationship, inference, embedding, retrieval, LLM/provider call, persona, model input, simulation input, or recommendation is implemented or exposed.
- Unknown fields, unknown graph types, non-synthetic sources, pending/rejected/revoked sources, cross-tenant references, duplicate assertions, and changed node provenance fail closed.
- Graph nodes, assertions, invalidations, evidence reviews/revocations, and audits are immutable in SQLite.

## Verification

Run the normal quality gates plus a real synthetic fixture operation:

```powershell
npm run lint
npm run test
npm run build
npm run graph:fixture -- --mode import --data-dir .\data --tenant-id studio-alpha --fixture .\fixture.json
npm run graph:fixture -- --mode export --data-dir .\data --tenant-id studio-alpha --fixture .\graph-export.json
```

The full design, rationale, and residual boundary are in [ADR-009](foundations/ADR-009-SYNTHETIC-GRAPH-KERNEL.md).