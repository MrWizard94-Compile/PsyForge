# PsyForge P0–P4 Acceptance Test Plan

## Required evidence

| Capability | Positive test | Negative/security test |
|---|---|---|
| Consent | create valid grant | unknown, expired, revoked, mismatched grant denied |
| Ingestion | validated event plus audit row | malformed, unknown field, duplicate, wrong purpose leave no event |
| Storage | restart-safe local database read | direct audit update/delete rejected |
| Features | repeatable feature output | out-of-window and unauthorized data excluded |
| Model | evidence and uncertainty returned | no protected/vulnerability feature accepted |
| Review | reviewer approve/reject/modify with audit | ingestor denied; denied/vetoed result cannot approve |
| HTTP | loopback health and contract endpoints | oversized body, unsupported method/content type rejected |
| Quality | clean install, typecheck, test, build, dependency audit | no warning suppression or open vulnerability |

Every test uses synthetic, non-personal fixture data. A phase is accepted only when its documentation, generated artifacts, and exact test command are synchronized.
