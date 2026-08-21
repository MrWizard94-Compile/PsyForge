# PsyForge v1.0 — Appendices

*These appendices complete the reference material enumerated by [PsyForge_v1_Master_TOC.md](PsyForge_v1_Master_TOC.md). They are normative where they define a schema or acceptance criterion and informative where they provide an index or template.*

## Appendix A — Mathematical Foundations

**A.1 Probability Theory.** Events, features, and outcomes record distributions, assumptions, sampling windows, and confidence intervals. Point estimates without an uncertainty statement are incomplete.

**A.2 Statistical Inference.** Hypotheses, effect sizes, sample selection, power, multiplicity handling, and stopping rules are fixed before a production experiment is interpreted.

**A.3 Causal Inference.** Directed acyclic graphs encode assumed causal structure; intervention claims require a stated identification strategy, confounder analysis, and sensitivity check. Correlation never automatically becomes a causal graph edge.

**A.4 Graph Theory.** The knowledge graph is a typed, directed, versioned multigraph. Nodes and edges have provenance, confidence, scope, lifecycle, and tenant/corpus context.

**A.5 Embedding Mathematics.** Embeddings carry source/model/version metadata. Contrastive or other loss choices require held-out retrieval/utility evaluation and do not replace source-level provenance.

**A.6 Monte Carlo Methods.** A run records seed, parameter distributions, iteration count, convergence criterion, confidence interval, and rejected/invalid samples.

**A.7 Evolutionary Algorithms.** Candidate generation is bounded by explicit safety constraints; fitness never rewards an ethics-vetoed outcome.

**A.8 Bayesian Inference.** Priors, likelihood, posterior update, and posterior-predictive validation are recorded. Priors need a domain rationale and sensitivity analysis.

**A.9 Reinforcement Learning.** Persona-learning experiments are offline, seeded, safety-constrained, and separated from real-player deployment. Reward design is reviewable for manipulation risk.

**A.10 Information Theory.** Entropy and mutual information can support feature selection only after leakage, correlation, privacy, and subgroup effects are evaluated.

## Appendix B — Schema Reference

All schemas require `schema_version`, `tenant_id` where data is tenant-bound, `created_at`, `provenance`, and validation status. Identifiers are pseudonymous unless a documented justified exception exists.

| Schema | Required fields and constraints |
|---|---|
| B.1 Event | `event_id`, `event_type`, `occurred_at`, `subject_id`, consent/purpose context, payload schema; reject unknown required fields/types |
| B.2 Feature | `feature_id`, definition version, subject/window, value, unit, confidence, source-event references |
| B.3 Graph node/edge | typed ID, properties, corpus scope, evidence reference, confidence, lifecycle; edges have source, target, relation |
| B.4 Player model | model/version, subject, feature references, predictions, uncertainty, explanation, review state |
| B.5 Virtual persona | persona/version, seed, parameters, corpus/model refs, constraints, calibration state |
| B.6 Recommendation | recommendation ID, evidence bundle, forecast, uncertainty, ethics score, review state, approver/audit refs |
| B.7 Experiment | hypothesis, variants, metrics, eligibility, power/stopping rules, approval, result version |
| B.8 Simulation configuration | scenario, seed, persona/model/corpus refs, parameters, resource budget, output retention |
| B.9 Ethics score card | dimensions, evidence, score/confidence, veto, reviewer, override/escalation refs |
| B.10 Agent message | sender/role, task, evidence refs, tool calls/results, structured output, policy/version refs |
| B.11 Audit log | immutable ID, time, actor, tenant, purpose, action, target class, outcome, correlation/integrity refs |
| B.12 Configuration | version, owner, scope, secret reference (never value), validation, approval, rollback artifact |

## Appendix C — API Reference

**C.1 Endpoint Catalog.** The future API exposes versioned, tenant-scoped resources for events, features, models, graph queries, simulations, recommendations, review decisions, corpus, agents, exports, and audit queries. No endpoint can directly deploy a game change.

**C.2 Request/Response Schemas.** Every request uses the Appendix B model plus authentication, scope, idempotency where mutation is allowed, validation error detail safe for the caller, and correlation ID. Responses include version and policy-relevant state.

**C.3 Error Codes.** `VALIDATION_FAILED`, `UNAUTHENTICATED`, `FORBIDDEN`, `TENANT_MISMATCH`, `CONSENT_DENIED`, `PURPOSE_DENIED`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `ETHICS_VETO`, `REVIEW_REQUIRED`, `DEPENDENCY_UNAVAILABLE`, and `INTERNAL_ERROR` have stable machine codes. Errors must not expose secrets or cross-tenant data.

**C.4 Rate Limits.** Limits are scoped by tenant, credential, endpoint class, and cost; responses publish retry behavior. Security and audit endpoints cannot be bypassed with a higher commercial tier.

**C.5 SDK Mapping.** SDKs serialize only validated event schemas, surface consent/purpose requirements, preserve idempotency, and map a server error code to a typed local result.

**C.6 Webhook Catalog.** Candidate events are `recommendation.review_required`, `recommendation.decided`, `ethics.vetoed`, `export.ready`, `model.drift_detected`, and `security.credential_revoked`; all require signed delivery, retries with bounded backoff, replay protection, and subscription audit events.

## Appendix D — Architecture Diagrams Index

The diagrams listed in the master TOC are rendered in the relevant Volume as text diagrams or are implementation deliverables to be generated from the versioned architecture model. The index below is the authoritative ownership map.

| Diagram series | Authoritative source |
|---|---|
| D.1–D.20 Core system, flow, deployment, graph, simulation, agent, ethics, security diagrams | Volumes II–VII and IX |
| D.I.1–D.I.4 Strategic foundation diagrams | Volume I |
| D.II.1–D.II.8 System architecture diagrams | Volume II |
| D.III.1–D.III.9 AI-core diagrams | Volume III |
| D.IV.1–D.IV.8 Simulation diagrams | Volume IV |
| D.V.1–D.V.7 Agent diagrams | Volume V |
| D.VI.1–D.VI.7 Telemetry and SDK diagrams | Volume VI |
| D.VII.1–D.VII.5 Platform diagrams | Volume VII |
| D.VIII.1–D.VIII.5 Commercial diagrams | Volume VIII |
| D.IX.1–D.IX.6 Security diagrams | Volume IX |
| D.X.1–D.X.6 Delivery diagrams | Volume X |

An implementation diagram is valid only when generated or reviewed against an implementation commit; a specification diagram is not evidence that a deployed component exists.

## Appendix E — Decision Record Templates

### E.1 ADR Template

```markdown
# ADR-<id>: <decision>
Status: Proposed | Accepted | Superseded
Date / Owner / Reviewers:
Context and decision drivers:
Options and evidence:
Decision and consequences:
Security, privacy, ethics, performance, and rollback impact:
Implementation and validation links:
```

### E.2 Ethics Decision Record Template

```markdown
# EDR-<id>: <recommendation or policy decision>
Evidence and uncertainty:
Affected populations and vulnerable-population assessment:
Ethics dimensions, score, and veto result:
Human reviewers, decision, and rationale:
Escalation/appeal and audit references:
```

### E.3 Risk Acceptance Record Template

```markdown
# RAR-<id>: <residual risk>
Threat / impact / likelihood / controls tested:
Residual risk and expiry/review date:
Named human authority and rationale:
Monitoring, rollback, and remediation owner:
```

## Appendix F — Glossary Index

**F.1 Alphabetical Index.** Agent, Audit Event, Behavioral Feature, Causal Chain, Consent, Corpus, Deployment Gate, Ethics Score, Feature Vector, Knowledge Graph, Model Card, Player Model, Recommendation, Simulation Run, Telemetry Event, and Virtual Persona are defined in Volume I Part I.3.

**F.2 Term-to-Section Cross-Reference.** Telemetry/SDK terms map to Volume VI; graph/corpus/model terms to Volume III; persona/simulation terms to Volume IV; agent terms to Volume V; review/API/platform terms to Volume VII; security/control terms to Volume IX.

## Appendix G — Requirements Traceability Matrix

| Trace | Required evidence |
|---|---|
| G.1 Vision → Requirements | Volume I principle/differentiator to `REQ-*` identifier |
| G.2 Requirements → Architecture | `REQ-*` to owning Volume/Part and ADR |
| G.3 Architecture → Implementation | approved architecture element to source, configuration, migration, and owner |
| G.4 Implementation → Test | behavior to unit/integration/E2E/security/benchmark evidence |
| G.5 Test → Compliance | test/evidence to applicable control and accountable validation |

The live implementation matrix must be machine-readable, versioned with code, and explicitly mark `planned`, `implemented`, `verified`, `not-applicable`, or `blocked`. The specification itself is not a substituted test result.

## Appendix H — Compliance Matrix

| Area | Engineering controls | Validation authority |
|---|---|---|
| H.1 GDPR | purpose/lawful-basis record, minimization, rights workflow, DPIA evidence, transfer map | counsel and accountable operator |
| H.2 CCPA/CPRA | notices, rights, opt-out/limit path, provider terms, preference-signal handling | counsel and accountable operator |
| H.3 COPPA | age/consent state, collection block, parental workflow, minimization/deletion | counsel and accountable operator |
| H.4 EU AI Act | use-case classification, technical docs, logs, human oversight, monitoring | counsel and accountable operator |
| H.5 SOC 2 | control ownership, evidence, change/access/incident operations | independent auditor where applicable |
| H.6 ISO 27001 | ISMS scope, risk treatment, statement of applicability, internal audit | accredited assessor where applicable |

## Appendix I — Corpus Source Bibliography

**I.1 Game Psychology, I.2 Behavioral Economics, I.3 Motivation Theory, I.4 Cognitive Science, I.5 Game Design, I.6 Social Dynamics, I.7 UX Research, I.8 Marketing Science, I.9 Education Psychology, and I.10 Decision Theory.** The operational bibliography is a controlled corpus registry, not a copied list of uncited claims. Every entry needs stable citation, author/publisher/date, license/usage basis, domain, evidence quality, population/context limits, extraction reviewer, revision history, and retraction/erratum status. A source may be discoverable without being approved for a production causal claim.

## Appendix J — RFC Templates

Feature (J.1), Agent (J.2), Corpus Domain (J.3), Architecture Change (J.4), and API Change (J.5) RFCs use the same required fields: problem, non-goals, evidence, options, data/consent/security/ethics impact, compatibility, observability, tests/benchmarks, rollout/rollback, documentation, owners, and approval record.

## Appendix K — Acceptance Criteria by Specification Area

K.1 Telemetry, K.2 Feature Engine, K.3 Graph, K.4 Corpus, K.5 Player Models, K.6 Simulation, K.7 Agents, K.8 Recommendation, K.9 Ethics, K.10 SDK, K.11 API, K.12 Dashboard, K.13 Deployment, K.14 Security, K.15 Compliance, K.16 Plugins, and K.17 Model Governance share the following minimum criterion: a capability is accepted only when its intended behavior, invalid/forbidden behavior, access and consent control, audit events, performance/resource budget where relevant, recovery/rollback, docs, and versioned test evidence have passed human review. The detailed per-area criteria are owned by the implementation plan's milestone acceptance packs.

## Appendix L — Model Governance Artifacts

**L.1 Model Card, L.2 Evaluation Card, L.3 Registry Entry, L.4 Drift Dashboard, L.5 Rollback Runbook, and L.6 Human Override Decision Record** are required for each model/agent/simulation component that influences a recommendation. They record purpose and prohibited use, training/corpus/data basis, version, owner, metrics and limits, bias/privacy/security assessment, release approval, monitoring, rollback artifact, and override/audit history.

## Appendix Completion Statement

All twelve appendices listed in the master TOC now have an authoritative specification home. Implementation-specific catalogs, diagrams, and evidence must be generated and linked as part of the relevant Phase X milestone; they must never be retroactively represented as already deployed.

*Document Version:* 1.0
*Status:* Normative reference and controlled templates
*Last Updated:* August 20, 2026
