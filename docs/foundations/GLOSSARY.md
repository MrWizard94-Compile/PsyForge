# PsyForge Local-Slice Glossary

This glossary defines the terms used by the implemented P0–P6 local slices. It does not expand the implementation boundary established in the normative volumes.

| Term | Meaning in the implemented local slice | Explicit non-meaning |
|---|---|---|
| Actor | A local credential-bound identity carrying one fixed tenant and allow-listed role. | A production identity provider, agent, or game client identity. |
| Audit event | An append-only SQLite record of a governed local action, outcome, and correlation ID. | A complete legal-retention, SIEM, or external-compliance record. |
| Consent grant | A tenant/subject/purpose/policy-version grant that must be active before telemetry ingestion. | A marketing, monetization, targeting, or research-participation authorization. |
| Evidence source | P5 metadata, SHA-256 digest, byte count, and review status for a bounded local source. | Retained source text, a corpus document, or a retrieval target. |
| Graph assertion | A P6 immutable, observed synthetic `Corpus Concept → Belongs_To → Domain Entity` fact with source hash and author provenance. | A causal claim, inference, model input, or recommendation rationale. |
| Graph invalidation | Immutable P6 record that marks a source-backed assertion inactive after evidence-rights revocation. | Deletion of graph/audit history or continued active use after rights withdrawal. |
| Evidence review | A terminal `approved` or `rejected` rights decision recorded by the distinct credential-bound `evidence_reviewer` role. | Proof that distinct credentials represent distinct people, or authorization to derive a graph assertion, model input, simulation, recommendation, or agent output. |
| Ephemeral source content | The source text supplied only to validate and hash a P5 registration. | Database, API, UI, audit, log, embedding, or provider content. |
| Feature | One deterministic seven-day aggregate calculated from consented P0 event types. | A protected-attribute inference, vulnerability score, or production predictor. |
| Local session | An in-memory, cookie-backed session issued after a configured actor-token check. | A multi-user account, remote credential, or persistent browser token. |
| Model result | The P3 low-confidence descriptive engagement baseline with its source feature snapshot. | A calibrated prediction or an authority for autonomous action. |
| Recommendation | A P4 human-review item linked to the baseline and ethics scorecard. | A production change, game command, or automated intervention. |
| Revocation | P0 consent withdrawal/purge or P5 evidence-reviewer source-rights withdrawal, each with immutable governance evidence. | A complete legal-retention policy or future derived-artifact invalidation rule. |
| Tenant | An opaque isolation key bound to a local actor credential and enforced by service methods and storage queries. | A replacement for enterprise identity, tenancy administration, or encryption at rest. |

Use this document with [CONSENT-AND-PURPOSE-MODEL.md](CONSENT-AND-PURPOSE-MODEL.md), [DATA-CLASSIFICATION.md](DATA-CLASSIFICATION.md), and [EVIDENCE-REGISTRY.md](../EVIDENCE-REGISTRY.md). New terms that change a local capability require synchronized schema, tests, ADR/runbook, and traceability updates.