# PsyForge P0–P6 Acceptance Test Plan

## Required evidence

| Capability | Positive test | Negative/security test |
|---|---|---|
| Consent | create valid grant | unknown, expired, revoked, mismatched grant denied |
| Ingestion | validated event plus audit row | malformed, unknown field, duplicate, wrong purpose leave no event |
| Storage | restart-safe local database read | direct audit update/delete rejected |
| Features | repeatable feature output | out-of-window and unauthorized data excluded |
| Model | evidence and uncertainty returned | no protected/vulnerability feature accepted |
| Review | reviewer approve/reject/modify with audit | ingestor denied; denied/vetoed result cannot approve |
| Local credentials | configured token resolves one fixed actor/tenant/role | malformed, duplicate, forged-role, and unauthorized credentials rejected |
| HTTP | loopback health and contract endpoints | oversized body, unsupported method/content type rejected |
| Evidence rights | pending source receives one reviewer decision; approved source can be revoked | raw content absent; role escalation, cross-tenant review/revocation, second terminal action, and direct mutation rejected |
| P6 graph | approved synthetic provenance creates an observed structural assertion and deterministic fixture round trip | unknown vocabulary, inferred/causal semantics, non-synthetic/pending/revoked/cross-tenant provenance, duplicate assertion, oversized/malformed fixture, and rights-revocation reuse rejected; batch leaves no partial state |
| Quality | clean install, typecheck, test, build, dependency audit | no warning suppression or open vulnerability |
| Resources | default 1,000-event synthetic benchmark stays inside the local time/heap budget | bounded CLI rejects malformed workload arguments and exits non-zero on a default-budget breach |

Every test uses synthetic, non-personal fixture data. A phase is accepted only when its documentation, generated artifacts, and exact test command are synchronized.
