# PsyForge Delivery Manifest

## Current repository contents

| Surface | Purpose | Status |
|---|---|---|
| `PsyForge_VolumeI.md`–`PsyForge_VolumeX.md` | Normative ten-volume platform specification | Complete against the master TOC |
| `PsyForge_Appendices.md` | Schemas, traceability, templates, and reference indexes | Complete against the master TOC |
| `PsyForge_v1_Master_TOC.md` | Canonical navigation and completion matrix | Canonical |
| `AGENTS.md` / `docs/GOVERNANCE-ADOPTION.md` | Canonical Constitution loader and dated adoption/verification record | Current |
| `governance_tests/` / `tools/check-source-map-security.mjs` | Positive loader, ignore-boundary, and patched dependency regression checks | Current |
| `src/` | Local deterministic dashboard plus Local Review client | Implemented; product panels remain sample data |
| `server/` | Consent-aware loopback service, SQLite store, deterministic features/baseline, and review workflow | Implemented P0–P4 vertical slice only |
| `docs/LOCAL-SERVICE.md` | Local operation, retention, and API-boundary runbook | Current |
| `docs/MODEL-CARD-BASELINE-1.0.md` / `docs/EVALUATION-CARD-BASELINE-1.0.md` | Baseline scope and evidence limits | Current |
| `docs/AUDIT-2026-08-21.md` | Full TOC, constitution, and implementation audit record | Current |
| `docs/IMPLEMENTATION-PLAN.md` | Dependency-ordered remaining-platform plan | Current |
| `docs/NEXT-PHASE-PLAN.md` | Proposed P5 evidence-registry gate and director decisions | Planning only; no P5 code exists |
| `package.json` / `package-lock.json` | Reproducible npm build and test configuration | Current |

## Verification

```powershell
npm ci
python -m unittest discover -s governance_tests -v
node tools/check-source-map-security.mjs
npm run lint
npm run test
npm run build
npm audit --audit-level=low
```

The canonical-source CI job separately validates the accepted source and runs
its adoption audit. See `docs/GOVERNANCE-ADOPTION.md` to reproduce that pinned
audit; Python is a governance-development dependency, not a product runtime.

The dashboard has no remote AI provider integration. `npm run build` produces the reviewable static bundle in `dist/`; `npm run start:server` serves it with the local P0–P4 API and creates ignored local operational data under `data/`.

## Deliberate boundary

The specification is complete as a design contract. The P0–P4 local vertical slice is implemented, while graph/corpus/simulation/agent work, SDKs, infrastructure, and delivery integrations remain future work. See `docs/IMPLEMENTATION-PLAN.md` for the gated remaining program.
