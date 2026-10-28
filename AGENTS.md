# PsyForge project entry

## Governance and scope

The accepted `main` of
[WPAI Constitution](https://github.com/MrWizard94-Compile/Agents-Constitution)
is the single editable source of constitutional law. Use `wpai-constitution`;
freeze and verify one accepted commit, then load its SKILL, source manifest,
always-load set and applicable law from that same revision. Generated mirrors
are distributions, not independent authority. Do not vendor law here.

Read [README.md](README.md), [DESIGN.md](DESIGN.md), [MANIFEST.md](MANIFEST.md),
the master [TOC](PsyForge_v1_Master_TOC.md), and the current
[implementation plan](docs/IMPLEMENTATION-PLAN.md) before changing a capability.
[Governance adoption](docs/GOVERNANCE-ADOPTION.md) separates the published
P0–P4 baseline from this unpublished local P0–P6 implementation. This migration
does not publish local milestones or authorize a new product increment.

## Product and data boundary

Preserve the existing narrow local P0–P6 slices: consented synthetic telemetry,
deterministic features and baseline, human-only recommendation review,
metadata-only evidence registration/revocation, and the approved synthetic
structural graph kernel in [ADR-009](docs/foundations/ADR-009-SYNTHETIC-GRAPH-KERNEL.md).
The ten-volume specification is a design contract, not evidence that the broader
platform exists. P7 remains planning only; require the decisions in
[P7 planning](docs/P7-PLANNING.md) before implementation.

Keep loopback defaults, strict validation and tenant/role authorization, consent,
ethics vetoes, no raw-source/secret logging, and no production writes. The graph
inspector stays read-only. Retained corpora, broader graph semantics, embeddings,
model/agent runtime, simulations, SDKs, cloud and delivery integrations remain
outside this migration. Do not infer new milestone authorization from a general
request to continue.

Keep operational `/data/`, actor credentials/tokens, SQLite records, real source
material, logs and generated output private and ignored. The four reviewed
`src/data/*.ts` modules are synthetic build inputs, not operational records.
Tests and benchmarks use synthetic temporary or in-memory stores; do not launch
the real service or inspect real records merely to verify adoption.

## Required delivery gates and authority

Preserve lint, all intended-behavior and negative/security assertions, builds,
dependency audit, deterministic traceability generation, and the local resource
benchmark. Run the verified canonical source validator and adoption audit, the
positive governance regressions, and all 15 Section 0 checks; these replace the
retired distribution's verifier/mechanical checker, not the quality obligation.
Do not treat a clean text scan as full acceptance.

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

Use [governance adoption](docs/GOVERNANCE-ADOPTION.md) for canonical validation
commands. Keep README, DESIGN, MANIFEST, audit, relevant ADR/runbook and
traceability synchronized when implementation boundaries change. Production
builds and unit/fixture checks do not prove installation, live operation or
physical acceptance.

Do not commit, push, force-push, rebase, merge or publish without specific
director authorization. The public governance PR authorization does not permit
publishing unrelated local P0–P6 work. Never push a private recovery/candidate.

Use [LOCAL-SERVICE.md](docs/LOCAL-SERVICE.md) for loopback operation and
[EVIDENCE-REGISTRY.md](docs/EVIDENCE-REGISTRY.md) before registering even a
synthetic source.
