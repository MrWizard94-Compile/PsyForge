# PsyForge

PsyForge is WPAI's local-first behavioral-intelligence platform specification. It defines an evidence-bounded system for transforming consented interaction telemetry into explainable player models, simulations, and human-reviewed recommendations. It does not make production changes directly.

This repository contains two complementary artifacts:

- A complete ten-volume living specification plus appendices, beginning with [PsyForge_v1_Master_TOC.md](PsyForge_v1_Master_TOC.md).
- A deterministic React dashboard demonstrator plus a verified local P0–P6 service slice. The slice accepts consented synthetic telemetry, computes bounded deterministic features, produces a deliberately low-confidence descriptive baseline, and holds recommendations for human review. It has no cloud/provider dependency and cannot write to a game or production system.

## Start here

1. Read [AGENTS.md](AGENTS.md), which loads the canonical [WPAI Constitution](https://github.com/MrWizard94-Compile/Agents-Constitution); see [governance adoption](docs/GOVERNANCE-ADOPTION.md) for the published/local boundary.
2. Read [DESIGN.md](DESIGN.md) for the implemented dashboard and local-service boundary.
3. Use [PsyForge_v1_Master_TOC.md](PsyForge_v1_Master_TOC.md) to navigate the specification.
4. Read [docs/EVIDENCE-REGISTRY.md](docs/EVIDENCE-REGISTRY.md) before registering even a synthetic source.
5. Read [docs/IMPLEMENTATION-PLAN.md](docs/IMPLEMENTATION-PLAN.md) before beginning platform engineering.

## Local development

Requirements: Node.js 22 or newer and npm 11.8.0 or newer.

```powershell
npm ci
npm run lint
npm run test
npm run build
npm run benchmark:local
npm run dev
```

No remote AI providers, cloud services, or API keys are required. The dashboard build is written to `dist/` and can be previewed with `npm run preview`. To run the local service and dashboard together, use `npm run start:server` after the build; it creates a local SQLite database and an unprinted, ignored role-bound credential file under `data/`. See [docs/LOCAL-ACTOR-CREDENTIALS.md](docs/LOCAL-ACTOR-CREDENTIALS.md) before using a local session. See [docs/LOCAL-SERVICE.md](docs/LOCAL-SERVICE.md) before handling any data.

## Product boundary

The specification describes the intended platform. P0–P6 now have narrow, local proof slices; broader graph work, retained corpora, simulation, LLM/agent work, SDKs, hosted deployment, and delivery integrations remain deferred. [P7 planning](docs/P7-PLANNING.md) records the next required director decisions. All work must preserve the ethics veto, consent controls, local-first deployment path, auditability, and no-direct-production-write doctrine specified in Volumes I, II, VI, and IX.
