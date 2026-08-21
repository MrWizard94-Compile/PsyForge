# PsyForge v1.0 — Volume II: System Architecture

*Part of the PsyForge Master Specification. See [PsyForge_v1_Master_TOC.md](PsyForge_v1_Master_TOC.md) for the full document map and [PsyForge_VolumeI_Complete.md](PsyForge_VolumeI_Complete.md) for Volume I (Strategic Foundation).*

*Document Status: Living Specification — Volume II complete (Parts II.1–II.8).*

---

Volume II specifies the platform's system architecture: the components that implement the capabilities summarized in [Volume I, Section I.1.4.4], the patterns that govern how those components communicate, the storage and networking substrates they run on, the deployment models the platform supports, and the resilience posture the platform maintains under failure. Where Volume I established what PsyForge must never do and why, Volume II establishes how PsyForge is built so that the Volume I commitments — Ethics by Architecture chief among them — are structurally true rather than aspirationally true. Every architectural decision in this Volume is evaluated against a single question: does this decision make a Volume I commitment easier or harder to enforce in code. An architecture that improves throughput at the cost of the Ethics Layer's synchronous position (see [Volume I, Section I.5.4.1]) is not a valid architecture for this platform, regardless of its performance characteristics — this is the precedence rule Volume I, Part I.2.3 establishes, applied for the first time to a concrete engineering trade-off.

---

## Part II.1 — Architecture Overview

Part II.1 establishes the architecture's vocabulary before Parts II.2 through II.8 specify its substance: the components that exist, the boundaries between them, the patterns that govern their interaction, the record of why each major decision was made, and the quality attributes the whole assembly is held to. A reader who has read this Part can locate any subsequent architectural claim in this Volume within the system as a whole; a reader who has not will encounter names and patterns without the map that makes them cohere.

### II.1.1 High-Level System Diagram

The system diagram is the platform's component inventory arranged by data flow, first introduced informally in [Volume I, Section I.1.4.3] ("PsyForge in One Page") and specified normatively here. The diagram below is the canonical reference; every component named in it is specified in detail in a later Volume, and every arrow is a data flow specified in Part II.2.

```
                              ┌─────────────────────────┐
                              │   Game Client / Studio    │
                              │   (SDK-instrumented)      │
                              └────────────┬──────────────┘
                                           │ telemetry events (VI.1)
                                           ▼
                              ┌─────────────────────────┐
                              │   Telemetry Collector     │  (VI.1.1)
                              └────────────┬──────────────┘
                                           ▼
                              ┌─────────────────────────┐
                              │ Event Normalization Layer │  (VI.1.3)
                              └────────────┬──────────────┘
                                           ▼
                              ┌─────────────────────────┐
                              │ Behavioral Feature Engine │  (III.3)
                              └──────┬─────────────┬──────┘
                                     ▼             ▼
                        ┌───────────────┐   ┌───────────────┐
                        │ Operational    │   │ Knowledge      │  (II.3.2,
                        │ Storage        │   │ Graph          │   III.1)
                        └───────┬────────┘   └───────┬────────┘
                                 └───────┬────────────┘
                                         ▼
                              ┌─────────────────────────┐
                              │  Psychology Corpus Engine │  (III.2)
                              └────────────┬──────────────┘
                       ┌───────────────────┼───────────────────┐
                       ▼                   ▼                   ▼
              ┌────────────────┐ ┌──────────────────┐ ┌────────────────┐
              │ Player Modeling │ │ Simulation Engine │ │ Pattern Mining  │
              │   (III.5)       │ │   (IV)             │ │   (III.6)      │
              └────────┬────────┘ └─────────┬──────────┘ └────────┬───────┘
                       └───────────────────┼───────────────────┘
                                            ▼
                              ┌─────────────────────────┐
                              │  AI Specialist Agents     │  (V.2–V.12)
                              │  (Orchestrator + 10)      │
                              └────────────┬──────────────┘
                                           ▼
                              ┌─────────────────────────┐
                              │      Ethics Layer         │  (I.5.4, V.11)
                              └────────────┬──────────────┘
                                           ▼
                              ┌─────────────────────────┐
                              │  Recommendation Engine    │  (II.2.6)
                              └────────────┬──────────────┘
                                           ▼
                              ┌─────────────────────────┐
                              │ Human Review & Deployment │  (VII.4.2)
                              └─────────────────────────┘
```

Two structural properties of this diagram are normative, not illustrative. First, there is exactly one path from Agent Reasoning to Human Review, and it passes through the Ethics Layer — this is the diagrammatic expression of [Volume I, REQ-ETH-069]. Second, no arrow originates at Human Review & Deployment and terminates at a production system outside this diagram without passing back through Recommendation Engine — this is the diagrammatic expression of the No-Direct-Production-Write Doctrine specified in Section II.2.6.1. A component diagram that redraws either property away is not a PsyForge architecture; it is a different system that happens to reuse PsyForge's component names.

- **REQ-ARCH-001 (MUST):** The system diagram in this Section is the canonical architectural reference; any implementation diagram that omits a component or redraws a data-flow arrow MUST be reconciled with this Section or MUST trigger an ADR (Section II.1.3) recording the deviation.
- **REQ-ARCH-002 (MUST):** The Ethics Layer's position between Agent Reasoning and Human Review, and the absence of any direct-write path from an internal component to a production system, MUST be preserved in every implementation and deployment topology.

#### II.1.1.1 Component Inventory

The table below is the canonical component inventory: the full set of named architectural components, the layer each belongs to, and the Volume/Part where each is specified in detail. A component not listed here is not part of the platform's architecture and MUST NOT appear in an implementation without first being added to this inventory via the amendment process in [Volume I, Section I.2.4.2].

| Component | Layer | Primary Responsibility | Specified In |
|---|---|---|---|
| SDK | Client | In-game event capture, local buffering, offline sync | VI.2 |
| Telemetry Collector | Ingestion | Receive, authenticate, and queue raw events | VI.1.1 |
| Event Normalization Layer | Ingestion | Canonicalize schema, resolve identity, enrich, validate | VI.1.3 |
| Behavioral Feature Engine | Processing | Transform normalized events into versioned features | III.3 |
| Operational Storage | Storage | Hot-tier state for real-time queries | II.3.2 |
| Data Lake | Storage | Raw/normalized/feature/embedding zones, long-term archive | II.3.3 |
| Knowledge Graph | Storage/Reasoning | Causal property graph over the behavioral stack | III.1 |
| Psychology Corpus Engine | Reasoning | Versioned, cited behavioral-science knowledge base | III.2 |
| Player Modeling | Reasoning | Per-player archetypes, embeddings, predictive models | III.5 |
| Simulation Engine | Reasoning | Persona-based forecasting before deployment | IV |
| Pattern Mining | Reasoning | Cross-player and sequential pattern discovery | III.6 |
| Orchestrator | Agent Framework | Dispatch, synthesis, conflict resolution across agents | V.2 |
| Specialist Agents (×10) | Agent Framework | Domain-specific reasoning over graph/models/simulation | V.3–V.12 |
| Ethics Layer / Ethics Agent | Governance | Seven-dimension scoring, gating, veto authority | I.5.4, V.11 |
| Recommendation Engine | Governance | Human review state machine, deployment gate | II.2.6 |
| Studio Tools / Dashboard | Interface | Human review, simulation studio, agent studio | VII.2, VII.4 |
| API Gateway | Interface | External REST/webhook surface, auth, rate limiting | VII.5 |
| Audit & Observability Stack | Cross-Cutting | Logging, metrics, tracing, audit trail | II.7, IX.4 |

- **REQ-ARCH-003 (MUST):** Every component in this inventory MUST have exactly one owning specification section; a component specified in two places without a cross-reference reconciling them is a documentation defect under [Volume I, DOC-SYNC-001-equivalent] and MUST be corrected.
- **REQ-ARCH-004 (SHOULD):** New components proposed during implementation SHOULD be added to this table before code is merged, not after, so the inventory remains the accurate map rather than a historical record.

#### II.1.1.2 Component Responsibility Matrix

Ownership disputes between components are a recurring source of architectural drift — a component quietly begins doing another component's job because it is expedient, and six months later the boundary no longer matches any specification. The Responsibility Matrix exists to make such drift detectable: for each component, it states not only what the component owns but what it explicitly does **not** own, so that a reviewer can check a proposed change against the negative space as well as the positive.

| Component | Owns | Does Not Own |
|---|---|---|
| Behavioral Feature Engine | Feature computation, versioning, validation | Raw event storage; feature *interpretation* (that is Player Modeling's role) |
| Knowledge Graph | Causal structure, entity/edge storage, graph queries | Corpus content (Psychology Corpus Engine owns the knowledge that populates edges) |
| Simulation Engine | Persona behavior, forecast generation, ethics-outcome termination (per [Volume I, REQ-ETH-078]) | Recommendation authorship (Agents author; Simulation forecasts) |
| Ethics Agent | Scoring, gating disposition, veto | Recommendation modification — per [Volume I, REQ-ETH-074], the Ethics Agent has no write access to recommendation content |
| Recommendation Engine | State machine transitions, deployment gate enforcement | Ethics scoring (delegated to Ethics Layer); simulation (delegated to Simulation Engine) |
| Orchestrator | Agent dispatch, result synthesis | Ethics gating (the Orchestrator's synthesis is an *input* to the Ethics Layer, not a substitute for it) |

- **REQ-ARCH-005 (MUST):** A component MUST NOT perform a responsibility listed in another component's "Does Not Own" column; a design that requires this MUST be resolved by an ADR proposing a boundary change, not by a silent implementation shortcut.
- **REQ-ARCH-006 (SHOULD):** The Responsibility Matrix SHOULD be reviewed whenever a new component is added to the inventory (II.1.1.1), so that the negative-space column is populated at the same time as the component itself, not left implicit.

#### II.1.1.3 System Boundary Definition

The system boundary separates what PsyForge is responsible for from what the studio's own systems remain responsible for. This distinction matters architecturally because everything inside the boundary is subject to the Ethics Layer's gate (per [Volume I, Section I.5.4.1]) and everything outside it is not — a studio that implements a mechanic recommended by PsyForge is implementing it in a system PsyForge does not control, and the boundary definition is what makes clear where the platform's enforcement power ends and the studio's own engineering responsibility begins.

Inside the boundary: the SDK's event-capture logic, the entire ingestion-through-recommendation pipeline in the diagram at II.1.1, all storage tiers holding PsyForge-derived data, the Studio Tools dashboard, and the API Gateway. Outside the boundary: the game client and server themselves (except for the SDK integration point), the studio's payment processor, the studio's CRM, and — critically — the actual deployment of an approved recommendation into the live game, which is an action the studio's own release pipeline performs after receiving an Approved-state recommendation (see the state machine in [Volume II, Section II.2.6.2]). PsyForge recommends and audits; it does not, and architecturally cannot, push code or configuration into a studio's live game build. This is a deliberate boundary, not a limitation: it is the system-level enforcement of "human-in-the-loop" (see [Volume I, Section I.2.1.6]), because a platform that could deploy directly would have collapsed the boundary the No-Direct-Production-Write Doctrine (Section II.2.6.1) depends on.

- **REQ-ARCH-007 (MUST):** PsyForge MUST NOT hold write credentials to a studio's production game build, payment system, or live-service configuration; deployment of an Approved recommendation MUST be an action the studio's own systems perform.
- **REQ-ARCH-008 (MUST):** The system boundary MUST be documented per-deployment in the deployment configuration (see Part II.5), including the explicit list of studio systems the SDK and API Gateway integrate with.

#### II.1.1.4 External System Interfaces

PsyForge integrates with studio-owned systems at four points, each of which is a distinct interface with its own trust posture (elaborated in II.1.1.5). The **game engine SDK integration** (Unity, Unreal, and web targets; see [Volume VI, Section VI.2.4]) is the highest-volume, lowest-trust interface — it receives data from a client the platform does not control and cannot fully authenticate against tampering. The **studio data integration** (CRM, customer support, platform analytics, marketing campaign data; see [Volume VI, Part VI.5]) is a lower-volume, higher-trust interface used to enrich player models with context the SDK cannot observe. The **studio release-pipeline integration** is the interface through which an Approved recommendation's content (not a direct write, per REQ-ARCH-007) is handed to the studio for implementation — typically a webhook or API pull against the Recommendation API (see [Volume VII, Section VII.5.8]). The **regulatory and audit integration** (see [Volume IX, Section IX.5]) is the interface through which the platform's audit trail and transparency reports become available to auditors and, where required, regulators.

- **REQ-ARCH-009 (MUST):** Each external system interface MUST be documented with its data direction (inbound/outbound), its trust level (Section II.1.1.5), and its authentication mechanism, in the API Specification (Part VII.5).
- **REQ-ARCH-010 (SHOULD):** New external interface types SHOULD be classified into one of the four categories above before implementation; a proposed interface that fits none of the four categories SHOULD trigger an ADR, because it may indicate a boundary the System Boundary Definition (II.1.1.3) has not accounted for.

#### II.1.1.5 Trust Boundaries

A trust boundary is a point in the architecture where data crosses from a domain with one level of assumed integrity to a domain with a different level, and it is the point at which validation, not convenience, MUST govern the handling of that data. PsyForge has four trust boundaries of architectural significance. The **client-to-collector boundary** (SDK to Telemetry Collector) is the least trusted: the client is outside the operator's physical control, and every event crossing this boundary is treated as untrusted input subject to the validation regime in [Volume VI, Section VI.1.4] — this is the concrete application of [Volume I, SEC-INPUT-001-equivalent] at the platform's widest attack surface. The **tenant boundary** (between one studio's data and another's, in a multi-tenant deployment) is enforced at the storage and query layer (see Part II.3 and [Volume IX, Section IX.3.3]) and a breach of it is a Severity-1 event under the same incident classification Volume I uses for ethics incidents ([Volume I, Section I.5.3.5]), because a tenant-isolation breach is also, definitionally, a player-data exposure. The **agent-to-ethics-layer boundary** is a trust boundary in a narrower sense: agent output is treated as unverified reasoning until the Ethics Layer has scored it, per [Volume I, Section I.5.4.1], and no downstream component may treat unscored agent output as if it had passed the gate. The **third-party plugin boundary** (Part VII.6) is the boundary at which code the platform's own team did not write is admitted into the runtime, and it is sandboxed accordingly (see [Volume VII, Section VII.6.1.3]).

- **REQ-ARCH-011 (MUST):** Every trust boundary identified in this Section MUST have a documented validation or isolation mechanism in the Part that owns it; a trust boundary without an owning mechanism is an architectural defect.
- **REQ-ARCH-012 (MUST):** Data MUST NOT be treated as validated, scored, or tenant-scoped merely because it originated from a component upstream that performs that function — each boundary crossing MUST re-assert the guarantee, not assume it was already asserted, so that a bug in one component cannot silently propagate a trust violation past a boundary designed to catch it.

### II.1.2 Architectural Style and Patterns

This Section specifies the architectural patterns that recur across the platform and states, for each, why it was chosen over its alternatives and what it costs. A pattern named here without a stated trade-off is a pattern this specification has not actually justified, and Volume I's Truth Over Assumptions principle ([Volume I, Section I.2.1.1]) applies to architectural claims as much as to behavioral ones: a pattern's benefits MUST be stated alongside its costs, not asserted alone.

#### II.1.2.1 Event-Driven Architecture

PsyForge is event-driven from the SDK inward: every unit of information the platform reasons about originates as a discrete, timestamped event, and every downstream component — normalization, feature extraction, graph construction, player modeling — operates by consuming a stream of such events rather than by querying a shared mutable state. This choice follows directly from the platform's subject matter: player behavior is fundamentally a sequence of interactions over time, and a request-response architecture would force an artificial batching of that sequence at every layer. The event-driven style also gives the platform natural support for the streaming feature computation specified in [Volume VI, Part VI.4] and for the audit trail's append-only requirement ([Volume I, REQ-ETH-038]), because an audit trail is, architecturally, just another event stream with a stricter retention policy.

The cost is complexity: event-driven systems are harder to reason about locally (a developer cannot read one component's code and know its full behavior without knowing what events arrive and in what order) and harder to test deterministically (see the reproducibility requirements in Part X.3, which specifies fixed-seed event replay as the mitigation). PsyForge accepts this cost because the alternative — a request-response architecture retrofitted with polling to approximate streaming — would be slower and would obscure the event ordering that causal inference (see [Volume III, Section III.7.2]) depends on.

- **REQ-ARCH-013 (MUST):** Every cross-component data handoff in the ingestion-through-feature-extraction path (Telemetry Collector → Normalization → Feature Engine) MUST be event-based; a synchronous request-response call in this path MUST be justified by an ADR (Section II.1.3).
- **REQ-ARCH-014 (SHOULD):** Components downstream of the Feature Engine (Player Modeling, Simulation, Agents) MAY use request-response for query-style interactions, since the event-driven requirement applies to the ingestion pipeline, not to every interaction in the system.

#### II.1.2.2 CQRS and Event Sourcing

The platform separates the path that writes behavioral data from the path that reads it (Command Query Responsibility Segregation), because the write path is dominated by high-volume, append-only telemetry while the read path is dominated by low-volume, complex queries (a dashboard rendering a player's full behavioral portrait, an agent querying a subgraph) that would be prohibitively expensive to serve from the same schema optimized for ingestion throughput. The write path is additionally event-sourced for the categories of data where historical reconstruction is a requirement rather than a convenience: the audit trail (per [Volume I, REQ-ETH-038]), the recommendation lifecycle state machine (Section II.2.6.2), and the corpus version history ([Volume III, Section III.2.1.3]). For these categories, the event log — not the current-state snapshot — is the source of truth, and current-state views are derived, cached, and rebuildable.

Event sourcing is not applied uniformly to every data category; the Behavioral Feature Engine's materialized features (Section III.3.3.6) are a current-state view with a bounded history window, not a full event-sourced ledger, because full event-sourcing of every feature recomputation at platform scale (see the throughput targets in Section II.1.4.1) would impose a storage and compute cost the corresponding audit or reconstruction benefit does not justify. The decision of which data categories are event-sourced versus snapshot-plus-window is itself an architectural decision subject to the ADR process (Section II.1.3).

- **REQ-ARCH-015 (MUST):** The audit trail, the recommendation lifecycle, and the corpus version history MUST be event-sourced with the event log as the sole source of truth; derived views MUST be rebuildable from the log.
- **REQ-ARCH-016 (SHOULD):** A data category SHOULD be event-sourced only where historical reconstruction, audit, or replay is a stated requirement (per Section X.3 reproducibility or Volume I ethics audit requirements); categories without such a requirement SHOULD default to the lighter-weight snapshot-plus-window pattern to avoid unjustified storage cost.

#### II.1.2.3 Microservices vs. Modular Monolith Decision

PsyForge is specified as a **modular monolith with extraction points**, not as a microservices architecture from day one, and this decision is stated explicitly because it runs against a common default in systems of this scale. The reasoning is threefold. First, the Local-First deployment model (Section II.1.2.4, elaborated in Part II.5) requires the platform to run as a single deployable unit on a studio's own hardware without an orchestration layer the studio may not operate; a microservices architecture is a poor fit for that target. Second, the components most likely to need independent scaling — the Simulation Engine at 10-million-persona scale (see [Volume IV, Section IV.9.1]) and the Telemetry Collector at high ingestion volume — are identified in advance, which means the platform can extract exactly those two components into independently deployable services while keeping the rest of the system, whose components change together far more often than they scale independently, as a single deployable unit with enforced internal module boundaries. Third, the operational cost of microservices (service discovery, distributed tracing, network-partition handling for every inter-service call) is a cost the platform's early-stage and local-first customers should not have to pay to run a single-tenant deployment.

The module boundaries within the monolith are not advisory: they are enforced at the build level (dependency-direction linting, per [Volume I, ENG-WARN-001-equivalent] applied to import graphs) so that the modular monolith does not degrade into an undifferentiated codebase — the "modular" in "modular monolith" is a architectural commitment, not a description of current tidiness. The extraction points (Simulation Engine, Telemetry Collector) are designed with service-shaped internal APIs from the start specifically so that extraction, when it happens, is a deployment change rather than a rewrite.

- **REQ-ARCH-017 (MUST):** The platform's core (everything except the Simulation Engine and Telemetry Collector) MUST be built as a single deployable unit with build-enforced module boundaries between the components in the II.1.1.1 inventory.
- **REQ-ARCH-018 (MUST):** The Simulation Engine and Telemetry Collector MUST expose service-shaped internal APIs (network-transparent, independent of in-process call conventions) even while co-deployed with the monolith, so that extraction to an independent service does not require an API redesign.
- **REQ-ARCH-019 (SHOULD):** Additional extraction points SHOULD be proposed via ADR only when a specific scaling or team-ownership pressure justifies the added operational cost, not as a default modernization step.

#### II.1.2.4 Local-First Architecture Pattern

Local-First is listed among Volume I's eight foundational principles ([Volume I, Section I.2.1.5]) and this Section specifies its architectural consequence: every core capability in the II.1.1.1 inventory MUST be able to run on a single machine under a studio's physical control, with no mandatory outbound dependency on a PsyForge-operated cloud service. This is stronger than "supports on-premise deployment" — it means the default deployment target is local, and the cloud deployment (Part II.5) is the variant, not the other way around. The architectural consequence is that every component's dependency on external services (a managed vector database, a managed LLM API) MUST have a local-runnable substitute specified (see the Local LLM Runtime in [Volume IX, Section IX.6.1.2] and local model registry in the same Section), because a platform whose "local-first" claim depends on a cloud API is not local-first, it is cloud-first with an offline mode.

- **REQ-ARCH-020 (MUST):** Every component in the II.1.1.1 inventory MUST have a local-runnable implementation path that does not require a network dependency on a PsyForge-operated service.
- **REQ-ARCH-021 (MUST):** A component whose only implementation depends on a managed cloud service MUST NOT be classified as part of the platform's core until a local-runnable alternative is specified, per the Local-First Deployment requirements in Section II.5.5.

#### II.1.2.5 Hybrid Cloud-Edge Pattern

Local-First does not mean cloud-incapable. The Hybrid Cloud-Edge pattern specifies how a local-first deployment opts into cloud capability incrementally: telemetry and features remain local by default; a studio MAY configure selective sync of aggregated, de-identified features to a cloud tier for cross-studio benchmarking (see [Volume X, Section X.6.1.5], not yet specified) or for cloud-burst simulation compute when a local deployment's hardware cannot complete a 10-million-persona run in the target window (Section II.1.4.1). The pattern is opt-in and granular: a studio can enable cloud burst for simulation compute while keeping all player-level data local, because the two are architecturally independent — simulation compute burst requires model and parameter data, not raw player telemetry, to execute.

- **REQ-ARCH-022 (MUST):** Cloud-edge sync MUST be opt-in per data category (telemetry, features, embeddings, simulation compute) and MUST default to fully local when a deployment does not explicitly configure a cloud tier.
- **REQ-ARCH-023 (MUST):** Cloud-burst simulation compute MUST NOT require raw player-level telemetry to leave the local deployment; only model parameters and aggregate/synthetic persona data MAY be transmitted for burst execution.

#### II.1.2.6 Polyglot Persistence Strategy

No single storage technology serves the platform's full range of access patterns well: the Knowledge Graph needs traversal-optimized storage, the embedding layer needs approximate-nearest-neighbor search, the audit trail needs append-only immutable storage, and the operational layer needs low-latency key-value and relational access. The platform therefore specifies polyglot persistence — multiple storage technologies, each selected against the criteria in Part II.3 for the access pattern it serves — rather than forcing every access pattern through a single general-purpose database. This is a cost as much as a benefit: it means the platform operates more moving parts than a single-database design, and the Data Lake zone architecture (Section II.3.3.1) exists partly to give these disparate stores a common ingestion and lineage discipline so that polyglot persistence does not become polyglot inconsistency.

- **REQ-ARCH-024 (MUST):** Each storage tier's technology selection MUST be justified against the specific access pattern it serves, per the selection criteria in the owning Section of Part II.3, not selected by default or by team familiarity alone.
- **REQ-ARCH-025 (MUST):** All storage tiers MUST participate in the common data lineage tracking specified in [Volume II, Section II.2.2], so that polyglot persistence does not fragment the provenance guarantees Volume I's Truth Over Assumptions principle requires.

### II.1.3 Architecture Decision Records

Architecture Decision Records (ADRs) are the mechanism by which this Volume's claims remain honest over time. A specification that states an architectural decision without recording why is a specification that cannot distinguish a deliberate trade-off from a decision nobody remembers making — and six months later, an engineer facing pressure to violate the decision has no way to know whether the decision was load-bearing or incidental. Every non-trivial architectural decision referenced in this Volume — including each one in Section II.1.2 — MUST have a corresponding ADR.

#### II.1.3.1 ADR Template

Every ADR uses the template specified in [Appendix E.1] (cross-referencing [Volume I]'s template catalog), populated with: **Title** (a short imperative name for the decision, e.g. "Use event sourcing for the audit trail"); **Status** (Proposed, Accepted, Superseded, with the superseding ADR linked if applicable); **Context** (the forces — technical, business, ethical — that made a decision necessary); **Decision** (the choice made, stated as a single unambiguous sentence); **Consequences** (both the benefits and the costs, mirroring the Principle/Rationale/Trade-off structure Volume I uses for its foundational principles, because an architectural decision and a foundational principle are both commitments that must be defensible under pressure); and **Alternatives Considered** (the options rejected and why, so a future reviewer does not re-litigate an alternative that was already evaluated and found wanting).

- **REQ-ARCH-026 (MUST):** Every ADR MUST populate all six fields; an ADR with an empty "Alternatives Considered" field MUST be returned for revision, because a decision with no considered alternative is not yet a decision.

#### II.1.3.2 ADR Index

The ADR Index is a single, chronologically and topically cross-indexed catalog of every ADR issued for the platform, maintained per [Volume I, Section I.2.4.3]'s historical-decisions-log requirement applied to architecture specifically. The Index is queryable by component (per the II.1.1.1 inventory), by Volume/Part, and by status. The six decisions specified in Section II.1.2 above are the first entries: ADR-001 (Event-Driven Ingestion Pipeline), ADR-002 (Event Sourcing for Audit, Lifecycle, and Corpus History), ADR-003 (Modular Monolith with Simulation and Telemetry Extraction Points), ADR-004 (Local-First as Default Deployment Target), ADR-005 (Opt-In Granular Cloud-Edge Sync), and ADR-006 (Polyglot Persistence by Access Pattern).

- **REQ-ARCH-027 (MUST):** The ADR Index MUST be updated in the same change that introduces a new ADR; an ADR that exists as a file but not in the Index is not discoverable and therefore does not satisfy the architectural-decision-recording requirement.

#### II.1.3.3 Superseded Decisions

An ADR is never deleted when the decision it records is reversed; it is marked Superseded and linked to the ADR that replaces it, because the history of *why* an architecture changed is as valuable as the current state, particularly for a platform whose core commitment is that ethical and architectural claims must be auditable after the fact (per [Volume I, Section I.5.2.5]'s audit-trail philosophy, applied here to the architecture's own decision history). A Superseded ADR remains part of the permanent record and remains linked from any specification section that originally cited it, with an annotation directing the reader to the current decision.

- **REQ-ARCH-028 (MUST):** A Superseded ADR MUST NOT be deleted; it MUST be retained with a status change and a forward link to its replacement.
- **REQ-ARCH-029 (MUST):** Specification sections citing a superseded ADR MUST be updated to cite the replacement, or MUST carry an explicit annotation if the historical citation is intentional (for example, when explaining why the prior approach was abandoned).

#### II.1.3.4 ADR-to-Implementation Traceability

An ADR that is accepted but never implemented, or implemented in a way that diverges from what it recorded, is a documentation-code drift of exactly the kind [Volume I, DOC-SYNC-001-equivalent] exists to prevent. Each ADR therefore carries a traceability link to the code module(s), configuration, or infrastructure-as-code definitions (Section II.5.4) that implement it, and the Requirements Traceability Matrix specified in [Appendix G] includes ADR-to-implementation as one of its five traceability chains, alongside Vision-to-Requirements, Requirements-to-Architecture, Architecture-to-Implementation, and Implementation-to-Test.

- **REQ-ARCH-030 (MUST):** Every Accepted ADR MUST carry a traceability link to its implementing code or configuration before the ADR is marked Implemented in the Index; an ADR with no traceability link after implementation begins MUST be flagged in the review packaging process (equivalent to [Volume I]'s REVIEW-PACKAGING discipline).

### II.1.4 Architecture Quality Attributes

Quality attributes are the properties the architecture is held to independent of any single feature — the platform can implement every capability in [Volume I, Section I.1.4.4] correctly and still fail if it cannot do so within the latency, scale, availability, and cost envelopes this Section specifies. Each attribute below states a target, the rationale for that target, and the Part of this Volume where the target is enforced architecturally.

#### II.1.4.1 Performance Targets (Latency, Throughput)

The platform has two performance-critical paths with different targets. The **real-time path** — SDK event ingestion through streaming feature computation to a dashboard query — targets sub-second end-to-end latency for the 95th percentile, because the Studio Ethics Dashboard's real-time posture claim ([Volume I, REQ-ETH-065]) is only meaningful if "real time" is actually fast enough for a reviewer to trust it as current. The **batch/simulation path** — a full simulation run across a persona population — targets the throughput specified in [Volume IV, Section IV.9.2.1] (cross-referenced, not restated here per [Volume I, CONST-ONEHOME-001-equivalent]), and this Volume's obligation is only to ensure the compute-scaling architecture in Section II.6.3 can deliver that throughput, not to restate the target.

- **REQ-ARCH-031 (MUST):** The real-time ingestion-to-dashboard path MUST target p95 end-to-end latency under one second at the reference load defined in the deployment configuration; a deployment that cannot meet this target MUST surface the degradation in the Studio Ethics Dashboard rather than silently serving stale data as if it were current.

#### II.1.4.2 Scalability Targets

Scalability is specified along the four dimensions named in Part II.6: data volume, event throughput, query load, and simulation compute. This Section's obligation is to state that all four MUST scale independently — a deployment experiencing high event throughput from a large player base MUST NOT be forced to over-provision simulation compute it isn't using, and vice versa — which is the architectural justification, stated here and elaborated in Section II.1.2.3, for extracting the Telemetry Collector and Simulation Engine as independently scalable services while the rest of the platform scales as a unit.

- **REQ-ARCH-032 (MUST):** The four scaling dimensions (data volume, event throughput, query load, simulation compute) MUST be independently provisionable in the cloud deployment model; the local-first deployment model MAY couple them, since a single-machine deployment has no independent provisioning to offer.

#### II.1.4.3 Availability and Reliability Targets

The platform distinguishes availability requirements by consequence of failure, not by component alone. A failure of the real-time dashboard is an inconvenience; a failure of the Ethics Layer while agents continue producing recommendations is a Severity-1-adjacent condition, because per [Volume I, REQ-ETH-071], the pipeline MUST backpressure rather than bypass the Ethics Layer under load — which means the Ethics Layer's availability target is not "high," it is a hard dependency for the entire recommendation pipeline's availability. The platform therefore specifies tiered availability targets: the ingestion path and Ethics Layer are tier-1 (highest availability target, backpressure rather than degrade), the Studio Tools dashboard is tier-2 (degraded-mode read-only access acceptable under partial outage), and the Simulation Engine's large-scale runs are tier-3 (queueable, delay-tolerant).

- **REQ-ARCH-033 (MUST):** The Ethics Layer's availability tier MUST NOT be set below tier-1 in any deployment configuration; a configuration attempting to do so MUST be refused, mirroring the non-configurable-floor pattern [Volume I, REQ-ETH-037] establishes for the ethical override rule.

#### II.1.4.4 Maintainability and Extensibility

Maintainability is enforced primarily through the module-boundary discipline specified in Section II.1.2.3 and through the plugin architecture (Part VII.6), which gives the platform an extension point for new feature extractors, agents, corpus domains, and event sources without requiring changes to the core module boundaries. A component that requires modifying two or more unrelated modules to add a single new behavior (for example, a new corpus domain requiring changes to the Simulation Engine's core logic rather than only to corpus-domain configuration) has violated the extensibility target this Section sets, and the violation SHOULD be resolved by an ADR proposing a boundary or plugin-interface change.

- **REQ-ARCH-034 (SHOULD):** Adding a new corpus domain, a new specialist agent, or a new feature extractor SHOULD require changes only within the plugin surface (Part VII.6) and its owning module, not within unrelated core modules.

#### II.1.4.5 Testability

Every component in the II.1.1.1 inventory MUST be independently testable without requiring the full pipeline to be running — this is an architectural requirement, not only a testing-discipline requirement (elaborated in Part X.3), because a component that cannot be tested in isolation is a component whose module boundary (Section II.1.2.3) is not actually clean. The event-driven pattern (Section II.1.2.1) supports this: a component's test harness can synthesize its input event stream and assert on its output event stream without standing up its upstream and downstream neighbors.

- **REQ-ARCH-035 (MUST):** Every component MUST expose a test harness capable of exercising it in isolation via synthetic input events, per the fixed-seed reproducibility requirement in Part X.3.

#### II.1.4.6 Observability

Observability is architectural, not operational garnish: the audit trail requirements in [Volume I, Section I.5.2.5], the ethics monitoring in [Volume I, Section I.5.4.5], and the incident detection in [Volume I, Section I.5.3.5] all depend on the logging, metrics, and tracing architecture specified in Part II.7 being present at every component boundary, not bolted on after the fact. A component added to the inventory without corresponding observability instrumentation is, by the same logic Volume I applies to the Ethics Layer, not yet a component this platform can trust in production.

- **REQ-ARCH-036 (MUST):** Every component MUST emit structured logs, metrics, and trace spans at the standard defined in Part II.7 before it is eligible for production deployment; this requirement is enforced by the Section 0-equivalent deployment gate in Part II.5.

#### II.1.4.7 Security (Cross-Reference Volume IX)

Security is specified in full in Volume IX; this Section's obligation is narrower — to state that security is a first-class quality attribute of this architecture, on equal footing with performance and availability, and that no component in the II.1.1.1 inventory is exempt from the threat-modeling and access-control requirements of Volume IX by virtue of being "internal" or "read-only." The trust boundaries specified in Section II.1.1.5 are the architectural anchor points Volume IX's controls attach to.

- **REQ-ARCH-037 (MUST):** Every trust boundary identified in Section II.1.1.5 MUST have its corresponding Volume IX control (encryption, access control, or audit logging, as applicable) implemented before the boundary is exposed in a production deployment.

#### II.1.4.8 Cost Efficiency

Cost efficiency is evaluated against the unit-economics model in Part X.5, and this Section's architectural obligation is to ensure the polyglot persistence strategy (Section II.1.2.6) and the compute-scaling architecture (Part II.6) do not, by their own complexity, erode the margin the pricing strategy (Part VIII.3) depends on. The Local-First pattern (Section II.1.2.4) is itself a cost-efficiency decision as much as a philosophical one: a studio running the platform on its own hardware shifts infrastructure cost out of the platform's cost model entirely, which is why Local-First is the default rather than a discount tier.

- **REQ-ARCH-038 (SHOULD):** Architectural decisions with material infrastructure-cost impact (a new storage tier, a new managed service dependency) SHOULD include a cost estimate in the ADR's Consequences field, per Section II.1.3.1.

---

*End of Part II.1 — Architecture Overview.*

*Cross-References:* [Volume I, Section I.1.4] (Solution Overview), [Volume I, Section I.5.4] (Ethics in the Architecture), [Volume II, Section II.2.6] (Recommendation Gate Architecture — forward reference, specified in Part II.2), [Volume IV, Part IV.9] (Simulation at Scale), [Volume VI, Part VI.1–VI.2] (Telemetry and SDK), [Volume IX] (Security, Privacy, and Compliance), [Appendix E.1] (ADR Template), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-ARCH-001 through REQ-ARCH-038.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 8, 2026

---

## Part II.2 — Data Flow Architecture

Part II.2 traces the platform's data as it moves — the thirteen-stage pipeline the II.1.1 diagram draws at component granularity, specified here at data-flow granularity; the lineage discipline that keeps every downstream artifact traceable to its inputs; the flow patterns that govern how data moves between components; and, at the center of this Part, the Recommendation Gate Architecture that gives the No-Direct-Production-Write Doctrine its enforcement mechanism. If Part II.1 is the platform's map, Part II.2 is the platform's circulatory system, and Section II.2.6 is its most important valve.

**A note on numbering (resolved).** The Master TOC's Part II.2 outline originally proceeded from Section II.2.3 directly to Section II.2.6, with Sections II.2.4 and II.2.5 absent from the published index. Per direction from the project owner, the gap has been closed: [PsyForge_v1_Master_TOC.md] now defines II.2.4 (Data Transformation and Enrichment Pipelines) and II.2.5 (Data Quality and Validation Gates), and both are specified in full below. This note is retained, rather than deleted outright, as the audit record of the correction — consistent with this Volume's own position on superseded ADRs (Section II.1.3.3): the history of why the structure changed is part of the specification, not a loose end to erase.

### II.2.1 End-to-End Data Pipeline

This Section specifies the thirteen-stage pipeline at the granularity of *what crosses each boundary*, complementing the component-level diagram in Section II.1.1. Each stage consumes a defined input artifact and produces a defined output artifact; a stage that cannot state both is not yet specified.

**II.2.1.1 Telemetry Collection.** Input: raw SDK event payloads over the client-to-collector trust boundary (Section II.1.1.5). Output: authenticated, queued raw events with collector-assigned ingestion timestamps. The Telemetry Collector performs no interpretation — only authentication, rate-limiting, and queuing — because interpretation ahead of normalization would let malformed data acquire false structure before validation ever sees it.

**II.2.1.2 Event Normalization.** Input: raw queued events. Output: schema-canonical events with resolved player identity and enriched context, per [Volume VI, Section VI.1.3]. This stage is the platform's primary validation gate for untrusted client data; an event that fails schema or identity validation is routed to the Dead Letter Queue (Section II.2.3.6), not silently dropped or silently coerced into a best-guess shape.

**II.2.1.3 Feature Extraction.** Input: normalized events. Output: versioned behavioral features, tagged with the epistemic tier required by [Volume I, REQ-PHI-001]. Feature Extraction is where raw interaction data first becomes a claim about behavior, which is why the epistemic-tier tagging requirement attaches here rather than downstream.

**II.2.1.4 Embedding Generation.** Input: behavioral features. Output: vector embeddings for similarity search and model input, per [Volume III, Section III.4]. Embeddings are versioned alongside the feature schema that produced them, since an embedding generated under a superseded feature schema is not comparable to one generated under the current schema.

**II.2.1.5 Knowledge Graph Construction.** Input: normalized events, features, and the Psychology Corpus's validated constructs (Section III.2). Output: causal graph edges linking Player → Behavior → Emotion → Motivation → Mechanic → Economy → Outcome, per [Volume III, Section III.1]. An edge is added to the graph only when its supporting evidence meets the causal-inference bar specified in [Volume III, Section III.7.2] — correlation alone does not produce a graph edge.

**II.2.1.6 Player Model Building.** Input: features, embeddings, and graph subgraphs for a given player. Output: a per-player behavioral portrait — archetype classification and predictive scores (churn, retention, spending, engagement, satisfaction) — per [Volume III, Section III.5]. Player models are the first stage at which the pipeline produces an artifact directly consumed by a human-facing view (the dashboard's player detail panel).

**II.2.1.7 Simulation Execution.** Input: player models, archetype distributions, and a candidate design change. Output: forecasted outcome deltas across the persona population, per [Volume IV]. This is the pipeline's most compute-intensive stage and the one Section II.1.4.1's batch-throughput target governs.

**II.2.1.8 Agent Reasoning.** Input: graph queries, player models, and simulation forecasts. Output: a candidate recommendation with supporting rationale, produced by the Orchestrator and specialist agents (Part V). The output at this stage is explicitly *unscored* — it has not yet crossed the Ethics Layer boundary (Section II.1.1.5) and MUST NOT be treated by any downstream consumer as if it had.

**II.2.1.9 Recommendation Generation.** Input: agent output. Output: a structured Recommendation record (per the schema in [Appendix B.9]) carrying the Ethics Score Card produced by the Ethics Layer. This stage is where agent reasoning and ethics scoring merge into the single artifact that Section II.2.6's state machine governs from this point forward.

**II.2.1.10 Human Review.** Input: a scored Recommendation in the Proposed state. Output: a Recommendation transitioned to Reviewed, Rejected, or Modified, per the state machine in Section II.2.6.2. This is the pipeline's mandatory human checkpoint; no path exists from Recommendation Generation to Deployment that does not pass through this stage.

**II.2.1.11 Deployment.** Input: an Approved Recommendation. Output: the recommendation's content, handed to the studio's own release pipeline per the System Boundary Definition (Section II.1.1.3) — not a direct write, per [REQ-ARCH-007]. The platform's Deployment stage ends at handoff; what the studio's pipeline does with that handoff is outside the platform's architectural boundary but within the platform's audit trail (Section II.2.6.4).

**II.2.1.12 Outcome Measurement.** Input: post-deployment telemetry for the affected player population, flowing back through Telemetry Collection (II.2.1.1) with a lineage tag linking it to the originating Recommendation. Output: measured outcome deltas, compared against the Simulation Execution stage's forecast. The comparison between forecast and measured outcome is the platform's primary self-calibration signal.

**II.2.1.13 Feedback Loop Closure.** Input: measured outcome deltas and their forecast comparison. Output: calibration adjustments to the Simulation Engine's forecast models and, where the divergence is material, an entry in the corpus review queue (per [Volume I, Section I.5.3.3]'s Ethics Review Process for Corpus Updates). This stage is what makes the pipeline a loop rather than a line: without it, the platform's forecasts would never improve against reality.

- **REQ-FLOW-001 (MUST):** Every pipeline stage MUST define its input and output artifacts per this Section before implementation; a stage whose output artifact is undefined MUST NOT be connected to a downstream consumer.
- **REQ-FLOW-002 (MUST):** Agent Reasoning output (II.2.1.8) MUST be tagged as unscored and MUST be structurally distinguishable (by type or schema, not only by convention) from a scored Recommendation (II.2.1.9), so that no downstream component can consume unscored output by mistake.
- **REQ-FLOW-003 (MUST):** Outcome Measurement events (II.2.1.12) MUST carry a lineage tag to their originating Recommendation, per Section II.2.2, so that Feedback Loop Closure can compute forecast-vs-actual comparisons without a manual join.

### II.2.2 Data Lineage and Provenance

**II.2.2.1 Lineage Tracking Architecture.** Every artifact produced by a pipeline stage (Section II.2.1) carries a lineage record identifying its direct inputs, forming a directed acyclic graph from any artifact back to the raw telemetry events that ultimately produced it. Lineage is tracked at the artifact level (a feature vector, a graph edge, a recommendation), not only at the batch or job level, because the epistemic-tier and audit requirements in [Volume I, Section I.5.2.5] require tracing a specific claim to its specific evidence, not to "the Tuesday batch run."

**II.2.2.2 Provenance Metadata Schema.** Every artifact's provenance metadata includes: the producing pipeline stage and its version, the input artifact IDs, the epistemic tier ([Volume I, REQ-PHI-001]) where applicable, a timestamp, and — for artifacts produced by an AI agent — the agent identity and model version, per the AI-generated-content provenance requirements referenced in [Volume I, Section I.5.2.5].

**II.2.2.3 Lineage Query API.** The platform exposes a lineage query interface (specified in [Volume VII, Section VII.5.6]) supporting both forward queries ("what downstream artifacts depend on this raw event") and backward queries ("what raw events support this recommendation"). Backward lineage queries are the mechanism by which a human reviewer inspects a recommendation's evidentiary basis, per [Volume I, REQ-ETH-008]'s human-readable-rationale requirement.

**II.2.2.4 Lineage Visualization.** The Studio Tools dashboard (Part VII.4) renders backward lineage as an interactive graph for any recommendation under review, so that "inspect and challenge the reasoning" (per [Volume I, Section I.5.3.2]) is something a reviewer can actually do within the interface, not something that requires a database query written by an engineer.

**II.2.2.5 Lineage for Audit and Compliance.** The lineage graph is itself part of the audit trail specified in [Volume I, Section I.5.2.5] and is retained for the same seven-year period. A lineage record MUST NOT be deleted while its downstream recommendation remains within the audit retention window, even if the recommendation's originating raw events would otherwise be eligible for deletion under the data retention policy in [Volume IX, Section IX.3.5] — audit retention supersedes standard retention for any data still reachable from an active audit obligation.

- **REQ-FLOW-004 (MUST):** Every artifact produced by a pipeline stage MUST carry a provenance record per the II.2.2.2 schema at the time of creation, not attached retroactively.
- **REQ-FLOW-005 (MUST):** Lineage records supporting a deployed recommendation MUST be retained for the full audit period specified in [Volume I, Section I.5.2.5], regardless of the retention policy that would otherwise apply to the underlying raw data.

### II.2.3 Event Flow Patterns

**II.2.3.1 Synchronous vs. Asynchronous Flows.** The pipeline is asynchronous by default (per the event-driven pattern, Section II.1.2.1); synchronous request-response is reserved for query-style interactions explicitly permitted under [REQ-ARCH-014] — a dashboard query, a lineage lookup, a recommendation-status check. A flow that moves data forward through the pipeline (any stage in Section II.2.1) MUST be asynchronous; a flow that reads current state without advancing it MAY be synchronous.

**II.2.3.2 Real-Time vs. Batch Processing.** Telemetry Collection, Event Normalization, and Feature Extraction (II.2.1.1–II.2.1.3) run as real-time streaming stages against the latency target in Section II.1.4.1. Knowledge Graph Construction, Player Model Building, and Simulation Execution (II.2.1.5–II.2.1.7) run as scheduled or triggered batch stages, because their compute cost per unit of input is high enough that streaming execution would not improve reviewer-facing latency and would materially increase infrastructure cost for no corresponding benefit.

**II.2.3.3 Stream Processing Architecture.** The real-time stages consume from and produce to a durable, ordered event log (the technology-neutral term this specification uses for the class of system a Kafka-, NATS-, or Pulsar-shaped broker occupies; selection criteria are specified in Section II.4.5, not mandated here). Consumers are stateless where possible and checkpoint their read position so that a consumer restart resumes rather than reprocesses or drops.

**II.2.3.4 Event Ordering and Deduplication.** Events are ordered per-player (not globally) using a per-player partition key, because cross-player ordering has no behavioral meaning while within-player ordering is load-bearing for every downstream causal claim. Deduplication uses an idempotency key derived from the SDK's client-generated event ID (per [Volume VI, Section VI.2.3]), because offline-sync retries (a Local-First client behavior, per Section II.1.2.4) will otherwise produce duplicate events on reconnect.

**II.2.3.5 Backpressure and Flow Control.** Per [Volume I, REQ-ETH-071], the pipeline backpressures rather than bypasses the Ethics Layer under load — this Section specifies the mechanism: when Ethics Layer throughput falls behind Agent Reasoning output, the Recommendation Generation stage (II.2.1.9) applies backpressure upstream to Agent Reasoning (II.2.1.8) rather than allowing unscored recommendations to accumulate in a queue that a downstream stage might, under pressure, be tempted to drain by skipping the gate.

**II.2.3.6 Dead Letter Queue Handling.** Events that fail validation at Event Normalization (II.2.1.2), or that fail processing at any stage after a bounded number of retries, are routed to a Dead Letter Queue rather than dropped or force-processed. Dead-lettered events are retained, logged, and surfaced to the Studio Tools dashboard's data-quality view (Part VII.4.6) so that a systematic ingestion problem is visible rather than silently lossy.

- **REQ-FLOW-006 (MUST):** Any flow that advances data through a Section II.2.1 pipeline stage MUST be asynchronous; synchronous calls are permitted only for read-only query interactions.
- **REQ-FLOW-007 (MUST):** Backpressure triggered by Ethics Layer saturation MUST propagate upstream to Agent Reasoning; the Recommendation Generation stage MUST NOT drain its queue by forwarding unscored output to Human Review under any load condition.
- **REQ-FLOW-008 (MUST):** Events routed to the Dead Letter Queue MUST be retained and MUST be visible in the Studio Tools data-quality view; silent drop of a validation failure is prohibited.

### II.2.4 Data Transformation and Enrichment Pipelines

**Transformation Pipeline Architecture (II.2.4.1).** The chain of transformations from raw event to feature (Section II.2.1.2–II.2.1.3) and from feature to graph edge (Section II.2.1.5) is represented internally as a directed acyclic graph of named transformation steps, not as an opaque sequence of function calls — each step declares its input schema, output schema, and the upstream steps it depends on, so that a transformation DAG can be introspected, tested in isolation (per the testability requirement in Section II.1.4.5), and partially re-executed when only a downstream step changes.

**External Data Enrichment (II.2.4.2).** The studio-owned systems named in the External System Interfaces (Section II.1.1.4) — CRM, customer support, platform analytics, marketing campaign data — enrich player models through a dedicated enrichment stage that joins external context onto the internal event stream by player identity, running as a scheduled or triggered batch step (not inline in the real-time path, per the real-time/batch split in Section II.2.3.2) so that an external system's latency or availability never blocks telemetry ingestion. Enriched fields carry their source system in the provenance metadata (Section II.2.2.2), so a player model's origin is traceable to "the SDK" versus "the studio's CRM" specifically, not blended into a single undifferentiated feature.

**Transformation Versioning and Reproducibility (II.2.4.3).** The transformation DAG itself — not only its output, per the feature-versioning requirement already in Section II.2.1.3 — is versioned; a DAG version change (a new transformation step, a changed join condition) produces a new DAG version, and historical feature values remain attributable to the DAG version that produced them, satisfying the fixed-seed reproducibility requirement (Part X.3, forward reference) at the transformation-recipe level, not only at the output-value level.

**Idempotent Transformation Guarantees (II.2.4.4).** Every transformation step is idempotent — re-running it against the same input produces the same output — which is what makes the DAG's partial-re-execution capability (II.2.4.1) safe: a re-run triggered by an upstream correction does not need to be sequenced carefully against a prior run's side effects, because there are none beyond the step's own declared output.

- **REQ-FLOW-026 (MUST):** Every transformation step in the pipeline MUST declare its input schema, output schema, and upstream dependencies as part of the transformation DAG (II.2.4.1); an undeclared transformation MUST NOT be merged into production.
- **REQ-FLOW-027 (MUST):** External data enrichment MUST run as a batch step outside the real-time ingestion path; it MUST NOT introduce a synchronous dependency on an external studio-owned system into the real-time latency budget (Section II.1.4.1).
- **REQ-FLOW-028 (MUST):** Enriched fields MUST carry their source system in provenance metadata, distinguishing SDK-observed data from externally-enriched data.
- **REQ-FLOW-029 (MUST):** Every transformation step MUST be idempotent; a transformation whose repeated execution against identical input produces different output MUST be corrected before it is eligible for production use.

### II.2.5 Data Quality and Validation Gates

**Validation Gate Placement (II.2.5.1).** Schema validation at ingestion (Section II.2.1.2) catches malformed data; it does not catch data that is well-formed but wrong — an anomalous feature distribution, a graph edge asserted below the causal-inference evidence bar (cross-referencing [Volume III, Section III.7.2]), a player model built from an implausibly small sample. Data Quality Gates are placed at three points beyond ingestion: after Feature Extraction (II.2.1.3), after Knowledge Graph Construction (II.2.1.5), and before Agent Reasoning consumes a Player Model (II.2.1.6) — each gate checking a different quality dimension appropriate to what that stage produces.

**Data Quality Metrics and Thresholds (II.2.5.2).** Each gate checks against explicit, versioned thresholds: feature-value distribution drift against a rolling baseline (statistical distance beyond a configured bound), graph edge confidence against the minimum evidentiary bar, player-model sample size against a configured minimum session count. Thresholds are configuration, not hardcoded constants, so that a threshold tuned too tight or too loose is a configuration change, not a code change requiring redeployment.

**Quality Gate Failure Handling (II.2.5.3).** Data failing a quality gate is not treated the same as data failing schema validation (Section II.2.3.6's Dead Letter Queue): quality-gate failures are well-formed data whose *fitness for downstream use* is in question, not malformed data. Failed records are routed to a quarantine zone (a dedicated area within the Data Lake, extending the zone structure in Section II.3.3.1) with the failure reason attached, remain queryable for investigation, and are explicitly excluded from Agent Reasoning and Simulation input until either the quality issue is resolved upstream or a human reviewer explicitly releases the quarantined data with a recorded justification — quarantine, unlike the Dead Letter Queue, requires a human decision to clear, because a quality-gate failure is a judgment call a retry cannot resolve.

**Quality Monitoring and Drift Detection (II.2.5.4).** Continuous monitoring of the metrics in II.2.5.2 is the mechanism that satisfies the feature-distribution-drift trigger already referenced but not previously specified in Section II.2.8.4's Model Training Flow and in [Volume I, Section I.5.3.3]'s corpus review trigger — this Section is the canonical home for that mechanism (per [Volume I, CONST-ONEHOME-001]), and both of those earlier references should be read as pointing here. A material drift event opens an entry in the corpus review queue and, where the drift affects a feature already feeding an in-flight Recommendation, flags that Recommendation for re-scoring per the Modified-state re-scoring requirement already established in [REQ-FLOW-012].

- **REQ-FLOW-030 (MUST):** Data Quality Gates MUST be placed after Feature Extraction, after Knowledge Graph Construction, and before Player Model data is consumed by Agent Reasoning.
- **REQ-FLOW-031 (MUST):** Quality gate thresholds MUST be externally configurable, not hardcoded, and MUST be versioned alongside the transformation DAG version (II.2.4.3) they apply to.
- **REQ-FLOW-032 (MUST):** Data failing a quality gate MUST be quarantined, not silently dropped or silently passed through; quarantined data MUST require an explicit, recorded human decision to release for downstream use.
- **REQ-FLOW-033 (MUST):** A material drift event affecting a feature feeding an in-flight Recommendation MUST flag that Recommendation for re-scoring before it can advance to Approved.

### II.2.6 Recommendation Gate Architecture

Section II.2.6 specifies the mechanism behind the single most important claim in this Volume: that PsyForge cannot write to a studio's production systems, and that every change the platform influences passes through an auditable, human-gated state machine. Where [Volume I, Section I.2.1.8] (Ethics by Architecture) states the principle and [Volume I, Section I.5.4] states the ethics-scoring behavior the gate enforces, this Section specifies the gate itself as an engineering artifact: the doctrine, the state machine, the guards, the audit trail, the bypass prevention, and the one narrow, fully-audited exception.

#### II.2.6.1 The No-Direct-Production-Write Doctrine

**II.2.6.1.a All System Changes Flow Through Recommendation.** Every change PsyForge influences in a studio's game — a monetization mechanic, a difficulty curve, a matchmaking parameter — reaches the studio exclusively as the content of an Approved Recommendation record (Section II.2.1.9, II.2.1.11). There is no code path, configuration path, or administrative path by which an agent, the Orchestrator, the Simulation Engine, or any platform operator causes a change to appear in a studio's live game without that change having first existed as a Recommendation that passed through the full state machine in Section II.2.6.2.

**II.2.6.1.b Systems Technically Prevented from Writing to Production.** The prohibition in II.2.6.1.a is not a policy instruction to engineers; it is a property the deployment topology enforces. No component in the II.1.1.1 inventory holds network credentials, API keys, or deployment access to a studio's production game servers, payment systems, or live-service configuration — this is the same commitment as [REQ-ARCH-007], restated here as the specific architectural mechanism (absence of credentials, not merely absence of intent) that makes it true.

**II.2.6.1.c Enforcement Mechanism (Code-Level Write Prohibition).** The prohibition is enforced at three layers: network policy (the platform's deployment has no egress path to studio production endpoints by default; Part II.5.6), credential scope (service accounts provisioned for the platform are scoped to read-only or PsyForge-owned-storage-only access; Part IX.2.4), and code review (any pull request introducing an outbound integration with write semantics to a non-PsyForge-owned endpoint requires a security and architecture sign-off per [Volume I, Section I.2.4.2]'s amendment process, treating such a change with the same gravity as a constitutional amendment because it would compromise a structural guarantee, not merely a feature).

- **REQ-FLOW-009 (MUST):** No platform component MUST hold write credentials to any studio-owned production system; this MUST be enforced by credential scoping (Part IX.2.4), not by convention alone.
- **REQ-FLOW-010 (MUST):** Any proposed integration with write semantics to a studio-owned endpoint MUST undergo the amendment-equivalent review specified in II.2.6.1.c before merge.

#### II.2.6.2 Human Review State Machine

The Recommendation lifecycle is a strict state machine with seven states. Each state below is specified with its entry criteria, its available exits, and who — human or system — may trigger each transition.

**II.2.6.2.a Proposed.** Entry: a Recommendation Generation stage (II.2.1.9) produces a record with a complete Ethics Score Card. Exits: to Reviewed (system, once a human reviewer opens it — see II.2.6.2.b) or directly to Rejected (human only, per II.2.6.2.c) if a reviewer declines without full review. A Recommendation MUST NOT enter Proposed without an Ethics Score Card already attached; an unscored record is not yet a Recommendation, per [REQ-FLOW-002].

**II.2.6.2.b Reviewed.** Entry: a human reviewer has opened the Recommendation, inspected its rationale and lineage (Section II.2.2.4), and recorded a review decision. Exits: to Approved, Rejected, or Modified, all human-triggered only. No system process may transition a Recommendation out of Reviewed; this state exists specifically to require a human decision point between machine output and any state with production consequence.

**II.2.6.2.c Rejected.** Entry: from Proposed or Reviewed, by human decision. Terminal state — a Rejected Recommendation does not automatically re-enter the pipeline. If the underlying opportunity remains valid, Agent Reasoning (II.2.1.8) MUST generate a new Recommendation record rather than resurrecting the rejected one, so the audit trail (II.2.6.4) shows a clean lineage from new evidence to new proposal rather than a reanimated rejection.

**II.2.6.2.d Modified.** Entry: from Reviewed, when a human reviewer alters the Recommendation's parameters (for example, narrowing its target population or reducing its magnitude) rather than approving or rejecting outright. Exit: a Modified Recommendation MUST re-enter the Ethics Layer for re-scoring before it can reach Approved — per [Volume I, REQ-ETH-074] read together with this Section, a human MAY modify a recommendation's content, but a modification MUST NOT bypass the ethics gate the original content passed through, because a modification can change a recommendation's risk profile as materially as a new proposal.

**II.2.6.2.e Approved.** Entry: from Reviewed or from a re-scored Modified record, by human decision only. This is the sole state from which Deployment (II.2.1.11) may proceed. An Approved Recommendation is immutable — further changes require a new Recommendation record, not an edit to the Approved one, preserving the audit trail's integrity.

**II.2.6.2.f Deployed.** Entry: the platform has handed the Approved Recommendation's content to the studio's release pipeline (II.2.1.11) and received a deployment confirmation callback (Part VII.5.8). Exit: to Rolled Back, or — the common case — no further transition; a Deployed Recommendation persists in this state while Outcome Measurement (II.2.1.12) runs against it.

**II.2.6.2.g Rolled Back.** Entry: from Deployed, triggered by a human (studio operator or PsyForge reviewer, per the incident response authority in [Volume I, Section I.5.3.5]) or by an automated post-deployment ethics monitor (Section II.7.4, forward reference) detecting an outcome that breaches a Manipulation Risk or Fairness threshold in production despite a pre-deployment score that did not predict it. A Rolled Back state records the rollback reason and re-opens the underlying design question for a new Recommendation cycle rather than silently closing it.

- **REQ-FLOW-011 (MUST):** State transitions out of Reviewed (to Approved, Rejected, or Modified) MUST be human-triggered; no automated process may perform these transitions.
- **REQ-FLOW-012 (MUST):** A Modified Recommendation MUST be re-scored by the Ethics Layer before it can transition to Approved.
- **REQ-FLOW-013 (MUST):** An Approved Recommendation record MUST be immutable; further changes MUST create a new Recommendation record.
- **REQ-FLOW-014 (SHOULD):** An automated post-deployment ethics monitor SHOULD be capable of triggering Deployed → Rolled Back for a breach detected after deployment, subject to the same audit requirements as a human-triggered rollback.

#### II.2.6.3 State Transition Rules and Guards

Every transition in the II.2.6.2 state machine is guarded by an explicit precondition check, not merely by UI affordance — the backend MUST reject an attempted transition whose precondition is unmet even if a client application (a compromised or buggy dashboard session) attempts to request it. The guard for Reviewed → Approved, for example, checks that the Ethics Score Card's Manipulation Risk dimension is not at veto level (per [Volume I, Section I.5.2.3]) independent of and in addition to whatever the reviewing human believed when they clicked approve, because a human reviewer's mistaken belief that a veto-level score was acceptable MUST NOT be sufficient to approve a Recommendation the Ethics Layer has vetoed — that override path exists only through the Emergency Override process (Section II.2.6.6) and requires the Board-level authority specified in [Volume I, Section I.5.2.4].

- **REQ-FLOW-015 (MUST):** Every state transition MUST be guarded by a backend precondition check independent of client-side validation.
- **REQ-FLOW-016 (MUST):** The Reviewed → Approved guard MUST reject the transition if the Ethics Score Card carries a veto-level Manipulation Risk or Regulatory Risk score, regardless of reviewer input, except via the Emergency Override process (II.2.6.6).

#### II.2.6.4 Gate Decision Audit Trail

Every state transition — its trigger (human identity or system process), timestamp, prior state, new state, and any accompanying rationale or modification content — is written to the event-sourced audit log specified in Section II.1.2.2, satisfying [Volume I, REQ-ETH-038]'s audit requirement at the architectural layer where state transitions actually occur. The audit log is append-only and is the authoritative source for the transparency reporting specified in [Volume I, Section I.5.3.6].

- **REQ-FLOW-017 (MUST):** Every state transition MUST produce an audit log entry before the transition is considered complete; a transition that succeeds without a corresponding audit entry is a defect, not a performance optimization.

#### II.2.6.5 Gate Bypass Prevention (Technical and Policy Controls)

Bypass prevention operates at the same three layers as the write prohibition in II.2.6.1.c. Technically: the Recommendation Engine is the sole component with write access to the state machine's persistence layer, and no other component — including components operated by platform engineers for debugging — has direct database write access to Recommendation records in a production deployment (per the least-privilege requirement this mirrors from [Volume I, SEC-INPUT-001-equivalent]). Operationally: any direct-database-write capability provisioned for incident response is itself logged, time-limited, and subject to the same audit requirements as the Emergency Override (II.2.6.6), because an unaudited "just this once" database edit is architecturally indistinguishable from a bypass.

- **REQ-FLOW-018 (MUST):** No component other than the Recommendation Engine MUST hold direct write access to Recommendation state in a production deployment.
- **REQ-FLOW-019 (MUST):** Any incident-response database access capable of altering Recommendation state MUST be logged, time-limited, and reviewed post-use, with no exception for platform-operator convenience.

#### II.2.6.6 Emergency Override Process (Human-Only, Time-Limited, Fully Audited)

An Emergency Override exists for the narrow case where a veto-level Ethics Score Card blocks a Recommendation the Board-level override authority in [Volume I, Section I.5.2.4] determines should proceed despite the veto. The override MUST be initiated by a member of the Ethics Board (not a platform engineer, not a single studio executive), MUST record a written justification at the time of initiation, MUST be time-limited (the override applies to the single Recommendation instance, not to a standing exception), and MUST be surfaced in the transparency reporting per [Volume I, Section I.5.3.6] without redaction. This Section's obligation is to specify that no technical shortcut exists that achieves the same effect without meeting all four conditions — an override is either a fully-audited Board action or it does not happen.

- **REQ-FLOW-020 (MUST):** The Emergency Override MUST require Board-level authorization per [Volume I, Section I.5.2.4], a written justification, and a scope limited to the single Recommendation instance being overridden.
- **REQ-FLOW-021 (MUST):** Every Emergency Override MUST appear in transparency reporting without redaction, per [Volume I, Section I.5.3.6].

### II.2.7 Synchronous Request Flows

**II.2.7.1 API Request Lifecycle.** A request entering through the API Gateway (Section II.1.1.1) is authenticated, rate-limited per the tenant boundary controls (Section II.1.1.5), routed to the owning component, and logged with a request-scoped trace ID that propagates through any downstream calls the request triggers, per the observability requirement in Section II.1.4.6.

**II.2.7.2 Recommendation Query Flow.** A dashboard or API client querying Recommendation state reads from a materialized view derived from the event-sourced state machine (Section II.2.6.4), not from the event log directly, so that query latency is independent of the log's full history length — this is the CQRS read-path pattern specified generally in Section II.1.2.2 applied to its most consequential instance.

**II.2.7.3 Simulation Status and Results Flow.** Because Simulation Execution (II.2.1.7) is a batch stage, a synchronous status query returns the job's current progress and, once complete, a reference to the results artifact rather than blocking for the job's duration — a client polls or subscribes to a completion event rather than holding a request open across a potentially multi-hour simulation run.

**II.2.7.4 Dashboard Data Query Flow.** The Studio Tools dashboard's real-time views (Section II.1.4.1's latency target) read from the operational storage tier's materialized views (Part II.3.2), which are kept current by the streaming stages (II.2.3.2) rather than by the dashboard querying the batch-oriented Knowledge Graph or Simulation Engine directly.

- **REQ-FLOW-022 (MUST):** Recommendation and dashboard query flows MUST read from materialized views, not from the raw event log, to keep query latency independent of log length.
- **REQ-FLOW-023 (MUST):** Every API Gateway request MUST propagate a trace ID through all downstream calls it triggers.

### II.2.8 Asynchronous Processing Flows

**II.2.8.1 Feature Engineering Job Flow.** Triggered by the streaming Feature Extraction stage (II.2.1.3) on a per-event or micro-batched basis; failures retry with backoff before routing to the Dead Letter Queue (II.2.3.6).

**II.2.8.2 Simulation Batch Flow.** Triggered on-demand (a reviewer requests a forecast for a candidate change) or on a schedule (nightly recalibration runs feeding Feedback Loop Closure, II.2.1.13); scheduled to the compute-scaling architecture in Part II.6.3 and queued rather than run inline when demand exceeds provisioned capacity, per the tier-3 availability classification in Section II.1.4.3.

**II.2.8.3 Agent Reasoning Job Flow.** Triggered when new player-model or simulation output changes the evidentiary basis for an existing recommendation opportunity, or on a scheduled sweep for proactive recommendation generation; Orchestrator dispatch to specialist agents (Part V.2) follows this flow's job-queue semantics rather than synchronous in-process calls, consistent with the modular monolith's service-shaped internal APIs (Section II.1.2.3).

**II.2.8.4 Model Training Flow.** Triggered on a schedule or on detection of feature-distribution drift (per the corpus review trigger in [Volume I, Section I.5.3.3]); training jobs consume from the Data Lake's feature zone (Part II.3.3.1) and produce versioned model artifacts that Player Modeling and Simulation Execution consume by explicit version reference, never by "latest," so a model rollback is a configuration change rather than a retraining event.

**II.2.8.5 Report Generation Flow.** Triggered on a schedule (the transparency reports specified in [Volume I, Section I.5.3.6]) or on-demand (an auditor's query, per Section II.2.2.5); report generation reads exclusively from the audit-trail and lineage stores, never from live operational state, so that a generated report is a reproducible snapshot rather than a moving target.

- **REQ-FLOW-024 (MUST):** Model artifacts MUST be referenced by explicit version, never by an implicit "latest" pointer, in any component that consumes them for scoring, forecasting, or recommendation.
- **REQ-FLOW-025 (MUST):** Transparency and audit reports MUST be generated from the audit-trail and lineage stores exclusively, not from live operational state, so that report contents are reproducible after generation.

---

*End of Part II.2 — Data Flow Architecture.*

*Cross-References:* [Volume I, Section I.2.1.8] (Ethics by Architecture), [Volume I, Section I.5.4] (Ethics in the Architecture), [Volume I, Section I.5.2.4] (Override and Escalation), [Volume I, Section I.5.3.5] (Incident Response), [Volume III] (Knowledge Graph, Corpus, Player Models), [Volume IV] (Simulation Engine), [Volume V] (Agent Framework), [Volume VII, Part VII.4–VII.5] (Studio Tools, API), [Volume IX] (Security and Compliance), [Appendix B.9] (Recommendation Record Schema).

*Requirement IDs issued in this Part:* REQ-FLOW-001 through REQ-FLOW-033.

*Document Version:* 1.1
*Part Status:* Normative
*Last Updated:* August 8, 2026
*Revision Note: v1.1 adds Sections II.2.4 (Data Transformation and Enrichment Pipelines) and II.2.5 (Data Quality and Validation Gates), closing the numbering gap flagged in v1.0 and reconciled in the Master TOC.*

---

## Part II.3 — Storage Architecture

Part II.3 specifies the eight storage tiers the polyglot persistence strategy (Section II.1.2.6) resolves into, each selected against the access pattern it serves. Where Part II.2 traced data as it moves, Part II.3 specifies where it rests — and for how long, under what consistency guarantee, and subject to what deletion obligation. The Data Purge and Right-to-Be-Forgotten section (II.3.3.6) is this Part's II.2.6: the section where an architectural choice and an ethical commitment are the same requirement viewed from different Volumes.

### II.3.1 Storage Strategy Overview

**II.3.1.1 Polyglot Persistence Model.** This Section operationalizes the principle established in Section II.1.2.6: no single storage technology serves the platform's full range of access patterns, so the eight tiers specified in this Part (II.3.2–II.3.8, with II.3.3 itself spanning seven zones) each exist because a specific access pattern justified a specific technology class, not because variety is a goal in itself. A ninth tier proposed during implementation MUST be justified against an access pattern this Part does not already cover, per [REQ-ARCH-024].

**II.3.1.2 Data Classification by Storage Tier.** Every data category the platform handles is classified by sensitivity and access pattern before a tier is assigned:

| Data Category | Sensitivity | Tier | Rationale |
|---|---|---|---|
| Raw telemetry events | High (player-identifiable) | Data Lake, Raw Zone | Write-once, rarely read directly; volume favors cold storage |
| Recommendation state | High (governs production changes) | Operational (hot) | Low-latency read/write; strong consistency required |
| Behavioral features | Medium | Operational + Data Lake | Hot copy for real-time scoring; lake copy for training |
| Knowledge graph edges | Medium (aggregate/causal, not raw) | Graph store | Traversal-optimized access, not key-value |
| Embeddings | Low-Medium (derived, not directly identifying) | Vector store | Similarity search access pattern |
| Audit trail | High (compliance-critical) | Append-only object storage | Immutability and long retention outweigh query speed |
| Session/UI state | Low | Cache (L1/L2) | Ephemeral, latency-dominated |

- **REQ-STOR-001 (MUST):** Every data category handled by the platform MUST be classified per this table (or an approved extension of it) before a storage tier is assigned; an unclassified category MUST NOT be persisted in production.

**II.3.1.3 Data Lifecycle Management.** Data moves through up to five lifecycle stages — hot (operational tier, actively queried), warm (Data Lake normalized/feature zones, queried by batch jobs), cold (Data Lake archive zone, rarely queried), audit-retained (append-only, retained regardless of the source category's own lifecycle per [REQ-FLOW-005]), and purged (Section II.3.3.6). A category's transition from hot to warm to cold is driven by access-frequency decay, not fixed elapsed time alone, though each tier does carry a maximum dwell time as a backstop (Section II.3.3.5).

**II.3.1.4 Storage Cost Optimization.** Cost optimization follows three levers, applied in this order of preference: tiering data to the cheapest storage class its current access frequency justifies (before compressing or deleting anything); compressing and deduplicating within a tier (columnar compression in the Data Lake's warm/cold zones, per Section II.3.3.4); and, only as a last resort and only where the retention policy (Section II.3.3.5) permits, reducing retention. Cost optimization MUST NOT shorten an audit-retention period to reduce cost, per [REQ-FLOW-005] — the audit trail is exempt from the cost-lever ordering above.

- **REQ-STOR-002 (MUST):** Cost-optimization measures MUST NOT reduce the retention period of audit-retained data below the period specified in [Volume I, Section I.5.2.5].

### II.3.2 Operational Storage (Hot Tier)

**Purpose and Scope (II.3.2.1).** The operational tier serves every read and write that the real-time latency target (Section II.1.4.1) applies to: recommendation state (Section II.2.6), the materialized views the dashboard queries (Section II.2.7.4), and the current-value cache of streaming features (Section II.2.1.3). It is not the system of record for raw telemetry — that is the Data Lake's Raw Zone (Section II.3.3.1.a) — because the operational tier is sized and priced for low-latency access to current state, not for cheaply storing an ever-growing history.

**Technology Selection Criteria (II.3.2.2).** Selection is criteria-driven, not vendor-mandated, per the pattern established in Section II.1.2.6: a relational engine (row-oriented, ACID) for the recommendation state machine, where transactional consistency across a multi-field state transition (Section II.2.6.3) is non-negotiable; a key-value or document store for materialized feature and dashboard views, where per-key latency matters more than cross-key transactions. A deployment's specific engine choices are recorded as an ADR (Section II.1.3) at implementation time.

**Schema Design (II.3.2.3).** Each operational-tier schema is owned by exactly one component (per the Responsibility Matrix, Section II.1.1.2); no two components write to the same table or collection, even where doing so would save a join, because shared-write schemas are the most common source of the responsibility-boundary drift Section II.1.1.2 exists to prevent.

**Indexing Strategy (II.3.2.4).** Indexes are added against observed or specified query patterns (Section II.2.7), not speculatively; the recommendation state machine's query-by-status and query-by-player indexes are mandatory from initial schema design because the state machine's core operations (Section II.2.6.2) depend on both.

**Read/Write Patterns (II.3.2.5).** The operational tier is write-heavy on the ingestion side (streaming feature updates, Section II.2.3.2) and read-heavy on the query side (dashboard, API); these two patterns are served by physically or logically separated read replicas where load justifies it, consistent with the CQRS pattern (Section II.1.2.2).

**Replication and Consistency Model (II.3.2.6).** Recommendation state uses strong (linearizable or equivalent) consistency, because the state-machine guards in Section II.2.6.3 depend on every reader seeing the current state, not a stale one — a stale read that shows "Reviewed" when the true state is already "Rejected" could let a client attempt an invalid transition. Feature and dashboard materialized views use eventual consistency with a bounded staleness window consistent with the p95 latency target (Section II.1.4.1), because a feature value that is a few hundred milliseconds stale does not compromise a governance guarantee the way stale recommendation state would.

**Capacity Planning (II.3.2.7).** Capacity is planned against the throughput targets in Section II.1.4.1 and the scalability dimensions in Section II.1.4.2, with headroom sized to the deployment's declared player-population tier (Part II.6.2, forward reference) rather than to current observed load alone, so that growth does not require an emergency re-provisioning.

**Backup and Recovery (II.3.2.8).** The operational tier's recovery point objective (RPO) is zero for recommendation state (every committed state transition is durable before the transition is considered complete, per [REQ-FLOW-017]'s audit-before-complete requirement) and up to five minutes for materialized views, which are rebuildable from the event log (Section II.1.2.2) and therefore do not require the same backup rigor as a source of truth.

- **REQ-STOR-003 (MUST):** Recommendation state MUST use a strongly consistent storage engine; materialized views MAY use eventual consistency within the bounded staleness window defined in the deployment configuration.
- **REQ-STOR-004 (MUST):** Recommendation state writes MUST have a recovery point objective of zero; a storage engine that cannot guarantee this MUST NOT be selected for this schema.
- **REQ-STOR-005 (SHOULD):** Materialized views SHOULD be treated as rebuildable and SHOULD NOT require independent backup where they can be regenerated from the event log within the deployment's acceptable recovery time.

### II.3.3 Data Lake (Cold/Warm Tier)

**Data Lake Layers (II.3.3.1).** The Data Lake is organized into seven zones, each with a distinct contract:

| Zone | Contents | Format | Typical Access |
|---|---|---|---|
| a. Raw Events | Unmodified ingested telemetry | Append-only, schema-on-read | Rare; replay/backfill only |
| b. Normalized Events | Schema-canonical events (II.2.1.2) | Columnar | Batch feature recomputation |
| c. Features | Versioned behavioral features (II.2.1.3) | Columnar | Model training, batch analysis |
| d. Embeddings | Vectors (II.2.1.4) | Columnar + vector-native | Bulk re-indexing, model training |
| e. Behavior Graph | Graph export snapshots (II.2.1.5) | Graph-native serialization | Temporal graph analysis (II.3.4.5) |
| f. Training Sets | Labeled/curated sets for model training | Columnar | Model Training Flow (II.2.8.4) |
| g. Long-Term Archive | Cold-compressed historical data past active retention | Compressed columnar | Compliance retrieval only |

- **REQ-STOR-006 (MUST):** Every Data Lake zone MUST have a documented schema-evolution policy (Section II.3.3.8), because schema-on-read zones (notably Raw Events) accumulate multiple historical schema versions by design.

**Data Lake Technology Selection (II.3.3.2).** Selected against: columnar storage efficiency for analytical scan patterns, support for schema evolution without full rewrite, and compatibility with the Local-First deployment target (Section II.1.2.4) — a Data Lake technology that requires a managed cloud service with no local-runnable equivalent fails [REQ-ARCH-021] regardless of its other merits.

**Partitioning Strategy (II.3.3.3).** Zones are partitioned by time (ingestion date) as the primary key and by tenant as the secondary key in multi-tenant deployments, so that both time-bounded queries (a month's cohort analysis) and tenant-isolated queries (Section II.1.1.5's tenant trust boundary) can prune partitions rather than scan the full zone.

**Compaction and Optimization (II.3.3.4).** Small-file compaction runs on a schedule against the Raw and Normalized zones, where high-frequency append writes would otherwise fragment storage into inefficiently small objects; compaction MUST NOT modify record content, only file layout, preserving the immutability the Raw zone's audit-adjacent role depends on.

**Data Retention Policy by Zone (II.3.3.5).** Retention is zone-specific: Raw Events per the studio's configured raw-retention window (default aligned to [Volume IX, Section IX.3.5]'s data-minimization guidance); Features and Embeddings retained as long as a model or player model referencing them is in active use, per the explicit-version-reference requirement in [REQ-FLOW-024]; Long-Term Archive retained per the audit period ([Volume I, Section I.5.2.5]) where the underlying data supports an active recommendation's lineage, and per standard retention otherwise.

**Data Purge and Right-to-Be-Forgotten (II.3.3.6).** A player data-deletion request (per [Volume IX, Section IX.3.6], the platform's implementation of GDPR Article 17 and equivalent regimes) must be executable against every zone in this table, and this is architecturally harder for zones designed around immutability and lineage. The resolution: purge is implemented as tombstone-and-compact for the Raw and Normalized zones (a tombstone record is written immediately, satisfying the request's effective date; physical removal occurs at the next compaction cycle, per II.3.3.4) and as anonymization-in-place for zones where a record's presence supports an active audit obligation (per [REQ-FLOW-005]) — the player-identifying fields are irreversibly removed while the audit-relevant structure (that *a* recommendation was made, scored, and reviewed) is preserved, because the audit trail's integrity requirement and the right-to-be-forgotten requirement are reconciled by deleting identity, not deleting evidence. Where a jurisdiction's law does not permit even anonymized retention against an explicit deletion request, the studio's configured legal-basis exception (Section IX.3.6.4) governs, and the platform defers to that configuration rather than making the legal determination itself.

- **REQ-STOR-007 (MUST):** Every Data Lake zone MUST support a documented purge or anonymization mechanism satisfying a player deletion request within the timeframe [Volume IX, Section IX.3.6] specifies.
- **REQ-STOR-008 (MUST):** Where a deletion request conflicts with an active audit-retention obligation, the platform MUST anonymize rather than delete the audit-relevant record, preserving evidentiary structure while removing player-identifying content, unless the studio's configured legal basis requires otherwise.

**Data Lake Query Patterns (II.3.3.7).** Query access is predominantly batch and analytical (Model Training Flow, II.2.8.4; Report Generation Flow, II.2.8.5); the Data Lake is not queried by the real-time dashboard path (Section II.2.7.4), which reads exclusively from the operational tier's materialized views.

**Data Lake Migration and Versioning (II.3.3.8).** Zone schemas are versioned, and a schema migration produces a new schema version rather than mutating historical records in place — consistent with the embedding-versioning requirement in II.2.1.4 and the model-versioning requirement in [REQ-FLOW-024] — so that a query against historical data can be resolved against the schema version that was actually in effect when the data was written.

- **REQ-STOR-009 (MUST):** Data Lake schema changes MUST be additive-versioned, not applied as in-place mutations to historical records.

### II.3.4 Knowledge Graph Storage

**Graph Database Selection Criteria (II.3.4.1).** Selected against: native support for property-graph traversal (multi-hop causal queries, per [Volume III, Section III.1]), temporal/versioned edge support (II.3.4.5), and a Local-First-compatible deployment option (Section II.1.2.4), evaluated together rather than any one criterion in isolation.

**Graph Schema and Ontology Storage (II.3.4.2).** The graph's node and edge types are defined by the behavioral ontology specified in [Volume III, Section III.1.2], and the ontology definition itself is version-controlled as configuration, not hardcoded into query logic, so that an ontology amendment (per the same amendment process as [Volume I, Section I.2.4.2]) does not require a schema migration across every consuming component.

**Graph Query Patterns (II.3.4.3).** The dominant pattern is bounded multi-hop traversal from a player or mechanic node (per [Volume III, Section III.1.4]'s causal chain queries) rather than full-graph scans; query planning and indexing are optimized accordingly.

**Graph Partitioning and Sharding (II.3.4.4).** Partitioning follows tenant boundaries first (Section II.1.1.5) and, within a large single-tenant graph, by connected-component locality where the graph technology supports it, so that a traversal rarely crosses a shard boundary.

**Graph Versioning and Temporal Queries (II.3.4.5).** Every edge carries a validity interval (per the epistemic-tier and evidence requirements in [Volume I, REQ-PHI-001] and [Volume III, Section III.7.2]), so that "what did we believe about this causal link as of a given date" is an answerable query, not only "what do we currently believe" — this is the graph-storage-layer requirement that makes the corpus's versioned-knowledge philosophy (Volume I, Section I.2.1.1) queryable rather than merely stated.

**Graph Backup and Recovery (II.3.4.6).** Because the graph is derived (Section II.2.1.5) from normalized events, features, and corpus constructs, it is rebuildable from those upstream sources; backup strategy therefore favors periodic snapshot plus rebuild-from-source over continuous replication, unless rebuild time exceeds the deployment's acceptable recovery window, in which case snapshot frequency increases accordingly.

- **REQ-STOR-010 (MUST):** Every graph edge MUST carry a validity interval sufficient to answer temporal queries per II.3.4.5; an edge without a validity interval MUST NOT be considered a complete graph-construction output under [REQ-FLOW-001].

### II.3.5 Vector Storage (Embeddings)

**Vector Database Selection Criteria (II.3.5.1).** Selected against approximate-nearest-neighbor query latency at the platform's embedding volume, support for metadata-filtered search (so a similarity query can be scoped to a tenant or archetype without a post-filter scan), and, again, a Local-First-compatible option.

**Index Types (II.3.5.2).** HNSW (graph-based, high recall, higher memory) is the default for the operational-tier similarity search the dashboard and agents query synchronously; IVF-family (partition-based, lower memory, tunable recall/latency trade-off) is the appropriate choice for the Data Lake's Embeddings Zone (II.3.3.1.d), where a batch job can tolerate a lower per-query recall in exchange for indexing a much larger corpus at lower memory cost. The choice is stated as a criterion, not a mandate, per the technology-neutral convention this Part follows throughout.

**Similarity Search Patterns (II.3.5.3).** The dominant query is k-nearest-neighbor lookup for a player or behavior embedding against the archetype and pattern space (Section III.5, III.6, forward reference), used both by Player Modeling (II.2.1.6) and by agents retrieving comparable historical cases during reasoning (II.2.1.8).

**Vector Lifecycle Management (II.3.5.4).** Embeddings are versioned alongside the feature schema that produced them (per II.2.1.4) and are superseded, not overwritten, when the embedding model is retrained — the prior version remains queryable until every consumer (Section II.2.1.4's downstream list) has migrated, avoiding a hard cutover that could silently change similarity results mid-comparison.

**Vector Dimension Management and Migration (II.3.5.5).** A change in embedding dimensionality (a new model architecture) is treated as a new embedding version under II.3.5.4, never as an in-place reindex of existing vectors into a new dimension, because vectors of different dimensionality are not comparable and a silent reindex would corrupt similarity search results without any visible error.

- **REQ-STOR-011 (MUST):** A change in embedding model or dimensionality MUST produce a new embedding version per II.3.5.4; existing vectors MUST NOT be reindexed in place into an incompatible dimensionality.

### II.3.6 Time-Series Storage

**Time-Series Data Model (II.3.6.1).** Behavioral trend metrics (session frequency over time, spend velocity, engagement decay curves referenced in [Volume III, Section III.5]) are modeled as tagged time series (metric name, entity ID, tags, timestamp, value) rather than as rows in the general operational schema, because trend queries (rate of change, moving averages, anomaly detection) are the access pattern a time-series-optimized store serves far more efficiently than a general-purpose relational table.

**Retention and Downsampling (II.3.6.2).** Raw-resolution time series are retained for a bounded recent window (default 90 days) and downsampled to coarser resolution (hourly, then daily) for longer-term trend storage, consistent with the storage-cost-optimization ordering in II.3.1.4 — downsampling is a compression technique applied after tiering, not a substitute for it.

**Query Patterns for Behavioral Trends (II.3.6.3).** Queries are predominantly range-scoped (a player's or cohort's metric over a date range) and are the primary data source for the dashboard's trend visualizations (Part VII.4, forward reference) and for the Feedback Loop Closure stage's forecast-vs-actual comparison (II.2.1.13).

- **REQ-STOR-012 (SHOULD):** Behavioral trend metrics SHOULD be stored in a time-series-optimized store rather than the general operational schema, once trend-query volume justifies the added storage-technology surface area.

### II.3.7 Object Storage

**Artifact Types (II.3.7.1).** Object storage holds large, immutable-once-written artifacts that do not fit the query-oriented tiers above: trained model binaries (II.2.8.4), simulation result sets (II.2.1.7), generated transparency and audit reports (II.2.8.5), and dashboard-exported snapshots.

**Bucket Organization (II.3.7.2).** Organized by artifact type and tenant, with a naming convention that embeds the artifact's version (model version, report generation date) so that the explicit-version-reference requirement ([REQ-FLOW-024]) is satisfiable by a stable, predictable path rather than a lookup table that could drift out of sync.

**Lifecycle Policies (II.3.7.3).** Model binaries superseded by a newer version (per II.3.5.4's versioning discipline applied to models generally) are retained for a rollback window (default matching the deployment's incident-response window, [Volume I, Section I.5.3.5]) before transitioning to cold storage, so that a Rolled Back recommendation (II.2.6.2.g) tied to a specific model version can still be explained against the model that produced it.

**Versioning and Immutability (II.3.7.4).** Once written, an object is immutable; a "new version" of a report or model is a new object, never an in-place overwrite, mirroring the event-sourcing discipline (Section II.1.2.2) applied to the object-storage tier — this is what makes a transparency report's contents (II.2.8.5) reproducible after generation, per [REQ-FLOW-025].

- **REQ-STOR-013 (MUST):** Object storage writes MUST be immutable; a revised artifact MUST be written as a new versioned object, never as an overwrite of an existing one.

### II.3.8 Caching Layer

**Cache Strategy (II.3.8.1).** Read-through caching is the default for the dashboard's materialized-view queries (Section II.2.7.4), since read latency dominates the access pattern; write-through is used for the small set of cached values that must never be stale relative to their source (none currently identified for recommendation state, which bypasses caching entirely per its strong-consistency requirement in II.3.2.6); write-behind is not used anywhere in the current architecture, because every write-behind candidate identified during design also carries a durability requirement write-behind's deferred-persistence model would violate.

**Cache Invalidation Patterns (II.3.8.2).** Invalidation is event-driven (a cache entry is invalidated by the same event stream that updates its source materialized view, per Section II.2.3.3) rather than time-to-live-only, because a TTL-only strategy would reintroduce the staleness-window uncertainty the bounded-staleness consistency model (II.3.2.6) is designed to make explicit and bounded.

**Cache Tiering (II.3.8.3).** L1 (in-process, per-instance) caching serves single-request-scoped lookups with no cross-instance consistency requirement; L2 (shared, per-deployment) caching serves the materialized views multiple service instances query, invalidated via the shared event stream in II.3.8.2 so that all instances observe an invalidation simultaneously rather than independently expiring on staggered TTLs.

**Cache Sizing and Eviction (II.3.8.4).** Sized against the working-set estimate for the deployment's declared player-population tier (per the capacity-planning approach in II.3.2.7), with least-recently-used eviction as the default policy; a deployment observing a cache hit-rate materially below the target in Section II.1.4.1's latency budget should be treated as under-provisioned, not as evidence the caching strategy itself is wrong.

- **REQ-STOR-014 (MUST):** Cache invalidation MUST be event-driven from the same stream that updates the cached data's source of truth; TTL MAY be used as a backstop but MUST NOT be the sole invalidation mechanism for data the operational tier's consistency model (II.3.2.6) governs.

---

*End of Part II.3 — Storage Architecture.*

*Cross-References:* [Volume I, Section I.5.2.5] (Audit and Evidence Trail), [Volume I, REQ-PHI-001] (Epistemic Tiers), [Volume III, Section III.1] (Knowledge Graph), [Volume III, Section III.5] (Player Modeling), [Volume III, Section III.7.2] (Causal Inference Bar), [Volume VII, Part VII.4] (Studio Tools Dashboard), [Volume IX, Section IX.3.5–IX.3.6] (Data Retention, Right-to-Be-Forgotten), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-STOR-001 through REQ-STOR-014.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 8, 2026

---

## Part II.4 — Networking Architecture

Part II.4 specifies how components reach each other across the network — the topology options a deployment can choose, the protocols and resilience patterns service-to-service calls follow, the transport that gets telemetry from an untrusted client to the ingestion pipeline safely, the gateway that fronts the platform's external API, and the event bus that Section II.1.2.1's event-driven architecture actually runs on.

### II.4.1 Network Topology

**Local-First Network Model (II.4.1.1).** The default topology (per Section II.1.2.4): all components communicate over localhost or a private LAN segment within the studio's own network, with no mandatory route to a PsyForge-operated endpoint. Inter-component calls in this topology use plain internal networking without the multi-tenant isolation machinery Section II.4.1.2 requires, because a single-studio local deployment has no other tenant to isolate from.

**Cloud Network Model (II.4.1.2).** The managed-service topology: components run within a VPC-equivalent private network, with tenant isolation enforced at the network layer (security groups or namespace-equivalent, per Section II.5.3.12) in addition to the application-layer tenant boundary already specified in Section II.1.1.5 — defense in depth, not a substitute for it.

**Hybrid Connectivity (II.4.1.3).** Where a Local-First deployment opts into cloud burst (Section II.1.2.5), connectivity between the local network and the cloud tier is a narrow, explicitly configured egress path scoped to the specific service (simulation compute, cross-studio benchmarking) that requires it — not a general site-to-site VPN granting the cloud tier broad visibility into the local network.

**Edge Network Model (II.4.1.4).** For the in-game runtime scenarios referenced in [Volume VII, Part VII.6] (forward reference), a lightweight edge topology allows a subset of platform logic (SDK-local feature flags, cached recommendation state for offline play) to run within the game client's own process boundary, communicating with the full platform asynchronously per the offline buffering pattern in Section II.4.3.3.

**Air-Gapped Network Model (II.4.1.5).** For studios with regulatory or security requirements prohibiting any external network path (a subset of the Local-First deployment target, per Section II.5.1.4, forward reference), the platform's full core MUST be operable with zero outbound network access — this is the strictest test of the Local-First commitment in [REQ-ARCH-020], and any component that silently fails or degrades without connectivity it was never guaranteed violates that requirement.

- **REQ-NET-001 (MUST):** Every network topology in this Section MUST be a configuration of the same platform codebase, not a separately maintained variant; a feature that only works in the Cloud topology MUST be flagged as a Local-First gap under [REQ-ARCH-020].
- **REQ-NET-002 (MUST):** The Air-Gapped topology MUST be tested with zero outbound network access as a standard deployment configuration, not treated as an unverified edge case.

### II.4.2 Service-to-Service Communication

**Communication Protocols (II.4.2.1).** Internal service-to-service calls (between the extracted Telemetry Collector or Simulation Engine and the monolith core, per Section II.1.2.3) use gRPC for its schema-enforced contracts and streaming support; the external API Gateway surface (Section II.4.4) uses REST for broader client compatibility; inter-component data handoffs within the event-driven pipeline (Section II.2.1) use the message bus (Section II.4.5), not direct calls, per [REQ-ARCH-013].

**Service Discovery (II.4.2.2).** In the Cloud topology, service discovery is DNS-based or registry-based per the orchestration platform (Section II.5.3); in the Local-First topology, statically configured endpoints are sufficient and preferred, because a single-node or small-cluster local deployment does not have the service churn that makes dynamic discovery valuable, and static configuration is simpler to air-gap-verify (Section II.4.1.5).

**Load Balancing (II.4.2.3).** Applied only to the components extracted per Section II.1.2.3 (Telemetry Collector, Simulation Engine) where independent horizontal scaling (Section II.1.4.2) is a requirement; the monolith core is not load-balanced across instances in a typical Local-First deployment, consistent with that topology's single-node default.

**Circuit Breakers and Resilience (II.4.2.4).** Every synchronous service-to-service call (Section II.2.7) is wrapped in a circuit breaker that opens after a configured failure threshold, preventing a downstream outage from cascading into upstream resource exhaustion (connection pool starvation from calls stuck waiting on a dead dependency) — this is the network-layer complement to the tiered availability targets in Section II.1.4.3, ensuring a tier-3 component's failure cannot exhaust the connection resources a tier-1 component needs.

**Retry and Timeout Policies (II.4.2.5).** Retries use exponential backoff with jitter and are bounded (a maximum retry count, not indefinite retry), consistent with the Dead Letter Queue's role (Section II.2.3.6) as the terminal destination for a call that has exhausted its retries rather than retrying forever. Timeout values are set per call type against the latency budget in Section II.1.4.1, not defaulted uniformly across every service.

**Idempotency (II.4.2.6).** Every request that can be safely retried (per II.4.2.5) is idempotent by design — a repeated request produces the same result as a single request, using the idempotency-key pattern already specified for event deduplication in Section II.2.3.4, applied here to synchronous calls as well.

- **REQ-NET-003 (MUST):** Every synchronous inter-service call MUST be wrapped in a circuit breaker with a configured failure threshold.
- **REQ-NET-004 (MUST):** Retries MUST be bounded and MUST use exponential backoff with jitter; unbounded retry loops are prohibited.
- **REQ-NET-005 (MUST):** Any endpoint accepting a retryable request MUST be idempotent with respect to a repeated identical request.

### II.4.3 Telemetry Transport

**SDK-to-Collector Protocol (II.4.3.1).** The SDK transmits events to the Telemetry Collector over HTTPS (or gRPC where the client platform supports persistent connections efficiently), never over an unencrypted transport, consistent with the client-to-collector trust boundary's validation requirements (Section II.1.1.5) — encryption in transit is the precondition for any of that boundary's other controls to be meaningful.

**Batching and Compression (II.4.3.2).** Events are batched client-side (per [Volume VI, Section VI.2.2], forward reference) and compressed before transmission, both to reduce the bandwidth cost the Local-First and mobile-client scenarios are sensitive to and to reduce Telemetry Collector connection overhead at scale; batch size is bounded so that batching does not itself become a latency source working against the real-time target in Section II.1.4.1.

**Offline Buffering and Sync (II.4.3.3).** The SDK buffers events locally when connectivity is unavailable (a Local-First client characteristic, per Section II.1.2.4) and syncs on reconnect using the idempotency-key deduplication specified in Section II.2.3.4 to handle any overlap between the buffered batch and events that may have already partially transmitted before the disconnect.

**Transport Security (TLS, mTLS) (II.4.3.4).** SDK-to-Collector traffic uses TLS at minimum; service-to-service traffic within a Cloud topology deployment (Section II.4.1.2) uses mutual TLS, so that a compromised network segment cannot inject traffic that a downstream service would treat as originating from a legitimate internal caller — this is the network-layer enforcement of the agent-to-ethics-layer and tenant trust boundaries specified in Section II.1.1.5.

**Network Partition Handling (II.4.3.5).** A partition between the SDK and the Collector is handled by offline buffering (II.4.3.3); a partition between internal services is handled by the circuit breaker and retry policies in Section II.4.2.4–II.4.2.5, with the tiered availability posture from Section II.1.4.3 determining which side of a partition degrades gracefully (tier-2/3 components) versus backpressures (the Ethics Layer, per [REQ-ARCH-033]).

- **REQ-NET-006 (MUST):** SDK-to-Collector traffic MUST use TLS; internal service-to-service traffic in a Cloud topology deployment MUST use mutual TLS.
- **REQ-NET-007 (MUST):** The SDK MUST buffer events locally during a connectivity partition and MUST deduplicate on sync using the idempotency-key mechanism in Section II.2.3.4.

### II.4.4 API Gateway

**Gateway Architecture (II.4.4.1).** The API Gateway is the platform's sole external-facing entry point for synchronous requests (per the component inventory, Section II.1.1.1); no internal component is directly reachable from outside the system boundary (Section II.1.1.3) without passing through the Gateway, which is where authentication, rate limiting, and request validation (II.4.4.3–II.4.4.5) are enforced once rather than duplicated per-component.

**Routing and Versioning (II.4.4.2).** Routes are versioned in the URL path (or an equivalent explicit version header), and a breaking API change ships as a new version alongside the prior one for a deprecation window, rather than as an in-place change to an existing version — the API-surface equivalent of the immutable-artifact discipline in Section II.3.7.4.

**Rate Limiting (II.4.4.3).** Applied per-tenant and per-API-key, sized against the tenant's provisioned capacity (Section II.1.4.2), with limits configured to protect the Ethics Layer's tier-1 availability (Section II.1.4.3) from being exhausted by a single tenant's traffic spike affecting every other tenant in a Cloud multi-tenant deployment.

**Authentication and Authorization (Cross-Reference Volume IX) (II.4.4.4).** Full authentication and authorization mechanics are specified in [Volume IX, Section IX.2]; this Section's obligation is to state that the Gateway is the enforcement point — no downstream component re-implements its own authentication, and a request that reaches an internal component has already been authenticated and authorized at the Gateway, consistent with the least-privilege and single-owner patterns established throughout this Volume.

**Request Validation (II.4.4.5).** Schema validation against the API contract occurs at the Gateway before a request reaches any internal component, applying the same untrusted-input discipline specified for the client-to-collector boundary (Section II.1.1.5) to the synchronous API surface — a malformed request is rejected at the perimeter, not passed inward for an internal component to discover it's malformed.

**Response Transformation (II.4.4.6).** The Gateway MAY transform internal response shapes into the versioned external contract (II.4.4.2), decoupling internal schema evolution from external API stability — an internal component's schema can change without breaking external clients, provided the Gateway's transformation layer is updated in the same change.

- **REQ-NET-008 (MUST):** All external synchronous requests MUST pass through the API Gateway; no internal component MUST be directly reachable from outside the system boundary.
- **REQ-NET-009 (MUST):** A breaking API change MUST ship as a new version alongside the existing one for a defined deprecation window, not as an in-place modification.
- **REQ-NET-010 (MUST):** Request schema validation MUST occur at the Gateway before a request is routed to an internal component.

### II.4.5 Message Bus / Event Bus

**Topic and Queue Design (II.4.5.1).** Topics are organized per pipeline stage boundary (Section II.2.1) — a topic for normalized events, a topic for extracted features, and so on — rather than one undifferentiated topic for all event types, so that a consumer can subscribe to exactly the stage output it depends on and so that the per-player ordering requirement (Section II.2.3.4) applies within a well-scoped partition key per topic.

**Event Schema Registry (II.4.5.2).** Every event type published to the bus is registered with a versioned schema, and a producer MUST NOT publish an event that does not validate against its registered schema — this is the message-bus-layer enforcement of the schema-canonical requirement specified for Event Normalization (Section II.2.1.2), extended to every event type the bus carries, not only telemetry.

**Consumer Group Management (II.4.5.3).** Each component consuming from a topic does so as a named consumer group with its own checkpointed read position (per Section II.2.3.3), so that one consumer's processing lag or restart does not affect another consumer group's independent progress through the same topic.

**Dead Letter Queue Handling (II.4.5.4).** Restates and specifies at the transport layer the Dead Letter Queue behavior already required at the pipeline layer in Section II.2.3.6: a message a consumer cannot process after its bounded retry count is moved to a per-topic dead letter queue, preserving the original message and the failure reason, not discarded.

**Event Replay and Time Travel (II.4.5.5).** Because the audit trail, recommendation lifecycle, and corpus history are event-sourced (Section II.1.2.2), the bus supports replay from an arbitrary earlier offset for these topics specifically, enabling both the fixed-seed reproducibility requirement (Part X.3, forward reference) and disaster recovery by rebuild-from-log (consistent with the graph backup strategy in Section II.3.4.6). Replay capability is not required for every topic — high-volume, non-event-sourced topics (raw telemetry) may have a bounded replay window sized to operational needs rather than full history.

- **REQ-NET-011 (MUST):** Every event published to the bus MUST validate against a registered schema version; an unregistered or non-conforming event MUST be rejected at publish time, not at consume time.
- **REQ-NET-012 (MUST):** Topics carrying event-sourced data (audit trail, recommendation lifecycle, corpus history) MUST support replay from an arbitrary historical offset.
- **REQ-NET-013 (MUST):** Each consuming component MUST maintain its own checkpointed read position per topic, independent of any other consumer group's position.

---

*End of Part II.4 — Networking Architecture.*

*Cross-References:* [Volume I, Section I.5.4] (Ethics in the Architecture), [Volume VI, Part VI.2] (SDK), [Volume VII, Part VII.5–VII.6] (API, Plugin Architecture), [Volume IX, Section IX.2] (Authentication and Authorization), [Part II.5] (Deployment Architecture — forward reference for topology implementation), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-NET-001 through REQ-NET-013.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 8, 2026

---

## Part II.5 — Deployment Architecture

Part II.5 specifies how the platform is actually packaged and run, across five deployment models — and specifies them in an order that reflects the platform's actual priority: Local-First (II.5.5) receives the same depth of treatment as the Kubernetes-based Cloud model (II.5.3), because Section II.1.2.4 makes Local-First the default, not the afterthought. A studio that runs PsyForge entirely on a single on-premise machine and never touches Kubernetes MUST still receive a fully specified, fully supported deployment — this Part exists to make sure that is actually true rather than assumed.

### II.5.1 Deployment Models

**Local-First (Single Node, On-Premise) (II.5.1.1).** The default model, specified fully in Section II.5.5: the platform's core runs as a single-binary (or small set of co-located processes) on hardware the studio owns and controls, with an embedded database and a local model runtime, requiring no external service dependency to operate.

**Cloud (Managed Services) (II.5.1.2).** The platform runs across managed cloud infrastructure — Kubernetes for orchestration (Section II.5.3), managed storage services per the criteria in Part II.3, provisioned via Infrastructure as Code (Section II.5.4). This model targets studios that prefer to offload operations to a managed environment and are comfortable with PsyForge, or a PsyForge-operated tenant, holding infrastructure responsibility.

**Hybrid (Local + Cloud Burst) (II.5.1.3).** Combines Local-First's core with the opt-in cloud burst capability specified in Section II.1.2.5: the studio's own hardware runs the platform day-to-day, and specific compute-intensive jobs (large simulation runs) burst to cloud capacity only when local hardware cannot complete them within the target window (Section II.1.4.1).

**Air-Gapped (Fully Offline) (II.5.1.4).** A Local-First deployment with zero outbound network access permitted at any layer, satisfying the network topology already specified in Section II.4.1.5. This model additionally requires that software updates, corpus updates ([Volume I, Section I.5.3.3]), and model updates be deliverable via an offline transfer mechanism (signed update bundles applied manually), since the platform cannot pull updates over a network it does not have.

**Edge (In-Game Runtime) (II.5.1.5).** A minimal footprint deployment of SDK-local logic within the game client process itself, per the edge network model (Section II.4.1.4) — this is not a deployment of the platform's core, but of a bounded subset (cached recommendation state, local feature flags) that can operate within the constraints of a game client's own resource budget.

**Deployment Model Comparison Matrix (II.5.1.6).**

| Model | Network Dependency | Orchestration | Data Residency | Update Mechanism |
|---|---|---|---|---|
| Local-First | None required | None (single binary) | 100% on studio hardware | Manual or scheduled pull |
| Cloud | Required | Kubernetes | Managed infrastructure | Rolling deployment |
| Hybrid | Optional, opt-in per job | None (core) + Cloud (burst) | Local, except burst compute inputs | Manual (core) + rolling (burst) |
| Air-Gapped | Prohibited | None | 100% on studio hardware | Offline signed bundle |
| Edge | Async, tolerant of absence | None (embedded in client) | Ephemeral, client-local | Bundled with game client release |

- **REQ-DEPLOY-001 (MUST):** Every deployment model in this Section MUST be a configuration of the same platform codebase (per [REQ-NET-001]); the platform MUST NOT maintain a separately forked codebase per model.
- **REQ-DEPLOY-002 (MUST):** The Air-Gapped model MUST support offline update delivery via signed bundles, including corpus and model updates, without requiring any outbound network call to verify or apply them.

### II.5.2 Containerization

**Container Image Strategy (II.5.2.1).** Every component in the II.1.1.1 inventory that runs in the Cloud or Hybrid model is packaged as a container image; the Local-First model's single-binary distribution (Section II.5.5.1) does not require containerization, and containerized images are built from the same source as the single-binary distribution so the two are not divergent artifacts.

**Image Registry (II.5.2.2).** Images are versioned and stored in a registry with immutable tags (a tag, once pushed, is never overwritten — mirroring the object-storage immutability discipline in Section II.3.7.4), so that a deployment referencing a specific image tag has a durable guarantee about what that tag contains.

**Base Image Selection and Hardening (II.5.2.3).** Base images are minimal (distroless or slim variants preferred) to reduce attack surface, per the security quality attribute in Section II.1.4.7, and are pinned to a specific digest, not a floating tag, so that a base-image update is a deliberate, reviewed change rather than a silent supply-chain shift.

**Multi-Stage Build Pipelines (II.5.2.4).** Build stages separate compilation/dependency-resolution from the runtime image, so that build tools, source code, and intermediate artifacts do not ship in the final production image — reducing both image size and the surface a compromised build tool could expose in production.

**Image Scanning and Vulnerability Management (II.5.2.5).** Every image is scanned for known vulnerabilities before it is eligible for the deployment gate referenced in Section II.1.4.6, and a critical-severity finding blocks deployment until remediated or explicitly waived through the same review process governing any other Section 0-equivalent gate exception.

- **REQ-DEPLOY-003 (MUST):** Container images MUST be built from pinned base-image digests, not floating tags.
- **REQ-DEPLOY-004 (MUST):** A container image with an unremediated critical-severity vulnerability MUST NOT be deployed to production without an explicit, reviewed waiver.

### II.5.3 Kubernetes Architecture

Section II.5.3 applies to the Cloud and Hybrid deployment models only; a Local-First or Air-Gapped deployment (Section II.5.5) requires none of the subsections below, and no component's correctness MUST depend on the presence of a Kubernetes-specific feature, per the same-codebase requirement in [REQ-DEPLOY-001].

**Cluster Topology (II.5.3.1).** A per-tenant or shared-multi-tenant cluster topology, selected per deployment scale — a shared cluster uses the namespace and network-policy isolation in II.5.3.2 and II.5.3.12 to enforce the tenant trust boundary (Section II.1.1.5) that a per-tenant cluster gets for free from physical separation.

**Namespace Strategy (II.5.3.2).** One namespace per tenant at minimum, with platform-shared components (where applicable) isolated into their own namespace with tightly scoped cross-namespace access, so that the namespace boundary is a meaningful enforcement point, not an organizational label alone.

**Pod Specifications and Resource Limits (II.5.3.3).** Every pod declares both requests and limits for CPU and memory, sized against the capacity planning in Section II.3.2.7 and the scalability dimensions in Section II.1.4.2; a pod without declared limits is not eligible for production deployment, because unbounded resource consumption by one component is the most common cause of a tier-1 component (Section II.1.4.3) being starved by a tier-3 neighbor on shared infrastructure.

**Service Mesh (II.5.3.4).** Where deployed, a service mesh provides mutual TLS (satisfying [REQ-NET-006] without requiring each component to implement its own TLS handling), traffic policy enforcement, and the distributed tracing substrate for the observability requirement in Section II.1.4.6; the mesh is an implementation convenience for meeting requirements this Volume already specifies elsewhere, not a source of new requirements.

**Ingress Controllers (II.5.3.5).** Fronts the API Gateway (Section II.4.4) at the cluster edge, terminating TLS and routing to the Gateway's internal service; the Ingress layer and the Gateway are distinct — Ingress handles cluster-level routing and TLS termination, the Gateway handles authentication, rate limiting, and request validation (Section II.4.4.3–II.4.4.5).

**Storage Classes and Persistent Volumes (II.5.3.6).** Persistent volume provisioning maps to the storage tiers in Part II.3 — a storage class backed by fast SSD-equivalent storage for the operational tier (Section II.3.2), a cheaper class for Data Lake cold-zone storage (Section II.3.3) — so that storage cost optimization (Section II.3.1.4) is expressed at the infrastructure layer, not only at the application layer.

**ConfigMaps and Secrets Management (II.5.3.7).** Configuration (non-sensitive) uses ConfigMaps; credentials, API keys, and encryption keys use the platform's secrets management integration (Part IX.2.5, forward reference) rather than ConfigMaps or environment variables in plaintext — no secret is ever stored in a container image, a ConfigMap, or version control, per [Volume I, SEC-INPUT-001-equivalent]'s no-secrets-in-source requirement extended to deployment configuration.

**Horizontal Pod Autoscaling (II.5.3.8).** Applied to the extracted, independently scalable components (Telemetry Collector, Simulation Engine, per Section II.1.2.3) against the throughput and compute metrics relevant to each — event ingestion rate for the Collector, queue depth for Simulation batch jobs — not against CPU utilization alone, which is a poor proxy for either component's actual bottleneck.

**Cluster Autoscaling (II.5.3.9).** Node-level autoscaling responds to pod-level autoscaling (II.5.3.8) with a provisioning lag budget accounted for in the scalability targets (Section II.1.4.2), so that a burst in demand is met within the latency the business requirement tolerates, not merely "eventually."

**Node Pool Strategy (CPU, GPU, Memory-Optimized) (II.5.3.10).** Distinct node pools serve distinct workload profiles: CPU-optimized for the ingestion and API-serving path, memory-optimized for the Knowledge Graph and in-memory feature caches (Section II.3.8), and GPU-optimized for the Local Model Runtime and Simulation Engine's compute-intensive persona forecasting where GPU acceleration is available and beneficial, per the compute-scaling architecture in Part II.6.3, forward reference.

**Pod Disruption Budgets (II.5.3.11).** Tier-1 components (the Ethics Layer, per Section II.1.4.3) carry a disruption budget that prevents a voluntary cluster operation (a node drain during maintenance) from taking enough replicas offline simultaneously to breach the tier-1 availability target — this is the Kubernetes-layer enforcement of a commitment already made at the architecture layer in [REQ-ARCH-033].

**Network Policies (II.5.3.12).** Default-deny network policies scoped per namespace, with explicit allow rules only for the specific cross-namespace or cross-service traffic the architecture actually requires (per the Component Responsibility Matrix, Section II.1.1.2) — a component that has no documented reason to reach another component has no network path to it, regardless of what a misconfiguration or compromised process might attempt.

- **REQ-DEPLOY-005 (MUST):** Every pod specification MUST declare CPU and memory requests and limits before it is eligible for production deployment.
- **REQ-DEPLOY-006 (MUST):** No secret, API key, or credential MUST be stored in a container image, ConfigMap, or version control; all secrets MUST be sourced from the platform's secrets management integration.
- **REQ-DEPLOY-007 (MUST):** Tier-1 components MUST carry a Pod Disruption Budget preventing voluntary cluster operations from breaching the tier-1 availability target in Section II.1.4.3.
- **REQ-DEPLOY-008 (MUST):** Network policies MUST default-deny; cross-component network paths MUST be explicitly allowed only where the Responsibility Matrix (Section II.1.1.2) documents a legitimate dependency.

### II.5.4 Infrastructure as Code

**IaC Tool Selection (II.5.4.1).** Selected against: declarative state management, support for the Cloud model's target infrastructure providers, and a plan/apply workflow that supports the drift detection requirement in II.5.4.5 — the specific tool (Terraform, Pulumi, or an equivalent) is recorded as an ADR (Section II.1.3) at implementation time, not mandated in this specification, consistent with this Volume's technology-neutral convention.

**Module and Template Structure (II.5.4.2).** Infrastructure is defined in reusable modules scoped per architectural component or per cross-cutting concern (networking, per Part II.4; storage, per Part II.3), mirroring the Section II.1.1.1 component inventory so that infrastructure structure and architecture structure do not silently diverge.

**Environment Management (Dev, Staging, Prod) (II.5.4.3).** Environments are provisioned from the same modules (II.5.4.2) with environment-specific parameter sets, never from environment-specific forked code — a staging environment that is a different codebase from production is a staging environment that cannot actually validate a production deployment.

**State Management (II.5.4.4).** IaC state is stored remotely with locking, preventing concurrent applies from corrupting shared infrastructure state, and is treated with the same secrets-handling discipline as II.5.3.7 where state contains sensitive values (initial credentials, connection strings).

**Drift Detection (II.5.4.5).** Scheduled drift-detection runs compare declared state against actual infrastructure and surface any divergence (a manual change made outside the IaC workflow) to the observability stack (Part II.7, forward reference), because undetected drift is the infrastructure-layer equivalent of the documentation-code drift [Volume I, DOC-SYNC-001-equivalent] exists to prevent.

**Infrastructure Testing (II.5.4.6).** IaC modules are tested in an isolated environment before being applied to staging or production, validating both that the module provisions successfully and that the provisioned infrastructure satisfies the architectural requirements it was written to implement (the ADR-to-implementation traceability chain specified in Section II.1.3.4).

- **REQ-DEPLOY-009 (MUST):** IaC state MUST be stored remotely with locking; concurrent applies without locking are prohibited.
- **REQ-DEPLOY-010 (SHOULD):** Drift detection SHOULD run on a schedule and SHOULD surface findings to the observability stack rather than requiring a manual audit to discover drift.

### II.5.5 Local-First Deployment

Section II.5.5 is where the Local-First commitment made throughout this Volume — [REQ-ARCH-020], [REQ-ARCH-021], [REQ-NET-001], [REQ-DEPLOY-001] — becomes a concrete deployment specification, not a recurring aspiration. A studio evaluating whether PsyForge is genuinely local-first should be able to verify every claim in this Section against a running deployment.

**Single-Binary Distribution Model (II.5.5.1).** The platform's core (everything except the two extraction points, per Section II.1.2.3) ships as a single executable (or a small, co-located process group) for the studio's target operating system, bundling the application logic, the embedded database engine (II.5.5.2), and the local model runtime (II.5.5.3) — installation is running one binary, not standing up a dependency stack.

**Embedded Database Strategy (II.5.5.2).** The operational tier (Section II.3.2) and a scaled-down Data Lake (Section II.3.3) run on an embedded, in-process database engine (an SQLite/DuckDB-class technology, selected per the same criteria as II.5.2.1's technology-neutral convention) rather than a separately deployed database server, eliminating the external service dependency a client-server database would introduce.

**Local Model Runtime (II.5.5.3).** AI agent reasoning (Section II.2.1.8) and the Ethics Layer's scoring (Section II.2.6) run against a locally hosted model runtime (a llama.cpp-class inference engine or equivalent, per [Volume IX, Section IX.6.1.2]) capable of running the specialist agent models without a network call to an external inference API — this is the specific mechanism that makes [REQ-ARCH-021] true for the AI Specialist Agents component rather than leaving it as an unmet aspiration for the component most tempting to outsource to a cloud API.

**Resource Constraints and Sizing (II.5.5.4).** The Local-First distribution declares minimum and recommended hardware specifications (CPU, RAM, disk, and GPU where the Local Model Runtime benefits from acceleration) sized against a small-studio player-population tier, with degraded-but-functional operation below the recommended specification (longer simulation run times, smaller local model variant) rather than a hard failure — consistent with the tier-3 delay-tolerant classification already established for Simulation Execution in Section II.1.4.3.

**Data Residency on Local Machine (II.5.5.5).** By default, one hundred percent of a Local-First deployment's data — raw telemetry, features, graph, models, audit trail — resides on the studio's own hardware; no data category is silently synced elsewhere, and any sync is the explicit, opt-in mechanism specified in II.5.5.6, never a default background behavior.

**Sync Strategy with Cloud (When Available) (II.5.5.6).** Where a studio opts into hybrid cloud burst (Section II.1.2.5, Section II.5.1.3) or cross-studio benchmarking (forward reference, [Volume X, Section X.6.1.5]), sync is granular per data category (per [REQ-ARCH-022]) and is resumable — a sync interrupted mid-transfer resumes rather than restarts, using the same idempotency-key discipline specified for event deduplication (Section II.2.3.4).

**Offline-First Conflict Resolution (II.5.5.7).** Where a Local-First deployment later reconnects after an extended offline period (Section II.4.3.3) and its local state has diverged from a cloud-tier record it optionally syncs against, conflict resolution favors the local deployment's data as authoritative for anything the studio's own hardware is the system of record for (per II.5.5.5) — the cloud tier is never permitted to silently overwrite local data the studio has not explicitly designated as cloud-synced.

- **REQ-DEPLOY-011 (MUST):** The Local-First distribution MUST run without any external service dependency beyond the studio's own hardware, satisfying [REQ-ARCH-020] for every core component.
- **REQ-DEPLOY-012 (MUST):** The Local Model Runtime MUST be capable of executing agent reasoning and Ethics Layer scoring without a network call to an external inference API.
- **REQ-DEPLOY-013 (MUST):** No data category MUST sync from a Local-First deployment to a cloud tier by default; all sync MUST be explicit, opt-in, and per-category.
- **REQ-DEPLOY-014 (MUST):** In a sync conflict, data the studio's local deployment is the system of record for MUST take precedence; a cloud tier MUST NOT silently overwrite local data.

---

*End of Part II.5 — Deployment Architecture.*

*Cross-References:* [Volume I, Section I.2.1.5] (Local-First Principle), [Volume IX, Section IX.2.5] (Secrets Management), [Volume IX, Section IX.6.1.2] (Local LLM Runtime), [Volume X, Section X.6.1.5] (Cross-Studio Benchmarking — not yet specified), [Part II.6] (Scalability Architecture — forward reference), [Part II.7] (Observability Architecture — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-DEPLOY-001 through REQ-DEPLOY-014.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 8, 2026

---

## Part II.6 — Scalability Architecture

Part II.6 specifies how the platform scales along the four dimensions named in [REQ-ARCH-032]: data volume, event throughput, query load, and simulation compute. This Part's obligation is to make each dimension's scaling mechanism concrete — which layer absorbs growth, what triggers a scaling action, and where the boundary sits between "the architecture handles this automatically" and "this requires a deliberate operational decision."

### II.6.1 Scaling Strategy Overview

**Scaling Dimensions (II.6.1.1).** The four dimensions from [REQ-ARCH-032] scale independently by design: data volume growth (more players, longer history) is absorbed primarily by the Data Lake's tiering (Section II.3.1.3) and does not by itself require additional compute; event throughput growth is absorbed by the Telemetry Collector's horizontal scaling (Section II.6.4); query load growth is absorbed by read replicas and caching (Section II.6.2.2, Section II.3.8); simulation compute demand is absorbed by the Simulation Engine's independent scaling (Section II.6.3.4). A deployment experiencing growth in one dimension MUST NOT be required to over-provision the other three.

**Vertical vs. Horizontal Scaling Decisions (II.6.1.2).** Stateless components (API Gateway, Normalization workers) default to horizontal scaling, consistent with the extraction-point design in Section II.1.2.3. Stateful components with a single logical owner of a partition (a graph shard, a database primary) scale vertically up to a ceiling, then horizontally via the sharding and partitioning strategies in Section II.6.2; vertical scaling is preferred below that ceiling because it avoids the cross-shard query complexity horizontal scaling introduces for the Knowledge Graph (Section II.3.4.4) specifically.

**Scaling Triggers and Metrics (II.6.1.3).** Scaling decisions trigger on the metric that actually reflects the component's bottleneck (per the same principle already stated for autoscaling in Section II.5.3.8): queue depth and processing lag for the Telemetry Collector and event consumers, active connection count and p95 latency for query-serving components, and queue depth again for Simulation compute jobs — CPU utilization alone is treated as a secondary, confirming signal, not the primary trigger, because several of the platform's actual bottlenecks (I/O-bound ingestion, memory-bound graph traversal) do not show up as CPU saturation first.

**Auto-Scaling Policies (II.6.1.4).** Auto-scaling policies specify both a scale-up and a scale-down path with independent thresholds and cooldown periods (scale-up fast, scale-down conservatively), preventing the oscillation ("flapping") that a symmetric threshold would produce under bursty load — this is a direct consequence of the event-driven architecture's bursty ingestion pattern (Section II.1.2.1) rather than a generic best practice applied without reason.

- **REQ-SCALE-001 (MUST):** Each of the four scaling dimensions MUST have an independently triggerable scaling mechanism; a deployment MUST NOT be forced to scale one dimension as a side effect of provisioning for another.
- **REQ-SCALE-002 (MUST):** Auto-scaling policies MUST define asymmetric scale-up and scale-down thresholds with cooldown periods to prevent oscillation under bursty load.

### II.6.2 Data Scaling

**Database Sharding Strategy (II.6.2.1).** Where a single operational-tier instance (Section II.3.2) reaches its vertical scaling ceiling, sharding follows tenant boundaries first (Section II.1.1.5) — a large single tenant is sharded by a secondary key (player ID range or hash) only once that tenant alone exceeds a single shard's capacity, keeping the common case (many small-to-medium tenants) shard-free and simple.

**Read Replicas (II.6.2.2).** Read-heavy query load (dashboard queries, Section II.2.7.4) is served from read replicas of the operational tier, consistent with the CQRS read-path separation established in Section II.1.2.2; replica lag is monitored and surfaced to the observability stack (Part II.7) so that a stale-read risk is visible rather than silent, particularly relevant given the bounded-staleness consistency model for materialized views (Section II.3.2.6).

**Data Partitioning by Tenant (II.6.2.3).** Every storage tier in Part II.3 partitions by tenant as a first-class dimension (extending the Data Lake partitioning already specified in Section II.3.3.3 to the operational and graph tiers as well), so that a per-tenant operation — a data export, a deletion request (Section II.3.3.6), a tenant offboarding — touches exactly the partitions that tenant owns.

**Hot Partition Mitigation (II.6.2.4).** A single unusually large or active tenant (or, within a tenant, a single unusually active player) can produce a hot partition that degrades performance for co-located data; mitigation combines sub-partitioning (splitting a hot tenant's partition further, per II.6.2.1's secondary key) with request-level rate limiting (Section II.4.4.3) so that one hot partition's load does not silently degrade a neighboring tenant sharing the same physical shard.

- **REQ-SCALE-003 (MUST):** Every storage tier MUST support tenant-scoped partitioning sufficient to isolate a single tenant's data operations (export, deletion, offboarding) from all other tenants.
- **REQ-SCALE-004 (SHOULD):** Hot partition detection SHOULD trigger sub-partitioning or rate-limiting before the affected shard's degradation propagates to co-located tenants.

### II.6.3 Compute Scaling

**Stateless Service Scaling (II.6.3.1).** The API Gateway, Event Normalization workers, and Agent Reasoning dispatch (Orchestrator-triggered, not the agents' own state) scale horizontally with no coordination overhead beyond the load balancing already specified in Section II.4.2.3, since no instance holds state another instance depends on.

**Stateful Service Scaling (II.6.3.2).** The Recommendation Engine's state machine (Section II.2.6.2) is the platform's primary stateful-scaling concern: scaling here means scaling the underlying strongly-consistent storage (Section II.3.2.6), not the service logic itself, which remains a thin, horizontally scalable layer over that storage — a design choice that keeps the hard scaling problem (consistent state) isolated to Part II.3's storage layer rather than duplicated into application-layer coordination logic.

**GPU Allocation for Model Inference (II.6.3.3).** GPU resources are allocated per the node pool strategy in Section II.5.3.10, shared across the Local Model Runtime's inference workload (agent reasoning, Ethics Layer scoring) and the Simulation Engine's persona forecasting, with inference workloads (latency-sensitive, tier-1-adjacent per the Ethics Layer's availability tier in Section II.1.4.3) receiving scheduling priority over simulation batch workloads (delay-tolerant, tier-3) when GPU contention occurs.

**Simulation Compute Cluster Scaling (II.6.3.4).** The Simulation Engine, as an extracted independently-scalable service (Section II.1.2.3), scales its worker pool against queue depth (per II.6.1.3) up to the throughput target specified in [Volume IV, Section IV.9.2.1]; in the Hybrid deployment model, this is the specific workload that bursts to cloud capacity (Section II.5.1.3) when local worker pool capacity is exhausted.

**Job Queue Scaling (II.6.3.5).** The job queue underlying Agent Reasoning and Simulation batch dispatch (Section II.2.8.2–II.2.8.3) scales its partition count and consumer parallelism together (per Section II.6.4.2), with queue depth itself serving as the primary autoscaling trigger for the worker pools that drain it.

- **REQ-SCALE-005 (MUST):** GPU scheduling MUST prioritize inference workloads (agent reasoning, Ethics Layer scoring) over simulation batch workloads when GPU contention occurs, consistent with the tiered availability classification in Section II.1.4.3.
- **REQ-SCALE-006 (MUST):** The Recommendation Engine's scaling strategy MUST scale the underlying storage layer, not attempt application-layer state coordination across service instances.

### II.6.4 Event Throughput Scaling

**Event Partitioning Strategy (II.6.4.1).** Extends the per-player partition key already specified for ordering (Section II.2.3.4) to throughput scaling: partition count is provisioned against target throughput per partition, with the per-player key ensuring that adding partitions increases aggregate throughput without disturbing the within-player ordering guarantee any single player's events depend on.

**Consumer Parallelism (II.6.4.2).** Consumer group parallelism (Section II.4.5.3) scales up to the partition count of the topic being consumed — beyond that point, additional consumer instances sit idle, so autoscaling policy for stream consumers is explicitly capped at partition count rather than scaling unboundedly against a queue-depth metric that additional consumers beyond that cap cannot actually improve.

**Backpressure Management at Scale (II.6.4.3).** The backpressure mechanism specified in Section II.2.3.5 — Ethics Layer saturation propagating upstream to Agent Reasoning — is scale-tested against the platform's target throughput specifically, because a backpressure mechanism that works correctly at low volume but fails to propagate fast enough at scale would silently reintroduce the ethics-bypass-under-load risk [Volume I, REQ-ETH-071] exists to prevent; this is called out explicitly here because it is the one throughput-scaling concern with a direct ethics-architecture consequence, not merely a performance concern.

- **REQ-SCALE-007 (MUST):** Consumer group autoscaling MUST be capped at the topic's partition count.
- **REQ-SCALE-008 (MUST):** The Ethics Layer backpressure mechanism (Section II.2.3.5) MUST be load-tested at the platform's target throughput (Section II.1.4.1) as part of the scalability quality attribute's acceptance criteria, not assumed to scale linearly from low-volume testing.

### II.6.5 Geographic Scaling

**Multi-Region Deployment (II.6.5.1).** Applies to the Cloud deployment model only (Section II.5.1.2); a multi-region deployment runs a full platform instance per region, with cross-region concerns limited to the specific replication and residency requirements in II.6.5.2–II.6.5.3 rather than a single logically-global deployment spanning regions, because the latter would make the strongly-consistent recommendation state machine (Section II.3.2.6) a cross-region consistency problem this specification has no need to take on.

**Data Residency by Region (II.6.5.2).** Where a studio's regulatory requirements mandate regional data residency (per [Volume IX, Section IX.3.4], forward reference), a tenant's data is provisioned entirely within the required region's deployment instance, and cross-region replication (II.6.5.3) for that tenant is limited to what the residency requirement explicitly permits.

**Cross-Region Replication (II.6.5.3).** Where permitted, replication is asynchronous and scoped to specific data categories (aggregate metrics for cross-region reporting, not raw player telemetry by default), following the same granular, opt-in principle already established for cloud sync in Section II.5.5.6.

**Latency Optimization (II.6.5.4).** SDK traffic (Section II.4.3.1) routes to the geographically nearest region's Telemetry Collector via standard DNS or anycast routing, minimizing client-perceived latency for the highest-volume, most latency-sensitive traffic in the system, while batch and simulation workloads (delay-tolerant, per Section II.1.4.3) are not subject to the same regional-affinity optimization.

- **REQ-SCALE-009 (MUST):** A tenant with a regional data residency requirement MUST have their data provisioned entirely within the required region; cross-region replication for that tenant MUST be limited to what the residency requirement explicitly permits.
- **REQ-SCALE-010 (SHOULD):** SDK traffic SHOULD route to the geographically nearest regional deployment to minimize client-perceived ingestion latency.

---

*End of Part II.6 — Scalability Architecture.*

*Cross-References:* [REQ-ARCH-032] (Scalability Targets), [Volume I, REQ-ETH-071] (No Bypass Under Load), [Volume IV, Section IV.9.2.1] (Simulation Throughput Target), [Section II.1.4.3] (Tiered Availability), [Volume IX, Section IX.3.4] (Regional Compliance — forward reference), [Part II.7] (Observability Architecture — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-SCALE-001 through REQ-SCALE-010.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 8, 2026

---

## Part II.7 — Observability Architecture

Part II.7 specifies the logging, metrics, tracing, alerting, and health-check architecture that makes every other Part in this Volume verifiable at runtime rather than only true on paper. Observability was named a first-class architectural requirement in Section II.1.4.6, not operational garnish, and this Part is where that claim is made concrete — including the one place observability and ethics governance are the same system: the Ethics System Health Checks in Section II.7.5.4.

### II.7.1 Logging

**Structured Logging Standard (II.7.1.1).** Every component emits structured (JSON or equivalent key-value) logs, never free-text-only messages, with a mandatory field set — timestamp, component name, trace ID (Section II.7.3.2), severity, tenant ID where applicable — so that logs are queryable and correlatable across the component inventory (Section II.1.1.1) without per-component parsing logic.

**Log Levels and Usage Guidelines (II.7.1.2).** Standard levels (DEBUG, INFO, WARN, ERROR, CRITICAL) with usage bound by convention, not left to individual developer judgment: CRITICAL is reserved for conditions requiring immediate human attention (an Ethics Layer availability breach, a gate bypass attempt per Section II.2.6.5) so that a CRITICAL-level log is never diluted by routine error noise that should be logged at ERROR instead.

**Log Aggregation Architecture (II.7.1.3).** Logs from every component aggregate into a central store queryable by trace ID, component, tenant, and severity, following the same technology-neutral selection convention established throughout this Volume; in a Local-First deployment (Section II.5.5), aggregation runs against the embedded database (Section II.5.5.2) rather than requiring a separate log-aggregation service.

**Log Retention Policy (II.7.1.4).** Retention follows the tiered lifecycle already specified in Section II.3.1.3 — recent logs hot for active debugging, older logs compacted and moved to cold storage — with the specific exception that any log entry that constitutes or supports an audit-trail record (a gate decision, an override, per Section II.2.6.4) inherits the audit retention period from [Volume I, Section I.5.2.5], not the standard operational log retention window.

**Sensitive Data in Logs (Redaction Rules) (II.7.1.5).** Player-identifying and psychologically sensitive data (raw behavioral content, not aggregate metrics) MUST NOT appear in logs in plaintext; logs reference such data by ID, with the actual content retrievable only through the lineage and audit query interfaces (Section II.2.2.3) that carry their own access controls (Part IX.2), so that a log stream — which typically has broader operational access than the data stores it describes — cannot become a side channel around those controls.

- **REQ-OBS-001 (MUST):** All logs MUST be structured with the mandatory field set (timestamp, component, trace ID, severity) defined in II.7.1.1.
- **REQ-OBS-002 (MUST):** Player-identifying or raw behavioral content MUST NOT appear in log output in plaintext; logs MUST reference such data by ID only.
- **REQ-OBS-003 (MUST):** Log entries supporting an audit-trail record MUST inherit the audit retention period from [Volume I, Section I.5.2.5], not the standard log retention window.

### II.7.2 Metrics

**Metric Taxonomy (Business, System, AI, Ethics) (II.7.2.1).** Four metric categories, tracked distinctly because they answer different questions and are consumed by different audiences: **System** metrics (latency, throughput, error rate) answer "is the platform healthy"; **Business** metrics (recommendations proposed/approved/deployed, cycle time) answer "is the platform delivering value"; **AI** metrics (agent confidence distributions, simulation forecast accuracy against Feedback Loop Closure's measured outcomes, per Section II.2.1.13) answer "is the reasoning layer trustworthy"; and **Ethics** metrics (score distributions across all seven dimensions, veto frequency, override frequency per [Volume I, Section I.5.2.4], time-to-review) answer "is the governance layer functioning as designed" — the fourth category exists as a first-class taxonomy entry specifically so that ethics governance is not reported only through incident postmortems but through the same continuous-monitoring discipline every other quality attribute in Section II.1.4 receives.

**Metric Collection Pipeline (II.7.2.2).** Metrics are emitted at the point of generation (per-component instrumentation, consistent with [REQ-ARCH-036]) and collected via a pull or push pipeline scoped to the deployment model — a pull-based scrape architecture for Cloud/Kubernetes deployments (Section II.5.3), a lightweight local collector for the single-binary Local-First distribution (Section II.5.5.1) that does not require a separate collection service.

**Metric Storage and Querying (II.7.2.3).** Time-series-optimized storage (Section II.3.6), shared with the behavioral-trend storage tier where deployment scale makes that efficient, queryable by the same range and aggregation patterns already specified in Section II.3.6.3.

**Metric Dashboards (II.7.2.4).** Dashboards are organized per metric category (II.7.2.1), with the Ethics dashboard specifically feeding the Studio Ethics Dashboard's real-time posture claim ([Volume I, REQ-ETH-065]) — this is the concrete architectural component that claim depends on, named explicitly so the dependency is traceable rather than assumed.

**SLO and SLI Definitions (II.7.2.5).** Service Level Objectives are defined per quality attribute in Section II.1.4 (the p95 latency target, the tier-1 availability target) with Service Level Indicators as the specific metrics (II.7.2.1) that measure conformance; an SLO without a named SLI is not yet a measurable commitment and MUST NOT be reported as met.

- **REQ-OBS-004 (MUST):** The platform MUST track Ethics metrics (score distributions, veto frequency, override frequency, time-to-review) as a first-class metric category, not only as incident-driven ad hoc reporting.
- **REQ-OBS-005 (MUST):** Every SLO defined against a Section II.1.4 quality attribute MUST have a named, measured SLI; an SLO without a corresponding SLI MUST NOT be reported as met or unmet.

### II.7.3 Tracing

**Distributed Tracing Architecture (II.7.3.1).** Every request or event flowing through the pipeline (Section II.2.1) carries a trace that spans every component it touches, giving a reviewer or engineer the ability to reconstruct a specific recommendation's full path from originating telemetry event to deployment decision — the observability-layer realization of the lineage query capability already specified at the data layer in Section II.2.2.3.

**Trace Context Propagation (II.7.3.2).** The trace ID first specified as a mandatory field in Section II.7.1.1 propagates across every synchronous call (per [REQ-NET code path already established in Section II.4.2 and Section II.2.7.1]) and across asynchronous event handoffs (Section II.2.1), so that a trace does not terminate at the first queue boundary — asynchronous propagation is treated with the same rigor as synchronous propagation, not as an acceptable gap.

**Trace Sampling Strategy (II.7.3.3).** Sampling is head-based and volume-proportional for routine ingestion traffic (to control storage cost at scale, per Section II.1.4.8) but is unconditionally 100% for any trace touching the Recommendation Gate Architecture (Section II.2.6) — a governance-relevant trace is never sampled away, because a sampled-out trace covering a state transition would be an unacceptable gap in the audit trail's completeness guarantee (Section II.2.6.4).

**Trace-to-Recommendation Correlation (II.7.3.4).** Every Recommendation record (Section II.2.1.9) carries a reference to its full trace, so that the backward lineage query (Section II.2.2.3) and the distributed trace are two views of the same underlying provenance rather than two independently-maintained systems that could drift apart.

- **REQ-OBS-006 (MUST):** Trace context MUST propagate across both synchronous calls and asynchronous event handoffs without termination at a queue boundary.
- **REQ-OBS-007 (MUST):** Any trace touching a Recommendation Gate Architecture state transition (Section II.2.6) MUST be sampled at 100%, regardless of the routine sampling rate applied elsewhere.

### II.7.4 Alerting

**Alert Rule Design (II.7.4.1).** Alerts fire against SLO breach (II.7.2.5) or against a defined failure condition (Part II.8.1), not against raw metric thresholds disconnected from a stated consequence — an alert without a corresponding runbook action is a rule this Section considers not yet ready for production, consistent with the Definition-of-Done discipline [Volume I, CONST-DONE-001-equivalent] applies to every other deliverable in this specification.

**Alert Severity Levels (II.7.4.2).** Severity mirrors the incident classification already established in [Volume I, Section I.5.3.5] for ethics incidents, extended to the full operational surface: Severity-1 (tier-1 component down, Ethics Layer unavailable, gate bypass detected — page immediately), Severity-2 (tier-2 degradation, elevated error rate), Severity-3 (tier-3 delay, non-urgent capacity warning) — using one severity taxonomy across both ethics and operational incidents rather than maintaining two, so that an on-call engineer never has to reconcile which of two scales an incident falls on.

**Alert Routing and Escalation (II.7.4.3).** Severity-1 alerts route to the on-call engineer and, where the alert concerns an Ethics Layer or gate-bypass condition, simultaneously to the incident response authority named in [Volume I, Section I.5.3.5] — the routing rule is the architectural enforcement of that Section's human-notification requirement, not left to the on-call engineer's discretion to escalate.

**On-Call and Incident Response (II.7.4.4).** Follows the incident response process specified in [Volume I, Section I.5.3.5] for any alert touching ethics governance, and a standard operational incident process (runbook execution, postmortem per [Volume I, DOC-SYNC-001-equivalent] applied to incident documentation) for purely operational alerts that carry no governance dimension.

**Alert Fatigue Management (II.7.4.5).** Alert rules are reviewed against their historical fire rate and resolution outcome on a recurring cadence, and a rule that fires frequently without corresponding action taken is tuned or retired — Severity-1 rules are exempt from this tuning-for-noise-reduction process, since a Severity-1 rule firing frequently is evidence of a real, recurring problem to fix at the source, not evidence the rule itself is miscalibrated.

- **REQ-OBS-008 (MUST):** Alert severity MUST use a single taxonomy shared between ethics-governance incidents and operational incidents, per [Volume I, Section I.5.3.5] extended to this Part.
- **REQ-OBS-009 (MUST):** A Severity-1 alert concerning the Ethics Layer or a suspected gate bypass MUST route simultaneously to on-call and to the incident response authority named in [Volume I, Section I.5.3.5].
- **REQ-OBS-010 (SHOULD):** Alert rules SHOULD be reviewed periodically for fire-rate and outcome, and tuned or retired if they do not drive action — except Severity-1 rules, which SHOULD instead prompt investigation of the underlying recurring cause.

### II.7.5 Health Checks

**Liveness and Readiness Probes (II.7.5.1).** Every component exposes a liveness probe (is the process running) and a readiness probe (is the component able to serve traffic) as distinct signals, per standard practice, with readiness for the Recommendation Engine specifically gated on the Ethics Layer being reachable — the Recommendation Engine reports not-ready rather than ready-but-degraded when its ethics-gating dependency is unavailable, so that traffic is not routed to a component that would otherwise have to choose between blocking and bypassing.

**Dependency Health Checks (II.7.5.2).** Each component's health check includes the status of its hard dependencies (per the Component Responsibility Matrix, Section II.1.1.2), so that a downstream failure is visible at the component that depends on it, not only at the failing component itself — this is what makes the backpressure behavior in Section II.2.3.5 something the observability layer can actually confirm is happening, rather than something assumed to be happening because the code says so.

**AI Model Health Checks (II.7.5.3).** The Local Model Runtime (Section II.5.5.3) and any cloud-tier inference dependency report health beyond simple liveness — including inference latency drift and, where feasible, a lightweight output-sanity check against a known reference input — so that a model silently degrading in quality (not crashing, just producing worse output) is distinguishable from a healthy model, which a pure liveness probe cannot detect.

**Ethics System Health Checks (II.7.5.4).** The Ethics Layer's health check is the most consequential in this Section: beyond liveness and readiness, it verifies that the veto-enforcement guard (Section II.2.6.3) is actually active — a synthetic canary Recommendation with a deliberately veto-level Manipulation Risk score is periodically run through the gate in a non-production-affecting path, and a canary that does *not* get blocked is itself the highest-severity alert this Part defines, because it would mean the single most important guarantee in this entire Volume has silently stopped holding.

- **REQ-OBS-011 (MUST):** The Recommendation Engine's readiness probe MUST report not-ready when its dependency on the Ethics Layer is unavailable; it MUST NOT report ready in a degraded state that could permit an ungated transition.
- **REQ-OBS-012 (MUST):** The Ethics Layer's health check MUST include a periodic synthetic canary test verifying the veto-enforcement guard (Section II.2.6.3) is active; a canary that fails to be blocked MUST trigger the highest-severity alert defined in Section II.7.4.2.
- **REQ-OBS-013 (SHOULD):** AI model health checks SHOULD include inference latency drift and an output-sanity check, not liveness alone, so that quality degradation is detectable independent of process crashes.

---

*End of Part II.7 — Observability Architecture.*

*Cross-References:* [Volume I, Section I.5.2.4] (Override and Escalation), [Volume I, Section I.5.3.5] (Incident Response), [Volume I, REQ-ETH-065] (Studio Ethics Dashboard), [Section II.2.6] (Recommendation Gate Architecture), [Section II.2.2.3] (Lineage Query API), [Part IX.2] (Access Control — forward reference), [Part II.8] (Failure Modes and Resilience — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-OBS-001 through REQ-OBS-013.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 8, 2026

---

## Part II.8 — Failure Modes and Resilience

Part II.8 closes Volume II by specifying what happens when the architecture described in Parts II.1 through II.7 fails anyway — because it will. A failure mode catalog that exists only in an engineer's head is not a specification; this Part makes the platform's failure behavior as explicit and reviewable as its happy-path behavior, and states, for the one failure mode that matters most, exactly what the architecture is required to do: fail closed, never open, where "open" would mean a recommendation reaching a studio without passing the gate.

### II.8.1 Failure Mode Catalog

Twelve failure modes are cataloged below with their detection signal, immediate effect, and the Section of this Volume that specifies the recovery mechanism. A failure mode identified during implementation that does not fit this table MUST be added to it before the corresponding component ships, per the same completeness discipline [Volume I, CONST-COMPLETE-001-equivalent] applies elsewhere.

| # | Failure Mode | Detection Signal | Immediate Effect | Recovery Mechanism |
|---|---|---|---|---|
| 1 | Telemetry Collector Failure | Liveness probe fail, ingestion rate drop | SDK buffers locally (II.4.3.3); no data loss within buffer window | Restart/reschedule; horizontal replica takeover (II.6.3.1) |
| 2 | Event Bus Failure | Consumer lag spike, publish errors | Producers block or buffer; real-time stages stall | Bus cluster failover; DLQ preserves in-flight messages (II.4.5.4) |
| 3 | Storage Failure (Primary, Replica, Cache) | Health check fail, write errors | Primary: writes blocked, reads may degrade to replica. Cache: fall through to source | Failover to replica (RPO per II.8.3.1); cache rebuild from source |
| 4 | Knowledge Graph Corruption | Integrity check fail, query anomalies | Affected subgraph queries degrade or error | Rebuild from upstream sources (II.3.4.6); flagged, not silently served |
| 5 | Model Inference Failure | Inference error rate spike, health check (II.7.5.3) | Agent reasoning or Ethics scoring for affected requests halts | Fallback to prior model version (II.3.5.4); requests queue, not skip gate |
| 6 | Agent Orchestration Failure | Orchestrator health check fail | New recommendation generation halts | Restart; in-flight agent jobs resume from job queue (II.2.8.3) |
| 7 | Simulation Engine Failure | Job failures, worker crash | In-flight simulation jobs fail | Job requeue with retry (II.4.2.5); tier-3, delay-tolerant (II.1.4.3) |
| 8 | Recommendation Engine Failure | Health check fail | State transitions halt platform-wide | Failover per RPO-zero requirement (II.3.2.8); no transition lost |
| 9 | Network Partition | Cross-component timeout pattern | Split-brain risk for stateful components | Partition handling per II.4.3.5; strong-consistency components refuse writes on minority side |
| 10 | Partial Service Degradation | SLI breach without full outage (II.7.2.5) | Subset of functionality slow or unavailable | Tiered response per availability tier (II.1.4.3); graceful degradation (II.8.2.5) |
| 11 | Resource Exhaustion (CPU, Memory, GPU, Disk) | Resource metric threshold, OOM events | Component slowdown or crash-restart loop | Resource limits prevent noisy-neighbor spread (II.5.3.3); autoscale (II.6.1) |
| 12 | Clock Skew and Time-Related Failures | NTP sync alerts, out-of-order timestamp anomalies | Event ordering (II.2.3.4) and lineage timestamps unreliable | NTP-synced clocks mandatory; logical/vector clock fallback for ordering-critical paths |

- **REQ-RESIL-001 (MUST):** Every failure mode in this catalog MUST have an implemented detection signal before the corresponding component is eligible for production deployment.
- **REQ-RESIL-002 (MUST):** A newly identified failure mode not covered by this catalog MUST be added to it before the affected component ships to production.

### II.8.2 Resilience Patterns

Three of the seven standard resilience patterns are already fully specified elsewhere in this Volume and are cross-referenced here rather than restated, per [Volume I, CONST-ONEHOME-001]: **Retry with Exponential Backoff** (II.8.2.1) is specified in Section II.4.2.5; **Circuit Breaker** (II.8.2.2) is specified in Section II.4.2.4; **Timeout** (II.8.2.4) is specified alongside retry policy in Section II.4.2.5. The remaining four are specified here for the first time.

**Bulkhead (II.8.2.3).** Resource pools (connection pools, thread pools, GPU allocation) are partitioned per component or per tier, so that one component's resource exhaustion (failure mode #11) cannot starve another's — this is the same principle already applied to GPU scheduling priority (Section II.6.3.3) and Pod Disruption Budgets (Section II.5.3.11), generalized here as a named pattern applied to every shared resource pool in the architecture, not only the two instances already specified.

**Fallback and Graceful Degradation (II.8.2.5).** Every non-tier-1 component defines an explicit degraded mode it falls back to under failure, rather than failing the entire request: the dashboard (tier-2) falls back to cached/stale data with a visible staleness indicator rather than failing to render; Simulation (tier-3) falls back to a queued-for-later state rather than failing the request outright. The Ethics Layer and Recommendation Engine (tier-1) are the explicit exception to graceful degradation — per [REQ-ARCH-033] and [REQ-OBS-011], they fail closed (block, don't proceed) rather than degrade gracefully, because a "degraded" ethics gate is a compromised ethics gate, not a smaller version of a working one.

**Queue-Based Load Leveling (II.8.2.6).** Formalizes, as a named pattern, the queuing behavior already implicit in the asynchronous pipeline design (Section II.2.3.1) and the backpressure mechanism (Section II.2.3.5): a burst of upstream demand is absorbed by queue depth rather than by downstream component overload, with the Ethics Layer's backpressure (already specified) as the pattern's most consequential instance in this architecture.

**Saga Pattern for Distributed Transactions (II.8.2.7).** The Recommendation lifecycle (Section II.2.6.2) and the multi-step Deployment-then-Outcome-Measurement sequence (Section II.2.1.11–II.2.1.12) are distributed, multi-step processes without a single ACID transaction spanning them; each step's failure is handled by an explicit compensating action rather than an assumed rollback — a Deployment that succeeds but whose confirmation callback (II.2.6.2.f) never arrives is handled by a timeout-triggered reconciliation query against the studio's release pipeline, not by silently assuming success or silently retrying a deployment that may have already applied.

- **REQ-RESIL-003 (MUST):** Tier-1 components (Ethics Layer, Recommendation Engine) MUST fail closed under failure conditions; graceful degradation MUST NOT be implemented as an alternative to failing closed for these components.
- **REQ-RESIL-004 (MUST):** Every multi-step process spanning a component boundary without a shared transaction MUST define an explicit compensating action for each step's failure case, per the Saga pattern in II.8.2.7.

### II.8.3 Disaster Recovery

**RPO and RTO Targets by Component (II.8.3.1).** Extends the RPO-zero requirement already specified for recommendation state (Section II.3.2.8) into a full per-component table: Recommendation state (RPO: zero, RTO: minutes, per its tier-1 classification), audit trail (RPO: zero, per its regulatory role), operational materialized views (RPO: minutes, rebuildable per Section II.3.2.5), Data Lake (RPO: hours, acceptable given its batch-oriented access pattern), Knowledge Graph (RPO: hours, rebuildable per Section II.3.4.6).

**Backup Strategy (II.8.3.2).** Strongly-consistent, RPO-zero data uses continuous replication (not periodic backup) as its primary recovery mechanism, per Section II.3.2.6; rebuildable data (graph, materialized views) uses periodic snapshot plus rebuild-from-source, per the same reasoning already established in Section II.3.4.6, rather than duplicating a full continuous-backup regime onto data that doesn't require it.

**Restore Procedures (II.8.3.3).** Documented, versioned, and specific per component — a restore procedure that exists only as institutional knowledge in one engineer's head does not satisfy this requirement — and restore procedures for tier-1 components include a verification step confirming restored state passes the same integrity checks (failure mode #4's detection mechanism, generalized) before the component is returned to production traffic.

**Disaster Recovery Testing (II.8.3.4).** Restore procedures (II.8.3.3) are tested on a recurring schedule against realistic failure scenarios (per the Failure Mode Catalog, II.8.1), not validated once at initial implementation and assumed to remain correct as the system evolves — an untested restore procedure is treated as an unverified claim, consistent with this Volume's evidence-over-assertion posture throughout.

**Multi-Site Failover (II.8.3.5).** Applies to the multi-region Cloud deployment model (Section II.6.5.1): a regional outage triggers failover to a secondary region for that region's tenants, subject to the same data residency constraints already specified in Section II.6.5.2 — failover MUST NOT relocate a tenant's data outside its required residency region even under disaster conditions, and where no compliant secondary region exists, the deployment fails safe (unavailable) rather than fails open (non-compliant).

- **REQ-RESIL-005 (MUST):** Every component MUST have a documented, versioned restore procedure with a stated RPO and RTO per II.8.3.1.
- **REQ-RESIL-006 (MUST):** Restore procedures for tier-1 components MUST include a post-restore integrity verification step before the component returns to production traffic.
- **REQ-RESIL-007 (SHOULD):** Disaster recovery procedures SHOULD be tested on a recurring schedule against the Failure Mode Catalog (II.8.1), not validated only once at initial implementation.
- **REQ-RESIL-008 (MUST):** Multi-site failover MUST NOT relocate a tenant's data outside its required data-residency region; where no compliant secondary region exists, the deployment MUST fail safe rather than fail open.

---

*End of Part II.8 — Failure Modes and Resilience.*

*Cross-References:* [Volume I, CONST-COMPLETE-001] (No Partial Delivery), [Volume I, CONST-ONEHOME-001] (One Canonical Home per Rule), [Section II.1.4.3] (Tiered Availability), [Section II.2.6] (Recommendation Gate Architecture), [Section II.3.2.6] (Operational Storage Consistency), [Section II.6.5] (Geographic Scaling), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-RESIL-001 through REQ-RESIL-008.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 8, 2026

---

## End of Volume II — System Architecture

Volume II is complete: eight Parts, specifying the components (II.1), data flows and the recommendation gate (II.2), storage (II.3), networking (II.4), deployment across five models with Local-First as the genuine default (II.5), scaling along four independent dimensions (II.6), observability including the Ethics Layer's own canary self-check (II.7), and failure behavior that fails closed exactly where Volume I requires it to (II.8). The Part II.2 numbering gap flagged in the prior revision — Sections II.2.4 and II.2.5 missing from the Master TOC — has been resolved: both sections are now specified (Data Transformation and Enrichment Pipelines; Data Quality and Validation Gates) and the Master TOC updated to match. No open items remain against this Volume.

Requirement IDs issued across this Volume: REQ-ARCH-001–038, REQ-FLOW-001–033, REQ-STOR-001–014, REQ-NET-001–013, REQ-DEPLOY-001–014, REQ-SCALE-001–010, REQ-OBS-001–013, REQ-RESIL-001–008 — 143 requirements in total, every one traceable to a specific Volume I commitment or to a stated engineering trade-off, per the ADR discipline established in Section II.1.3.

*Volume III — Knowledge Graph and AI Core follows, per [PsyForge_v1_Master_TOC.md].*
