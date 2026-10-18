# PsyForge project entry

## Governance

The accepted `main` of
[WPAI Constitution](https://github.com/MrWizard94-Compile/Agents-Constitution)
is the single source of constitutional law. Use the `wpai-constitution` skill;
freeze and verify one accepted commit, then load its SKILL, source manifest,
always-load set, and applicable law from that same revision. Local mirrors are
generated distributions, not independent authority. Do not vendor law here.

Read `README.md`, `DESIGN.md`, `MANIFEST.md`, the master
`PsyForge_v1_Master_TOC.md`, and `docs/IMPLEMENTATION-PLAN.md` before changing
an affected capability. See `docs/GOVERNANCE-ADOPTION.md` for the dated source
pin, provenance, regression commands, and verification boundaries.

## Product boundary

This published baseline contains the ten-volume specification, deterministic
React dashboard, and narrow local P0–P4 service slice. The specification is a
design contract, not proof that every described platform capability exists.
Future milestones need their own explicit director-approved contract; this
adoption does not authorize or publish broader graph/corpus, agent, model,
simulation, SDK, cloud, or production-integration work.

Preserve consent, tenant isolation, ethics vetoes, human-only recommendation
review, loopback defaults, strict input validation, and no direct production
write. Keep demonstrator panels visibly labeled as sample data. No provider
account or remote AI service is required for the local slice.

Treat operational `data/`, actor credentials/tokens, SQLite databases, real
source material, logs, and generated output as private runtime data. Never
publish them. The four reviewed `src/data/*.ts` modules are synthetic source
fixtures, not the operational data directory. Use temporary synthetic stores
for tests; do not launch the real service or inspect real records merely to
verify governance.

## Verification and authority

Use the declared Node/npm versions, exact lockfile, original intended-behavior
assertions, type check, production build, dependency audit, governance checks,
and Section 0 self-audit. Preserve the current project-local acceptance gates
when integrating this published baseline into an unpublished working tree.

Do not commit, push, force-push, rebase, merge, or publish unless the director
authorizes the specific action. A governance pointer grants no extra authority
and does not permit unrelated unpublished source to be included in a migration.
