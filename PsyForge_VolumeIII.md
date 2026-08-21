# PsyForge v1.0 — Volume III: Knowledge Graph and AI Core

*Part of the PsyForge Master Specification. See [PsyForge_v1_Master_TOC.md](PsyForge_v1_Master_TOC.md) for the full document map, [PsyForge_VolumeI_Complete.md](PsyForge_VolumeI_Complete.md) for Volume I (Strategic Foundation), and [PsyForge_VolumeII.md](PsyForge_VolumeII.md) for Volume II (System Architecture).*

*Document Status: Living Specification — Volume III complete (Parts III.1–III.7).*

---

Volume III specifies the reasoning substrate Volume II's architecture runs on: the Knowledge Graph's schema (Part III.1), the Psychology Corpus that populates and validates it (Part III.2), the Feature Engineering Pipeline that turns raw telemetry into graph-worthy signal (Part III.3), and — in Parts III.4 through III.7 — embeddings, player modeling, pattern mining, and the causal-inference discipline that every other Part in this Volume depends on and that Volume II has already cited more than a dozen times without yet defining. Where Volume I stated *why* an inference must clear an evidence bar before it becomes a graph edge, and Volume II specified *where* that edge is stored and *how* it flows through the pipeline, Volume III specifies *what the edge actually means* — which is the harder problem, because it requires the platform to commit to a specific, checkable model of player psychology rather than leaving "behavioral reasoning" as a phrase the rest of the specification can gesture at.

---

## Part III.1 — Knowledge Graph Schema

Part III.1 is the schema every causal claim this platform ever makes has to fit inside. A node type not in this catalog cannot be created; an edge type not in this catalog cannot connect two nodes; a property not in the relevant schema cannot be attached. This is deliberately restrictive — the alternative, a schema-less graph where any agent can invent a new node or edge type on demand, would make the causal-inference evidence bar (Section III.7.2, forward reference — cited throughout Volume II) unenforceable, because there would be no fixed vocabulary for "meets the bar" to apply to.

### III.1.1 Graph Model Overview

**Property Graph Model (Nodes, Edges, Properties) (III.1.1.1).** The Knowledge Graph is a directed, typed property graph: every node has a type (from the seventeen in Section III.1.2) and a property set (Section III.1.4); every edge has a type (from the fifteen in Section III.1.3), a direction, and its own property set, most importantly a confidence and evidence trail (Section III.1.4.5). This is the same property-graph model the storage-layer selection criteria in [Volume II, Section II.3.4.1] already assume; Part III.1 is where those assumptions become an actual, closed schema.

**Graph vs. Relational Trade-offs (III.1.1.2).** A relational model would represent "Player exhibits Behavior which triggers Emotion which motivates re-engagement with Mechanic" as a chain of foreign-key joins across as many tables as there are hops — correct, but opaque to both a human reviewer and a graph-traversal query planner. The property graph model makes the causal chain itself the primary queryable structure (Section III.1.6.2), which is the specific capability the platform's core value proposition depends on: an agent or a human reviewer asking "why" a recommendation exists needs to walk a path, not reconstruct one from join logic.

**Graph Query Language Selection (III.1.1.3).** Selected against native multi-hop traversal expressiveness and the temporal/versioned query support Section III.1.4.4 requires (a Cypher-family or Gremlin-family language, per the technology-neutral convention already established in [Volume II, Section II.1.2.6]); the specific language is recorded as an ADR ([Volume II, Section II.1.3]) at implementation time, cross-referencing the storage engine selection in [Volume II, Section II.3.4.1] since the two choices are not independent.

- **REQ-GRAPH-001 (MUST):** Every node and edge instance MUST conform to a type defined in this Part's catalog (Sections III.1.2, III.1.3); the platform MUST NOT support ad hoc, unregistered node or edge types in production.
- **REQ-GRAPH-002 (MUST):** A new node or edge type proposed during implementation MUST be added to this catalog via the amendment process ([Volume I, Section I.2.4.2]) before it is used in production, not introduced silently by a single agent or engineer.

### III.1.2 Node Types

Seventeen node types, each representing a distinct kind of entity the platform reasons about. The distinction between types is deliberate and load-bearing: collapsing, for example, Behavior and Outcome into a single generic "Event" type would make the causal-chain queries in Section III.1.6.2 unable to distinguish "what a player did" from "what resulted from it," which is the exact distinction causal inference (Section III.7.2) depends on.

| # | Node Type | Represents | Example Instance |
|---|---|---|---|
| 1 | Player | A person, or the anonymized/pseudonymous record of one | `Player:p_48291` |
| 2 | Behavior | An observed action pattern, not a single event | "Skips tutorial dialogue" |
| 3 | Emotion | An inferred affective state, always carrying a confidence score (Section III.1.4.5) | "Frustration (inferred, conf. 0.71)" |
| 4 | Motivation | A theorized underlying driver, sourced from the Psychology Corpus (Part III.2) | "Achievement-seeking (Bartle)" |
| 5 | Mechanic | A specific game system or feature | "Daily login reward" |
| 6 | Economy | An in-game economic system or currency flow | "Premium currency exchange" |
| 7 | Outcome | A measured result (retention, spend, churn) | "7-day retention: true" |
| 8 | Session | A bounded play session | `Session:s_991204` |
| 9 | Feature | A computed behavioral feature ([Volume II, Section II.2.1.3]) | "session_frequency_7d" |
| 10 | Pattern | A cross-player or sequential pattern (Part III.6, forward reference) | "Pre-churn disengagement sequence" |
| 11 | Event | A raw or normalized telemetry event ([Volume II, Section II.2.1.1–II.2.1.2]) | `Event:e_...` |
| 12 | Recommendation | A Recommendation record ([Volume II, Section II.2.1.9]) | `Recommendation:r_2291` |
| 13 | Experiment | A validation experiment testing a Recommendation's effect | "A/B test: reward timing" |
| 14 | Simulation Result | An output of the Simulation Engine ([Volume IV], forward reference) | `SimResult:sim_881` |
| 15 | Agent Decision | A specialist agent's reasoning step ([Volume V], forward reference) | `AgentDecision:ad_5510` |
| 16 | Corpus Concept | A theory, construct, or finding from the Psychology Corpus (Part III.2) | "Prospect Theory: Loss Aversion" |
| 17 | Domain Entity (Game-Specific) | A studio-specific concept not covered by the platform-generic sixteen above | "Guild rank" (a specific studio's system) |

Domain Entity (#17) exists specifically so that a studio's game-specific concepts do not force a schema amendment for every new game onboarded — it is deliberately generic, with its specific meaning carried in its properties rather than in additional platform-defined subtypes, per the extensibility discipline already established in [Volume II, Section II.1.4.4].

- **REQ-GRAPH-003 (MUST):** Every node instance MUST be typed as exactly one of the seventeen types in this table; a node MUST NOT carry multiple simultaneous types.
- **REQ-GRAPH-004 (MUST):** The Domain Entity type MUST be used for studio-specific concepts rather than proposing a new platform-generic node type for a single studio's terminology.

### III.1.3 Edge Types

Fifteen edge types, each with a defined direction and meaning. The distinction between an edge that merely correlates and an edge that asserts causation (#7 versus #8 below) is the single most consequential distinction in this catalog, because only Causes edges are subject to the evidentiary bar in Section III.7.2 — a Correlates_With edge is cheap to assert and carries no causal claim; a Causes edge is expensive to assert and is exactly what a Recommendation's rationale (per [Volume I, REQ-ETH-008]'s human-readable-rationale requirement) is built from.

| # | Edge Type | Direction | Meaning | Evidence Bar Applies? |
|---|---|---|---|---|
| 1 | Exhibits | Player → Behavior | This player has been observed performing this behavior pattern | No (observational) |
| 2 | Triggers | Behavior → Emotion | This behavior is associated with this inferred emotional state | Confidence-scored, not causal-bar |
| 3 | Motivated_By | Behavior → Motivation | This behavior is theorized to be driven by this motivation | Corpus-sourced, confidence-scored |
| 4 | Engages_With | Player → Mechanic | This player has interacted with this mechanic | No (observational) |
| 5 | Influences | Mechanic → Economy | This mechanic affects this economic system | Confidence-scored |
| 6 | Produces | Behavior → Outcome | This behavior pattern is associated with this measured outcome | Confidence-scored |
| 7 | Correlates_With | Feature ↔ Feature | Statistical association only, explicitly non-causal | **No — correlation only, never promoted implicitly** |
| 8 | Causes | Node → Node | A direct causal claim between any two eligible node types | **Yes — full evidentiary bar, Section III.7.2** |
| 9 | Part_Of | Node → Aggregate | Compositional relationship (a Session is Part_Of a Player's history) | No (structural) |
| 10 | Derived_From | Feature → Raw Event | Lineage edge, mirroring [Volume II, Section II.2.2.1] at the graph layer | No (structural/lineage) |
| 11 | Recommends | Agent Decision → Recommendation | This agent reasoning step produced this recommendation | No (structural) |
| 12 | Validated_By | Recommendation → Experiment | This recommendation's predicted effect was tested by this experiment | No (structural, links to evidence) |
| 13 | Simulated_As | Player → Virtual Persona | This player was represented by this persona in a simulation run | No (structural) |
| 14 | Belongs_To | Entity → Corpus Domain | This corpus concept belongs to this psychology domain | No (structural, corpus taxonomy) |
| 15 | Temporal_Edge | Versioned relationship modifier | Not a standalone edge type but a property pattern (Section III.1.4.4) applicable to any edge above requiring validity-interval tracking | N/A — modifier, not a type |

The explicit separation of Correlates_With (#7) from Causes (#8) is this schema's direct implementation of [Volume I, Section I.2.1.1]'s Truth Over Assumptions principle applied to graph construction: **a correlation edge MUST NOT be silently upgraded to a causal edge** by any process in the pipeline, including an AI agent under time pressure to produce a recommendation with a compelling rationale. The upgrade path exists — Section III.7.2 specifies exactly what evidence converts a Correlates_With relationship into a Causes claim — but it is a deliberate, evidenced, auditable step, never a default.

- **REQ-GRAPH-005 (MUST):** A Causes edge MUST NOT be created without evidence meeting the bar specified in Section III.7.2; an agent or pipeline stage proposing a causal claim without meeting that bar MUST create a Correlates_With edge instead.
- **REQ-GRAPH-006 (MUST):** No automated process MUST convert a Correlates_With edge into a Causes edge without the evidentiary review specified in Section III.7.2; this conversion MUST be logged and attributable, consistent with the audit-trail discipline in [Volume I, Section I.5.2.5].
- **REQ-GRAPH-007 (MUST):** Every edge instance MUST be typed as exactly one of the fifteen types in this table (with Temporal_Edge applied as a property modifier, not a standalone instance).

### III.1.4 Property Schemas

**Common Properties (ID, Timestamp, Source, Confidence) (III.1.4.1).** Every node and every edge carries: a unique ID, a creation timestamp, a source (which pipeline stage or agent created it, per the provenance schema already specified in [Volume II, Section II.2.2.2]), and a confidence score in [0,1] — even structural edges (Part_Of, Derived_From) carry confidence, defaulted to 1.0, so that confidence is a universal, queryable property rather than one that appears only on the edge types where it happens to matter.

**Node-Specific Properties (III.1.4.2).** Beyond the common set, each node type carries properties specific to what it represents (an Emotion node's valence and arousal dimensions, a Feature node's version per [Volume II, Section II.3.1] versioning discipline, an Outcome node's measurement window) — the full per-type property schema is maintained as structured configuration (per the criteria-driven, non-hardcoded pattern already established for quality-gate thresholds in [Volume II, Section II.2.5.2]), not enumerated exhaustively in this prose specification, so that adding a property to one node type does not require a specification amendment for a change that is genuinely just schema evolution.

**Edge-Specific Properties (Weight, Direction, Evidence) (III.1.4.3).** Beyond direction (fixed per edge type, Section III.1.3) and confidence (III.1.4.1), edges carry a weight (relative strength, distinct from confidence — a high-confidence, low-weight edge is a well-evidenced but minor effect) and, for Causes edges specifically, a mandatory evidence reference pointing to the specific corpus citation, experiment result, or statistical test that justified the claim, satisfying the human-readable-rationale requirement ([Volume I, REQ-ETH-008]) at the data-model level.

**Temporal Properties (Valid From, Valid To) (III.1.4.4).** Every edge carries a validity interval, per [Volume II, REQ-STOR-010], already required at the storage layer and specified here as the schema-level property that requirement operationalizes — `valid_from` defaults to creation time; `valid_to` is null (open-ended, currently believed true) until superseded, at which point the superseding edge's creation closes the prior edge's interval rather than deleting it, mirroring the Superseded-ADR pattern in [Volume II, Section II.1.3.3] applied to graph facts instead of architecture decisions.

**Confidence and Provenance Properties (III.1.4.5).** Confidence (III.1.4.1) and provenance (source, evidence reference per III.1.4.3) together are what make a graph edge auditable rather than assertable: a reviewer inspecting a Recommendation's backward lineage ([Volume II, Section II.2.2.4]) sees not just that a Causes edge exists, but how confident the platform is in it and exactly what evidence produced that confidence.

- **REQ-GRAPH-008 (MUST):** Every node and edge MUST carry the common property set (ID, timestamp, source, confidence) defined in III.1.4.1; an instance missing any of these fields MUST NOT be considered a valid graph write.
- **REQ-GRAPH-009 (MUST):** A Causes edge MUST carry a non-null evidence reference; a Causes edge without one MUST be rejected at write time, not merely flagged for later review.
- **REQ-GRAPH-010 (MUST):** Superseding an edge MUST close the prior edge's validity interval rather than deleting the prior edge, per III.1.4.4.

### III.1.5 Graph Construction

**Entity Extraction Pipeline (III.1.5.1).** Nodes are extracted from upstream pipeline artifacts per the mapping already established in [Volume II, Section II.2.1.5]: normalized events become Event nodes, behavioral features become Feature nodes, and so on through the seventeen types in Section III.1.2 — extraction is deterministic and rule-based for structural types (Event, Feature, Session) and inference-based (agent- or model-driven, carrying sub-1.0 confidence) for interpretive types (Emotion, Motivation).

**Relationship Extraction Pipeline (III.1.5.2).** Edges are extracted by a combination of deterministic rules (an Exhibits edge is created whenever a Behavior is observed for a Player — no inference required) and evidence-gated inference (a Causes edge requires the full pipeline specified in Section III.7.2, forward reference) — the distinction mirrors the Correlates_With/Causes split in Section III.1.3 and is enforced at the same pipeline stage, not left to downstream cleanup.

**Entity Resolution and Deduplication (III.1.5.3).** Player identity resolution (linking events from multiple devices or sessions to one Player node) uses the identity resolution already specified in [Volume VI, Section VI.1.3] (forward reference); non-Player entity deduplication (two extraction passes producing near-duplicate Behavior or Pattern nodes) uses similarity matching against the Vector Storage tier ([Volume II, Section II.3.5]), merging duplicates and preserving both sources in the merged node's provenance.

**Graph Merging Strategy (III.1.5.4).** Where multiple pipeline runs (a real-time incremental update and a scheduled batch reprocessing, per [Volume II, Section II.2.3.2]) produce overlapping graph writes, merging is additive and confidence-aware: a higher-confidence assertion from a later run does not silently overwrite a lower-confidence prior assertion but supersedes it via the temporal-edge pattern (Section III.1.4.4), preserving the graph's own history of what the platform believed and when.

**Incremental Graph Updates (III.1.5.5).** The graph updates incrementally as new events arrive (per the real-time feature-extraction path, [Volume II, Section II.2.3.2]) rather than requiring full reconstruction; incremental updates are the common case, and full rebuild (Section III.1.5.7's compaction, or disaster recovery per [Volume II, Section II.3.4.6]) is the exception.

**Graph Consistency Validation (III.1.5.6).** A scheduled consistency pass checks for schema violations (an edge connecting two node types the catalog in Section III.1.3 does not permit), orphaned nodes (a node with no edges, which for most types indicates an extraction defect), and validity-interval conflicts (two open-ended edges of the same type between the same two nodes, which should have been superseded rather than duplicated) — findings route to the same quarantine mechanism already specified for data quality failures in [Volume II, Section II.2.5.3].

**Graph Pruning and Compaction (III.1.5.7).** Low-confidence, low-weight edges below a configured retention threshold, and closed-interval (superseded) edges past the audit retention window ([Volume I, Section I.5.2.5]), are candidates for pruning — pruning is a Data Lake archival operation (per [Volume II, Section II.3.3.4]'s compaction discipline), not deletion, so a pruned edge remains queryable from cold storage if a future audit requires it.

- **REQ-GRAPH-011 (MUST):** Entity and relationship extraction MUST distinguish deterministic, rule-based writes from evidence-gated inferred writes at the point of creation; the two MUST NOT be conflated in a single undifferentiated write path.
- **REQ-GRAPH-012 (MUST):** Graph consistency validation MUST run on a recurring schedule and MUST route violations to the quarantine mechanism specified in [Volume II, Section II.2.5.3].
- **REQ-GRAPH-013 (SHOULD):** Pruned edges SHOULD be archived, not deleted, consistent with the audit retention requirements in [Volume I, Section I.5.2.5].

### III.1.6 Graph Queries

**Behavioral Path Queries (Player → Outcome) (III.1.6.1).** The canonical query shape: given a Player node, traverse Exhibits and Produces edges (and any Causes edges along the way) to enumerate the Outcome nodes reachable from that player's observed behavior — the query-level realization of the "why did this player churn" question a specialist agent (Part V, forward reference) exists to answer.

**Causal Chain Queries (III.1.6.2).** A stricter variant of III.1.6.1 that traverses only Causes edges (never Correlates_With), returning a path whose every hop carries the evidence Section III.1.4.3 requires — this is the specific query type a Recommendation's rationale (per [Volume I, REQ-ETH-008]) is built from, and it is only as trustworthy as the evidentiary discipline in Section III.7.2 that gates what counts as a Causes edge in the first place.

**Similarity Queries (Player-to-Player) (III.1.6.3).** Delegate to the Vector Storage tier's similarity search ([Volume II, Section II.3.5.3]) over Player-node embeddings (Part III.4, forward reference), returning graph-adjacent players for the "players like this one" pattern Player Modeling (Part III.5, forward reference) and Simulation persona construction (Volume IV, forward reference) both depend on.

**Pattern Matching Queries (III.1.6.4).** Match a named subgraph shape (a Pattern node's defining structure, per Section III.1.2's Pattern type) against the live graph, used by Pattern Mining (Part III.6, forward reference) to detect known behavioral sequences (a pre-churn disengagement pattern) as they emerge for a specific player, not only in retrospective analysis.

**Subgraph Extraction for Agent Context (III.1.6.5).** A bounded, depth-limited extraction (per III.1.6.6) of the graph neighborhood relevant to a specific reasoning task, packaged as the context a specialist agent (Part V, forward reference) receives — extraction is scoped deliberately narrow, because passing an agent the entire graph would defeat the purpose of a structured knowledge representation by forcing the agent back into unstructured reasoning over an unbounded context.

**Graph Traversal Depth Limits (III.1.6.6).** Every traversal query declares a maximum hop count, both for query performance (per the latency target in [Volume II, Section II.1.4.1]) and for causal-inference discipline — a causal chain claimed across an unbounded number of hops accumulates uncertainty at every hop (each hop's confidence compounds multiplicatively) to the point that a very long chain's aggregate confidence may fall below a threshold worth acting on, and the depth limit forces that accumulation to be visible rather than hidden in an arbitrarily long path.

**Query Optimization and Indexing (III.1.6.7).** Indexes on node type, edge type, and the temporal validity properties (III.1.4.4) support the common query shapes above without full-graph scans, consistent with the indexing-against-observed-patterns discipline already established in [Volume II, Section II.3.2.4].

- **REQ-GRAPH-014 (MUST):** Causal Chain Queries (III.1.6.2) MUST traverse only Causes edges; a query mixing Correlates_With and Causes edges in a single causal-chain result MUST label each hop's edge type explicitly so a reader cannot mistake a correlation for a causal link.
- **REQ-GRAPH-015 (MUST):** Every graph traversal query MUST declare a maximum hop count; unbounded traversal is prohibited in production.

### III.1.7 Example: Housing → Ownership → Identity → Community → Retention

This worked example exists because an abstract schema is hard to evaluate; a concrete causal chain, walked end to end, is not. The chain below is illustrative — a plausible, corpus-groundable pattern in games with player-owned spaces (housing, bases, guild halls) — not an empirical finding this specification asserts as true for any specific game without the actual evidence Section III.7.2 would require.

**Full Causal Chain Walkthrough (III.1.7.1).** A player acquires a customizable in-game space (Engages_With: Player → Mechanic, "Player Housing"). Over repeated sessions, the player invests time decorating and upgrading it (Exhibits: Player → Behavior, "Home customization"). Behavioral economics research on the endowment effect ([Volume III, Section III.2.3.2], forward reference) and self-determination theory's autonomy component ([Volume III, Section III.2.4.1], forward reference) together predict — and, if the platform's own telemetry corroborates it with sufficient evidence, would support — a Motivated_By edge to "Ownership/autonomy" and a Triggers edge to an inferred Emotion node, "Attachment." Attachment plausibly Produces an Outcome-adjacent Behavior, "Social space sharing" (inviting other players to view the space), which Engages_With the "Guild/Community" Mechanic, which — per social identity theory ([Volume III, Section III.2.7.1], forward reference) — Motivated_By "Belonging," ultimately Producing the Outcome node "30-day retention: true."

**Graph Representation (III.1.7.2).** The chain above is a path of six edges across seven nodes: `Player —Engages_With→ Mechanic(Housing) —[investment behavior]→ Behavior(Customization) —Motivated_By→ Motivation(Ownership) —Triggers→ Emotion(Attachment) —Produces→ Behavior(Social Sharing) —Engages_With→ Mechanic(Community) —Motivated_By→ Motivation(Belonging) —Produces→ Outcome(Retention)`. Every edge in this path that is asserted as Causes rather than Correlates_With carries its own evidence reference (III.1.4.3); a platform that has only correlational telemetry (players who decorate homes also tend to retain, with no controlled evidence of the mechanism) represents this same chain with Correlates_With edges throughout, and the chain's rhetorical persuasiveness is explicitly not permitted to substitute for the evidence a Causes edge requires — this is the worked example's central point, more than the specific psychological narrative it illustrates.

**Query to Retrieve This Chain (III.1.7.3).** A Behavioral Path Query (III.1.6.1) from the Player node, filtered to Outcome nodes with type "retention," bounded at six hops (III.1.6.6), returns this path alongside any other paths reaching a retention Outcome from the same Player — a specialist agent evaluating "why is this player retained" receives the full set of contributing paths, not a single cherry-picked narrative, and the Ethics Layer's rationale-inspection tooling ([Volume II, Section II.2.2.4]) renders all of them for a human reviewer.

**Agent Interpretation of This Chain (III.1.7.4).** A specialist agent reasoning over this chain (per Part V, forward reference) does not conclude "add more housing customization options" as a mechanical output of the path's existence; the chain is evidence the agent weighs alongside Simulation forecasts (Volume IV, forward reference) and the Ethics Layer's manipulation-boundary test ([Volume I, Section I.5.1.3]) before a Recommendation is even proposed — a causal chain explaining why a mechanic retains players is not, by itself, ethical clearance to intensify that mechanic, and this worked example deliberately stops short of generating a recommendation to make that boundary visible rather than implied.

---

*End of Part III.1 — Knowledge Graph Schema.*

*Cross-References:* [Volume I, Section I.2.1.1] (Truth Over Assumptions), [Volume I, REQ-ETH-008] (Human-Readable Rationale), [Volume I, Section I.5.1.3] (Manipulation Boundary), [Volume II, Section II.2.1.5] (Knowledge Graph Construction pipeline stage), [Volume II, Section II.2.2] (Lineage and Provenance), [Volume II, Section II.3.4] (Knowledge Graph Storage), [Volume II, Section II.2.5] (Data Quality and Validation Gates), [Part III.2] (Psychology Corpus — forward reference), [Part III.4] (Embeddings — forward reference), [Part III.5] (Player Modeling — forward reference), [Part III.6] (Pattern Mining — forward reference), [Section III.7.2] (Causal Inference Bar — forward reference), [Volume IV] (Simulation — forward reference), [Volume V] (Agent Framework — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-GRAPH-001 through REQ-GRAPH-015.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 8, 2026

---

## Part III.2 — Psychology Corpus

Part III.2 is the largest single Part in this specification by content volume, and deliberately so: it is the platform's actual claim to domain expertise. Everything upstream of it (Part III.1's schema) is infrastructure for holding knowledge; everything downstream (Parts III.3–III.7, and the specialist agents in Volume V) is infrastructure for using it. This Part is the knowledge itself — eleven academic and applied domains (III.2.2–III.2.11), each contributing named, attributable theories that become Corpus Concept nodes (Section III.1.2, type #16) and, where a theory predicts a specific mechanism, the Motivated_By and Causes edges that give the platform's reasoning a citable foundation rather than an agent's unsupported assertion.

**A note on scope and treatment.** Given eleven domains and dozens of named theories, each domain below is treated as a catalog: theory name, its core claim in the platform's own words (not a verbatim reproduction of any source text), its originator(s) for attribution, and how it registers in the graph. This is deliberately more compressed than the paragraph-per-topic treatment in Parts II and III.1 — the governing behavior (how a theory becomes a Corpus Concept, how it's versioned, how it's cited) is specified once, normatively, in Sections III.2.1 and III.2.12, and is not restated for each of the theories that follow, per [Volume I, CONST-ONEHOME-001]. Given its size, this Part is being delivered across multiple sessions; this revision covers Sections III.2.1 through III.2.3.

### III.2.1 Corpus Architecture

**Corpus Structure Overview (III.2.1.1).** The Psychology Corpus is organized as a domain-partitioned knowledge base (eleven domains, Sections III.2.2–III.2.11), where each domain contains a set of Concepts — named theories, models, or empirical findings — each carrying attribution, a plain-language statement of its claim, its applicability conditions, and its mapping to Knowledge Graph constructs (Section III.2.12). The corpus is the platform's only source for Motivated_By and Corpus-sourced Causes edges (Section III.1.3); an agent MUST NOT assert a psychological mechanism that does not trace to a registered Corpus Concept, which is the specific mechanism that keeps agent reasoning grounded rather than freely associative.

**Domain Separation Model (III.2.1.2).** Domains are isolated namespaces — a Concept in Game Psychology (III.2.2) and a same-named Concept in Marketing Science (III.2.9) are distinct Corpus Concept nodes even if they describe overlapping phenomena, because the domain-swapping capability (Section III.2.13) depends on being able to remove or replace one domain's concepts without touching another's. Cross-domain references (a Game Design concept citing a Cognitive Science finding) are explicit edges (Belongs_To combined with a cross-reference property), not implicit shared identity.

**Corpus Versioning (III.2.1.3).** Every Corpus Concept is versioned independently; a concept's claim can be revised (new evidence, a refined applicability condition) without forcing a version bump across the entire corpus, and every graph edge sourced from a concept (Section III.2.12.1) references the specific concept version it was built from, so that a later corpus revision does not retroactively and silently change the meaning of an already-deployed Recommendation's rationale.

**Corpus Update and Contribution Process (III.2.1.4).** New concepts and revisions to existing ones enter through the Ethics Review Process for Corpus Updates already specified in [Volume I, Section I.5.3.3] — this Part supplies the content that process governs, not a competing governance path. A proposed addition requires: a citation to its source (III.2.1.5), a plain-language claim statement, and an explicit applicability boundary (where the theory does and does not hold), before it is eligible for review.

**Corpus Quality Metrics (III.2.1.5).** Each concept's quality is tracked along three dimensions: citation strength (peer-reviewed empirical source outranks a practitioner blog post, though both are permitted with their tier disclosed), replication status (a single-study finding is flagged distinctly from a well-replicated one), and applicability evidence (whether the platform's own telemetry has corroborated the theory's prediction in-domain, per the Causes-edge evidence bar in Section III.7.2) — a concept can be corpus-registered and citable while still being marked low-replication or not-yet-corroborated, because the corpus's job is to represent the state of knowledge honestly, not to only admit settled science.

- **REQ-CORPUS-001 (MUST):** An agent MUST NOT assert a psychological mechanism, motivation, or causal claim that does not trace to a registered Corpus Concept; unsupported psychological assertions are prohibited regardless of how plausible they appear.
- **REQ-CORPUS-002 (MUST):** Every Corpus Concept MUST carry a citation, a plain-language claim statement, and an explicit applicability boundary before it is eligible for use in graph construction.
- **REQ-CORPUS-003 (MUST):** Graph edges sourced from a Corpus Concept MUST reference the specific concept version used; a corpus revision MUST NOT retroactively alter the sourcing of an already-created edge.
- **REQ-CORPUS-004 (MUST):** Every Corpus Concept MUST disclose its citation-strength tier and replication status; the corpus MUST NOT present a single-study or practitioner-sourced claim with the same apparent authority as a well-replicated finding.

### III.2.2 Game Psychology Domain

**Player Motivation Theories — Bartle Taxonomy (III.2.2.1).** Richard Bartle's player-type model (1996) classifies players along two axes — acting vs. interacting, and players vs. world — yielding four archetypes: Achievers (goal- and completion-driven), Explorers (discovery-driven), Socializers (relationship-driven), and Killers (competition- and dominance-driven). Registers as four Corpus Concepts under a shared taxonomy parent, each supporting Motivated_By edges from Behavior nodes matching its pattern (e.g., completionist behavior → Achiever).

**Player Motivation Theories — Quantic Foundry Model (III.2.2.2).** A more granular, empirically-derived successor to Bartle (Yee & Nicoll's Gamer Motivation Model), organizing motivation across six paired dimensions (Action–Social, Mastery–Achievement, Immersion–Creativity) derived from large-scale survey factor analysis rather than a priori categories. Preferred over Bartle where the platform has sufficient survey or behavioral-proxy data to support the finer-grained model, per the applicability-boundary discipline in III.2.1.4.

**Flow Theory (Csikszentmihalyi) (III.2.2.3).** Mihaly Csikszentmihalyi's flow state (1990): optimal engagement occurs when perceived challenge and perceived skill are closely matched and both are elevated; too-easy content produces boredom, too-hard content produces anxiety. Directly informs difficulty-curve reasoning (Section III.2.6.3) and registers Causes-edge-eligible predictions (a specific challenge/skill mismatch pattern predicting a specific disengagement Behavior) when the platform's telemetry can measure both sides of the ratio.

**Game Engagement Models (III.2.2.4).** Composite frameworks (e.g., the Player Engagement Process model) describing engagement as a multi-stage funnel — initial engagement, extended engagement, habitual engagement — distinct from the single-session flow state in III.2.2.3; used where a Recommendation's time horizon spans multiple sessions rather than a single play session.

**Player Type Taxonomies (III.2.2.5).** Extends beyond Bartle/Quantic Foundry to domain-specific typologies (e.g., competitive-vs-casual segmentation in multiplayer titles); registered per-title as Domain Entity-linked concepts (Section III.1.2, type #17) where a taxonomy is game-specific rather than platform-generic.

**Game Addiction and Healthy Engagement (III.2.2.6).** Draws on clinical literature on problematic gaming (including WHO ICD-11's "gaming disorder" criteria: impaired control, increasing priority over other activities, continuation despite harm) to give the platform a Corpus-grounded basis for distinguishing healthy high engagement from harmful compulsive engagement — this concept is a direct input to the Manipulation Boundary's vulnerable-population protections ([Volume I, Section I.5.1.4]) and to any Recommendation touching engagement-frequency mechanics.

**Microtransaction Psychology (III.2.2.7).** Covers the psychological drivers of in-game purchase decisions distinct from general behavioral economics (III.2.3) — framing effects specific to virtual currency ("currency illusion," where spending feels less real when denominated in a purchased soft currency rather than real money), which is directly relevant to the Ethics Layer's Manipulation Risk dimension ([Volume I, Section I.5.2.3]) when a Recommendation touches monetization UI.

**Loot Box and Reward Schedule Research (III.2.2.8).** Covers the empirical literature on variable-ratio reward schedules in loot box mechanics, including research linking loot box engagement patterns to problem-gambling risk measures — this concept is cited directly by the canonical Manipulation Boundary violation example already named in [Volume I, Section I.5.1.3] (compulsion-tuned reward schedules), making this Corpus Concept the evidentiary anchor for that Volume I example rather than a free-floating citation.

**Social Dynamics in Games (III.2.2.9).** Covers game-specific social phenomena (guild formation, raid-team cohesion, PvP rivalry dynamics) distinct from the general Social Dynamics domain (III.2.7); provides the Motivated_By basis for Belonging-driven Behavior nodes in multiplayer contexts, as used in the worked example at Section III.1.7.

**Player Lifecycle Models (III.2.2.10).** Models of the player journey from onboarding through mastery to eventual churn or long-term retention (e.g., the New Player Experience → Core Loop Mastery → Endgame/Churn-Risk stages common in live-service game design); provides the temporal frame Outcome nodes (Section III.1.2, type #7) are typically evaluated against, since "retention" and "churn" are only meaningful relative to a lifecycle stage.

### III.2.3 Behavioral Economics Domain

**Prospect Theory and Loss Aversion (III.2.3.1).** Kahneman and Tversky's prospect theory (1979): people evaluate outcomes as gains or losses relative to a reference point, not in absolute terms, and losses loom larger than equivalent gains (loss aversion, typically observed at roughly a 2:1 psychological weighting). This is the corpus's single most load-bearing concept for monetization-adjacent reasoning, because loss-aversion-exploiting mechanics (engineered loss framing) are named explicitly as a canonical Manipulation Boundary violation in [Volume I, Section I.5.1.3] — any agent reasoning about a mechanic that frames a neutral outcome as a loss MUST cite this concept and route through the Manipulation Boundary test before proceeding.

**Endowment Effect (III.2.3.2).** Also from Kahneman, Knetsch, and Thaler's work: people ascribe more value to things merely because they own them. Directly cited in the worked causal-chain example (Section III.1.7.1) to explain housing/customization attachment, and generally applicable wherever a Recommendation reasons about player-owned virtual property (cosmetics, housing, collected items).

**Anchoring and Adjustment (III.2.3.3).** Tversky and Kahneman's finding that an initial reference value ("anchor") disproportionately influences subsequent numeric judgments, even when the anchor is arbitrary. Relevant to pricing-display reasoning (a "was $50, now $20" framing) and is a concept the Ethics Layer's Fairness dimension ([Volume I, Section I.5.2.3]) weighs when a Recommendation touches price presentation.

**Mental Accounting (III.2.3.4).** Richard Thaler's finding that people treat money differently depending on its subjective source or intended use, rather than as perfectly fungible — directly explains why virtual-currency purchases (III.2.2.7) feel psychologically distinct from equivalent real-money spending, connecting this domain's general theory to the game-specific mechanism in III.2.2.7 via an explicit cross-domain reference (Section III.2.1.2).

**Sunk Cost Fallacy (III.2.3.5).** The tendency to continue an endeavor because of previously invested resources (time, money, effort) rather than its current expected value. Relevant both descriptively (explaining why heavily-invested players resist abandoning a game even when satisfaction has dropped) and as a Manipulation Boundary concern when a mechanic is deliberately designed to increase sunk-cost lock-in rather than genuine engagement — the distinction between the two is exactly the kind of judgment call the Ethics Agent's rationale (per [Volume I, Section I.5.4.1]) has to make explicit rather than leave implicit.

**Hyperbolic Discounting (III.2.3.6).** The empirical finding that people discount the value of future rewards non-exponentially, over-weighting immediate rewards relative to delayed ones far more steeply than rational discounting would predict. Informs reward-timing reasoning (immediate vs. delayed gratification mechanics) and connects to the Fogg Behavior Model's prompt-timing component (III.2.4.3).

**Choice Architecture and Nudges (III.2.3.7).** Thaler and Sunstein's framework: how choices are presented (default options, ordering, framing) predictably influences decisions without restricting options. This concept is explicitly double-edged in the corpus's own framing: choice architecture is the general theory underlying both legitimate UX improvement (reducing decision friction the player would endorse) and dark-pattern design (friction engineered specifically to discourage an action the platform benefits from, such as cancellation) — which side of that line a specific application falls on is precisely what the Manipulation Boundary's informed-endorsement test ([Volume I, Section I.5.1.3]) is designed to adjudicate, and this concept is cited whenever that test is applied to a UI or flow-design Recommendation.

**Variable Reward Schedules (III.2.3.8).** B.F. Skinner's operant conditioning research on reinforcement schedules, specifically the finding that variable-ratio schedules (unpredictable reward timing/magnitude) produce more persistent behavior than fixed schedules — the general behavioral-science foundation underlying the game-specific loot box research in III.2.2.8, related via cross-domain reference.

**Spending Triggers and Friction (III.2.3.9).** Covers the applied literature on what increases versus decreases the likelihood of a purchase decision at the point of decision (time pressure, scarcity framing, social proof, one-click reduction of purchase friction) — each specific trigger registers as its own sub-concept so that an agent's rationale can cite the specific mechanism (e.g., "scarcity framing" rather than "spending triggers" generally), consistent with the specificity the human-readable-rationale requirement ([Volume I, REQ-ETH-008]) calls for.

### III.2.4 Motivation Theory Domain

**Self-Determination Theory (III.2.4.1).** Deci and Ryan's framework: three innate psychological needs — autonomy (sense of volition and choice), competence (sense of mastery and effectiveness), and relatedness (sense of connection to others) — whose satisfaction predicts intrinsic motivation and wellbeing, and whose frustration predicts disengagement or purely controlled, externally-driven motivation. Already the concept cited in the worked causal-chain example (Section III.1.7.1) to explain ownership/autonomy motivation, and one of the corpus's most frequently cross-referenced concepts across other domains.

**Maslow's Hierarchy Applied to Digital Experiences (III.2.4.2).** Abraham Maslow's needs hierarchy (physiological, safety, belonging, esteem, self-actualization), adapted to digital contexts (safety as fair, non-exploitative systems; belonging as social features; esteem as status and achievement systems; self-actualization as mastery and creative expression). Per the honesty requirement in Section III.2.1.5, this concept is corpus-flagged with a lower citation-strength and replication-status tier than most others in this domain — the strict hierarchical/prepotency claim in Maslow's original theory has limited direct empirical support, and this concept is retained as an organizing heuristic for categorizing recommendation types, not as a validated causal model an agent may cite as strong evidence.

**Fogg Behavior Model — B=MAP (III.2.4.3).** BJ Fogg's model: a behavior occurs when Motivation, Ability, and a Prompt converge above a joint threshold at the same moment; a well-timed prompt can trigger low-ability-required behavior even at modest motivation, while high-effort behavior requires correspondingly higher motivation. Directly informs onboarding design reasoning (Section III.2.6.4) and prompt-timing reasoning generally.

**Habit Formation — Hook Model (III.2.4.4).** Nir Eyal's four-phase loop: Trigger (external or internal), Action, Variable Reward, Investment, repeating to build habitual product engagement. This concept carries an explicit corpus annotation: the Hook Model is, by its author's own subsequent public reflection, as much a description of how habit-forming products can become compulsive as it is a design guide, and any agent citing it to justify a Recommendation MUST route that Recommendation through the Manipulation Boundary test ([Volume I, Section I.5.1.3]) rather than treating "increases habit strength" as self-evidently a positive outcome — this is the corpus's second explicit anchor (alongside loot box research, Section III.2.2.8) to a Volume I ethics mechanism, made explicit here rather than left for an agent to infer.

**Goal-Setting Theory (III.2.4.5).** Locke and Latham's finding that specific, challenging goals paired with feedback produce higher performance than vague ("do your best") or easy goals. Directly informs quest and objective design reasoning (Section III.2.6.6).

**Expectancy Theory (III.2.4.6).** Victor Vroom's model: motivation is a function of Expectancy (belief that effort leads to performance), Instrumentality (belief that performance leads to outcome), and Valence (subjective value of the outcome), combining multiplicatively — a zero on any factor predicts near-zero motivation regardless of the other two. Used in reward-system design reasoning where the platform models a player's subjective expected-value calculation for a given effort/reward structure.

**Intrinsic vs. Extrinsic Motivation (III.2.4.7).** The foundational distinction (Deci and Ryan) between behavior performed for its own inherent satisfaction (intrinsic) versus behavior performed for a separable outcome or reward (extrinsic). The corpus uses this distinction to classify every Motivation node (Section III.1.2, type #4) as intrinsic- or extrinsic-sourced, which matters directly for III.2.4.8 below.

**Motivational Crowding Out (III.2.4.8).** The empirical finding (Deci, Koestner, and Ryan's meta-analytic work, among others) that adding extrinsic rewards to an activity can undermine pre-existing intrinsic motivation for that same activity (the "over-justification effect"). This is one of the corpus's most directly ethics-actionable concepts: a Recommendation that adds extrinsic rewards (currency, points) to a mechanic players already engaged with intrinsically could increase short-term engagement metrics while degrading long-term engagement quality — precisely the Retention-versus-Long-Term-Trust tension the Ethics Score's seven dimensions ([Volume I, Section I.5.2.3]) are structured to catch rather than let a single improved metric mask.

### III.2.5 Cognitive Science Domain

**Cognitive Load Theory (III.2.5.1).** John Sweller's framework: working memory has sharply limited capacity, and instructional or interface design should manage intrinsic load (inherent task complexity), extraneous load (poor presentation adding unnecessary complexity), and germane load (effort that builds useful mental schemas) separately. Directly informs onboarding design (Section III.2.6.4) and interface-complexity reasoning generally (cross-referenced from UX Research, Section III.2.8.2).

**Attention and Information Processing (III.2.5.2).** Covers selective-attention research and dual-process theory (Kahneman's System 1 — fast, automatic, intuitive — versus System 2 — slow, effortful, deliberate). Informs reasoning about what a player is likely to actually notice and process at a given interface moment, which is directly relevant to whether a disclosure genuinely achieves the informed-consent standard ([Volume I, Section I.5.1.5]) or is technically present but practically invisible under System-1 processing.

**Decision-Making Heuristics (III.2.5.3).** The general heuristics-and-biases research program (Tversky and Kahneman) underlying the specific behavioral-economics biases catalogued in Section III.2.3 — this concept is the domain-level umbrella; Section III.2.3's entries are treated as its game-and-economic applications, connected by explicit cross-domain reference per Section III.2.1.2.

**Memory and Learning in Game Contexts (III.2.5.4).** Covers spaced-repetition and testing-effect research (building on Ebbinghaus's forgetting-curve work) as applied to skill and knowledge retention in games — the cognitive-science foundation for the applied spaced-repetition entry in the Education domain (Section III.2.10.1), connected by cross-domain reference.

**Cognitive Biases Catalog (III.2.5.5).** A registered catalog of biases beyond those already covered under Behavioral Economics (Section III.2.3) — including confirmation bias, illusion of control, and gambler's fallacy, the last of which is directly relevant to any Recommendation touching gambling-adjacent mechanics (cross-referenced with loot box research, Section III.2.2.8). Each bias is registered as its own sub-concept, per the citation-specificity discipline already established in Section III.2.3.9.

**Expertise Development and Skill Acquisition (III.2.5.6).** Covers deliberate-practice research (Anders Ericsson) and stage-based skill-acquisition models (the classic cognitive–associative–autonomous progression), informing mastery-curve and progression-pacing reasoning (Sections III.2.5.6 connects directly to III.2.2.3 Flow Theory and III.2.6.3 Difficulty Curves).

**Mental Models (III.2.5.7).** Don Norman's conceptual-model research: players build internal representations of how a game's systems work, and the gap between a player's mental model and the system's actual behavior is a primary source of confusion and frustration. Informs interface-clarity reasoning in the UX Research domain (Section III.2.8).

### III.2.6 Game Design Domain

**MDA Framework (III.2.6.1).** Hunicke, LeBlanc, and Zubek's foundational game-design framework (2004): Mechanics (the rules and systems a designer builds) produce Dynamics (the run-time behavior those rules generate in play) which produce Aesthetics (the emotional response a player experiences) — read designer-to-player as Mechanics→Dynamics→Aesthetics, and player-to-designer in reverse. This concept is called out explicitly because it is the corpus concept that directly justifies the Knowledge Graph's own node-type separation (Section III.1.2): Mechanic, Behavior, and Emotion nodes are not an arbitrary schema choice, they are MDA's three layers made queryable.

**Game Feel and Juice (III.2.6.2).** Steve Swink's game-feel framework: the moment-to-moment tactile and kinesthetic responsiveness of interaction — input latency, feedback timing, animation polish ("juice"). Distinct from the higher-level motivational concepts elsewhere in the corpus, and applicable to a narrower slice of Recommendation types (interaction-polish and feel-tuning recommendations) than most other concepts in this Part.

**Difficulty Curves and Pacing (III.2.6.3).** Applies Flow Theory (Section III.2.2.3) concretely to content sequencing — how challenge should ramp across a game's length, including established patterns such as the sawtooth curve (alternating rising tension with deliberate relief points). Directly informs Simulation Engine forecasting of difficulty-adjustment Recommendations (Volume IV, forward reference).

**Onboarding Design Principles (III.2.6.4).** Applies Cognitive Load Theory (Section III.2.5.1) and the Fogg Behavior Model (Section III.2.4.3) to first-time-user-experience design — progressive disclosure and deliberate minimization of extraneous load in early tutorial sequences, where a confused new player is at the highest risk of churning before the platform has gathered enough telemetry to model them well.

**Economy Design Principles (III.2.6.5).** Covers game-economy-specific design literature — the faucets-and-sinks framework for currency flow, inflation control, and economic balance — directly informing the Economy node type (Section III.1.2, type #6) and Influences edges (Section III.1.3, type #5).

**Progression Systems (III.2.6.6).** Covers design patterns for player advancement (leveling curves, skill trees, unlock pacing), synthesizing Goal-Setting Theory (Section III.2.4.5) and Expertise Development research (Section III.2.5.6) into concrete, implementable design patterns.

**Social System Design (III.2.6.7).** Covers design patterns for multiplayer social features (guilds, matchmaking, cooperative and competitive balance), connecting Social Identity Theory (Section III.2.7.1, forward reference within this Part) and the game-specific Social Dynamics entry (Section III.2.2.9).

**Content Scaling (III.2.6.8).** Covers design literature on scaling content difficulty and volume to player skill and engagement level dynamically — dynamic difficulty adjustment and pacing-oriented procedural content generation — a direct input to the Simulation Engine's parameter space (Volume IV, forward reference).

---

### III.2.7 Social Dynamics Domain

**Social Identity Theory (III.2.7.1).** Tajfel and Turner's finding that people derive part of their self-concept from group memberships, producing in-group favoritism and out-group differentiation even under minimal-group conditions where the group itself is arbitrary. Already the concept cited in the worked causal-chain example (Section III.1.7.1) explaining Belonging as a motivation for guild and community engagement.

**Group Formation and Cohesion (III.2.7.2).** Covers group-development research (Tuckman's forming–storming–norming–performing stages) and cohesion literature, informing guild and team-formation mechanic design in coordination with Social System Design (Section III.2.6.7).

**Social Proof and Conformity (III.2.7.3).** Cialdini's social-proof principle and the classic conformity literature (Asch): people use others' observed behavior as a guide for their own, especially under uncertainty. Like Choice Architecture (Section III.2.3.7), this concept is explicitly double-edged in the corpus's framing — legitimately helping players discover popular or high-quality content versus fabricating or exaggerating popularity signals to manufacture false urgency, the latter of which is named directly among the canonical Manipulation Boundary violations in [Volume I, Section I.5.1.3] (manufactured social pressure).

**Reputation Systems (III.2.7.4).** Covers the design and psychology literature on trust and reputation mechanisms (peer-rating systems, skill-ranking systems), informing reputation-system design in coordination with Section III.2.6.7 and connecting to the Fairness ethics dimension ([Volume I, Section I.5.2.3]) wherever a reputation system is exploitable through coordinated gaming.

**Cooperation and Competition Dynamics (III.2.7.5).** Covers social-psychology research on cooperation (including Axelrod's work on the evolution of cooperation in repeated social dilemmas) as applied to multiplayer design, informing PvP/PvE balance and cooperative-mechanic reasoning.

**Community Lifecycle (III.2.7.6).** Covers online-community lifecycle research (birth, growth, maturity, decline stages, distinct from the individual-level Player Lifecycle Models in Section III.2.2.10) — relevant to Recommendations reasoning about community health across a live-service game's full lifespan rather than a single player's trajectory.

**Toxicity and Moderation Psychology (III.2.7.7).** Covers research on online disinhibition and harassment (including Suler's work on why people behave differently online) and moderation-intervention effectiveness research. This concept feeds directly into player-safety reasoning for any Recommendation touching chat or community-moderation systems — a distinct concern from, but related to, the vulnerable-population protections in [Volume I, Section I.5.1.4].

### III.2.8 UX Research Domain

**Usability Heuristics (III.2.8.1).** Jakob Nielsen's ten usability heuristics (visibility of system status, match between system and the real world, user control and freedom, consistency and standards, error prevention, recognition over recall, flexibility and efficiency of use, aesthetic and minimalist design, helping users recognize and recover from errors, help and documentation) — the foundational evaluation framework the corpus uses to assess interface quality for any Recommendation touching UI.

**Friction and Cognitive Load in UI (III.2.8.2).** Applies Cognitive Load Theory (Section III.2.5.1) specifically to interface friction — the number of steps, clicks, or decisions a task requires. The corpus uses this concept to name a specific, checkable asymmetry: friction reduced on a purchase flow while left unreduced (or deliberately increased) on the corresponding cancellation or refund flow is a pattern this concept flags for Manipulation Boundary review, because the asymmetry itself — not friction in isolation — is the signal of a boundary concern.

**Onboarding Effectiveness Patterns (III.2.8.3).** Applied UX research methodology (funnel analysis, comprehension testing) for measuring and improving first-time-user-experience completion and comprehension rates — operationalizes the design principles in Section III.2.6.4 with measurable evaluation methodology rather than design guidance alone.

**Accessibility in Behavioral Context (III.2.8.4).** Covers how accessibility accommodations (screen-reader use, alternative input methods, extended-time settings) produce interaction patterns that a naive behavioral model could misclassify as disengagement or confusion rather than correctly recognizing as an accessibility accommodation. This concept exists specifically to prevent that misclassification: a behavioral model penalizing or down-scoring an accessibility-driven interaction pattern is a Fairness-dimension concern ([Volume I, Section I.5.2.3]), and Player Modeling (Part III.5, forward reference) is required to account for it rather than treat all players' interaction patterns as drawn from one undifferentiated distribution.

**Information Scent and Navigation (III.2.8.5).** Pirolli and Card's information-foraging theory: users navigate based on cues ("scent") suggesting where valuable information or content lies, following the strongest available scent even when it leads away from their actual goal if the cues are misleading. Informs navigation and content-discovery design reasoning.

### III.2.9 Marketing Science Domain

**Customer Lifetime Value Models (III.2.9.1).** Standard CLV modeling literature (cohort-based and predictive LTV models), directly informing how spend-related Outcome nodes (Section III.1.2, type #7) are evaluated and connecting to the forecast-versus-actual comparison in Feedback Loop Closure ([Volume II, Section II.2.1.13]).

**Churn Prediction Theory (III.2.9.2).** Covers survival-analysis and churn-prediction modeling literature (proportional-hazards models, cohort retention-curve analysis) — the applied-marketing counterpart to the Player Lifecycle Models in Section III.2.2.10, informing the specific predictive-modeling methodology Player Modeling (Part III.5, forward reference) uses for churn scores.

**Segmentation Methodologies (III.2.9.3).** Covers player and customer segmentation methodology (RFM — recency, frequency, monetary — segmentation, and behavioral clustering approaches), directly informing how Player nodes are grouped for cohort-level analysis and Recommendation targeting.

**Conversion Funnel Psychology (III.2.9.4).** Covers the psychology of multi-step conversion funnels (classic awareness–interest–desire–action models and modern funnel-drop-off research) — a canonical applied instance of Choice Architecture (Section III.2.3.7), cross-referenced accordingly, and informing any Recommendation touching a multi-step monetization or conversion flow.

**Brand Attachment and Loyalty (III.2.9.5).** Covers brand-psychology and parasocial-attachment-to-product research, informing long-term loyalty reasoning distinct from mechanic-level engagement — a player can be behaviorally disengaged from daily play while remaining brand-loyal, a distinction that matters directly for win-back Recommendation reasoning, which targets loyalty rather than trying to recreate daily-engagement pressure.

---

### III.2.10 Education Domain

**Spaced Repetition and Learning Curves (III.2.10.1).** Builds on the Ebbinghaus forgetting-curve foundation and modern spaced-repetition scheduling research (Bjork's "desirable difficulties" work included), applying the general memory research in Section III.2.5.4 specifically to scheduling tutorial reinforcement and skill-check timing.

**Gamification of Learning (III.2.10.2).** Covers research on applying game mechanics (points, badges, leaderboards) to educational contexts, including the cautionary finding — directly cross-referenced to Motivational Crowding Out (Section III.2.4.8) — that poorly designed extrinsic gamification layers can undermine the intrinsic motivation to learn they were meant to support. Primary relevance shifts to central when the corpus is swapped into the EdTech vertical (Section III.2.13.4.c).

**Mastery Learning Principles (III.2.10.3).** Benjamin Bloom's mastery-learning framework: learners should demonstrate mastery of a unit before advancing, with individualized pacing rather than fixed time-based progression. Informs progression-gating design reasoning in coordination with Progression Systems (Section III.2.6.6).

**Motivation in Educational Contexts (III.2.10.4).** Applies Self-Determination Theory (Section III.2.4.1) and Expectancy Theory (Section III.2.4.6) specifically to learning contexts, covering academic-motivation research distinct from general product engagement — relevant both to games with explicit skill-building content and, more centrally, to an EdTech deployment of this corpus.

### III.2.11 Decision Theory Domain

**Rational Choice Models (III.2.11.1).** The classical rational-choice and expected-utility framework (von Neumann–Morgenstern) — retained in the corpus specifically as the normative baseline that Prospect Theory (Section III.2.3.1) and the rest of behavioral economics are explicit, evidenced departures from; a Corpus Concept's applicability boundary (Section III.2.1.4) for a behavioral-economics finding is stated relative to this baseline.

**Bounded Rationality (III.2.11.2).** Herbert Simon's foundational concept: people "satisfice" rather than optimize, constrained by limited cognitive resources, information, and time. The general theoretical umbrella connecting the heuristics-and-biases research in Section III.2.5.3 to most of the Behavioral Economics domain (Section III.2.3), cited whenever an agent needs to explain *why* a departure from rational choice (III.2.11.1) is expected rather than anomalous.

**Multi-Criteria Decision Making (III.2.11.3).** Covers formal MCDM methodology (weighted scoring models, the analytic hierarchy process). This concept is called out explicitly because it is the decision-theoretic foundation for the Ethics Score's own seven-dimension, non-averaging structure ([Volume I, Section I.5.2.3]): a veto-dimension architecture, where no amount of strength on other criteria can compensate for failing one, is a well-established MCDM pattern (a "conjunctive" or lexicographic decision rule), not an arbitrary design choice — this Corpus Concept is the citable grounding for that structural decision.

**Sequential Decision Making (III.2.11.4).** Covers Markov Decision Process framing and sequential-choice research, relevant to Simulation Engine persona forecasting (Volume IV, forward reference) because player behavior across a session or a game's full lifetime is inherently a sequence of interdependent decisions, not a single-shot choice each Outcome node can be evaluated against in isolation.

**Risk Perception and Decision Making (III.2.11.5).** Covers subjective risk-perception research, building on Prospect Theory's probability-weighting function (Section III.2.3.1), informing reasoning about how players perceive risk/reward mechanics (gambling-adjacent systems, competitive stakes) differently from their objective odds — directly connected to the gambler's-fallacy entry in the Cognitive Biases Catalog (Section III.2.5.5).

### III.2.12 Corpus-to-Graph Mapping

Section III.2.12 is the concrete technical bridge from this Part's prose theories to Part III.1's schema — the mechanism, not yet specified until now, by which a Corpus Concept actually becomes queryable graph structure.

**How Corpus Knowledge Becomes Graph Nodes/Edges (III.2.12.1).** A Corpus Concept, once registered (III.2.12.2), is instantiated as a Corpus Concept node (Section III.1.2, type #16) the first time it is cited by an extraction or agent process. Each concept carries a template defining which edge types it can support and under what feature pattern — for example, Prospect Theory's loss-aversion template predicts a Motivated_By edge whenever a specific loss-framing feature pattern is observed in a Behavior node — and it is this template, not free-form agent judgment, that determines which edges a concept is eligible to produce.

**Corpus Concept Registration (III.2.12.2).** Extends the update process in Section III.2.1.4 with the formal technical registration step: a concept must be registered with its complete metadata (claim statement, applicability boundary, citation, domain assignment, edge templates) before any graph-construction process may reference it — enforced by the same type-closure discipline [Volume III, REQ-GRAPH-001–002] already apply to nodes and edges generally, extended here to the corpus layer that feeds them.

**Corpus Domain Isolation and Cross-Domain References (III.2.12.3).** Formalizes the domain separation stated in Section III.2.1.2 at the graph layer: a Belongs_To edge (Section III.1.3, type #14) links every Corpus Concept node to exactly one owning domain, and cross-domain references (used throughout this Part — for example, III.2.2.7 Microtransaction Psychology referencing III.2.3.4 Mental Accounting) are stored as an explicit, queryable cross-reference property rather than an implicit textual mention, so that the domain-swap process (Section III.2.13) can programmatically enumerate every cross-domain dependency before a domain is removed.

**Corpus Evidence and Citation Tracking (III.2.12.4).** Every concept's citation (required by Section III.2.1.2) is stored as structured metadata — source type, author, year, citation-strength tier, and replication status (Section III.2.1.5) — not as unstructured prose, so that the Ethics Layer's rationale-inspection tooling ([Volume II, Section II.2.2.4]) can render a concept's actual evidentiary basis to a human reviewer directly, rather than the reviewer having to take a citation's authority on faith.

- **REQ-CORPUS-005 (MUST):** A Corpus Concept MUST be fully registered per III.2.12.2's metadata requirements before any graph-construction process references it; an unregistered concept MUST NOT produce a graph node or edge.
- **REQ-CORPUS-006 (MUST):** Every Corpus Concept node MUST carry a Belongs_To edge to exactly one domain; cross-domain reliance MUST be recorded as an explicit, queryable property, not an implicit textual reference.
- **REQ-CORPUS-007 (MUST):** Citation metadata (source, author, year, citation-strength tier, replication status) MUST be stored as structured, queryable fields, not free-text alone.
- **REQ-CORPUS-008 (MUST):** An edge produced from a Corpus Concept MUST conform to one of that concept's declared edge templates (III.2.12.1); an agent MUST NOT produce an edge from a concept in a pattern the concept's template does not define.

### III.2.13 Domain-Agnostic Corpus Swapping

Section III.2.13 specifies the mechanism behind one of Volume I's original strategic claims: that the platform's behavioral-reasoning architecture generalizes beyond games. This Section is what makes that claim checkable rather than aspirational — a corpus swap either satisfies the interface below or it doesn't.

**Corpus Interface Specification (III.2.13.1).** Any replacement corpus — whether a wholesale swap or an additional domain alongside the eleven specified in this Part — MUST implement: the concept registration schema (Section III.2.1.1, III.2.12.2), the citation and quality-metrics schema (Sections III.2.1.5, III.2.12.4), and the domain-isolation boundary (Sections III.2.1.2, III.2.12.3). A corpus satisfying this interface is swappable by construction; a corpus that does not is not a PsyForge-compatible corpus regardless of its content quality.

**Swapping Process (III.2.13.2).** Swapping proceeds: register the new domain's concepts (III.2.12.2) alongside or in place of an existing domain; run Graph Consistency Validation (Section III.1.5.6) to confirm no live edge references a concept being removed without an explicit historical-retention decision; and re-score, per the Modified-state re-scoring requirement already established in [Volume II, REQ-FLOW-012], any in-flight Recommendation whose rationale cited a concept the swap removes, before that Recommendation may proceed toward Approved.

**Validation After Swap (III.2.13.3).** Post-swap validation confirms that no Causes or Motivated_By edge in the live graph references a concept outside the currently active domain set (unless retained under the temporal-edge/superseded pattern, Section III.1.4.4, for audit purposes) and that the Ethics Layer's citation-inspection tooling (III.2.12.4) resolves cleanly against the new corpus — a swap that leaves any Recommendation's rationale citing a concept that no longer exists has failed validation and MUST be rolled back per [Volume II, Section II.8.2.7]'s Saga-pattern compensating-action discipline.

**Supported Corpus Markets (III.2.13.4).** Six markets were named in the platform's original vision (cross-referencing FirstSteps.md and the Master TOC's own outline). Three are substantially covered by domains already specified in this Part; three would require new domain content this specification does not yet provide, and are named honestly as gaps rather than papered over with fabricated theory catalogs, per the same evidence discipline this entire Part has followed throughout:

- **III.2.13.4.a Game Psychology → Game Studios.** The corpus as specified in this Part (III.2.2–III.2.11 in full). No swap required — this is the shipping configuration.
- **III.2.13.4.b Consumer Psychology → Marketing Agencies.** Substantially reuses Behavioral Economics (III.2.3), Marketing Science (III.2.9), and Decision Theory (III.2.11) largely as specified; Game Psychology (III.2.2) and Game Design (III.2.6) would be removed via the swap process (III.2.13.2), and a Consumer Psychology domain (retail and advertising-specific findings not covered by the eleven domains here) would need to be registered as new content.
- **III.2.13.4.c Education Psychology → EdTech.** The Education domain (III.2.10) becomes primary; Cognitive Science (III.2.5) is retained near-fully; game-specific domains (III.2.2, III.2.6) are removed.
- **III.2.13.4.d Workplace Psychology → HR & Training.** **Not yet supported by any domain in this Part.** Organizational psychology (job satisfaction theory, workplace motivation research distinct from III.2.4's general motivation theories, team-performance research) is not currently registered corpus content; this market requires a new domain registration before it is viable, flagged here rather than assumed.
- **III.2.13.4.e Healthcare Engagement → Digital Health.** **Not yet supported by any domain in this Part.** Health-behavior-change theory (the Transtheoretical Model / Stages of Change, health belief models) is not currently registered corpus content; this market likewise requires new domain registration, and — given the elevated stakes of health-context manipulation risk — would additionally require an extension to the Ethics Framework's vulnerable-population protections ([Volume I, Section I.5.1.4]) before deployment, not merely a corpus swap.
- **III.2.13.4.f Financial Behavior → FinTech.** Substantially reuses Behavioral Economics (III.2.3, particularly Prospect Theory and Hyperbolic Discounting) and Decision Theory (III.2.11) with minimal modification; Marketing Science's CLV and segmentation concepts (III.2.9.1, III.2.9.3) also transfer directly. The closest of the three unsupported markets to being swap-ready, though a Financial Behavior domain proper (research specific to saving, debt, and investment decision-making) is still not registered content.

- **REQ-CORPUS-009 (MUST):** A replacement or additional corpus MUST implement the full Corpus Interface Specification (III.2.13.1) before it is eligible for use in production.
- **REQ-CORPUS-010 (MUST):** A corpus swap MUST re-score every in-flight Recommendation whose rationale cites a concept the swap removes before that Recommendation may advance toward Approved.
- **REQ-CORPUS-011 (MUST):** Post-swap validation (III.2.13.3) MUST run before a swap is considered complete; a swap leaving an orphaned concept reference MUST be rolled back.
- **REQ-CORPUS-012 (MUST):** A market listed in III.2.13.4 without a corresponding registered domain MUST NOT be represented as currently supported in any product or sales communication; "supported" requires the domain to actually be registered per III.2.12.2, not merely named in this table.

---

*End of Part III.2 — Psychology Corpus.*

*Cross-References:* [Volume I, Section I.5.1.3] (Manipulation Boundary), [Volume I, Section I.5.1.4] (Vulnerable Population Protections), [Volume I, Section I.5.1.5] (Informed Consent), [Volume I, Section I.5.2.3] (Ethics Scoring Dimensions), [Volume I, Section I.5.3.3] (Ethics Review Process for Corpus Updates), [Volume I, REQ-ETH-008] (Human-Readable Rationale), [Volume II, Section II.2.1.13] (Feedback Loop Closure), [Volume II, REQ-FLOW-012] (Modified-State Re-Scoring), [Volume II, Section II.8.2.7] (Saga Pattern), [Part III.1] (Knowledge Graph Schema), [Part III.5] (Player Modeling — forward reference), [Volume IV] (Simulation — forward reference), [FirstSteps.md] (original corpus-market vision), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-CORPUS-001 through REQ-CORPUS-012.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 8, 2026

---

## Part III.3 — Feature Engineering Pipeline

Part III.3 specifies the layer between raw telemetry and everything this Volume reasons over: the Behavioral Feature Engine first named as a component in [Volume II, Section II.1.1.1] and specified as a pipeline stage in [Volume II, Section II.2.1.3], now specified as its own architecture — what a feature actually is, the twenty-five-feature catalog the platform ships with, how features are computed, how they're validated before anything downstream is allowed to trust them, and how they're assembled into the vectors that feed embeddings (Part III.4) and player models (Part III.5).

### III.3.1 Feature Engine Overview

**Purpose: Transform Raw Telemetry into Higher-Level Signals (III.3.1.1).** A raw event ("player opened inventory at 14:32:07") carries almost no interpretive value alone; a feature ("this player's average decision time across the last 50 inventory interactions") is a computed, often windowed aggregation that carries the interpretive weight raw events don't — this Part specifies how that transformation happens for the platform's twenty-five shipped features and how a studio or future domain adds new ones.

**Feature Engine as Intellectual Property (III.3.1.2).** The Psychology Corpus (Part III.2) is citable, public behavioral science — its value is in synthesis and application, not in the underlying theories, which anyone can read in the cited sources. The Feature Engine's specific computation logic — the exact windowing, aggregation, and normalization that turns raw telemetry into a numeric "Risk Tolerance" or "Purchase Friction" score — is where the platform's proprietary interpretive layer actually lives, and is treated accordingly under the IP and invention hygiene discipline this specification's own governing framework applies to novel technical work.

**Feature vs. Raw Event Distinction (III.3.1.3).** Formalizes the distinction already implicit in the epistemic-tier requirement ([Volume I, REQ-PHI-001]): a raw Event node (Section III.1.2, type #11) is an observed-tier fact; a Feature node (type #9) is, except in the narrowest single-count cases, an inferred-tier aggregation, and carries the confidence and provenance properties (Section III.1.4.1, III.1.4.5) that distinction requires.

**Feature Lifecycle (III.3.1.4).** Every feature moves through four states — Proposed (defined, not yet computed against real data), Experimental (computed and running, not yet trusted for production reasoning), Production (validated per Section III.3.4 and eligible for use by agents and models), Deprecated (superseded or retired, retained per the archival discipline in [Volume II, Section II.3.3.4] rather than deleted) — mirroring the Recommendation lifecycle's discipline ([Volume II, Section II.2.6.2]) that nothing reaches production trust without passing an explicit gate.

- **REQ-FEAT-001 (MUST):** A feature MUST NOT be consumed by agent reasoning, Player Modeling, or Simulation input while in the Proposed or Experimental state; only Production-state features are eligible.
- **REQ-FEAT-002 (MUST):** A Deprecated feature's historical values MUST remain queryable; deprecation MUST NOT delete prior computed values a historical Recommendation's rationale may reference.

### III.3.2 Feature Catalog

Twenty-five features ship with the platform's initial configuration. Each is defined narrowly enough to be independently computable and independently validated (Section III.3.4); several map directly to Self-Determination Theory's three needs (Section III.2.4.1) and other Corpus Concepts, made explicit in the table's basis column rather than left as a coincidental resemblance.

| # | Feature | Definition | Corpus / Theory Basis | Primary Use |
|---|---|---|---|---|
| 1 | Average Decision Time | Mean latency between options presented and a choice made | Decision-Making Heuristics (III.2.5.3) | Cognitive engagement, difficulty tuning |
| 2 | Exploration Preference | Ratio of novel- vs. known-option selection | Novelty Seeking research | Content-discovery reasoning |
| 3 | Risk Tolerance | Propensity to select higher-variance options when available | Risk Perception (III.2.11.5) | Stakes/gambling-adjacent mechanic reasoning |
| 4 | Novelty Seeking | Engagement frequency with newly introduced vs. established content | Exploration/novelty literature | Content-release pacing |
| 5 | Social Dependency | Correlation of session initiation with friends' online presence | Social Dependency, Relatedness (SDT) | Social-feature reasoning |
| 6 | Goal Persistence | Continuation rate after setback vs. abandonment | Goal-Setting Theory (III.2.4.5) | Difficulty/frustration reasoning |
| 7 | Purchase Friction | Measured hesitation/step-count before purchase completion | Friction and Cognitive Load in UI (III.2.8.2) | Monetization UX, Manipulation Boundary review |
| 8 | Recovery From Failure | Behavior pattern following a failure event (retry/adjust/quit) | Frustration Tolerance research | Difficulty curve reasoning |
| 9 | Session Fatigue | Within-session performance/engagement decay over duration | Cognitive Load Theory (III.2.5.1) | Session-length and pacing reasoning |
| 10 | Flow Stability | Consistency of challenge–skill balance over time | Flow Theory (III.2.2.3) | Difficulty-curve tuning |
| 11 | Engagement Breadth | Number of distinct systems regularly engaged vs. narrow focus | Engagement models (III.2.2.4) | Cross-system recommendation targeting |
| 12 | Mastery Progression Rate | Speed of skill/competence growth over time | Expertise Development (III.2.5.6) | Progression-pacing reasoning |
| 13 | Social Influence Susceptibility | Behavior change following exposure to social-proof signals | Social Proof and Conformity (III.2.7.3) | Manipulation Boundary review for social UI |
| 14 | Content Velocity Preference | Preferred pace of new-content consumption | Player Lifecycle Models (III.2.2.10) | Content-release cadence reasoning |
| 15 | Economic Rationality Index | Alignment of in-game economic decisions with expected-value maximization | Rational Choice vs. Prospect Theory (III.2.11.1, III.2.3.1) | Economy design reasoning |
| 16 | Frustration Tolerance | Threshold at which negative-affect behavior patterns emerge | Frustration/Recovery research | Difficulty and pacing reasoning |
| 17 | Habitual vs. Exploratory Ratio | Proportion of session time in routine loops vs. novel exploration | Habit Formation (III.2.4.4) | Engagement-quality assessment |
| 18 | Long-Term vs. Short-Term Orientation | Behavioral preference for delayed vs. immediate reward | Hyperbolic Discounting (III.2.3.6) | Reward-timing reasoning |
| 19 | Autonomy Preference | Preference for self-directed vs. guided/structured content | Self-Determination Theory (III.2.4.1) | Content-structure reasoning |
| 20 | Competence Seeking | Frequency of engaging with mastery-demonstrating content | Self-Determination Theory (III.2.4.1) | Progression/mastery reasoning |
| 21 | Relatedness Seeking | Frequency and intensity of connection-oriented behavior | Self-Determination Theory (III.2.4.1) | Social-feature reasoning |
| 22 | Reward Sensitivity | Behavioral responsiveness to reward delivery | Variable Reward Schedules (III.2.3.8) | Reward-system design reasoning |
| 23 | Loss Sensitivity | Behavioral responsiveness to loss-framed events | Prospect Theory / Loss Aversion (III.2.3.1) | Manipulation Boundary review for loss framing |
| 24 | Novelty Reward vs. Familiarity Comfort | Balance between novelty-seeking and comfort in familiar patterns | Novelty Seeking, Habit Formation | Content-mix reasoning |
| 25 | Session Regularity | Consistency and predictability of session timing/cadence | Player Lifecycle Models (III.2.2.10) | Churn-risk and re-engagement reasoning |

- **REQ-FEAT-003 (MUST):** Every feature in this catalog MUST be traceable to a defined computation (Section III.3.3.1) and, where a corpus basis is listed, MUST cite the specific Corpus Concept rather than the domain generally.
- **REQ-FEAT-004 (MUST):** A new feature proposed beyond this catalog MUST enter at the Proposed lifecycle state (Section III.3.1.4) and MUST NOT skip directly to Production.

### III.3.3 Feature Extraction Architecture

**Feature Definition Language / DSL (III.3.3.1).** Each feature is declared, not hand-coded — a domain-specific declarative language specifies the input event or feature types, the aggregation function, the window (Section III.3.3.4), and any dependency on other features (Section III.3.3.5), consistent with the configuration-not-hardcoded pattern already established for quality-gate thresholds ([Volume II, Section II.2.5.2]) — a feature's definition is auditable and versionable as data, not buried in imperative code only a reader of that code can inspect.

**Real-Time Feature Computation (III.3.3.2).** Features feeding the real-time dashboard or in-session reasoning (Session Fatigue, Flow Stability) compute in the streaming path, per the real-time/batch split already established in [Volume II, Section II.2.3.2], against the same latency budget ([Volume II, Section II.1.4.1]).

**Batch Feature Computation (III.3.3.3).** Features requiring longer windows or heavier cross-session aggregation (Mastery Progression Rate, Session Regularity) compute in the batch path, consistent with the same Section II.2.3.2 split — the feature's own required window (III.3.3.4), not a blanket policy, determines which path it takes.

**Feature Windowing (III.3.3.4).** Every feature is computed at one or more of three standard windows — short (session-level), medium (rolling 7–30 day), long-term (lifetime-to-date) — and the same feature at different windows is a different Feature node instance (Section III.1.2, type #9), not a single node with a variable window property, so that "Risk Tolerance (7-day)" and "Risk Tolerance (lifetime)" remain independently queryable and independently versioned.

**Feature Dependencies and Computation Order (III.3.3.5).** Features that depend on other features (Habitual vs. Exploratory Ratio depends on Exploration Preference) form a computation DAG, using the same dependency-declaration and partial-re-execution discipline already specified for the transformation pipeline in [Volume II, Section II.2.4.1] — the Feature Engine's DAG is a specific instance of that general pattern, not a separately invented mechanism.

**Feature Caching and Materialization (III.3.3.6).** Computed feature values materialize into the operational tier's cache per the caching strategy already specified in [Volume II, Section II.3.8], with event-driven invalidation ([Volume II, REQ-STOR-014]) triggering recomputation when the underlying window's events change.

**Feature Backfilling (III.3.3.7).** When a feature definition changes or a new feature enters Production (III.3.1.4), historical values are backfilled by re-running the DSL definition (III.3.3.1) against historical raw events — backfilling is a batch job (Section III.3.3.3 path) regardless of the feature's normal computation path, since a backfill by definition operates over already-collected history rather than the live stream.

**Feature Schema Evolution (III.3.3.8).** A feature definition change produces a new feature version, per the same additive-versioning discipline already required for Data Lake schemas ([Volume II, REQ-STOR-009]); historical values computed under a prior definition remain attributed to that version and are not silently reinterpreted under the new one.

- **REQ-FEAT-005 (MUST):** Every feature MUST be declared via the Feature Definition Language (III.3.3.1), not implemented as ungoverned imperative code outside that declarative layer.
- **REQ-FEAT-006 (MUST):** A feature definition change MUST produce a new feature version; historical values MUST remain attributed to the version that produced them.
- **REQ-FEAT-007 (SHOULD):** A newly Production-state feature SHOULD be backfilled against available historical raw events before Player Modeling (Part III.5) is expected to rely on it for existing players.

### III.3.4 Feature Validation

Feature Validation is where the Feature Catalog's claims about what each feature measures are actually checked against data, before Section III.3.1.4's Production gate can be satisfied. This Section carries particular weight because a feature that silently measures the wrong thing propagates that error into every downstream model, embedding, and Recommendation that touches it.

**Statistical Validity (III.3.4.1).** Distribution, variance, and outlier checks — a feature whose observed distribution is degenerate (near-constant, or dominated by outliers from a data-quality defect upstream) fails validation regardless of its theoretical soundness, and routes through the same quarantine mechanism already specified for data quality failures generally ([Volume II, Section II.2.5.3]).

**Predictive Validity (III.3.4.2).** Empirical correlation with the outcomes the feature is theorized to relate to (does Risk Tolerance actually correlate with spending or session-frequency outcomes as the corpus basis would predict) — measured against the platform's own telemetry, not assumed from the corpus citation alone, consistent with the applicability-evidence quality metric already established in Section III.2.1.5.

**Causal Validity Assessment (III.3.4.3).** A stricter check than predictive validity: whether the feature's relationship to a downstream outcome meets the causal-inference bar (Section III.7.2, forward reference) or remains correlational — a feature can be Production-eligible on predictive validity alone (it's a useful signal) while its relationship to any specific outcome remains a Correlates_With edge (Section III.1.3, type #7) rather than a Causes edge, and this Section is where that distinction is first evaluated for a feature, before any downstream Causes claim can cite it.

**Stability Over Time (III.3.4.4).** A feature's distribution should remain stable absent an actual underlying behavioral shift; validation includes a baseline stability check before Production promotion, distinct from the ongoing drift monitoring in III.3.4.6, which checks stability continuously after promotion rather than once at the gate.

**Bias and Fairness Assessment (III.3.4.5).** Every feature is checked for disparate impact and proxy-discrimination risk before Production promotion — specifically including the accessibility-interaction-pattern concern already named in Section III.2.8.4: a feature like Session Fatigue or Average Decision Time (#9, #1) MUST be validated against accessibility-tool usage patterns (screen readers, alternative input, extended-time settings) to confirm it does not systematically mis-score those patterns as fatigue, low competence, or disengagement. This is the concrete validation mechanism that makes III.2.8.4's concern enforceable rather than aspirational, and it is treated as equally mandatory to the statistical and predictive checks above, not as a secondary or optional pass.

**Feature Drift Detection (III.3.4.6).** Continuous post-Production monitoring using the drift-detection mechanism already established as canonical in [Volume II, Section II.2.5.4]; a feature is subject to the same corpus-review-queue trigger and in-flight Recommendation re-scoring requirement ([Volume II, REQ-FLOW-033]) as any other drift-monitored data category, not a separately invented mechanism for features specifically.

- **REQ-FEAT-008 (MUST):** A feature MUST pass Statistical Validity, Predictive Validity, and Bias and Fairness Assessment before promotion to Production; failing any one MUST block promotion regardless of performance on the others.
- **REQ-FEAT-009 (MUST):** Bias and Fairness Assessment MUST explicitly test for accessibility-pattern misclassification per Section III.2.8.4, for any feature whose definition involves timing, speed, or frequency measures.
- **REQ-FEAT-010 (MUST):** A feature's relationship to a downstream outcome MUST NOT be represented as a Causes edge until it passes Causal Validity Assessment (III.3.4.3); predictive validity alone is insufficient grounds for a causal claim.

### III.3.5 Feature Vector Assembly

**Vector Schema and Ordering (III.3.5.1).** Individual Production-state features (Section III.3.2) combine into a single Feature Vector representing a player at a point in time, with a fixed schema and consistent feature ordering so that the vector is compatible across the embedding (Part III.4) and modeling (Part III.5) consumers that expect a stable input shape.

**Missing Value Handling (III.3.5.2).** A new player without sufficient history for a given feature's window produces an explicit missing value, not a silently imputed default — missing values propagate as reduced confidence in any downstream model or embedding that consumes the vector (Section III.5.1.4's uncertainty quantification, forward reference), rather than being treated as if the platform were as certain about a new player as an established one.

**Normalization and Standardization (III.3.5.3).** Features are normalized (typically standardized to zero mean, unit variance, or an equivalent scale) before use in models or embeddings, using normalization parameters computed and versioned alongside the feature schema version (III.3.3.8) so that a model trained against one normalization is never silently fed vectors normalized under a different, incompatible scheme.

**Feature Versioning (III.3.5.4).** Extends III.3.3.8's per-feature versioning to the assembled vector level: a Feature Vector carries the schema version of every feature it includes, satisfying the explicit-version-reference requirement already established for model consumption generally ([Volume II, REQ-FLOW-024]).

**Vector Serialization Format (III.3.5.5).** Serialized in a compact, schema-versioned binary or columnar format suitable for both the real-time path (low-latency deserialization) and batch training use (efficient bulk read), with the specific format selected per the technology-neutral convention this Volume follows throughout and recorded as an ADR ([Volume II, Section II.1.3]) at implementation time.

- **REQ-FEAT-011 (MUST):** Missing feature values MUST be represented explicitly and MUST NOT be silently imputed with a default that a downstream consumer could mistake for an observed value.
- **REQ-FEAT-012 (MUST):** A Feature Vector MUST carry the schema version of every constituent feature; a vector missing this versioning MUST NOT be consumed by Player Modeling or Simulation.

---

*End of Part III.3 — Feature Engineering Pipeline.*

*Cross-References:* [Volume I, REQ-PHI-001] (Epistemic Tiers), [Volume II, Section II.1.1.1] (Behavioral Feature Engine component), [Volume II, Section II.2.1.3] (Feature Extraction pipeline stage), [Volume II, Section II.2.4.1] (Transformation Pipeline Architecture), [Volume II, Section II.2.5] (Data Quality and Validation Gates), [Volume II, REQ-FLOW-024] (Explicit Model Versioning), [Volume II, REQ-FLOW-033] (Drift-Triggered Re-Scoring), [Part III.1] (Knowledge Graph Schema), [Part III.2] (Psychology Corpus), [Section III.2.8.4] (Accessibility in Behavioral Context), [Section III.7.2] (Causal Inference Bar — forward reference), [Part III.4] (Embeddings — forward reference), [Part III.5] (Player Modeling — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-FEAT-001 through REQ-FEAT-012.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 8, 2026

---

## Part III.4 — Embedding Architecture

Part III.4 specifies how the platform compresses everything Parts III.1 through III.3 produce — graph structure, feature vectors, corpus content — into the dense vector representations that similarity search, clustering, and downstream models (Player Modeling, Part III.5) actually operate on. [Volume II, Section II.3.5] already specified where embeddings live and how they're stored, versioned, and migrated; this Part specifies what embeddings the platform generates, how, and for what purpose, without restating that storage-layer content.

### III.4.1 Embedding Strategy

**What Gets Embedded (III.4.1.1).** Five distinct embedding types: Player embeddings (aggregate, derived from Feature Vectors, Section III.4.2.1), Behavioral Sequence embeddings (temporal, order-sensitive, Section III.4.2.2), Graph embeddings (structural, derived from the Knowledge Graph, Section III.4.2.3), Corpus Concept embeddings (semantic, derived from corpus content, Section III.4.2.4), and Cross-Modal embeddings (combining the above, Section III.4.2.5) — each serving a different downstream use case (Section III.4.3), and each versioned and stored independently rather than collapsed into one undifferentiated "embedding" concept.

**Embedding Model Selection (III.4.1.2).** Selected per embedding type against the input modality it must handle — numeric feature vectors, sequential behavior, graph structure, or corpus text — following the same technology-neutral, criteria-driven convention established throughout this specification; the specific model architecture per embedding type is recorded as an ADR ([Volume II, Section II.1.3]) at implementation time.

**Embedding Dimensionality (III.4.1.3).** A per-embedding-type trade-off between representational richness (favoring higher dimensionality) and both storage/compute cost and approximate-nearest-neighbor search efficiency (favoring lower dimensionality, per the index-type trade-off already specified in [Volume II, Section II.3.5.2]) — dimensionality is not set uniformly across the platform; Player embeddings and Corpus Concept embeddings, for example, are expected to warrant different dimensionalities given their different downstream consumers.

**Embedding Update Frequency (III.4.1.4).** Player embeddings update incrementally as their source Feature Vectors recompute (following the real-time/batch split already established in Section III.3.3.2–3); Corpus Concept embeddings update only when corpus content changes (Section III.2.1.4's update process), which is comparatively rare; Pattern embeddings (Section III.4.1.1) update when Pattern Mining (Part III.6, forward reference) discovers or revises a pattern. Update frequency is a property of what an embedding represents, not a platform-wide constant.

- **REQ-EMBED-001 (MUST):** Each of the five embedding types MUST be versioned and stored independently; they MUST NOT be collapsed into a single shared embedding space without an ADR justifying the modality alignment (Section III.4.2.5 being the one type where this is deliberate).

### III.4.2 Embedding Generation

**Player Embeddings from Feature Vectors (III.4.2.1).** The primary embedding type: an assembled Feature Vector (Section III.3.5.1) is projected into embedding space by the selected model (Section III.4.1.2). The resulting embedding's version is a function of both the Feature Vector schema version (Section III.3.5.4) and the embedding model version, so that a change in either produces a distinguishable embedding version, per the same versioning discipline as [Volume II, Section II.3.5.4].

**Behavioral Sequence Embeddings (III.4.2.2).** Distinct from the aggregate Player embedding: encodes the temporal *order* of behaviors using a sequence-aware architecture, capturing order-dependent patterns an aggregate feature vector flattens away — "frustration followed by recovery" and "recovery followed by frustration" carry the same aggregate statistics but are materially different sequences, and only this embedding type distinguishes them.

**Graph Embeddings (III.4.2.3).** Applies a graph-structure-aware embedding technique (a Node2Vec- or GraphSAGE-class algorithm, named as an illustrative technology class per this specification's technology-neutral convention) to the Knowledge Graph (Part III.1), producing embeddings that capture a node's structural position and neighborhood rather than its own properties alone — enabling "structurally similar players" queries (two players embedded closely because their causal-chain neighborhoods resemble each other) distinct from the feature-similarity queries III.4.2.1 supports.

**Corpus Concept Embeddings (III.4.2.4).** Embeds the Psychology Corpus's Concepts (Part III.2) into a semantic embedding space, enabling similarity search over theories rather than requiring exact domain or keyword matching — the mechanism that lets an agent search for "which corpus concepts are semantically relevant to this observed behavior pattern" as a similarity query rather than a manual lookup.

**Cross-Modal Embeddings (III.4.2.5).** Combines behavioral (numeric), corpus (semantic/text-derived), and graph (structural) signals into a shared embedding space, enabling a single query to span types — "find corpus concepts relevant to this player's specific behavior pattern" as one query rather than a manual join across III.4.2.1's and III.4.2.4's separate spaces. This is explicitly the least mature of the five embedding types: aligning heterogeneous modalities into one coherent space is a harder technical problem than any single-modality embedding, and this Section is flagged accordingly — consistent with the corpus's own honesty-about-maturity discipline (Section III.2.1.5) applied here to an architectural capability rather than a theory.

- **REQ-EMBED-002 (MUST):** An embedding's version MUST be derivable from (or explicitly record) the versions of every input it was generated from — the Feature Vector schema version for Player embeddings, the graph schema version for Graph embeddings, and so on.
- **REQ-EMBED-003 (SHOULD):** Cross-Modal Embeddings (III.4.2.5) SHOULD be treated as experimental-tier for any Recommendation-facing use case until validated against the quality metrics in Section III.4.4.4, given their comparatively lower maturity.

### III.4.3 Embedding Use Cases

**Player Similarity and Clustering (III.4.3.1).** The primary use case, delegating to the Vector Storage tier's similarity search already specified in [Volume II, Section II.3.5.3] and first referenced at the graph-query layer in Section III.1.6.3 — this Section confirms Player embeddings (III.4.2.1) are the specific content that query type operates on.

**Behavioral Archetype Discovery (III.4.3.2).** Clustering over Player embeddings feeds archetype discovery (Part III.5.2.1, forward reference) — distinct from III.4.3.1's nearest-neighbor queries in that this use case specifically seeks stable, named cluster boundaries rather than per-query similarity results.

**Anomaly Detection (III.4.3.3).** Players or behaviors whose embeddings sit far from any dense cluster region are flagged as anomalous, serving both fraud/abuse-detection use cases and, more centrally to this Volume's purpose, identifying genuinely novel behavior patterns worth surfacing to Pattern Mining (Part III.6, forward reference) for examination.

**Recommendation Input (III.4.3.4).** Embeddings — predominantly Player and Graph embeddings — feed as compressed context to Agent Reasoning ([Volume II, Section II.2.1.8]), giving an agent an efficient representation to reason over rather than requiring it to process raw, high-dimensional Feature Vectors directly.

**Simulation Persona Initialization (III.4.3.5).** Player embeddings (or synthetic archetypal embeddings derived from Behavioral Archetype Discovery, III.4.3.2) initialize Simulation Engine personas (Volume IV, forward reference) — a persona's starting state is derived from real or archetypal embeddings rather than fabricated from unconstrained parameters, grounding Simulation forecasts in observed behavioral structure from the first step.

- **REQ-EMBED-004 (MUST):** Simulation persona initialization MUST derive from Player or archetypal embeddings (III.4.3.2, III.4.3.5); a persona initialized from unconstrained or arbitrary parameters MUST NOT be used for a Recommendation-facing simulation forecast.

### III.4.4 Embedding Management

**Embedding Storage (III.4.4.1).** Fully specified in [Volume II, Section II.3.5]; this Part's obligation is only to confirm that the five embedding types in Section III.4.1.1 are the specific content that storage tier holds, not to restate its mechanics, per [Volume I, CONST-ONEHOME-001].

**Embedding Versioning (III.4.4.2).** Fully specified in [Volume II, Section II.3.5.4]; applied here per III.4.2.1's derivation rule for how an embedding's version is computed from its inputs.

**Embedding Migration on Schema Change (III.4.4.3).** Fully specified in [Volume II, Section II.3.5.5]; triggered specifically by a Feature Vector schema change (Section III.3.3.8) for Player embeddings, or a graph schema change (Section III.1.1.1's catalog amendment process) for Graph embeddings.

**Embedding Quality Metrics (III.4.4.4).** This Section is new content, not previously specified: an embedding's quality is measured by neighborhood preservation (do feature-similar players end up embedding-similar, verified by comparing embedding-space nearest neighbors against feature-space nearest neighbors on a held-out sample), downstream task performance (does using this embedding improve Player Modeling prediction accuracy, Section III.5.3, forward reference, versus a baseline without it), and, where applicable, reconstruction quality. An embedding failing these checks is not eligible for Recommendation-facing use, mirroring the Production-eligibility gate already established for features in Section III.3.1.4.

- **REQ-EMBED-005 (MUST):** Every embedding type MUST be evaluated against neighborhood preservation and downstream task performance before it is eligible for Recommendation-facing use; an embedding that has not been so evaluated is experimental-tier only, per the same discipline as Section III.3.1.4's feature lifecycle.

---

*End of Part III.4 — Embedding Architecture.*

*Cross-References:* [Volume II, Section II.3.5] (Vector Storage), [Volume II, Section II.2.1.4] (Embedding Generation pipeline stage), [Volume II, Section II.2.1.8] (Agent Reasoning), [Part III.1, Section III.1.6.3] (Similarity Queries), [Part III.2, Section III.2.1.5] (Corpus Quality Metrics), [Part III.3, Section III.3.1.4] (Feature Lifecycle), [Part III.5] (Player Modeling — forward reference), [Part III.6] (Pattern Mining — forward reference), [Volume IV] (Simulation — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-EMBED-001 through REQ-EMBED-005.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 8, 2026

---

## Part III.5 — Player Modeling

Part III.5 specifies the Player Model: the assembled, per-player representation everything upstream in this Volume ultimately serves, and the five predictive scores built on top of it. It closes with Model Governance (Section III.5.5), a lifecycle discipline deliberately built to mirror the Recommendation Gate Architecture's rigor ([Volume II, Section II.2.6]) — because a biased or silently-degraded predictive model is exactly as capable of producing an unethical outcome as a badly-gated Recommendation is, and deserves the same structural seriousness rather than being treated as an implementation detail beneath governance's notice.

### III.5.1 Model Overview

**Player Model Definition and Scope (III.5.1.1).** A Player Model is not a separate, independently trained artifact — it is the composed, current representation of a single player: their Feature Vector, Player Embedding, a bounded Graph Subgraph, and their active Predictions (Section III.5.3), assembled together. Scope is explicitly per-player; cohort- and archetype-level representations (Section III.5.2) aggregate across players and are a distinct construct built on top of, not identical to, individual Player Models.

**Model Components (III.5.1.2).** Four components, each already specified elsewhere and referenced here by composition rather than restated: the Feature Vector (Section III.3.5.1), the Player Embedding (Section III.4.2.1), a depth-bounded Graph Subgraph extracted per the same pattern already specified for agent context (Section III.1.6.5), and the five Predictions (Section III.5.3). A Player Model is the assembly of these four; it is not a fifth, independently-trained black box sitting alongside them.

**Model Freshness and Update Strategy (III.5.1.3).** A Player Model's freshness is inherited from its constituents — it is only as fresh as the least-recently-updated component feeding it, cascading from Feature Vector recomputation (Section III.3.3.2–3) through embedding update (Section III.4.1.4) to prediction refresh. No independent freshness target is set at the Player Model level; one is unnecessary given the constituent targets already establish it.

**Model Confidence and Uncertainty Quantification (III.5.1.4).** Every Player Model carries an explicit confidence score, propagated from its constituents' own confidence — feature confidence (Section III.1.4.1), embedding quality (Section III.4.4.4) — so that a new player with sparse history produces a Player Model explicitly flagged as low-confidence, not one silently presented with the same apparent certainty as an established player's model. This is the Player-Model-level realization of the missing-value propagation rule already required at the vector level ([Section III.3.5.2]).

- **REQ-MODEL-001 (MUST):** A Player Model MUST carry an explicit confidence score derived from its constituent components' confidence; a Player Model MUST NOT be presented to an agent or reviewer without this score.
- **REQ-MODEL-002 (MUST):** A Player Model MUST NOT be implemented as an independently trained artifact separate from its four specified components (III.5.1.2); any additional independently-trained component MUST be added to that component list via the amendment process before use.

### III.5.2 Behavioral Archetypes

**Archetype Discovery (III.5.2.1).** Archetypes are discovered empirically via clustering over Player Embeddings ([Section III.4.3.2]), using an unsupervised method selected per the technology-neutral convention this specification follows throughout. Discovered archetypes are validated against, but not forced to match, the corpus's a priori taxonomies (Bartle, Section III.2.2.1; Quantic Foundry, Section III.2.2.2) — a real player population may not cleanly partition along a published typology's boundaries, and the platform's discovery process is honest about that rather than fitting clusters to a theory that doesn't hold for the specific game.

**Archetype Taxonomy (III.5.2.2).** The resulting named archetype set is maintained as its own versioned taxonomy, governed by the same versioning discipline already established for Corpus Concepts (Section III.2.1.3) — an archetype's definition can be revised as more data arrives without silently reinterpreting a player's historical archetype assignment made under a prior version.

**Archetype Drift and Transition (III.5.2.3).** Players move between archetypes across their lifecycle (cross-referencing Player Lifecycle Models, Section III.2.2.10); a transition is recorded using the same temporal-edge validity-interval pattern already established at the graph layer ([Section III.1.4.4]), so a player's full archetype trajectory — not only their current label — remains queryable.

**Custom Archetype Definition by Studio (III.5.2.4).** A studio MAY define custom, game-specific archetypes (extending the Domain Entity pattern, [Section III.1.2], type #17) alongside the platform-discovered set. A hand-defined custom archetype is explicitly flagged as studio-asserted and unvalidated until it separately passes the same discovery-validation rigor as III.5.2.1, distinct from a platform-discovered archetype's default validated status.

- **REQ-MODEL-003 (MUST):** A studio-defined custom archetype MUST be labeled as unvalidated until it passes discovery-validation; it MUST NOT be presented with the same confidence as a platform-discovered archetype by default.

### III.5.3 Predictive Models

Five predictive scores, each targeting a distinct Outcome-adjacent question and each drawing primarily from a distinguishable subset of the Feature Catalog (Section III.3.2).

| Prediction | Predicts | Primary Features Drawn From | Target |
|---|---|---|---|
| Churn Prediction | Probability of disengagement within a window | Session Regularity, Content Velocity Preference, Session Fatigue | Churn Outcome (boolean/probability) |
| Retention Prediction | Probability of continued engagement over a horizon | Goal Persistence, Flow Stability, Engagement Breadth | N-day retention Outcome |
| Spending Prediction | Expected future spend | Economic Rationality Index, Purchase Friction, Loss Sensitivity | Spend amount/probability Outcome |
| Engagement Prediction | Expected engagement level and frequency | Habitual vs. Exploratory Ratio, Session Regularity | Engagement score Outcome |
| Satisfaction Prediction | Inferred satisfaction (itself a proxy — satisfaction is not directly observable) | Recovery From Failure, Frustration Tolerance, Flow Stability | Satisfaction proxy score |

**Model Explainability Requirements (III.5.3.6).** Every predictive model supports feature-attribution explainability at the individual-player level, sufficient to satisfy the human-readable-rationale requirement ([Volume I, REQ-ETH-008]) whenever a prediction feeds a Recommendation's rationale. A prediction that cannot be explained at that granularity MUST NOT be cited in an individual Recommendation's rationale; it remains usable for aggregate or cohort-level reasoning, where individual-level explainability is not the binding constraint.

**Model Drift and Retraining (III.5.3.7).** Predictive accuracy is continuously validated against actual measured outcomes via Feedback Loop Closure ([Volume II, Section II.2.1.13]), using the drift-detection mechanism already established as canonical in [Volume II, Section II.2.5.4]; a model whose accuracy degrades beyond threshold enters the retraining process governed in full by Section III.5.5.5, not an ad hoc retrain outside that governance.

- **REQ-MODEL-004 (MUST):** A predictive model MUST support individual-level feature-attribution explainability before its output may be cited in a Recommendation's rationale.
- **REQ-MODEL-005 (MUST):** Predictive accuracy MUST be continuously validated against measured outcomes; a model MUST NOT be assumed accurate indefinitely from its initial evaluation alone.

### III.5.4 Player Model Privacy

**Anonymization and Pseudonymization (III.5.4.1).** Player Models operate on pseudonymous identifiers by default, consistent with the high-sensitivity classification raw player-identifiable data already carries ([Volume II, Section II.3.1.2]); re-identification requires a separate, access-controlled identity-resolution step ([Volume VI, Section VI.1.3], forward reference), not information embedded directly in the Player Model artifacts agents and the Simulation Engine operate on — in the ordinary case, an agent reasoning over a Player Model never sees directly identifying information at all.

**Differential Privacy in Aggregates (III.5.4.2).** Cohort- and archetype-level aggregate statistics (Section III.5.2) exposed via dashboard or cross-studio benchmarking ([Volume II, Section II.1.2.5, Section II.5.5.6]) apply differential-privacy noise injection whenever the aggregate group size is small enough that individual players could be re-identified from the aggregate itself — the specific mechanism and parameters are technology-neutral per this specification's convention, but the requirement that small-cohort disclosure risk be mitigated is not optional.

**Model Deletion on Request (III.5.4.3).** Extends the Right-to-Be-Forgotten mechanism already specified in [Volume II, Section II.3.3.6] explicitly to the Player Model: a deletion request purges or anonymizes not only raw telemetry but the derived Player Model, its embeddings, and its cached predictions. A derived artifact is not exempt from a deletion request merely because it is computed rather than directly collected — the Player Model is player-identifying data by construction and is in scope accordingly.

**Inferential Privacy (III.5.4.4).** The platform's Feature Catalog (Section III.3.2) is deliberately scoped to behavioral and psychographic dimensions relevant to game design; no inference pipeline — agent, predictive model, or embedding — may be extended to infer or output a sensitive attribute (health status, sexual orientation, political affiliation, financial hardship, or similar) even where the underlying behavioral data could technically support such an inference with sufficient precision. This is stated as its own explicit prohibition, not left as an implicit consequence of the Feature Catalog's current scope, because a sufficiently capable behavioral model could otherwise drift into inferring such attributes as an unintended byproduct of optimizing for a legitimate prediction target, without anyone having deliberately built that capability.

- **REQ-MODEL-006 (MUST):** A Player Model deletion request MUST purge or anonymize the derived Player Model, its embeddings, and cached predictions, not raw telemetry alone.
- **REQ-MODEL-007 (MUST):** No component MUST infer or output a sensitive attribute (health status, sexual orientation, political affiliation, financial hardship, or similar) as a Player Model output, prediction, or feature, regardless of whether the underlying behavioral data could support such an inference.

### III.5.5 Model Governance

Model Governance applies the Recommendation Gate's structural discipline — registration, staged approval, mandatory documentation, drift monitoring, rollback, and audited override — to the predictive models feeding those Recommendations, on the reasoning that a model silently degraded or quietly biased is no less consequential than a badly-scored Recommendation, and deserves no less rigor.

**Model Registry (III.5.5.1).** Every trained model instance is registered before deployment eligibility. **(a) Registration Process:** registration captures training data lineage, hyperparameters, and a link to the model's supporting Evaluation Card (Section III.5.5.4) — an unregistered model cannot be deployed. **(b) Versioning and Lineage:** models are versioned per the explicit-version-reference discipline already established ([Volume II, REQ-FLOW-024]), with lineage traced back to the specific Feature Vector and Embedding versions ([Sections III.3.5.4, III.4.2.1]) the model was trained against. **(c) Artifact Storage:** model binaries are stored in the immutable, versioned Object Storage tier already specified in [Volume II, Section II.3.7].

**Model Approval Gates (III.5.5.2).** Four sequential gates, all of which a model must clear before production deployment. **(a) Pre-Deployment Evaluation Gate:** performance must meet the thresholds recorded in the model's Evaluation Card (III.5.5.4). **(b) Bias and Fairness Gate:** mirrors the Feature Validation Bias and Fairness Assessment ([Section III.3.4.5]) at the full-model level, including the same mandatory accessibility-pattern-misclassification check extended from individual features to the assembled model's output. **(c) Explainability Gate:** enforces the individual-level explainability requirement (Section III.5.3.6) before deployment, not after. **(d) Ethics Gate:** final review routing through the Ethics Layer, on the basis that a model capable of feeding Recommendation rationale is itself subject to ethics review before deployment — not only the Recommendations it later produces.

**Model Cards (III.5.5.3).** **(a) Template:** Purpose, Data (training data description), Limitations, Performance, and Biases (the findings from the Bias and Fairness Gate, III.5.5.2.b) — the standard model-card structure, specified for this platform. **(b) Storage and Access:** stored alongside the model artifact (III.5.5.1.c) and accessible to reviewers through the Studio Tools dashboard ([Volume II, Part VII.4], forward reference). **(c) Update Triggers:** retraining (III.5.5.5), rollback (III.5.5.6), or a drift-driven revision each trigger a mandatory Model Card update — a stale Model Card is a documentation-synchronization defect at the model-governance layer, subject to the same standard [Volume I, DOC-SYNC-001-equivalent] applies elsewhere.

**Evaluation Cards (III.5.5.4).** **(a) Template:** Dataset (what the model was evaluated against), Metrics, Results, and Context (the conditions under which the evaluation ran). **(b) Linkage to Model Cards:** every Model Card links to at least one supporting Evaluation Card; a Model Card without a linked Evaluation Card fails the Pre-Deployment Evaluation Gate (III.5.5.2.a) automatically.

**Model Drift Management (III.5.5.5).** **(a) Drift Detection Metrics:** accuracy decay, prediction-distribution shift, and feature-distribution shift, using the canonical drift-detection mechanism already established in [Volume II, Section II.2.5.4] rather than a separately invented model-specific one. **(b) Thresholds and Alerting:** routes through the observability severity taxonomy already specified in [Volume II, Section II.7.2, Section II.7.4], applied here to model drift specifically. **(c) Automatic Retraining Triggers:** drift beyond threshold MAY trigger an automatic retraining job via the Model Training Flow ([Volume II, Section II.2.8.4]) — but automatic trigger does not mean automatic deployment; the retrained model must still clear every Approval Gate (III.5.5.2) before it replaces the deployed version. **(d) Retraining Approval Process:** human sign-off is required for deployment even when the retraining job itself ran automatically, extending the human-in-the-loop principle from the Recommendation layer ([Volume I, Section I.2.1.6]) to the model layer feeding it.

**Model Rollback (III.5.5.6).** **(a) Triggers:** post-deployment accuracy collapse, a fairness incident discovered after deployment, or an ethics-relevant failure — mirroring the Rolled Back Recommendation state ([Volume II, Section II.2.6.2.g]) applied to the model that produced a flawed prediction rather than only to the Recommendation it fed. **(b) Process:** revert to the prior registered model version (III.5.5.1.b) immediately, per the same RPO/RTO discipline already established for tier-1-adjacent components ([Volume II, Section II.8.3.1]). **(c) Post-Rollback Validation:** the rolled-back model is re-validated against its Evaluation Card before being trusted again — a rollback target is not silently assumed still valid merely because it predates the failure that triggered the rollback.

**Human Override Policy (III.5.5.7).** **(a) Authority and Scope:** mirrors the Emergency Override structure already established for the Recommendation Gate ([Volume II, Section II.2.6.6]); a human with appropriate authority may override a specific model prediction for a specific case, with Board-level authority required specifically when the override touches a model gated by the Ethics Gate (III.5.5.2.d), matching Volume II's existing escalation threshold rather than inventing a separate one. **(b) Audit Trail:** every override is logged per the same audit discipline already established at the Recommendation Gate ([Volume II, Section II.2.6.4]), applied here to model-prediction overrides specifically. **(c) Escalation:** a pattern of repeated overrides against the same model triggers mandatory model review, feeding back into Section III.5.5.5's drift and retraining process — repeated overrides are themselves a degradation signal worth acting on even when automated drift metrics haven't yet crossed their threshold.

- **REQ-MODEL-008 (MUST):** A model MUST pass all four Approval Gates (III.5.5.2) before production deployment; passing three of four MUST NOT be treated as sufficient.
- **REQ-MODEL-009 (MUST):** Automatic retraining (III.5.5.5.c) MUST NOT result in automatic deployment; the retrained model MUST clear the full Approval Gate sequence before replacing the currently deployed version.
- **REQ-MODEL-010 (MUST):** A Board-level Human Override (III.5.5.7.a) touching an Ethics-Gate-relevant model MUST be logged and reported without redaction, per the same transparency requirement already established for Recommendation-level overrides ([Volume I, Section I.5.3.6]).
- **REQ-MODEL-011 (SHOULD):** A pattern of repeated human overrides against the same model SHOULD trigger mandatory model review, independent of whether automated drift metrics have crossed their alert threshold.

---

*End of Part III.5 — Player Modeling.*

*Cross-References:* [Volume I, REQ-ETH-008] (Human-Readable Rationale), [Volume I, Section I.2.1.6] (Human-in-the-Loop), [Volume I, Section I.5.3.6] (Transparency Reporting), [Volume II, Section II.2.5] (Data Quality and Validation Gates), [Volume II, Section II.2.6] (Recommendation Gate Architecture), [Volume II, Section II.3.7] (Object Storage), [Volume II, Section II.7] (Observability Architecture), [Volume II, Section II.8.3] (Disaster Recovery), [Part III.1] (Knowledge Graph Schema), [Part III.3] (Feature Engineering Pipeline), [Part III.4] (Embedding Architecture), [Volume VI, Section VI.1.3] (Identity Resolution — forward reference), [Volume VII, Part VII.4] (Studio Tools — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-MODEL-001 through REQ-MODEL-011.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 8, 2026

---

## Part III.6 — Pattern Mining

Part III.6 specifies how the platform discovers structure nobody hypothesized in advance — sequences and co-occurrences mined directly from telemetry, distinct from the corpus-driven, theory-first reasoning that dominates the rest of this Volume. Pattern Mining is deliberately the platform's most data-driven, least theory-anchored capability, which is exactly why Section III.6.2.3's confidence discipline matters most here: a mined pattern is, by construction, evidence of frequency, not evidence of cause, and this Part is careful not to let the two blur.

### III.6.1 Pattern Discovery

**Sequential Pattern Mining (III.6.1.1).** Discovers frequent behavioral sequences (a PrefixSpan-class algorithm, named illustratively per this specification's technology-neutral convention) over raw event or Behavioral Sequence Embedding data (Section III.4.2.2) — surfacing patterns like "tutorial skip → early session end → non-return" without requiring the pattern to be hypothesized before the mining run, which is the capability's entire value: it finds what nobody thought to look for.

**Frequent Itemset Mining (III.6.1.2).** Discovers non-sequential co-occurrence patterns (an Apriori- or FP-Growth-class algorithm) — which behaviors or features co-occur frequently regardless of order, distinct from III.6.1.1's order-sensitive discovery.

**Anomalous Pattern Detection (III.6.1.3).** Extends the embedding-based anomaly detection already specified in Section III.4.3.3 to the pattern level specifically — a pattern occurring with unusual frequency or in an unusual context relative to baseline, distinct from a single anomalous player.

**Emerging Pattern Detection (III.6.1.4).** Identifies patterns whose frequency is *increasing* over time, not only patterns that are currently frequent — the mechanism that catches a new behavior trend (an emerging exploit, a shifting content-engagement pattern) while it is still forming rather than only after it has become common enough for standard frequent-pattern mining to surface it.

**Cross-Player Pattern Discovery (III.6.1.5).** Patterns holding across multiple players in aggregate, feeding the Pattern node type (Section III.1.2, type #10) as a genuinely cross-player construct — related to but distinct from Behavioral Archetype Discovery (Section III.5.2.1): archetypes cluster *players*, patterns identify recurring behavioral *sequences* that may cut across archetype boundaries entirely.

- **REQ-PATTERN-001 (MUST):** A discovered pattern MUST record the mining method and support/frequency statistics that produced it, per the provenance discipline already established in Section III.1.4.1.

### III.6.2 Pattern-to-Graph Integration

**Pattern Registration in Knowledge Graph (III.6.2.1).** A discovered pattern meeting a minimum support/confidence threshold registers as a Pattern node (Section III.1.2, type #10), carrying the same confidence and provenance properties required of every other node type (Section III.1.4.1) — a pattern below threshold remains in the mining layer's own working store and is not graph-eligible.

**Pattern-to-Corpus Mapping (III.6.2.2).** A registered pattern is checked against the Psychology Corpus (Part III.2) for a matching or related Corpus Concept — a discovered "loss-framed event followed immediately by a purchase prompt" pattern, for example, maps to Prospect Theory and Loss Aversion (Section III.2.3.1). Where a pattern has *no* corpus match, that absence is itself valuable: it flags a candidate for new corpus content and routes through the same update process already specified in Section III.2.1.4, rather than being discarded for lacking a theoretical home.

**Pattern Confidence and Evidence Tracking (III.6.2.3).** A pattern's statistical confidence (its mining-algorithm support and frequency) is tracked distinctly from, and MUST NOT be conflated with, causal confidence (Section III.7.2, forward reference) — a highly frequent pattern is not automatically a highly confident causal claim. This restates the Correlates_With/Causes distinction already established in Section III.1.3 specifically for Pattern Mining, because frequency-based discovery is exactly the kind of process that could tempt an agent toward mistaking "this happens a lot" for "this causes that."

- **REQ-PATTERN-002 (MUST):** A Pattern node's statistical confidence MUST NOT be represented as, or silently converted into, causal confidence; a pattern feeding a Causes-edge claim MUST separately clear the evidentiary bar in Section III.7.2.

### III.6.3 Pattern Application

**Pattern-Triggered Recommendations (III.6.3.1).** A sufficiently confident, corpus-grounded (Section III.6.2.2) pattern can trigger Agent Reasoning to evaluate a Recommendation opportunity — but per Section III.6.2.3, the pattern alone is correlational evidence, an input to agent reasoning rather than a Recommendation-generating trigger by itself; the agent must still ground any causal claim through Section III.7.2 before a Recommendation's rationale can cite it as more than a correlated observation.

**Pattern-Triggered Simulations (III.6.3.2).** A newly discovered pattern — an Emerging Pattern (Section III.6.1.4) in particular — can trigger a Simulation Engine run (Volume IV, forward reference) to forecast the pattern's likely trajectory and impact before any Recommendation is even proposed, giving the platform a proactive rather than purely reactive simulation posture.

**Pattern-Triggered Alerts (III.6.3.3).** A pattern crossing a safety-relevant threshold — an Anomalous or rapidly Emerging pattern connected to player wellbeing (cross-referencing Toxicity and Moderation Psychology, Section III.2.7.7, or gaming-disorder-adjacent behavior, Section III.2.2.6) — triggers an alert through the observability alerting mechanism already specified in [Volume II, Section II.7.4], rather than waiting for the standard Recommendation pipeline's slower cadence, because a safety-relevant emerging pattern is exactly the case where speed of human notification matters more than the full deliberative pipeline.

- **REQ-PATTERN-003 (MUST):** A Pattern-Triggered Recommendation MUST NOT cite the triggering pattern's frequency as causal evidence in its rationale; only a Section III.7.2-validated causal claim may be cited as such.
- **REQ-PATTERN-004 (MUST):** A safety-relevant Anomalous or Emerging Pattern (III.6.3.3) MUST route through the alerting mechanism at detection time, not only through the standard Recommendation pipeline's cadence.

---

*End of Part III.6 — Pattern Mining.*

*Cross-References:* [Volume II, Section II.7.4] (Alerting), [Part III.1, Section III.1.3] (Edge Types — Correlates_With/Causes), [Part III.2, Section III.2.1.4] (Corpus Update Process), [Part III.2, Section III.2.2.6] (Game Addiction), [Part III.2, Section III.2.7.7] (Toxicity and Moderation Psychology), [Part III.4, Section III.4.2.2, III.4.3.3] (Behavioral Sequence Embeddings, Anomaly Detection), [Part III.5, Section III.5.2.1] (Archetype Discovery), [Section III.7.2] (Causal Inference Framework), [Volume IV] (Simulation — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-PATTERN-001 through REQ-PATTERN-004.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 8, 2026

---

## Part III.7 — Reasoning Engine

Part III.7 closes Volume III with the layer that sits between everything upstream — features, embeddings, graph, corpus, patterns — and the specialist agents that consume it (Volume V, forward reference). This Part specifies the *methods* of reasoning available to those agents, not the agents themselves; Volume V specifies who reasons, Part III.7 specifies what tools they reason with. Section III.7.2 is this Part's — and arguably this Volume's — single most consequential Section: it is where "Section III.7.2" stops being a forward reference and finally becomes the actual, checkable definition of the evidence bar every Causes edge in this specification has been held to since Part III.1.

### III.7.1 Reasoning Architecture

**Reasoning Pipeline Overview (III.7.1.1).** The Reasoning Engine is a shared substrate, not a separate agent — every specialist agent (Volume V) draws on the same reasoning methods (Section III.7.1.4) and the same input surface (III.7.1.2) rather than each agent implementing its own ad hoc reasoning logic, so that a causal claim's validity does not depend on which agent happened to produce it.

**Inputs (III.7.1.2).** The Reasoning Engine's complete input surface is five sources, each already fully specified: Features (Part III.3), Embeddings (Part III.4), the Knowledge Graph (Part III.1), the Psychology Corpus (Part III.2), and Patterns (Part III.6). An agent reasoning from a source outside this list is out of specification — there is no sixth, informal input channel (an unvalidated external API call, a free-form unstructured lookup) available to agent reasoning.

**Outputs (III.7.1.3).** Three output types, each subject to different downstream discipline: Insights (human-readable observations not necessarily tied to a specific action), Predictions (Section III.5.3's five scores, or ad hoc predictions), and Recommendations ([Volume II, Section II.2.1.9]). Only Recommendations are subject to the full Ethics Gate and Recommendation state machine ([Volume II, Section II.2.6]); Insights and Predictions still carry confidence and provenance (Section III.1.4.5) but do not by themselves cause any action, so the heavier governance is reserved for the output type that actually can.

**Reasoning Types (III.7.1.4).** Four types, named honestly with their different certainty profiles rather than treated as uniformly rigorous: **Deductive** reasoning applies a known corpus rule to a specific case (SDT predicts X; this player exhibits X's preconditions; therefore X) and carries the lowest uncertainty of the four. **Inductive** reasoning generalizes from observed instances to a general claim — Pattern Mining's raw output before corpus-grounding (Section III.6.2.2) is inductive reasoning by construction. **Abductive** reasoning infers the most likely explanation for an observation (this player's behavior is best explained by frustration), the primary mode behind Emotion node inference (Section III.1.2, type #3). **Causal** reasoning is the strictest of the four, specified in full in Section III.7.2, and is the only type eligible to produce a Causes edge.

- **REQ-REASON-001 (MUST):** Agent reasoning MUST draw only from the five input sources in III.7.1.2; an informal or out-of-specification input source MUST NOT feed a Recommendation's rationale.
- **REQ-REASON-002 (MUST):** Every reasoning output MUST be labeled with which of the four reasoning types (III.7.1.4) produced it; a Causes edge MUST NOT result from Deductive, Inductive, or Abductive reasoning alone without separately clearing Section III.7.2.

### III.7.2 Causal Inference Framework

**Causal Graph Construction (III.7.2.1).** A causal graph, in the formal structural-causal-model sense this Section uses, is distinct from the Knowledge Graph specified in Part III.1, though related: the Knowledge Graph is the platform's general, persistent knowledge store, while a causal graph is a specific directed acyclic graph constructed *for a specific causal question* — which variables might causally relate to which — drawing on Knowledge Graph structure as a starting hypothesis. A proposed Causes edge is not written back to the Knowledge Graph until the causal graph constructed to evaluate it has passed every subsequent Section in this Framework.

**Do-Calculus and Intervention Queries (III.7.2.2).** The platform adopts Pearl's do-calculus as its formal foundation: the sharp distinction between P(Y|X) — observing X and updating belief about Y — and P(Y|do(X)) — actively intervening to set X and observing the resulting effect on Y. This is the mathematical grounding underneath every "correlation is not causation" statement elsewhere in this specification, and it gives the platform an actual query type rather than a vague caution: an intervention query asks "if we changed this mechanic, what would happen," which is precisely the claim embedded in every Recommendation's predicted effect.

**Counterfactual Reasoning (III.7.2.3).** The third rung of Pearl's ladder of causation: "what would have happened to this specific player or cohort had the mechanic been different." This is the formal grounding for Simulation Engine forecast validity (Volume IV, forward reference) — a Simulation forecast is, precisely stated, a counterfactual estimate, and Simulation's claim to predictive value rests on how well its underlying model approximates true counterfactual outcomes, not merely on how plausible its narrative sounds.

**Confounders and Confounding Control (III.7.2.4).** A confounder is a variable causally affecting both a proposed cause and a proposed effect, producing a spurious correlation between them — "available free time" might confound "housing engagement" and "retention" (more free time independently increases both engagement with optional content and overall retention, without housing engagement itself causing retention). This Section is the concrete mechanism behind the evidence bar's actual rigor: before a Causes edge may be asserted, candidate confounders are identified — using the Knowledge Graph's own causal-chain structure to suggest candidates, per III.7.2.1 — and controlled for via standard statistical adjustment. A causal claim that has not undergone confounding control is not eligible for a Causes edge regardless of how strong its raw correlation appears.

**Instrumental Variables (III.7.2.5).** A causal-identification technique for cases where confounding cannot be directly measured or controlled: an instrumental variable affects the proposed cause but affects the proposed effect *only* through that cause. Game telemetry rarely provides clean natural instruments, so this technique is specified as available rather than commonly applicable — its clearest use case in this platform's context is a randomized feature rollout (an Experiment node, Section III.1.2, type #13), where the randomization itself serves as a clean instrument.

**Mediation Analysis (III.7.2.6).** Decomposes a causal effect into direct and indirect (mediated through an intermediate variable) components — does housing engagement cause retention directly, or entirely through the mediating "attachment" emotional state, as the worked example in Section III.1.7 proposed. This Section is what would let the platform actually test that worked example's proposed causal chain empirically rather than leaving it as an illustrative narrative, closing the loop the worked example deliberately left open.

**Causal Effect Estimation Methods (III.7.2.7).** The available estimation methods, in ascending order of evidentiary strength: matching methods and regression-discontinuity designs (where a natural threshold in the data creates a quasi-experimental comparison), difference-in-differences (comparing pre- and post-change behavior against a comparison group unaffected by the change), and randomized experiments (an Experiment node, the gold standard, providing the cleanest causal identification available). **This Section states the actual, concrete evidence bar** every Causes edge has been held to since [REQ-GRAPH-005]: a Correlates_With edge may be promoted to a Causes edge only when **(a)** a randomized experiment directly supports it, **or (b)** an observational estimate has passed confounding control (III.7.2.4), clears a pre-registered minimum effect-size and confidence threshold, and is accompanied by a plausible causal mechanism already registered in the Psychology Corpus (Part III.2) that would explain the pathway. A correlational finding meeting neither condition remains a Correlates_With edge indefinitely — persistence of a strong correlation is not, by itself, ever sufficient.

- **REQ-REASON-003 (MUST):** A Causes edge MUST NOT be created except by satisfying the bar stated in III.7.2.7(a) or (b) in full; this is the canonical, complete specification of the requirement first stated abstractly at [REQ-GRAPH-005] and [REQ-GRAPH-006].
- **REQ-REASON-004 (MUST):** Confounding control (III.7.2.4) MUST be performed and documented for every observational causal claim before it may be evaluated against the effect-size and confidence thresholds in III.7.2.7(b).
- **REQ-REASON-005 (SHOULD):** Where a randomized experiment (Experiment node) is feasible for a candidate causal claim, it SHOULD be preferred over observational estimation, consistent with III.7.2.7's ordering by evidentiary strength.

### III.7.3 Explainability Layer

**Explainability Requirements by Output Type (III.7.3.1).** Rigor scales with the output type named in III.7.1.3: a Recommendation requires the full human-readable rationale ([Volume I, REQ-ETH-008]) with explicit causal-chain citation; a Prediction requires feature-attribution explainability (Section III.5.3.6); an Insight requires, at minimum, a stated confidence and provenance trail — the lightest output type is not exempt from explainability, only from the heaviest tier of it.

**Feature Attribution Methods (III.7.3.2).** A SHAP- or LIME-class attribution method (named illustratively, per this specification's technology-neutral convention) is the shared mechanism underlying the explainability requirement already established for predictive models in Section III.5.3.6 — specified once here as the Reasoning Engine's shared toolkit rather than re-specified separately for each of the five predictive models.

**Graph Path Explanation (III.7.3.3).** Renders a Causal Chain Query result (Section III.1.6.2) as a human-readable path explanation — the mechanism underlying the Ethics Layer's rationale-inspection tooling ([Volume II, Section II.2.2.4]) and the same walkthrough style the worked example in Section III.1.7 demonstrated by hand.

**Natural Language Explanation Generation (III.7.3.4).** Converts the structured outputs of III.7.3.2 and III.7.3.3 into prose a human reviewer actually reads, satisfying [Volume I, REQ-ETH-008]'s human-readable requirement with its generation mechanism now specified. Generation MUST be traceable back to the structured evidence it renders — a free-form narrative that drifts from what the underlying attribution or graph path actually supports is exactly the failure mode this Section exists to prevent, since a fluent, persuasive explanation is not the same thing as an accurate one, and an AI-generated explanation is specifically capable of producing the former without the latter if this traceability requirement is not enforced.

**Confidence and Uncertainty in Explanations (III.7.3.5).** Every generated explanation surfaces its underlying confidence, propagated from edge confidence (Section III.1.4.5) and model confidence (Section III.5.1.4) — a low-confidence causal claim's explanation reads as tentative, not authoritative, consistent with the honesty-about-certainty discipline this Volume has maintained since the Corpus Quality Metrics in Section III.2.1.5.

**Explanation Audience Adaptation (III.7.3.6).** The same underlying evidence renders differently for different audiences — technical and graph-path-detailed for a developer, design-pattern-and-corpus-theory-framed for a designer, business-outcome-framed for an executive — but audience adaptation MUST NOT alter the underlying confidence or evidence claims themselves. A claim cannot become more certain when explained to an executive than it was when explained to a developer; adaptation changes framing and vocabulary, never the substance of what is actually known.

- **REQ-REASON-006 (MUST):** Natural language explanation generation MUST be traceable to the structured evidence (feature attribution, graph path) it renders; a generated explanation MUST NOT introduce claims the underlying structured evidence does not support.
- **REQ-REASON-007 (MUST):** Every generated explanation MUST surface its underlying confidence; an explanation MUST NOT present a low-confidence claim without that qualification.
- **REQ-REASON-008 (MUST):** Explanation Audience Adaptation MUST preserve the underlying confidence and evidence claims across all audience variants; only framing and vocabulary MAY vary.

---

*End of Part III.7 — Reasoning Engine.*

*Cross-References:* [Volume I, REQ-ETH-008] (Human-Readable Rationale), [Volume I, Section I.2.1.1] (Truth Over Assumptions), [Volume II, Section II.2.2.4] (Lineage Visualization), [Part III.1, Section III.1.6.2] (Causal Chain Queries), [Part III.1, Section III.1.7] (Worked Example), [Part III.1, REQ-GRAPH-005–006] (Causes Edge Evidentiary Requirement), [Part III.2] (Psychology Corpus), [Part III.5, Section III.5.3.6] (Model Explainability), [Part III.6] (Pattern Mining), [Volume IV] (Simulation Engine — forward reference), [Volume V] (Agent Framework — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-REASON-001 through REQ-REASON-008.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 8, 2026

---

## End of Volume III — Knowledge Graph and AI Core

Volume III is complete: seven Parts, specifying the schema every claim must fit inside (III.1), the citable behavioral-science knowledge that populates it across eleven domains (III.2), the feature engineering layer that turns telemetry into signal (III.3), the embeddings that compress it for similarity and modeling (III.4), the Player Model and its governance (III.5), the pattern-discovery layer that finds what nobody hypothesized (III.6), and — closing the loop opened in Part III.1 — the Reasoning Engine that finally defines, concretely and testably, when a correlation earns the right to be called a cause (III.7.2.7).

Requirement IDs issued across this Volume: REQ-GRAPH-001–015, REQ-CORPUS-001–012, REQ-FEAT-001–012, REQ-EMBED-001–005, REQ-MODEL-001–011, REQ-PATTERN-001–004, REQ-REASON-001–008 — 67 requirements in total.

*Volume IV — Simulation Engine follows, per [PsyForge_v1_Master_TOC.md].*
