# PsyForge

PsyForge is WPAI's local-first behavioral-intelligence platform specification. It defines an evidence-bounded system for transforming consented interaction telemetry into explainable player models, simulations, and human-reviewed recommendations. It does not make production changes directly.

This repository contains two complementary artifacts:

- A complete ten-volume living specification plus appendices, beginning with [PsyForge_v1_Master_TOC.md](PsyForge_v1_Master_TOC.md).
- A deterministic React dashboard demonstrator plus a verified local P0–P4 service slice. The slice accepts consented synthetic telemetry, computes bounded deterministic features, produces a deliberately low-confidence descriptive baseline, and holds recommendations for human review. It has no cloud/provider dependency and cannot write to a game or production system.

## Start here

1. Read [AGENTS.md](AGENTS.md) and its local constitution pack.
2. Read [DESIGN.md](DESIGN.md) for the implemented dashboard and local-service boundary.
3. Use [PsyForge_v1_Master_TOC.md](PsyForge_v1_Master_TOC.md) to navigate the specification.
4. Read [docs/IMPLEMENTATION-PLAN.md](docs/IMPLEMENTATION-PLAN.md) before beginning platform engineering.

## Local development

Requirements: Node.js 22 or newer and npm 11.8.0 or newer.

```powershell
npm ci
npm run lint
npm run test
npm run build
npm run dev
```

No remote AI providers, cloud services, or API keys are required. The dashboard build is written to `dist/` and can be previewed with `npm run preview`. To run the local service and dashboard together, use `npm run start:server` after the build; it creates a local SQLite database and an unprinted local token under `data/`. See [docs/LOCAL-SERVICE.md](docs/LOCAL-SERVICE.md) before handling any data.

## Product boundary

The specification describes the intended platform. P0–P4 now have a narrow, local proof slice; knowledge graphs, corpora, simulation, LLM/agent work, SDKs, hosted deployment, and delivery integrations remain deferred. All work must preserve the ethics veto, consent controls, local-first deployment path, auditability, and no-direct-production-write doctrine specified in Volumes I, II, VI, and IX.
