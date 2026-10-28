# PsyForge Delivery Manifest

## Current repository contents

| Surface | Purpose | Status |
|---|---|---|
| `PsyForge_VolumeI.md`–`PsyForge_VolumeX.md` | Normative ten-volume platform specification | Complete against the master TOC |
| `PsyForge_Appendices.md` | Schemas, traceability, templates, and reference indexes | Complete against the master TOC |
| `PsyForge_v1_Master_TOC.md` | Canonical navigation and completion matrix | Canonical |
| `AGENTS.md` / `docs/GOVERNANCE-ADOPTION.md` | Canonical Constitution loader, local gates, and published/local adoption boundary | Current |
| `governance_tests/` / `tools/check-source-map-security.mjs` | Positive loader, ignore-boundary, and patched dependency regressions | Current |
| `src/` | Local deterministic dashboard plus Local Review, Evidence Registry, and read-only P6 Graph Inspector clients | Implemented; product panels remain sample data |
| `server/` | Credential-bound loopback service, SQLite store, deterministic features/baseline, review workflow, metadata-only evidence registry with revocation, and synthetic structural graph kernel | Implemented P0–P6 vertical slices only |
| `docs/LOCAL-SERVICE.md` / `LOCAL-ACTOR-CREDENTIALS.md` | Local operation, retention, API-boundary, and credential runbooks | Current |
| `docs/foundations/GLOSSARY.md` / `LOCAL-RESOURCE-BUDGET.md` | P0 vocabulary and verified local workload constraints | Current |
| `server/benchmark-local.ts` | Deterministic in-memory resource benchmark and budget enforcement | Current |
| `docs/EVIDENCE-REGISTRY.md` | Metadata-only source registration, rights-review, and source-revocation runbook | Current |
| `docs/FEATURE-ENGINE.md` | P2 declarative definitions and reproducible recomputation runbook | Current |
| `server/recompute-features.ts` | Strict local-only P2 recomputation command | Current |
| `docs/foundations/ADR-INDEX.md` | Chronological architecture-decision index | Current |
| `docs/TRACEABILITY.json` | Generated normative-requirement and verified-increment ledger | Current |
| `scripts/generate-traceability.mjs` | Deterministic canonical-order traceability generator | Current |
| `docs/MODEL-CARD-BASELINE-1.0.md` / `docs/EVALUATION-CARD-BASELINE-1.0.md` | Baseline scope and evidence limits | Current |
| `docs/MODEL-REGISTRY.md` / `docs/DRIFT-AND-ROLLBACK.md` | Executable P3 registry contract and local drift/rollback boundary | Current |
| `server/domain/model-registry.ts` | P3 registered-model and data-contract drift gate | Current |
| `server/auth/local-credentials.ts` | Strict private credential parsing and role-bound local actor bootstrap | Current |
| `docs/AUDIT-2026-08-21.md` | Full TOC, constitution, and implementation audit record | Current |
| `docs/IMPLEMENTATION-PLAN.md` | Dependency-ordered remaining-platform plan | Current |
| `docs/NEXT-PHASE-PLAN.md` / `docs/foundations/ADR-009-SYNTHETIC-GRAPH-KERNEL.md` | Director-approved P6 contract and decision record | Implemented P6 structural graph boundary |
| `docs/P7-PLANNING.md` | Director-decision package for the next graph increment | Planning only; no P7 code exists |
| `server/graph/` / `server/domain/graph.ts` | Bounded P6 fixture I/O, closed graph contract, and deterministic export | Current |
| `package.json` / `package-lock.json` | Reproducible npm build and test configuration | Current |

## Verification

```powershell
npm ci
python -m unittest discover -s governance_tests -v
node tools/check-source-map-security.mjs
npm run lint
npm run test
npm run build
npm run docs:traceability
npm run benchmark:local
npm audit --audit-level=low
```

Also validate the verified canonical source and run its adoption audit as
documented in `docs/GOVERNANCE-ADOPTION.md`; score all 15 Section 0 checks.
The unpublished local P0–P6 source and its acceptance gates remain distinct
from the public P0–P4 baseline. This local reconciliation is not publication.

The dashboard has no remote AI provider integration. `npm run build` produces the reviewable static bundle in `dist/`; `npm run start:server` serves it with the local P0–P6 API and creates ignored local operational data under `data/`.

## Deliberate boundary

The specification is complete as a design contract. The P0–P6 local vertical slices are implemented, while corpus expansion, broader graph semantics, causal/model/simulation/agent work, SDKs, infrastructure, and delivery integrations remain future work. See `docs/IMPLEMENTATION-PLAN.md` for the gated remaining program.
