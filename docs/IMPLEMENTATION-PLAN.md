# PsyForge Next-Part Implementation Plan

## Decision

Build one local-first, evidence-bounded vertical slice before adding agents, cloud deployment, marketplace, or population-scale simulation. The slice proves the platform's distinctive contract without pretending the broader specification is already implemented.

```text
Consented event fixture
  → schema + consent + tenant validation
  → append-only local event store and audit event
  → deterministic feature definitions
  → explainable baseline player model
  → human-only recommendation review queue
```

## Milestone P0 — Foundations and decision records — implemented

Deliverable: a technology ADR set, domain glossary, threat model, data classification, consent/purpose model, local resource budget, and acceptance-test plan.

Exit evidence: [ADR-007](foundations/ADR-007-LOCAL-VERTICAL-SLICE.md), [glossary](foundations/GLOSSARY.md), [threat model](foundations/THREAT-MODEL-P0.md), [data classification](foundations/DATA-CLASSIFICATION.md), [consent/purpose model](foundations/CONSENT-AND-PURPOSE-MODEL.md), [local resource budget](foundations/LOCAL-RESOURCE-BUDGET.md), and [acceptance-test plan](foundations/P0-ACCEPTANCE-TEST-PLAN.md) are present. The runtime choice is documented with supportability, offline-operation, licensing, and local-hardware constraints.

## Milestone P1 — Validated local telemetry pipeline — implemented vertical slice

Deliverable: versioned event contract, fixture generator, validator, quarantine/rejection path, tenant/consent/purpose checks, append-only local storage, and structured audit event schema.

Acceptance criteria:

- Valid fixture events persist with provenance and correlation IDs.
- Unknown, malformed, cross-tenant, expired-consent, and purpose-denied events are rejected without partial writes.
- Tests prove idempotency, ordering policy, retention/deletion behavior, and audit events.
- The whole slice runs offline against a temporary local store.

## Milestone P2 — Deterministic Feature Engine v1 — implemented vertical slice

Deliverable: declarative, versioned feature definitions for a small approved event set; feature windows; provenance linkage; confidence/epistemic tier; and a reproducible recomputation command.

Acceptance criteria:

- A fixed event fixture produces byte-for-byte stable feature outputs on repeated runs.
- Feature definitions have invalid-input, boundary-window, and privacy tests.
- No feature derives a protected or vulnerable-person inference without a dedicated approved use case. The P2 definition language and exact recomputation contract are documented in [FEATURE-ENGINE.md](FEATURE-ENGINE.md).
- Resource measurements fit the agreed local hardware budget documented in [LOCAL-RESOURCE-BUDGET.md](foundations/LOCAL-RESOURCE-BUDGET.md).

## Milestone P3 — Explainable baseline player model — implemented vertical slice

Deliverable: one interpretable, explicitly uncalibrated descriptive baseline with a model card, evaluation card, source-feature explanation, executable version registry entry, data-contract drift signal definition, and rollback artifact.

Acceptance criteria:

- The model exposes confidence and evidence rather than a categorical claim alone.
- Evaluation uses versioned synthetic fixtures, documents limitations, and explicitly withholds predictive/calibration claims until a consented, purpose-limited held-out dataset is approved.
- Privacy and explainability controls pass. Subgroup, leakage, and calibration metrics are intentionally not claimed because this local model is descriptive and has no consented labeled dataset.
- Outputs do not create an autonomous deployment or monetization action. The executable registry and local data-contract drift gate are documented in [MODEL-REGISTRY.md](MODEL-REGISTRY.md) and [DRIFT-AND-ROLLBACK.md](DRIFT-AND-ROLLBACK.md).

## Milestone P4 — Human-only recommendation review — implemented vertical slice

Deliverable: recommendation schema, ethics score-card interface, immutable review states, reviewer authorization, reject/modify/approve actions, and audit exports.

Acceptance criteria:

- Every recommendation links model/version, features, evidence, uncertainty, ethics result, and a human decision.
- A denied/vetoed recommendation cannot transition to approved through an API, UI, or agent identity.
- The review history is append-only and a reviewer can reconstruct why a decision was made.

## Milestone P5 — Metadata-only evidence registry — implemented vertical slice

Deliverable: a local source-manifest reader, strict allow-listed source metadata, SHA-256 provenance receipt, metadata-only SQLite registry, credential-bound local role workflow, immutable rights review/revocation records, audit events, a reproducible command, and a local Evidence Registry view.

Acceptance evidence:

- The importer accepts only two bounded regular local files, rejects unsafe paths and malformed/unknown manifest fields, and fails closed on duplicate tenant/source/version records or changed-content hash mismatches.
- The database persists rights metadata, SHA-256 digest, byte count, and review state, but has no source-content field.
- A token binds one fixed actor/tenant/role, supplied role headers cannot elevate an operator, and the distinct `evidence_reviewer` credential records one terminal review or an approved-source revocation with a required rationale.
- Tests prove metadata-only persistence, duplicate and changed-content hash-mismatch rejection, rejection/revocation audit events, strict fixture handling, credential-bound role authorization, tenant isolation, immutable terminal history, and restart-safe SQLite use.
- P5 is consumed only by the narrow P6 synthetic structural graph kernel; it remains unavailable to corpus retrieval, embeddings, models, simulations, recommendations, agents, providers, URL fetches, or production actions.

The implementation decision and operator boundary are recorded in [ADR-008](foundations/ADR-008-EVIDENCE-REGISTRY.md) and [EVIDENCE-REGISTRY.md](EVIDENCE-REGISTRY.md). The generated [traceability ledger](TRACEABILITY.md) keeps verified local increments distinct from unfinished normative requirements.
## Milestone P6 — Synthetic typed knowledge-graph kernel — implemented vertical slice

Deliverable: a tenant-scoped SQLite structural graph with the closed `Corpus Concept → Belongs_To → Domain Entity` vocabulary, approved-synthetic-evidence gate, immutable nodes/assertions/invalidation rows and audits, deterministic bounded fixture import/export, and a credential-bound read-only provenance inspector.

Acceptance evidence:

- Writes require an `operator` and an approved, non-revoked P5 source whose domain and rights basis are both synthetic; no raw source text is persisted or returned.
- Every assertion reconstructs its source ID/version/hash/status, observed tier, author/role, confidence, timestamp, and audit correlation without a corpus payload.
- A source-rights revocation atomically invalidates all active assertions backed by the source; history remains immutable and inactive assertions are excluded from export.
- Exact-schema, tenant, duplicate, invalid-vocabulary, non-synthetic, and fixture-size failures roll back without partial graph state.
- The P6 inspector is read-only and makes no causal, model, retrieval, agent, simulation, or recommendation claim.

The approved decision and operational boundary are in [ADR-009](foundations/ADR-009-SYNTHETIC-GRAPH-KERNEL.md) and [the P6 decision record](NEXT-PHASE-PLAN.md).

## Next part: P7 planning only

P6 is complete, but P7 code is not authorized. [P7 Planning: Governed Structural Vocabulary Expansion](P7-PLANNING.md) identifies the five director decisions, dependency order, non-goals, and proof package required before implementation. It keeps all real-source, causal, retrieval, model, simulation, agent, and recommendation work outside the next candidate scope.

## Remaining work after P0–P6 verification

Knowledge graph, corpus ingestion, persona simulation, local LLM/agent orchestration, external SDKs, hosted/cloud deployment, air-gapped packaging, marketplace, and additional industry corpora remain intentionally deferred. Each has a specified home in Volumes III–IX but requires a new dependency review, threat/ethics assessment, tests, resources, and acceptance gate.

P6 has established the smallest graph provenance boundary. The next increment must not broaden vocabulary, admit real corpus material, or connect graph data to modeling, inference, simulation, agents, or recommendations without a separately approved design.

## Initial research and architecture decisions required

1. Select the local runtime and data-store architecture after comparing Windows/offline support, backup/recovery, licensing, and resource use.
2. Define the first game telemetry contract with a studio-owned consent and data-retention policy.
3. Select the smallest valid feature set and model task. Churn-risk forecasting is a candidate only if a consented, labeled data source and no-harm use case are approved.
4. Establish a model/corpus source registry and an ethics-review cadence before ingesting research or player data.
5. Specify the local model policy separately. Docker-hosted Ollama is the default WPAI direction, but it is not a prerequisite for P1–P4 and must be hardware-sized and evaluated before agent use.

## Definition of done for every milestone

Each increment must pass `CONST-GATE-001`: complete dependencies, zero-warning build, behavior/negative/security tests, synchronized docs and ADRs, deterministic/reproducible local run, resource measurement, no secrets, IP/invention record where relevant, clean review package, and named human acceptance of residual risk.
