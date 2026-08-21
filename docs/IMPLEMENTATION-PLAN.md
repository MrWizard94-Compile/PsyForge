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

Exit evidence: human-approved architecture boundary; no code begins without identified storage, identity, audit, and secrets dependencies. Select a local service/runtime stack only after the ADR compares supportability, offline operation, licensing, and current Windows hardware constraints.

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
- No feature derives a protected or vulnerable-person inference without a dedicated approved use case.
- Resource measurements fit the agreed local hardware budget.

## Milestone P3 — Explainable baseline player model — implemented vertical slice

Deliverable: one interpretable, calibrated baseline model with a model card, evaluation card, source-feature explanation, version registry entry, drift signal definition, and rollback artifact.

Acceptance criteria:

- The model exposes confidence and evidence rather than a categorical claim alone.
- Evaluation uses versioned, consented, held-out fixtures and documents limitations.
- Subgroup, privacy, leakage, calibration, and explainability checks pass.
- Outputs do not create an autonomous deployment or monetization action.

## Milestone P4 — Human-only recommendation review — implemented vertical slice

Deliverable: recommendation schema, ethics score-card interface, immutable review states, reviewer authorization, reject/modify/approve actions, and audit exports.

Acceptance criteria:

- Every recommendation links model/version, features, evidence, uncertainty, ethics result, and a human decision.
- A denied/vetoed recommendation cannot transition to approved through an API, UI, or agent identity.
- The review history is append-only and a reviewer can reconstruct why a decision was made.

## Remaining work after P0–P4 verification

Knowledge graph, corpus ingestion, persona simulation, local LLM/agent orchestration, external SDKs, hosted/cloud deployment, air-gapped packaging, marketplace, and additional industry corpora remain intentionally deferred. Each has a specified home in Volumes III–IX but requires a new dependency review, threat/ethics assessment, tests, resources, and acceptance gate.

The next proposed increment is [P5 Evidence Registry and Corpus Intake Gate](NEXT-PHASE-PLAN.md). It establishes rights and provenance controls before graph, corpus, simulation, or agent implementation.

## Initial research and architecture decisions required

1. Select the local runtime and data-store architecture after comparing Windows/offline support, backup/recovery, licensing, and resource use.
2. Define the first game telemetry contract with a studio-owned consent and data-retention policy.
3. Select the smallest valid feature set and model task. Churn-risk forecasting is a candidate only if a consented, labeled data source and no-harm use case are approved.
4. Establish a model/corpus source registry and an ethics-review cadence before ingesting research or player data.
5. Specify the local model policy separately. Docker-hosted Ollama is the default WPAI direction, but it is not a prerequisite for P1–P4 and must be hardware-sized and evaluated before agent use.

## Definition of done for every milestone

Each increment must pass `CONST-GATE-001`: complete dependencies, zero-warning build, behavior/negative/security tests, synchronized docs and ADRs, deterministic/reproducible local run, resource measurement, no secrets, IP/invention record where relevant, clean review package, and named human acceptance of residual risk.
