# PsyForge v1.0 — Volume V: Agent Framework

*Part of the PsyForge Master Specification. See [PsyForge_v1_Master_TOC.md](PsyForge_v1_Master_TOC.md) for the full document map, [PsyForge_VolumeI_Complete.md](PsyForge_VolumeI_Complete.md) for Volume I, [PsyForge_VolumeII.md](PsyForge_VolumeII.md) for Volume II, [PsyForge_VolumeIII.md](PsyForge_VolumeIII.md) for Volume III, and [PsyForge_VolumeIV.md](PsyForge_VolumeIV.md) for Volume IV.*

*Document Status: Living Specification — Volume V complete (Parts V.1–V.14).*

---

Volume V specifies the Agent Framework: the Orchestrator and ten specialist agents that consume the Reasoning Engine's methods ([Volume III, Section III.7.1]), draw on Simulation forecasts ([Volume IV]), and produce the Insights, Predictions, and Recommendation drafts that flow into the Recommendation Gate ([Volume II, Section II.2.6]). Part V.1 is deliberately the largest single Part in this Volume relative to what follows it, because it establishes the shared architecture — anatomy, communication, memory, tools, evaluation, and failure modes — that every one of the ten specialist-agent Parts (V.3 through V.12) references rather than restates, per [Volume I, CONST-ONEHOME-001]. A reader who has read Part V.1 can predict the shape of every subsequent agent Part before reading it; that predictability is the point.

---

## Part V.1 — Agent Architecture

### V.1.1 Agent Model Overview

**Agent Definition (V.1.1.1).** An Agent is a bounded reasoning process with a defined role, drawing on the Reasoning Engine's shared substrate and methods ([Volume III, Section III.7.1.1, Section III.7.1.4]), operating within declared tool, memory, and evaluation boundaries (Section V.1.1.2). An Agent is explicitly distinct from a Persona ([Volume IV, Section IV.2.1.1]): a Persona simulates *being* a player; an Agent reasons *about* players and systems on the platform's behalf. The two share no implementation, only the platform's underlying corpus and graph.

**Agent Anatomy: Prompts, Memory, Tools, Evaluation Criteria (V.1.1.2).** Every agent is composed of four parts, specified once here so that every specialist-agent Part (V.3–V.12) can follow an identical, predictable structure without re-deriving it: a **Prompt Specification** (System Prompt, Context Assembly Template, and Output Format Specification — the three-part pattern every specialist agent's own "Prompt Specification" subsection follows), **Memory** (Section V.1.3), **Tools** (Section V.1.4), and **Evaluation Criteria** (Section V.1.5).

**Agent Lifecycle (V.1.1.3).** Initialization (context assembled per the agent's Context Assembly Template, tools and memory provisioned), Execution (the actual reasoning invocation, drawing on the Reasoning Types already specified in [Volume III, Section III.7.1.4]), and Termination (result returned to the Orchestrator, Part V.2; memory consolidated per Section V.1.3.5). An agent's execution is bounded and stateless between invocations by default — what persists across invocations is specifically Memory (Section V.1.3), not execution state itself.

**Agent State Management (V.1.1.4).** During a single execution, an agent's state is its assembled context plus its accumulated reasoning steps for that invocation; this state does not persist automatically once execution terminates. This distinction — in-invocation state versus cross-invocation memory — is stated explicitly because conflating the two is a common source of confusion in agent architectures generally, and this specification treats them as structurally separate concepts throughout.

- **REQ-AGENT-001 (MUST):** An agent's in-invocation state MUST NOT be assumed to persist across invocations; anything intended to persist MUST be written to Memory (Section V.1.3) explicitly.
- **REQ-AGENT-002 (MUST):** Every specialist agent Part MUST specify its Prompt Specification, Tools and Access, and Evaluation Criteria following the anatomy in V.1.1.2; a specialist agent lacking any of the four components MUST NOT be eligible for production deployment.

### V.1.2 Agent Communication Protocol

**Inter-Agent Message Format (V.1.2.1).** A structured, technology-neutral schema for agent-to-agent and agent-to-Orchestrator communication, carrying sender identity, message type (request, response, or broadcast), a payload typed per the Reasoning Engine's output types ([Volume III, Section III.7.1.3]: Insight, Prediction, or Recommendation-draft), and provenance and confidence per the same discipline already established at [Volume III, Section III.1.4.5].

**Message Routing and Dispatch (V.1.2.2).** The Orchestrator (Part V.2) is the primary routing hub for the common case (hub-and-spoke), though direct agent-to-agent messages are permitted for tightly coupled exchanges — the Statistician (Part V.6) validating a finding for the Psychologist (Part V.4), for example — without requiring an Orchestrator round-trip for every such exchange.

**Agent Discovery and Addressing (V.1.2.3).** Every agent carries a stable, registered identity, using the same registration pattern already established for models ([Volume III, Section III.5.5.1]) applied to agent identity — a message can be addressed reliably to "the Statistician Agent" regardless of which underlying model version currently implements that role.

**Asynchronous vs. Synchronous Communication (V.1.2.4).** Mirrors the platform-wide default already established ([Volume II, Section II.1.2.1, Section II.2.3.1]: asynchronous by default). Communication within a single, bounded Orchestrator-coordinated reasoning cycle is typically synchronous; cross-cycle or long-running exchanges — awaiting a Simulation Engine result ([Volume IV]), in particular — are asynchronous, consistent with the platform's existing split rather than a separately invented rule for agents specifically.

**Message Priority and Queuing (V.1.2.5).** Mirrors the priority pattern already established for the Simulation Job Scheduler ([Volume IV, Section IV.1.2.1]): a message blocking a Recommendation's progress outranks a proactive or exploratory reasoning cycle's messages in queue ordering.

- **REQ-AGENT-003 (MUST):** Every inter-agent message MUST carry provenance and confidence per V.1.2.1; an unattributed or unscored message MUST NOT be treated as evidence by a receiving agent.

### V.1.3 Agent Memory

**Short-Term (Working) Memory (V.1.3.1).** Bounded to a single execution — the "state" described in Section V.1.1.4 — holding assembled context and accumulated intermediate reasoning for the current invocation only, cleared at termination.

**Long-Term (Persistent) Memory (V.1.3.2).** Persists across invocations for a given agent *role*, not per instance (since instances are stateless between calls, Section V.1.1.3) — storing accumulated role-specific learnings, such as confound patterns the Statistician Agent has learned to routinely check for. Distinct from and complementary to Model Governance's model-level learning ([Volume III, Section III.5.5]), which governs the underlying predictive models rather than an agent's own accumulated reasoning heuristics.

**Episodic Memory — Past Reasoning Instances (V.1.3.3).** Retrievable specific past reasoning episodes, not only consolidated learnings (Section V.1.3.2) — "the last three times a similar Recommendation was evaluated, what did the reasoning look like" — supporting few-shot-style grounding in an agent's own reasoning history.

**Shared Memory — Knowledge Graph Access (V.1.3.4).** The Knowledge Graph ([Volume III, Part III.1]) itself serves as the platform's shared memory substrate across *all* agents — not a separate per-agent store, but the same graph every agent queries, which is precisely what keeps different agents' reasoning grounded in a consistent, shared factual basis rather than each agent building up its own potentially diverging private world-model.

**Memory Garbage Collection and Consolidation (V.1.3.5).** Long-Term (Section V.1.3.2) and Episodic (Section V.1.3.3) memory are periodically consolidated and pruned, extending the Graph Pruning pattern already established at [Volume III, Section III.1.5.7] to agent memory specifically — preventing unbounded growth while retaining the most valuable, frequently referenced learnings.

**Memory Conflict Resolution (V.1.3.6).** When an agent's Long-Term memory conflicts with current Knowledge Graph state — the graph has been updated with new evidence since the agent's memory last consolidated — the Knowledge Graph (Shared Memory, Section V.1.3.4) takes precedence as the authoritative source. An agent's own Long-Term memory is a faster-access heuristic layer that can go stale, never a competing source of truth against the platform's actual current knowledge state.

- **REQ-AGENT-004 (MUST):** Knowledge Graph state MUST take precedence over an agent's Long-Term or Episodic memory in any conflict; an agent MUST NOT reason from stale memory when current graph state is available and contradicts it.
- **REQ-AGENT-005 (MUST):** Long-Term and Episodic memory MUST be subject to scheduled garbage collection (V.1.3.5); unbounded, unpruned agent memory growth is prohibited.

### V.1.4 Agent Tools

**Tool Registration and Discovery (V.1.4.1).** Mirrors the Model Registry pattern already established at [Volume III, Section III.5.5.1], applied to Tools: every tool an agent can invoke is registered with its interface schema before it is eligible for use.

**Tool Execution Sandbox (V.1.4.2).** Mirrors Simulation Isolation ([Volume IV, Section IV.1.2.6]) and the No-Direct-Production-Write Doctrine ([Volume II, Section II.2.6.1]) applied specifically to Agent Tools: a tool invocation runs within a sandboxed context with no direct write path to production systems. Agent tool use is read-heavy — querying the Knowledge Graph, Feature Engine, and the rest of the Standard Tool Catalog (Section V.1.4.5) — with the *only* write-capable outcome of any agent's reasoning being the structured Recommendation draft handed to the Orchestrator, never a direct system write of any kind.

**Tool Result Validation (V.1.4.3).** Tool outputs are validated against the tool's declared output schema (Section V.1.4.1) before the calling agent's reasoning may trust them; a malformed or unexpected result is flagged and routed per the same Dead-Letter-Queue-style handling already established at [Volume II, Section II.2.3.6], never silently consumed as though it were valid.

**Tool Access Control — Per-Agent Permissions (V.1.4.4).** Mirrors the least-privilege discipline already established at [Volume I, SEC-INPUT-001-equivalent], applied to tools: each specialist agent's own Tools and Access subsection (Sections V.3.3, V.4.3, and so on through V.12) declares its specific permitted subset of the Standard Tool Catalog (Section V.1.4.5) — the Statistician Agent has Statistical Computing Tool access; the Narrative Designer, by default, does not. Access is default-deny and explicitly granted per agent, never default-allow-all.

**Standard Tool Catalog (V.1.4.5).** Eight canonical tools every specialist agent draws its permitted subset from:

| Tool | Queries | Governing Specification |
|---|---|---|
| a. Knowledge Graph Query Tool | Causal Chain and Behavioral Path queries | [Volume III, Section III.1.6] |
| b. Feature Engine Query Tool | Player and cohort feature values | [Volume III, Part III.3] |
| c. Simulation Trigger Tool | Initiates a simulation run | [Volume IV], subject to Job Scheduler priority ([Volume IV, Section IV.1.2.1]) |
| d. Player Model Query Tool | Per-player behavioral portrait | [Volume III, Part III.5], subject to Privacy discipline ([Volume III, Section III.5.4]) |
| e. Corpus Search Tool | Corpus Concepts, including embedding similarity search | [Volume III, Part III.2, Section III.4.2.4] |
| f. Experiment Query Tool | Real experiment results | [Volume IV, Section IV.6.1] |
| g. Data Lake Query Tool | Batch and historical analysis | [Volume II, Section II.3.3] |
| h. Ethics Scoring Tool | Ethics Layer assessment | [Volume I, Section I.5.2.3] |

The Ethics Scoring Tool (h) carries a specific, important limit: it **scores**, it does not **decide or gate**. An agent may call it to obtain an ethics assessment as an input to the agent's own reasoning, exactly as the Ethics Layer's guard is independently and unconditionally re-checked at the actual gate regardless of any agent's belief about the outcome ([Volume II, Section II.2.6.3], [REQ-FLOW-016]) — an agent cannot use this tool to self-certify past the real gate.

- **REQ-AGENT-006 (MUST):** Tool access MUST be default-deny; each specialist agent's permitted tool subset MUST be explicitly declared in its own Tools and Access subsection, not inherited implicitly from the full catalog.
- **REQ-AGENT-007 (MUST):** No agent tool MUST provide a direct write path to a production system; the Recommendation draft handed to the Orchestrator is the sole write-capable output of agent reasoning.
- **REQ-AGENT-008 (MUST):** The Ethics Scoring Tool's output MUST NOT be treated by any agent as equivalent to passing the Recommendation Gate; the gate's guard (Volume II, REQ-FLOW-016) is independently enforced regardless of an agent's prior Ethics Scoring Tool query.

### V.1.5 Agent Evaluation

**Per-Agent Evaluation Criteria (V.1.5.1).** States the general pattern every specialist agent's own Evaluation Criteria subsection follows: a domain-specific quality metric, an accuracy or validity metric, and a bias or risk-check metric — visible in the recurring three-item shape of Sections V.3.4, V.4.4, V.5.4, and so on through V.12, each specialized to that agent's domain rather than reinventing the pattern's structure.

**Agent Output Quality Metrics (V.1.5.2).** Mirrors the Model Card and Evaluation Card pattern already established at [Volume III, Section III.5.5.3–4], applied to agents: an agent's output quality is tracked with the same governance discipline a narrow predictive model receives, because an agent — even though it reasons over a general-purpose model rather than implementing a single narrow prediction — is still a governed artifact subject to registration, evaluation, and drift monitoring, not an ungoverned exception to Volume III's model discipline.

**Agent Drift Detection (V.1.5.3).** Extends the canonical drift-detection mechanism ([Volume II, Section II.2.5.4]) to agent output quality specifically — an agent's reasoning quality can drift, notably when its underlying implementing model is updated (cross-referencing Model Versioning, [Volume III, Section III.5.5.1.b], applied to the agent's own implementing model) — detected and routed through the same Model-Governance-style review process.

**Agent Performance Benchmarking (V.1.5.4).** Agents are benchmarked against a standard, domain-specific evaluation set (cross-referencing Evaluation Cards, [Volume III, Section III.5.5.4]) both at initial deployment and on a recurring cadence thereafter, not validated once and assumed to remain valid indefinitely.

**Agent A/B Testing (V.1.5.5).** Extends the A/B Testing Framework already specified in [Volume IV, Section IV.6.1] to comparing two candidate implementations of the *same* agent role — two prompt versions, or two different underlying models for the Psychologist Agent — applying the same statistical rigor already established for game-mechanic experiments to agent-implementation choices rather than treating those choices as exempt from experimental validation.

- **REQ-AGENT-009 (MUST):** Every agent MUST be benchmarked against a domain-specific evaluation set before initial deployment and on a recurring cadence thereafter (V.1.5.4); a one-time evaluation at launch MUST NOT be treated as sufficient ongoing assurance.
- **REQ-AGENT-010 (MUST):** A change to an agent's underlying implementing model MUST trigger Agent Drift Detection (V.1.5.3) before the changed agent is trusted in production.

### V.1.6 Agent Failure Modes

Nine cataloged failure modes, each with its detection mechanism and mitigation, following the same catalog discipline already established for platform-level failures at [Volume II, Section II.8.1].

| # | Failure Mode | Detection | Mitigation |
|---|---|---|---|
| 1 | Hallucination and Confabulation | Fails the explanation-traceability check ([Volume III, REQ-REASON-006]) | Claim rejected if it cannot be traced to structured evidence |
| 2 | Circular Reasoning Between Agents | Provenance chain fails to terminate in a non-agent source within a bounded hop count | Chain-termination check required before a claim is treated as independently grounded |
| 3 | Agent Collusion (Coordinated Bias) | Suspiciously perfect agreement across agents sharing an underlying model | Orchestrator Conflict Resolution (Section V.2.1.4) flags rather than accepts uncritical consensus; mitigated by Agent A/B Testing (V.1.5.5) across model implementations |
| 4 | Stale Memory / Outdated Knowledge | Long-Term memory diverges from current graph state | Resolved by the precedence rule already established in Section V.1.3.6 |
| 5 | Tool Misuse and Unexpected Outputs | Tool Result Validation (Section V.1.4.3) fails | Malformed result routed to Dead-Letter-Queue-style handling, never silently consumed |
| 6 | Conflicting Recommendations from Different Agents | Independently-grounded agents reach different conclusions from the same evidence | Not treated as failure per se; resolved via Orchestrator Conflict Resolution (Section V.2.1.4), never by silent override |
| 7 | Agent Deadlock | Circular dependency in Context Assembly (Section V.2.2.4) | Timeout per the Circuit Breaker pattern ([Volume II, Section II.4.2.4]); Orchestrator breaks the cycle |
| 8 | Infinite Reasoning Loops | A single agent's reasoning fails to converge | Bounded by a maximum reasoning-step limit, mirroring the graph traversal depth limit ([Volume III, Section III.1.6.6]); forced termination and flag on limit breach |
| 9 | Detection and Mitigation Completeness | — | Every failure mode above MUST have an implemented detection mechanism before the Agent Framework is production-eligible |

- **REQ-AGENT-011 (MUST):** Every failure mode in this catalog MUST have an implemented detection mechanism before the Agent Framework is considered production-ready, mirroring [Volume II, REQ-RESIL-001–002].
- **REQ-AGENT-012 (MUST):** A conflict between two independently-grounded agents (failure mode #6) MUST route through Orchestrator Conflict Resolution; neither agent's output MUST silently override the other's.
- **REQ-AGENT-013 (MUST):** A single agent's reasoning process MUST be bounded by a maximum step or timeout limit (failure mode #8); an unbounded reasoning process MUST NOT be deployed to production.

---

*End of Part V.1 — Agent Architecture.*

*Cross-References:* [Volume I, Section I.5.2.3] (Ethics Scoring Dimensions), [Volume I, SEC-INPUT-001] (Least Privilege), [Volume I, CONST-ONEHOME-001] (One Canonical Home per Rule), [Volume II, Section II.1.2.1, Section II.2.3.1] (Event-Driven Architecture, Sync/Async Flows), [Volume II, Section II.2.3.6] (Dead Letter Queue), [Volume II, Section II.2.5.4] (Drift Detection), [Volume II, Section II.2.6.1, Section II.2.6.3] (No-Direct-Production-Write Doctrine, State Transition Guards), [Volume II, Section II.4.2.4] (Circuit Breakers), [Volume II, Section II.8.1] (Failure Mode Catalog), [Volume III, Section III.1] (Knowledge Graph Schema), [Volume III, Section III.1.4.5] (Confidence and Provenance), [Volume III, Section III.1.5.7] (Graph Pruning), [Volume III, Section III.1.6.6] (Traversal Depth Limits), [Volume III, Part III.2] (Psychology Corpus), [Volume III, Part III.3] (Feature Engineering Pipeline), [Volume III, Section III.4.2.4] (Corpus Concept Embeddings), [Volume III, Part III.5, Section III.5.4] (Player Modeling, Privacy), [Volume III, Section III.5.5] (Model Governance), [Volume III, Section III.7.1, Section III.7.3.4] (Reasoning Architecture, Natural Language Explanation Generation), [Volume III, REQ-REASON-006] (Explanation Traceability), [Volume IV, Section IV.1.2.1, Section IV.1.2.6] (Simulation Job Scheduler, Simulation Isolation), [Volume IV, Section IV.6.1] (A/B Testing Framework), [Part V.2] (Orchestrator — forward reference), [Parts V.3–V.12] (Specialist Agents — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-AGENT-001 through REQ-AGENT-013.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 10, 2026

---

## Part V.2 — Orchestrator

Part V.2 specifies the component that turns ten independent specialist agents into one coherent reasoning cycle: the Orchestrator dispatches, collects, synthesizes, and — where the agents themselves cannot agree — escalates, rather than forcing a synthesis that papers over a genuine disagreement. Section V.2.3 names and resolves a naming collision worth flagging directly: the Orchestrator's own internal "Reviewing" state (Section V.2.3.1) is not the same concept as the Recommendation Gate's "Reviewed" state already specified in [Volume II, Section II.2.6.2.b] — the two sit at different layers of the pipeline, and this Part is explicit about the distinction rather than letting the near-identical names cause confusion later.

### V.2.1 Orchestrator Role

**Central Coordination Responsibility (V.2.1.1).** The Orchestrator is the single component responsible for coordinating the ten specialist agents (Parts V.3–V.12) into a coherent reasoning cycle — mirroring the Component Responsibility Matrix pattern already established at [Volume II, Section II.1.1.2], which explicitly names dispatch and synthesis as what the Orchestrator owns and ethics gating as what it does not own. This Part restates and confirms that boundary at the Agent Framework layer rather than leaving it implicit.

**Agent Dispatch and Task Delegation (V.2.1.2).** Given an incoming, classified request (Section V.2.2.1), determines which specialist agents (Section V.2.2.2) are relevant and sends each a properly scoped task via the Inter-Agent Message Format already specified at [Section V.1.2.1].

**Result Aggregation and Synthesis (V.2.1.3).** Collects each dispatched agent's output — Insights, Predictions, or Recommendation-draft components, per the Reasoning Engine's output types ([Volume III, Section III.7.1.3]) — and synthesizes them into a coherent whole. Synthesis is explicitly not concatenation: the Orchestrator reconciles potentially differing agents' emphasis and framing into one Recommendation draft with a unified rationale, while preserving each contributing agent's individual attribution per the provenance discipline already established at [Volume III, Section III.1.4.5], so a reviewer can still see who said what even within the synthesized output.

**Conflict Resolution Between Agents (V.2.1.4).** The mechanism forward-referenced repeatedly from Part V.1's failure catalog (failure modes #3 and #6). When agents disagree on independently grounded evidence, or agree suspiciously well in a pattern consistent with collusion risk, the Orchestrator does not simply average their outputs or arbitrarily pick one — resolving conflicting expert assessments is itself a decision-theoretic problem, and averaging away disagreement is exactly the failure mode the Ethics Score's non-averaging rule ([Volume I, Section I.5.2.3]) already rejected for its own seven dimensions, now applied here to agent conflict specifically. A genuine disagreement is surfaced explicitly in the Recommendation draft's rationale, not silently resolved; a suspiciously perfect agreement is flagged for Agent A/B Testing review ([Section V.1.5.5]) rather than accepted as validating consensus.

**Escalation to Human Review (V.2.1.5).** When the Orchestrator cannot resolve a conflict (Section V.2.1.4), or its own confidence in a synthesized output falls below a configured threshold, it escalates directly to human review rather than forcing a synthesis that papers over the shortfall — mirroring the Escalation for Low-Confidence Recommendations pattern already established in [Volume IV, Section IV.6.4.3], but at an earlier point in the pipeline: this escalation can occur before a Simulation run is ever triggered, whenever the agents themselves cannot agree.

- **REQ-ORCH-001 (MUST):** The Orchestrator MUST NOT resolve agent disagreement by averaging or arbitrarily selecting one agent's output; disagreement MUST be surfaced explicitly in the Recommendation draft's rationale or escalated per V.2.1.5.
- **REQ-ORCH-002 (MUST):** Suspiciously perfect agreement across agents sharing an underlying model MUST be flagged for Agent A/B Testing review, not accepted as automatically validating consensus.

### V.2.2 Orchestration Workflow

**Request Intake and Classification (V.2.2.1).** The entry point: a request originates from a scheduled proactive sweep ([Volume II, Section II.2.8.3]'s scheduled sweep for proactive recommendation generation), a Pattern-Triggered event ([Volume III, Section III.6.3.1]), or a direct human query (a designer's specific question via Studio Tools). Classification determines which of these three intake types a request is, which in turn affects downstream Agent Selection (Section V.2.2.2) and message priority ([Section V.1.2.5]).

**Agent Selection for Request (V.2.2.2).** Determines which of the ten specialist agents (Parts V.3–V.12) are relevant to a given classified request — not every request requires all ten; a pure economy-balance question primarily engages the Economy Designer, Statistician, and Behavioral Economist, not necessarily the Narrative Designer. Selection is driven by the request's classification and the specific domain it touches.

**Parallel vs. Sequential Agent Execution (V.2.2.3).** Mirrors the platform-wide asynchronous-by-default, synchronous-for-tightly-coupled pattern already established at [Section V.1.2.4]: independent agents (a Psychologist and an Economy Designer analyzing different facets of the same request) execute in parallel; agents with a genuine dependency (the Statistician validating a specific finding before the Behavioral Economist builds on it) execute sequentially. The Orchestrator determines this per-request based on the dependency structure among the selected agents.

**Context Assembly for Each Agent (V.2.2.4).** The mechanism forward-referenced from Agent Deadlock (Section V.1.6, failure mode #7): for each dispatched agent, assembles that agent's specific Context Assembly Template (per its own Prompt Specification, [Section V.1.1.2]) with the relevant subset of Knowledge Graph, Feature, and Corpus data for the current request. A circular dependency here — Agent A's context requiring Agent B's not-yet-produced output, and vice versa — is precisely what produces Deadlock, so dependency order (per Section V.2.2.3's determination) is resolved *before* dispatch, not discovered as a cycle mid-execution.

**Result Collection and Merging (V.2.2.5).** Collects results from all dispatched agents, respecting the parallel or sequential execution order established in Section V.2.2.3, with a per-agent timeout using the Circuit Breaker pattern already specified as Agent Deadlock's mitigation ([Volume II, Section II.4.2.4]). Merged results feed directly into Result Aggregation and Synthesis (Section V.2.1.3).

**Recommendation Draft Assembly (V.2.2.6).** The structured Recommendation record ([Volume II, Section II.2.1.9] schema) is assembled from the synthesized agent output (Section V.2.1.3) — the concrete point at which Agent Framework output becomes the Volume II artifact that enters the Recommendation Gate state machine.

**Ethics Scoring Trigger (V.2.2.7).** The Orchestrator triggers the actual, authoritative Ethics Layer scoring ([Volume II, Section II.2.1.9]) once the Recommendation Draft (Section V.2.2.6) is assembled — distinct from any individual agent's own informational Ethics Scoring Tool query ([Section V.1.4.5.h]). This is the real scoring event that produces the Ethics Score Card attached to the Recommendation, not a preview an agent consulted along the way.

**Human Review Queue Submission (V.2.2.8).** Once scored (Section V.2.2.7), the Recommendation enters the Proposed state ([Volume II, Section II.2.6.2.a]) and is submitted to the Human Review queue. The Orchestrator's workflow terminates here, handing off entirely to the Recommendation Gate state machine ([Volume II, Section II.2.6.2]), which governs everything from this point forward — closing the loop from Agent Framework output to the governance mechanics Volume II already fully specifies.

- **REQ-ORCH-003 (MUST):** Context Assembly (V.2.2.4) MUST resolve inter-agent dependency order before dispatch; a circular context dependency MUST be detected and broken before agent invocation begins, not discovered mid-execution.
- **REQ-ORCH-004 (MUST):** The Ethics Scoring Trigger (V.2.2.7) MUST be a distinct, authoritative scoring event, independent of any agent's own prior Ethics Scoring Tool queries during Result Aggregation.

### V.2.3 Orchestrator State Machine

**States (V.2.3.1).** Seven states: Idle (no active request), Planning (Sections V.2.2.1–2: intake, classification, agent selection), Dispatching (Sections V.2.2.3–4: execution order determined, context assembled, agents invoked), Collecting (Section V.2.2.5: gathering agent results), Synthesizing (Sections V.2.1.3, V.2.2.6: aggregation and Recommendation Draft assembly), Reviewing (Section V.2.2.7: awaiting the Ethics Scoring result), and Complete (Section V.2.2.8: submitted to the Human Review queue). **Naming note:** the Orchestrator's internal "Reviewing" state is a distinct concept from the Recommendation Gate's "Reviewed" state already specified in [Volume II, Section II.2.6.2.b] — the former describes the Orchestrator awaiting an Ethics Score before it can finish assembling a Recommendation; the latter describes a fully assembled, already-scored Recommendation awaiting a human decision. The near-identical names are noted explicitly here to prevent the two being conflated in implementation or in review discussion.

**State Transitions (V.2.3.2).** Idle → Planning (request received); Planning → Dispatching (agents selected, execution order determined); Dispatching → Collecting (agents invoked); Collecting → Synthesizing (all results received, or timeout per Section V.2.3.3); Synthesizing → Reviewing (Draft assembled) or Synthesizing → Idle-with-Escalation (per Section V.2.1.5, when a conflict is unresolvable — no draft is produced at all in this branch, the cycle escalates directly instead); Reviewing → Complete (Ethics Score obtained, Recommendation submitted) or Reviewing → Idle-with-Escalation (in the narrower case where Orchestrator-level confidence remains too low even after ethics scoring). Escalation is possible at more than one point in the cycle, not only at a single fixed checkpoint.

**Error and Timeout Handling (V.2.3.3).** Extends the Circuit Breaker and Retry/Timeout Policies already specified at [Volume II, Section II.4.2.4–5] to Orchestrator-to-Agent calls specifically; a timed-out agent's absence is handled by the fallback logic in Section V.2.3.4 rather than blocking the entire reasoning cycle indefinitely.

**Retry and Fallback Logic (V.2.3.4).** A failed or timed-out agent invocation retries with bounded, exponential-backoff-with-jitter retry per [Volume II, Section II.4.2.5]. If retries exhaust, the Orchestrator proceeds with a Recommendation Draft explicitly marked as missing that agent's input — never silently proceeding as though the missing agent had nothing relevant to contribute. This transparency matters concretely: a Recommendation missing, for example, the Statistician's validation must be visibly flagged as such to a human reviewer, not presented as though it had been statistically validated when it had not.

- **REQ-ORCH-005 (MUST):** A Recommendation Draft assembled after exhausting retries for a missing agent MUST be explicitly flagged as missing that agent's input; it MUST NOT be presented to a human reviewer as though the agent had contributed.
- **REQ-ORCH-006 (MUST):** The Orchestrator's internal "Reviewing" state MUST NOT be conflated with the Recommendation Gate's "Reviewed" state in implementation, logging, or dashboard presentation; the two MUST be visually and terminologically distinguishable to a reviewer.

---

*End of Part V.2 — Orchestrator.*

*Cross-References:* [Volume I, Section I.5.2.3] (Ethics Scoring Dimensions), [Volume II, Section II.1.1.2] (Component Responsibility Matrix), [Volume II, Section II.2.1.9] (Recommendation Generation), [Volume II, Section II.2.6.2] (Recommendation State Machine), [Volume II, Section II.2.8.3] (Agent Reasoning Job Flow), [Volume II, Section II.4.2.4–5] (Circuit Breakers, Retry and Timeout Policies), [Volume III, Section III.1.4.5] (Confidence and Provenance), [Volume III, Section III.6.3.1] (Pattern-Triggered Recommendations), [Volume III, Section III.7.1.3] (Reasoning Engine Outputs), [Volume IV, Section IV.6.4.3] (Escalation for Low-Confidence Recommendations), [Part V.1, Section V.1.1.2, Section V.1.2.1, Section V.1.2.4–5, Section V.1.4.5, Section V.1.5.5, Section V.1.6] (Agent Anatomy, Message Format, Communication Timing, Standard Tool Catalog, Agent A/B Testing, Failure Modes), [Parts V.3–V.12] (Specialist Agents — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-ORCH-001 through REQ-ORCH-006.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 10, 2026

---

## Part V.3 — Chief Research Officer Agent

The Chief Research Officer Agent is the platform's deliberately non-specialized agent: where every other specialist agent (Parts V.4–V.12) goes deep in one domain, the CRO goes wide, and its output typically hands other agents a hypothesis worth their specialized attention rather than a finished finding.

### V.3.1 Role and Responsibilities

**Strategic Research Direction (V.3.1.1).** Sets the platform's overall research agenda — which corpus domains ([Volume III, Section III.2]) or feature dimensions ([Volume III, Section III.3.2]) deserve deeper investigation given current priorities. The CRO decides *where* the platform points its reasoning effort, not what any single answer is.

**Hypothesis Generation (V.3.1.2).** Proposes candidate causal hypotheses — using the Inductive and Abductive reasoning types specified in [Volume III, Section III.7.1.4] — drawing on Pattern Mining output ([Volume III, Part III.6]) and this agent's own cross-domain synthesis (Section V.3.1.4) to surface hypotheses no single narrower specialist would be positioned to connect.

**Research Prioritization (V.3.1.3).** Ranks candidate hypotheses and questions for Simulation and Experimentation resources ([Volume IV]) — a resource-allocation role at a higher level than the Simulation Job Scheduler's own priority mechanism ([Volume IV, Section IV.1.2.1]): the CRO decides which *question* deserves investigation, not which already-queued job runs first.

**Cross-Domain Synthesis (V.3.1.4).** The agent's defining capability: synthesizing findings across all eleven Psychology Corpus domains ([Volume III, Part III.2]) and across other specialist agents' outputs (Parts V.4–V.12) into a coherent picture no single-domain agent would produce. This is what distinguishes the CRO from every other specialist agent — its job is explicitly not to specialize, but to integrate.

### V.3.2 Prompt Specification

**System Prompt (V.3.2.1).** Establishes the CRO's identity as broad and integrative rather than narrowly domain-expert, explicitly instructed to draw connections across domains other agents are not positioned to see.

**Context Assembly Template (V.3.2.2).** Draws a wide but shallow context slice — summaries across many corpus domains and recent patterns — in deliberate contrast to a domain specialist's narrow-but-deep template (compare the Psychologist's template, Section V.4.2.2).

**Output Format Specification (V.3.2.3).** Produces Insights and Predictions primarily ([Volume III, Section III.7.1.3]), often *feeding* other agents' more detailed work rather than directly producing Recommendation-draft components — a typical CRO output reads as "this hypothesis is worth the Psychologist and Statistician investigating together," not a fully formed recommendation in its own right.

### V.3.3 Tools and Access

**Permitted Tools (V.3.3.1).** From the Standard Tool Catalog ([Section V.1.4.5]): Knowledge Graph Query (a), Corpus Search (e), Data Lake Query (g) — broad read access reflecting the integrative role. Notably absent: Simulation Trigger (c) and Ethics Scoring (h) — the CRO generates and prioritizes questions; it does not run or score them itself, deferring those actions to the specialist agents it hands hypotheses to, or to the Orchestrator and Ethics Layer directly.

**Knowledge Graph Access Scope (V.3.3.2).** Broad, cross-domain traversal permitted, not restricted to any single node-type neighborhood — integrative synthesis requires visibility across the graph's full structure.

**Corpus Access Scope (V.3.3.3).** All eleven Psychology Corpus domains ([Volume III, Section III.2.2–III.2.11]) — the only specialist agent with unrestricted full-corpus access by design, since cross-domain synthesis is precisely this agent's function, in deliberate contrast to every other specialist agent's domain-restricted access under the default-deny pattern already established in [Section V.1.4.4].

### V.3.4 Evaluation Criteria

**Research Quality Metrics (V.3.4.1).** Whether the CRO's generated hypotheses are genuinely novel and non-redundant with existing corpus concepts or already-investigated questions, checked against Episodic Memory ([Section V.1.3.3]).

**Hypothesis Novelty and Validity (V.3.4.2).** A two-part check: Novelty (not already covered) and Validity — grounded in actual corpus or graph evidence, not pure speculation. Even an Inductive or Abductive hypothesis must remain traceable per [Volume III, REQ-REASON-002, REQ-REASON-006], despite carrying explicitly lower certainty than Deductive or Causal reasoning by construction.

**Impact Assessment (V.3.4.3).** Tracks whether hypotheses the CRO prioritized (Section V.3.1.3) actually led to valuable downstream findings or Recommendations, extending the Forecast Accuracy Tracking pattern ([Volume IV, Section IV.5.3.2]) to hypothesis-value tracking specifically. A CRO whose prioritized hypotheses rarely pan out has a measurable performance problem this metric is designed to surface.

- **REQ-CRO-001 (MUST):** A CRO-generated hypothesis MUST be traceable to structured evidence per [Volume III, REQ-REASON-006], even where the underlying reasoning type is Inductive or Abductive rather than Deductive or Causal.
- **REQ-CRO-002 (MUST):** The CRO Agent MUST NOT trigger Simulation runs or Ethics Scoring directly; these actions remain the responsibility of the specialist agent or Orchestrator the CRO's hypothesis is handed to.

---

*End of Part V.3 — Chief Research Officer Agent.*

*Cross-References:* [Volume III, Part III.2] (Psychology Corpus), [Volume III, Part III.6] (Pattern Mining), [Volume III, Section III.7.1.3–4] (Reasoning Engine Outputs and Types), [Volume III, REQ-REASON-002, REQ-REASON-006] (Reasoning Type Labeling, Explanation Traceability), [Volume IV, Section IV.1.2.1] (Simulation Job Scheduler), [Volume IV, Section IV.5.3.2] (Forecast Accuracy Tracking), [Part V.1, Section V.1.3.3, Section V.1.4.4–5] (Episodic Memory, Tool Access Control, Standard Tool Catalog), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-CRO-001 through REQ-CRO-002.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 10, 2026

---

## Part V.4 — Psychologist Agent

The Psychologist Agent is the platform's primary interpretive voice — the agent whose specific job is to say what an observed behavior *means* psychologically, always grounded in a cited Corpus Concept rather than freelance speculation. Section V.4.4.3's bias check is this Part's most important content: a psychological interpretation is exactly as capable of *over*-reading normal behavior as it is of missing a genuine concern, and this Part treats both failure directions as real.

### V.4.1 Role and Responsibilities

**Behavioral Interpretation (V.4.1.1).** Interprets observed Behavior nodes ([Volume III, Section III.1.2], type #2) through the Psychology Corpus's frameworks — the core "what does this behavior mean" function underlying most of this agent's output.

**Emotional State Assessment (V.4.1.2).** Infers or assesses Emotion node states ([Volume III, Section III.1.2], type #3), drawing on the abductive-reasoning basis for Emotion inference already established in [Volume III, Section III.7.1.4], and cross-referencing the Persona Emotional State Model ([Volume IV, Section IV.2.3.2]) specifically when interpreting simulation output rather than real player data.

**Motivational Analysis (V.4.1.3).** Assesses Motivation node states ([Volume III, Section III.1.2], type #4) — which motivational framework (Self-Determination Theory, Bartle, or another from [Volume III, Section III.2.4]) best explains an observed behavior pattern.

**Psychological Pattern Identification (V.4.1.4).** Provides the genuine psychological interpretation a mined pattern requires when Pattern-to-Corpus Mapping ([Volume III, Section III.6.2.2]) needs judgment beyond simple keyword or statistical matching — this agent is the one that actually performs that mapping's interpretive step where it is non-trivial.

### V.4.2 Prompt Specification

**System Prompt (V.4.2.1).** Establishes deep psychology-domain expertise with an explicit instruction to ground every interpretation in a specific, cited Corpus Concept — never freelance psychological speculation. This is the literal operating instruction implementing the prohibition on unsupported psychological assertions already established at [Volume III, REQ-CORPUS-001] for this specific agent.

**Context Assembly Template (V.4.2.2).** Narrow but deep: full behavioral history for the specific player, persona, or pattern under examination, plus the relevant Psychology-domain corpus concepts — in deliberate contrast to the Chief Research Officer's wide-but-shallow template (Section V.3.2.2).

**Output Format Specification (V.4.2.3).** Produces Insights (interpretive findings) and feeds Predictions — Satisfaction Prediction ([Volume III, Section III.5.3]) in particular draws heavily on this agent's interpretive work, since satisfaction is itself a proxy, inferred prediction rather than a directly observable quantity. Every output carries an explicit Corpus Concept citation per the System Prompt's requirement.

### V.4.3 Tools and Access

**Permitted Tools (V.4.3.1).** Knowledge Graph Query (a), Corpus Search (e) restricted to Psychology domains (Section V.4.3.3), and Player Model Query (d) subject to the privacy discipline already established at [Volume III, Section III.5.4]. Notably absent: Data Lake Query (g), which sits more naturally within the Statistician's territory (Part V.6), and Simulation Trigger (c).

**Knowledge Graph Access Scope (V.4.3.2).** Focused on the Player→Behavior→Emotion→Motivation subgraph specifically — the psychological slice of the graph — rather than Economy- or Mechanic-heavy subgraphs a different specialist agent would traverse.

**Corpus Access Scope — Psychology Domains (V.4.3.3).** Restricted to the psychology-adjacent domains specifically: Game Psychology ([Volume III, Section III.2.2]), Motivation Theory ([Section III.2.4]), Cognitive Science ([Section III.2.5]), and Social Dynamics ([Section III.2.7]) — not Marketing Science ([Section III.2.9]) or Education ([Section III.2.10]), which are less relevant to this agent's core interpretive function, consistent with the default-deny access pattern already established at [Section V.1.4.4].

### V.4.4 Evaluation Criteria

**Interpretation Accuracy (V.4.4.1).** Validated against real outcomes where available, extending the Outcome Prediction Accuracy pattern ([Volume III, Section III.3.4.3]): does an interpreted "frustration" state actually correlate with subsequent churn or negative outcomes as the interpretation would predict.

**Evidence Citation Quality (V.4.4.2).** Checks that every interpretation cites a genuinely applicable Corpus Concept, not a mismatched or overly generic one — a stricter, agent-specific check layered on top of the platform-wide requirement already established at [Volume III, REQ-CORPUS-001].

**Bias and Over-Pathologizing Checks (V.4.4.3).** Guards explicitly against the Psychologist Agent over-pathologizing ordinary player behavior — labeling normal disengagement as "frustration," or ordinary risk-taking as a "compulsive" pattern when it is actually benign. This connects directly to the clinical criteria already specified for Game Addiction ([Volume III, Section III.2.2.6]), which distinguishes healthy high engagement from clinically relevant compulsive engagement, and this agent must apply that distinction carefully rather than defaulting to a clinical-sounding label whenever one is available. This is a genuinely two-sided calibration challenge, named as its own explicit criterion rather than left implicit: over-pathologizing risks feeding inappropriate, paternalistic design changes; under-pathologizing risks missing a genuine vulnerable-population concern ([Volume I, Section I.5.1.4]). Neither error is treated as the safer default.

- **REQ-PSYCH-001 (MUST):** Every psychological interpretation produced by this agent MUST cite a specific Corpus Concept from its permitted Psychology domains (V.4.3.3); a generic or domain-mismatched citation MUST fail Evidence Citation Quality review.
- **REQ-PSYCH-002 (MUST):** This agent's output MUST be evaluated for both over-pathologizing and under-pathologizing error directions (V.4.4.3); an evaluation process checking only one direction MUST NOT be considered complete.

---

*End of Part V.4 — Psychologist Agent.*

*Cross-References:* [Volume I, Section I.5.1.4] (Vulnerable Population Protections), [Volume III, Section III.1.2] (Behavior, Emotion, Motivation Node Types), [Volume III, Section III.2.2, Section III.2.2.6, Section III.2.4, Section III.2.5, Section III.2.7] (Game Psychology, Game Addiction, Motivation Theory, Cognitive Science, Social Dynamics Domains), [Volume III, Section III.3.4.3] (Outcome Prediction Accuracy), [Volume III, Section III.5.3] (Predictive Models — Satisfaction Prediction), [Volume III, Section III.5.4] (Player Model Privacy), [Volume III, Section III.6.2.2] (Pattern-to-Corpus Mapping), [Volume III, Section III.7.1.4] (Reasoning Types), [Volume III, REQ-CORPUS-001] (Corpus-Grounding Requirement), [Volume IV, Section IV.2.3.2] (Persona Emotional State Model), [Part V.1, Section V.1.4.4] (Tool Access Control), [Part V.3, Section V.3.2.2] (Chief Research Officer Context Assembly), [Part V.6] (Statistician Agent — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-PSYCH-001 through REQ-PSYCH-002.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 10, 2026

---

## Part V.5 — Behavioral Economist Agent

The Behavioral Economist Agent interprets player *economic* behavior — distinct from the Economy Designer (Part V.7), which designs the systems themselves. This agent is also a primary voice, alongside the Ethics Officer (Part V.11), on where legitimate choice architecture ends and a dark pattern begins.

### V.5.1 Role and Responsibilities

**Economic Behavior Analysis (V.5.1.1).** Analyzes player economic decision patterns through the Behavioral Economics domain lens ([Volume III, Section III.2.3]) — interpreting observed or simulated economic behavior itself, distinct from the Economy Designer's focus on the mechanic and system design that produces it.

**Spending Pattern Interpretation (V.5.1.2).** Interprets spending-related features — Purchase Friction, Economic Rationality Index, Loss Sensitivity ([Volume III, Section III.3.2], #7, #15, #23) — through the Prospect Theory and Mental Accounting lens ([Section III.2.3]), performing for economic behavior the same interpretive function the Psychologist performs for behavior generally.

**Choice Architecture Assessment (V.5.1.3).** Evaluates a proposed UI or flow design's choice architecture ([Volume III, Section III.2.3.7]) for whether it constitutes legitimate friction reduction or crosses into dark-pattern territory. This agent is a primary voice on the Manipulation Boundary's informed-endorsement test ([Volume I, Section I.5.1.3]) specifically for economic and choice-architecture-relevant Recommendations.

**Economic Health Diagnosis (V.5.1.4).** Diagnoses overall economic health signals — drawing on the Economy Health Metrics already specified in [Volume IV, Section IV.3.3]: velocity, Gini coefficient, price stability — from a *behavioral* perspective, explaining why the numbers are what they are rather than only reporting what they are, complementing the Economy Designer's more mechanical, systems-level view.

### V.5.2 Prompt Specification

**System Prompt (V.5.2.1).** Establishes deep behavioral-economics expertise with an explicit instruction to flag Manipulation-Boundary-relevant findings (Section V.5.1.3) proactively, rather than waiting to be specifically asked to evaluate a design's ethics.

**Context Assembly Template (V.5.2.2).** Player or cohort economic feature history plus relevant Behavioral Economics corpus concepts, and — when evaluating a proposed design — the specific choice-architecture details of that design.

**Output Format Specification (V.5.2.3).** Insights and Predictions on economic behavior, plus a distinct Manipulation Risk flag specifically for choice-architecture assessments (Section V.5.1.3), which feeds as an input into the Ethics Scoring Tool's Manipulation Risk dimension consideration ([Section V.1.4.5.h]) — this agent's flag is an input to scoring, not itself authoritative.

### V.5.3 Tools and Access

**Permitted Tools (V.5.3.1).** Knowledge Graph Query (a), Feature Engine Query (b), Corpus Search (e, Behavioral Economics domain), and — notably — the Ethics Scoring Tool (h), granted specifically because of this agent's Manipulation-Boundary-adjacent role (Section V.5.1.3), in deliberate contrast to the Psychologist Agent, which does not carry this permission. Tool access genuinely varies by domain relevance; it is not copied uniformly across agents.

**Knowledge Graph Access Scope (V.5.3.2).** Focused on the Economy, Mechanic, and Behavior subgraph.

**Corpus Access Scope — Behavioral Economics Domain (V.5.3.3).** Behavioral Economics ([Section III.2.3]) primarily, Decision Theory ([Section III.2.11]) secondarily, given the close relationship already established between the two — Decision Theory's Rational Choice model is the normative baseline Behavioral Economics is defined as a set of departures from ([Section III.2.11.1]).

### V.5.4 Evaluation Criteria

**Economic Model Validity (V.5.4.1).** Checks whether this agent applies the *correct* behavioral departure ([Section III.2.3.1] and related concepts) for an observed pattern, rather than any plausible-sounding one — validity, not merely plausibility.

**Prediction Accuracy (V.5.4.2).** Extends the Spending Prediction validation pattern ([Volume III, Section III.5.3]): this agent's economic-behavior forecasts are checked against real measured outcomes.

**Manipulation Risk Assessment (V.5.4.3).** The agent's own Manipulation Risk flagging (Section V.5.2.3) is itself checked for calibration — neither over-flagging nor under-flagging — mirroring the two-sided calibration concern already established for the Psychologist Agent's pathologizing checks ([Section V.4.4.3]), applied here to economic and choice-architecture judgments specifically. A Behavioral Economist that never flags anything is exactly as much a problem as one that flags everything; both directions are evaluated.

- **REQ-BEHECON-001 (MUST):** This agent's Manipulation Risk flags MUST be evaluated for both over-flagging and under-flagging calibration error (V.5.4.3), not only for whether flags were raised.
- **REQ-BEHECON-002 (MUST):** A Choice Architecture Assessment MUST be routed through the Manipulation Boundary test ([Volume I, Section I.5.1.3]) rather than resolved solely by this agent's own judgment; this agent's flag is an input to Ethics Scoring, not a substitute for it.

---

*End of Part V.5 — Behavioral Economist Agent.*

*Cross-References:* [Volume I, Section I.5.1.3] (Manipulation Boundary), [Volume III, Section III.2.3, Section III.2.3.7, Section III.2.11.1] (Behavioral Economics Domain, Choice Architecture, Rational Choice Models), [Volume III, Section III.3.2] (Feature Catalog), [Volume III, Section III.5.3] (Predictive Models), [Volume IV, Section IV.3.3] (Economy Health Metrics), [Part V.1, Section V.1.4.5.h] (Ethics Scoring Tool), [Part V.4, Section V.4.4.3] (Bias and Over-Pathologizing Checks), [Part V.7] (Economy Designer Agent — forward reference), [Part V.11] (Ethics Officer Agent — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-BEHECON-001 through REQ-BEHECON-002.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 10, 2026

---

## Part V.6 — Statistician Agent

The Statistician Agent is the platform's institutional skeptic — the agent whose explicit role is to not share the enthusiasm another domain specialist might have for a promising-looking result. Section V.6.4.1 asks the question this Part's own framing invites: if this agent is the platform's check on everyone else's statistics, who checks the Statistician.

### V.6.1 Role and Responsibilities

**Statistical Validity Assessment (V.6.1.1).** Reviews other agents' and pipeline stages' statistical claims — Predictive Validity, Causal Validity ([Volume III, Section III.3.4.2–3]) — for correctness, serving as the general validity-checking role across the platform's reasoning output.

**Significance Testing (V.6.1.2).** Performs and reviews actual significance tests, the agent-level execution of the Multiple Comparison Corrections and Sequential Testing methodologies already specified in [Volume IV, Section IV.6.2.3–4].

**Sample Size and Power Analysis (V.6.1.3).** Performs the actual power analysis specified in [Volume IV, Section IV.6.1.3] when a real experiment ([Volume IV, Part IV.6]) is being planned, typically working closely with the Experiment Planner Agent (Part V.12).

**Confound Detection (V.6.1.4).** The concrete agent-level execution of the Confounders and Confounding Control methodology already specified in [Volume III, Section III.7.2.4] — this agent is the one that actually identifies candidate confounders for a proposed causal claim.

**Uncertainty Quantification (V.6.1.5).** Ensures every quantitative claim passing through this agent's review carries appropriate uncertainty bounds — extending Confidence Intervals ([Volume IV, Section IV.5.1.2]) and Model Confidence ([Volume III, Section III.5.1.4]) — rather than allowing false precision to pass unchecked.

### V.6.2 Prompt Specification

**System Prompt (V.6.2.1).** Establishes rigorous statistical skepticism as the default posture, explicitly instructed to serve as the conservative check on other agents' more domain-enthusiastic claims — the operating instruction behind Section V.6.4.3's evaluation criterion.

**Context Assembly Template (V.6.2.2).** The specific quantitative claim or dataset under review, from whichever agent or pipeline stage requested statistical validation, plus the relevant methodology references ([Volume III, Section III.7.2]; [Volume IV, Part IV.6]).

**Output Format Specification (V.6.2.3).** A Validity Assessment — pass, fail, or conditional against specific statistical criteria — attached to the claim under review, always with explicit confidence intervals or uncertainty bounds (Section V.6.1.5) rather than a point-estimate-only finding.

### V.6.3 Tools and Access

**Permitted Tools (V.6.3.1).** Data Lake Query (g), Statistical Computing Tools (Section V.6.3.2), and Experiment Query Tool (f).

**Statistical Computing Tools (V.6.3.2).** A specialized tool beyond the Standard Tool Catalog's original eight ([Section V.1.4.5]) — the first specialist agent to require a tool outside that default set, demonstrating the catalog's extensibility point explicitly: actual statistical computation capability (running power analyses, significance tests, confound-detection algorithms), registered under the same Tool Registration discipline ([Section V.1.4.1]) as any catalog tool.

**Data Lake Query Access (V.6.3.3).** Full batch and historical query access ([Volume II, Section II.3.3]), broader than most specialist agents receive, given this agent's need to run independent statistical analyses rather than relying solely on pre-computed Features.

### V.6.4 Evaluation Criteria

**Statistical Correctness (V.6.4.1).** The technical correctness of this agent's own statistical work, checked via Agent A/B Testing ([Section V.1.5.5]) or dedicated peer-review-style validation — a meta-check, since this agent is itself the platform's check on other agents' statistics, and that role does not exempt its own output from independent verification.

**Methodological Rigor (V.6.4.2).** Whether this agent selects and applies the *correct* method for a given question — per the evidentiary-strength ordering already established in Causal Effect Estimation Methods ([Volume III, Section III.7.2.7]) — not merely *a* technically valid method chosen without regard to fit.

**Conservative Reporting — Avoiding Overstatement (V.6.4.3).** This agent's defining evaluation criterion, given its institutional role as the conservative check (Section V.6.2.1): does it appropriately avoid overstating confidence or significance, consistent with the honesty-about-confidence discipline established throughout this specification ([Volume III, Section III.2.1.5, Section III.7.3.5]). This criterion specifically checks that the Statistician does not succumb to the same result-enthusiasm pressure a domain specialist (a Behavioral Economist or Game Designer motivated to see a positive finding) might reasonably feel — the Statistician's entire institutional purpose is to not share that motivation.

- **REQ-STAT-001 (MUST):** The Statistician Agent's own statistical output MUST be subject to independent verification (V.6.4.1); this agent's institutional role as validator of others MUST NOT exempt its own work from validation.
- **REQ-STAT-002 (MUST):** This agent MUST NOT report a statistical finding without accompanying uncertainty bounds (V.6.1.5); a point estimate presented without a confidence interval MUST be rejected at the Validity Assessment stage.

---

*End of Part V.6 — Statistician Agent.*

*Cross-References:* [Volume III, Section III.2.1.5] (Corpus Quality Metrics), [Volume III, Section III.3.4.2–3] (Predictive and Causal Validity), [Volume III, Section III.7.2.4, Section III.7.2.7] (Confounders, Causal Effect Estimation Methods), [Volume III, Section III.7.3.5] (Confidence in Explanations), [Volume IV, Section IV.5.1.2] (Confidence Intervals), [Volume IV, Section IV.6.1.3, Section IV.6.2.3–4] (Statistical Power, Sequential Testing, Multiple Comparison Corrections), [Part V.1, Section V.1.4.1, Section V.1.4.5, Section V.1.5.5] (Tool Registration, Standard Tool Catalog, Agent A/B Testing), [Part V.12] (Experiment Planner Agent — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-STAT-001 through REQ-STAT-002.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 10, 2026

---

## Part V.7 — Economy Designer Agent

The Economy Designer Agent proposes actual economy *design* changes — mechanic and system-level, complementing rather than duplicating the Behavioral Economist's focus on interpreting player economic behavior (Part V.5). Its recommendations are expected to arrive simulation-backed by default, not as design intuition alone.

### V.7.1 Role and Responsibilities

**Virtual Economy Design Recommendations (V.7.1.1).** Proposes concrete design changes — faucet, sink, and pricing adjustments — drawing on the Economy Design Principles already specified in [Volume III, Section III.2.6.5], distinct from the Behavioral Economist's interpretive focus (Part V.5) on why players behave as they do within an existing design.

**Balance Assessment (V.7.1.2).** Assesses whether a proposed or existing economy design is balanced, interpreting the simulated or measured data already established in [Volume IV, Section IV.3.3], particularly Sink/Source Balance ([Section IV.3.3.5]).

**Inflation/Deflation Risk (V.7.1.3).** Interprets the Inflation and Deflation Simulation forecasts already specified in [Volume IV, Section IV.3.1.4] and proposes design adjustments to correct projected inflationary or deflationary pressure before it manifests in a live economy.

**Sink/Source Optimization (V.7.1.4).** A primary consumer of Evolutionary Search results ([Volume IV, Section IV.8.2.1]) specifically for economy parameters, translating optimizer output — a point on the Pareto frontier ([Volume IV, Section IV.8.2.3]) — into an actual design recommendation a human reviewer can evaluate in design terms, not raw parameter values.

### V.7.2 Prompt Specification

**System Prompt (V.7.2.1).** Establishes economy-design expertise with an explicit instruction to always accompany a design recommendation with its expected Economy Health Metrics impact ([Volume IV, Section IV.3.3]), and not to propose changes without simulation-backed evidence, per the Minimum Simulation Coverage requirement already established at [Volume IV, Section IV.6.4.1].

**Context Assembly Template (V.7.2.2).** Current economy state (Economy nodes and Influences edges, [Volume III, Section III.1.2–3]), recent Economy Simulation results ([Volume IV, Part IV.3]), and relevant Economy Design corpus concepts ([Volume III, Section III.2.6.5]).

**Output Format Specification (V.7.2.3).** Recommendation-draft components for economy-touching changes, each attached to a Simulation Trigger request ([Section V.1.4.5.c]) when not already backed by existing simulation data — this agent is among the specialist agents most likely to directly trigger simulations, given the design-proposal nature of its work.

### V.7.3 Tools and Access

**Permitted Tools (V.7.3.1).** Knowledge Graph Query (a), Simulation Trigger (c) — notably granted here, in contrast to the Psychologist and Chief Research Officer, since economy design proposals inherently require simulation validation — and Feature Engine Query (b).

**Economy Simulation Access (V.7.3.2).** A further-scoped permission within the general Simulation Trigger tool: this agent can trigger Economy Simulation type runs specifically ([Volume IV, Section IV.1.1.3]), not arbitrary Player Behavior or Social Simulation runs outside its domain. Tool access is not only binary per-tool; it can be scoped to a specific capability within a tool as well.

**Knowledge Graph Access Scope (V.7.3.3).** Focused on the Economy and Mechanic subgraph.

### V.7.4 Evaluation Criteria

**Economy Health Improvement (V.7.4.1).** Whether a recommendation actually improves the Economy Health Metrics ([Section IV.3.3]) when deployed or simulated — the core outcome-effectiveness check.

**Long-Term Sustainability (V.7.4.2).** Distinct from immediate improvement: whether the design remains healthy over longer simulated or real horizons, per the long-term tier of Time-Horizon Forecasting ([Volume IV, Section IV.5.1.4]). A design that improves short-term metrics while creating a long-term structural problem — unsustainable sink dependency, for instance — fails this criterion even where it passes V.7.4.1.

**Player Fairness (V.7.4.3).** Extends the mandatory Wealth Distribution reporting already established at [Volume IV, REQ-ECON-003]: this agent's recommendations are specifically checked for whether they worsen or improve wealth distribution fairness, not evaluated against aggregate economy health alone.

- **REQ-ECONDESIGN-001 (MUST):** An economy-design Recommendation MUST be accompanied by a simulation-backed Economy Health Metrics forecast before it may be proposed; a design proposal without simulation backing MUST NOT proceed past this agent's own output stage.
- **REQ-ECONDESIGN-002 (MUST):** A recommendation improving short-term Economy Health Metrics while failing Long-Term Sustainability (V.7.4.2) MUST NOT be scored as successful on V.7.4.1 alone; both criteria MUST be satisfied.

---

*End of Part V.7 — Economy Designer Agent.*

*Cross-References:* [Volume III, Section III.1.2–3] (Economy Node and Influences Edge Types), [Volume III, Section III.2.6.5] (Economy Design Principles), [Volume IV, Section IV.3.1.4–5, Section IV.3.3] (Inflation/Deflation Simulation, Sink and Source Modeling, Economy Health Metrics), [Volume IV, Section IV.5.1.4] (Time-Horizon Forecasting), [Volume IV, Section IV.6.4.1] (Minimum Simulation Coverage), [Volume IV, Section IV.8.2.1, Section IV.8.2.3] (Parameter Space Exploration, Pareto Frontier Analysis), [Volume IV, REQ-ECON-003] (Mandatory Wealth Distribution Reporting), [Part V.5] (Behavioral Economist Agent), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-ECONDESIGN-001 through REQ-ECONDESIGN-002.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 10, 2026

---

## Part V.8 — Game Designer Agent

The Game Designer Agent proposes mechanic, difficulty, pacing, and onboarding changes — the platform's broadest design-craft voice. Section V.8.4.2 draws a deliberate line this agent's own incentive structure could otherwise blur: engagement and satisfaction are scored separately, precisely because a design can raise one while quietly eroding the other.

### V.8.1 Role and Responsibilities

**Mechanic Design Recommendations (V.8.1.1).** Proposes game mechanic changes across a broader scope than the Economy Designer's economy-specific focus — difficulty, pacing, onboarding, and general engagement mechanics — drawing on the Game Design corpus domain broadly ([Volume III, Section III.2.6]: the MDA Framework, Game Feel, and the rest of that domain, not only Economy Design Principles specifically).

**Difficulty and Pacing Assessment (V.8.1.2).** Assesses whether a current or proposed difficulty curve produces healthy Flow-Stability outcomes ([Volume III, Section III.3.2], feature #10), drawing on Difficulty Curves and Pacing and Flow Theory ([Volume III, Section III.2.6.3, Section III.2.2.3]).

**Engagement Optimization (V.8.1.3).** Proposes mechanic changes to improve Engagement Breadth and the Habitual-vs-Exploratory Ratio ([Volume III, Section III.3.2], features #11, #17) — explicitly distinguished from the Monetization Advisor's revenue-focused optimization (Part V.10): this agent optimizes for engagement *quality* and design coherence, not revenue.

**Onboarding Effectiveness (V.8.1.4).** Assesses and proposes improvements to new-player-experience design specifically, drawing on Onboarding Design Principles ([Volume III, Section III.2.6.4]) and the applied measurement methodology in Onboarding Effectiveness Patterns ([Volume III, Section III.2.8.3]).

### V.8.2 Prompt Specification

**System Prompt (V.8.2.1).** Establishes game-design expertise across mechanics, difficulty, and onboarding, with an explicit instruction to maintain Design Coherence (Section V.8.4.3): a proposed mechanic change must fit the game's existing design language, not merely work in isolation.

**Context Assembly Template (V.8.2.2).** Current mechanic inventory (Mechanic nodes, [Volume III, Section III.1.2], type #5), relevant Game Design corpus concepts ([Section III.2.6]), and Flow and engagement feature history for the affected player segment.

**Output Format Specification (V.8.2.3).** Recommendation-draft components for mechanic and design changes, with explicit design-coherence rationale — how the change fits existing systems — presented alongside the behavioral rationale, not as an afterthought.

### V.8.3 Tools and Access

**Permitted Tools (V.8.3.1).** Knowledge Graph Query (a), Simulation Trigger (c) scoped per Section V.8.3.2, and Feature Engine Query (b).

**Simulation Access (V.8.3.2).** Scoped, following the same pattern already established for the Economy Designer ([Section V.7.3.2]), to Player Behavior and Content simulation types ([Volume IV, Section IV.1.1.3]) relevant to mechanic design specifically — not Economy or Social simulation types outside this agent's domain.

**Knowledge Graph Access Scope (V.8.3.3).** Focused on the Mechanic, Behavior, and Session subgraph.

### V.8.4 Evaluation Criteria

**Engagement Impact (V.8.4.1).** Whether a recommendation improves engagement metrics as simulated or measured, extending Engagement Prediction ([Volume III, Section III.5.3]).

**Player Satisfaction Impact (V.8.4.2).** A distinct check from raw engagement, extending Satisfaction Prediction ([Volume III, Section III.5.3]) — a design could increase engagement while decreasing satisfaction, exactly the pattern the Manipulation Boundary's concern about compulsion-adjacent mechanics ([Volume I, Section I.5.1.3]) warns against. This agent's recommendations are checked against both engagement and satisfaction, not engagement alone, guarding specifically against optimizing for engagement numbers at satisfaction's expense.

**Design Coherence (V.8.4.3).** Whether a recommendation fits the game's existing design language and systems, per the MDA Framework's mechanics-dynamics-aesthetics consistency ([Volume III, Section III.2.6.1]) — a qualitative, design-craft-specific criterion distinct from the quantitative metrics in Sections V.8.4.1–2.

- **REQ-GAMEDESIGN-001 (MUST):** A mechanic-design Recommendation MUST be evaluated against both Engagement Impact and Player Satisfaction Impact (V.8.4.1–2); a recommendation improving engagement while degrading satisfaction MUST NOT be scored as successful on engagement alone.
- **REQ-GAMEDESIGN-002 (SHOULD):** A mechanic-design Recommendation SHOULD include an explicit Design Coherence rationale (V.8.4.3) alongside its behavioral rationale.

---

*End of Part V.8 — Game Designer Agent.*

*Cross-References:* [Volume I, Section I.5.1.3] (Manipulation Boundary), [Volume III, Section III.1.2] (Mechanic Node Type), [Volume III, Section III.2.2.3] (Flow Theory), [Volume III, Section III.2.6] (Game Design Domain), [Volume III, Section III.2.8.3] (Onboarding Effectiveness Patterns), [Volume III, Section III.3.2] (Feature Catalog), [Volume III, Section III.5.3] (Predictive Models — Engagement, Satisfaction Prediction), [Volume IV, Section IV.1.1.3] (Simulation Types), [Part V.7, Section V.7.3.2] (Economy Designer Simulation Scoping), [Part V.10] (Monetization Advisor Agent — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-GAMEDESIGN-001 through REQ-GAMEDESIGN-002.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 10, 2026

---

## Part V.9 — Narrative Designer Agent

The Narrative Designer Agent assesses and proposes story and character content — the specialist agent whose evaluation criteria this Part is most honest about being hard to fully quantify. Section V.9.4.2 names that difficulty directly rather than pretending a purely numeric check is sufficient for judging narrative craft.

### V.9.1 Role and Responsibilities

**Story and Content Recommendations (V.9.1.1).** Proposes actual narrative content additions or changes — the creative recommendation-generation role, analogous to the Economy Designer's and Game Designer's own design-recommendation items ([Section V.7.1.1], [Section V.8.1.1]) but for story and character content specifically, drawing on the Game Design corpus domain's narrative-adjacent concepts ([Volume III, Section III.2.6]).

**Narrative Engagement Analysis (V.9.1.2).** Analyzes player engagement with narrative content and characters — a content-specific engagement measure distinct from the Game Designer's mechanic-level Engagement Optimization ([Section V.8.1.3]).

**Emotional Journey Mapping (V.9.1.3).** Maps the shape of a narrative's emotional arc over time, using Emotion node temporal tracking ([Volume III, Section III.1.4.4]) applied to a sequence of Emotion states across a story's progression — the narrative equivalent of the Game Designer's Difficulty Curve work ([Section V.8.1.2]), but shaping emotional intensity and valence rather than challenge.

**Content Pacing Recommendations (V.9.1.4).** Recommends the pacing of narrative content delivery — how much story content per session, how frequently new narrative beats arrive — drawing on the Content Velocity Preference feature ([Volume III, Section III.3.2], #14), distinct from the Game Designer's difficulty-and-challenge pacing work ([Section V.8.1.2]).

### V.9.2 Prompt Specification

**System Prompt (V.9.2.1).** Establishes narrative-design expertise with an explicit instruction to weigh emotional authenticity — whether a proposed narrative beat feels earned, not merely mechanically effective at driving a metric. This connects directly to the Manipulation Boundary ([Volume I, Section I.5.1.3]) applied to narrative specifically: narrative content engineered purely to manufacture emotional pressure — a deliberately guilt-inducing story beat timed to a monetization prompt, for instance — is a distinct manifestation of the same underlying ethical concern the Boundary addresses elsewhere in the platform, not a separate issue narrative content is somehow exempt from.

**Context Assembly Template (V.9.2.2).** Current narrative content inventory, relevant Emotion and Behavior node history for the affected player segment, and the narrative-adjacent subset of the Game Design domain corpus.

**Output Format Specification (V.9.2.3).** Recommendation-draft components for narrative content changes, with explicit emotional-arc rationale attached.

### V.9.3 Tools and Access

**Permitted Tools (V.9.3.1).** Knowledge Graph Query (a), scoped to the narrative-relevant subgraph, and Corpus Search (e) — a narrower tool set than the design-focused agents (Parts V.7–V.8), reflecting this agent's more interpretive, craft-oriented role. Notably, Simulation Trigger is not granted by default: narrative impact is harder to simulate with the same behavioral-parameter precision mechanic and economy changes support, an honest architectural acknowledgment in the same spirit as Known Simulation Limitations ([Volume IV, Section IV.6.3.2]) — this agent still consumes existing simulation results where relevant, but does not initiate new runs.

**Knowledge Graph Access Scope (V.9.3.2).** Focused on the Emotion, Behavior, and narrative-relevant Mechanic subgraph.

**Corpus Access Scope (V.9.3.3).** The narrative-adjacent subset of Game Design ([Volume III, Section III.2.6]) plus the emotional and motivational concepts within Game Psychology ([Section III.2.2]).

### V.9.4 Evaluation Criteria

**Narrative Engagement Metrics (V.9.4.1).** Whether proposed narrative content achieves its intended emotional or engagement effect, measured where possible against the metrics established in Section V.9.1.

**Emotional Resonance Assessment (V.9.4.2).** Extends the System Prompt's instruction in Section V.9.2.1 into an explicit evaluation criterion — whether an emotional beat actually resonates rather than merely registering as a metric spike. This is stated honestly as a harder-to-formalize criterion than most other agents' evaluation criteria — checking that narrative content is not purely metric-optimized at the expense of genuine narrative craft is a qualitative judgment this specification does not pretend to fully reduce to a numeric check. A narrative beat engineered purely to manufacture emotional pressure (cross-referencing the Manipulation Boundary concern named in Section V.9.2.1) is, by this criterion's own logic, exactly the kind of beat that fails genuine resonance even where it succeeds at moving a metric — the two are treated as connected, not coincidentally correlated.

**Content Fatigue Detection (V.9.4.3).** Detects when players are experiencing fatigue from a repeated narrative style, pacing pattern, or content type — distinct from the within-session Session Fatigue feature ([Volume III, Section III.3.2], #9), this is specifically about staleness in narrative content across sessions, cross-referencing Content Velocity Preference and Novelty Reward vs. Familiarity Comfort ([Volume III, Section III.3.2], #14, #24). A narrative design effective at launch but grown stale through repetition is flagged here rather than continuing to be treated as effective on the strength of its original evaluation.

- **REQ-NARRATIVE-001 (MUST):** Narrative content timed to coincide with a monetization prompt MUST be evaluated under Emotional Resonance Assessment (V.9.4.2) with the same rigor as a Behavioral Economist's choice-architecture assessment; narrative framing MUST NOT be treated as exempt from Manipulation Boundary review because it is not itself a UI element.
- **REQ-NARRATIVE-002 (SHOULD):** This agent SHOULD NOT trigger new Simulation runs by default (V.9.3.1); narrative Recommendations relying on simulated forecasts SHOULD cite existing runs from the Game Designer or Economy Designer's domain rather than requesting narrative-specific simulation the platform is not yet equipped to model precisely.
- **REQ-NARRATIVE-003 (SHOULD):** Content Fatigue Detection (V.9.4.3) SHOULD be re-run on a recurring cadence against live narrative content, not evaluated once at initial deployment and assumed to remain valid as repetition accumulates.

---

*End of Part V.9 — Narrative Designer Agent.*

*Cross-References:* [Volume I, Section I.5.1.3, Section I.5.2.3] (Manipulation Boundary, Ethics Scoring Dimensions), [Volume III, Section III.1.4.4] (Temporal Properties), [Volume III, Section III.2.2, Section III.2.6] (Game Psychology, Game Design Domains), [Volume III, Section III.5.3] (Predictive Models), [Volume IV, Section IV.2.3.2] (Persona Emotional State Model), [Volume IV, Section IV.6.3.2] (Known Simulation Limitations), [Part V.8, Section V.8.1.1–3] (Game Designer Agent), [Part V.10] (Monetization Advisor Agent — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-NARRATIVE-001 through REQ-NARRATIVE-003.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 10, 2026

---

## Part V.10 — Monetization Advisor Agent

The Monetization Advisor Agent carries the specification's most explicit, structurally reinforced ethical guardrails of any specialist agent, for a direct reason: its core function — optimizing purchase friction and offer timing — sits closer to the Manipulation Boundary's core concern than any other agent's role. Where the Behavioral Economist is instructed to flag risk proactively (Section V.5.2.1), this agent is required to self-check every single recommendation against the Boundary, as a mandatory structural component of its role rather than good practice left to judgment.

### V.10.1 Role and Responsibilities

**Revenue Optimization Recommendations (V.10.1.1).** Proposes monetization-touching design changes — distinct from the Economy Designer's broader economy-health focus (Part V.7): this agent specifically optimizes revenue, while the Economy Designer optimizes overall economy health, of which revenue is only one component.

**Monetization Strategy Assessment (V.10.1.2).** Assesses overall monetization strategy — subscription, direct purchase, battle pass, and other models — beyond pricing alone, drawing on Anchoring and Adjustment ([Volume III, Section III.2.3.3]) and Price Discovery Mechanisms ([Volume IV, Section IV.3.1.3]) as inputs to a broader strategic assessment rather than treating pricing as the whole of monetization design.

**Purchase Friction Analysis (V.10.1.3).** Analyzes Purchase Friction ([Volume III, Section III.3.2], #7) drawing on Friction and Cognitive Load in UI ([Volume III, Section III.2.8.2]) — this is precisely the responsibility whose incentive structure most directly aligns with the friction-asymmetry pattern already named as a Manipulation Boundary concern: friction reduced on purchase while left unreduced on cancellation. Because this agent's job is literally to analyze and optimize purchase friction, the platform requires an especially robust counterbalance here, which Section V.10.1.5 provides structurally rather than leaving to this agent's own discretion.

**Whale/Dolphin/Minnow Analysis (V.10.1.4).** Analyzes player spend-tier distribution using the standard game-industry segmentation — Whales (a small percentage of players generating a disproportionate share of revenue), Dolphins (moderate spenders), and Minnows (free or low-spending players) — drawing on the Segmentation Methodologies already specified in [Volume III, Section III.2.9.3]. This analysis capability is precisely why Section V.10.1.5's boundary enforcement matters as much as it does: spend-tier segmentation is legitimate business intelligence, but the same segmentation that identifies a high-value Whale also identifies the player most susceptible to targeted, escalating monetization pressure — the capability and the safeguard are specified together deliberately, not as unrelated items that happen to share a Part.

**Ethical Monetization Boundary Enforcement (V.10.1.5).** A fifth, explicit responsibility — distinct from the four-item pattern every other specialist agent follows — reflecting this agent's structurally elevated risk profile: a mandatory self-check against the Manipulation Boundary's informed-endorsement test ([Volume I, Section I.5.1.3]) is attached to *every* recommendation this agent produces, not flagged only when something seems risky, and applies with particular weight to any recommendation informed by Whale/Dolphin/Minnow segmentation (Section V.10.1.4). This is a stronger requirement than the Behavioral Economist's proactive-flagging instruction ([Section V.5.2.1]) precisely because this agent's core incentive — revenue optimization — is the one most structurally likely to create pressure toward exactly the outcomes the Boundary prohibits.

### V.10.2 Prompt Specification

**System Prompt (V.10.2.1).** Establishes monetization expertise with an unusually prominent, explicit ethical constraint embedded directly in the prompt itself, not left to downstream Ethics Layer scoring alone: the prompt states the Manipulation Boundary test directly and instructs the agent to reason through it for every recommendation, operationalizing the mandatory self-check required by Section V.10.1.5.

**Context Assembly Template (V.10.2.2).** Current monetization mechanic inventory, Purchase Friction, Loss Sensitivity, and Reward Sensitivity feature history, and relevant Behavioral Economics *and* Marketing Science corpus concepts ([Volume III, Section III.2.3, Section III.2.9]).

**Output Format Specification (V.10.2.3).** Recommendation-draft components for monetization changes, with a mandatory attached Manipulation Boundary self-assessment (Section V.10.1.5) as a required field — a monetization recommendation missing this field is structurally incomplete, not merely lower quality, and MUST NOT be forwarded to the Orchestrator's synthesis stage.

### V.10.3 Tools and Access

**Permitted Tools (V.10.3.1).** Knowledge Graph Query (a), Feature Engine Query (b), Corpus Search (e, Behavioral Economics and Marketing Science domains), and the Ethics Scoring Tool (h) — granted for the same reason as the Behavioral Economist ([Section V.5.3.1]), arguably even more essential given this agent's elevated risk profile.

**Knowledge Graph Access Scope (V.10.3.2).** The Economy, Mechanic, and Behavior subgraph, scoped to monetization-relevant structure.

**Corpus Access Scope (V.10.3.3).** Behavioral Economics ([Section III.2.3]), Marketing Science ([Section III.2.9]), and Decision Theory ([Section III.2.11]) — the broadest corpus access of any design-focused specialist agent besides the Chief Research Officer, reflecting how many corpus domains bear directly on monetization specifically.

### V.10.4 Evaluation Criteria

**Revenue Impact (V.10.4.1).** Whether a recommendation achieves its projected revenue impact, extending Spending Prediction ([Volume III, Section III.5.3]) and Revenue Forecasting Under Uncertainty ([Volume IV, Section IV.7.3.1]).

**Long-Term Trust Impact (V.10.4.2).** This agent's most consequential evaluation criterion: distinguishes recommendations that genuinely grow long-term player value — cross-referencing Customer Lifetime Value ([Volume III, Section III.2.9.1]) — from those that merely extract short-term revenue at the cost of long-term trust and retention, cross-referencing the Long-Term vs. Short-Term Orientation feature ([Volume III, Section III.3.2], #18) and the Long-Term Trust ethics dimension ([Volume I, Section I.5.2.3]). A recommendation scoring well on immediate Revenue Impact (Section V.10.4.1) while scoring poorly here is precisely the pattern the platform's entire ethics architecture exists to catch — this criterion is not a secondary check, it is the primary one this agent is held to.

**Manipulation Risk Score (V.10.4.3).** Tracks, across this agent's full recommendation history, what fraction required Ethics Layer intervention (Modified or Rejected, per [Volume II, Section II.2.6.2]) versus cleanly passing — an aggregate, longitudinal check on this agent's own calibration, distinct from the Behavioral Economist's per-instance Manipulation Risk Assessment ([Section V.5.4.3]) in that it tracks actual Gate outcomes rather than this agent's own self-flagging accuracy alone. A high intervention rate is itself a signal that this agent's prompt or tuning needs revision, triggering Agent Drift Detection ([Section V.1.5.3]).

**Fairness Assessment (V.10.4.4).** Extends Disproportionate Impact Reporting ([Volume IV, Section IV.5.2.4]) to specifically check monetization recommendations for disproportionate impact on vulnerable or high-Loss-Sensitivity segments — with particular attention to whether Whale-tier players identified via Section V.10.1.4's segmentation are being targeted with escalating pressure rather than genuinely valued — cross-referencing the Vulnerable Population Protections already established at [Volume I, Section I.5.1.4].

- **REQ-MONETIZE-001 (MUST):** Every Recommendation produced by this agent MUST include a completed Ethical Monetization Boundary Enforcement self-assessment (V.10.1.5); a Recommendation missing this field MUST NOT be forwarded to Orchestrator synthesis.
- **REQ-MONETIZE-002 (MUST):** A monetization Recommendation MUST be evaluated against Long-Term Trust Impact (V.10.4.2) as a primary criterion, not a secondary check performed only after Revenue Impact is confirmed positive.
- **REQ-MONETIZE-003 (MUST):** This agent's Manipulation Risk Score (V.10.4.3) MUST be tracked longitudinally and reviewed on a recurring cadence; a rising intervention rate MUST trigger Agent Drift Detection review.
- **REQ-MONETIZE-004 (MUST):** Monetization Recommendations MUST be checked for disproportionate impact on vulnerable or high-Loss-Sensitivity segments, including Whale-tier players specifically (V.10.4.4), before reaching Approved.

---

*End of Part V.10 — Monetization Advisor Agent.*

*Cross-References:* [Volume I, Section I.5.1.3, Section I.5.1.4, Section I.5.2.3] (Manipulation Boundary, Vulnerable Population Protections, Ethics Scoring Dimensions), [Volume II, Section II.2.6.2] (Recommendation State Machine), [Volume III, Section III.2.3, Section III.2.3.3, Section III.2.3.9, Section III.2.8.2, Section III.2.9, Section III.2.9.1, Section III.2.9.3, Section III.2.11] (Behavioral Economics, Anchoring, Spending Triggers, Friction, Marketing Science, CLV, Segmentation Methodologies, Decision Theory), [Volume III, Section III.3.2] (Feature Catalog), [Volume III, Section III.5.3] (Predictive Models), [Volume IV, Section IV.3.1.3] (Price Discovery Mechanisms), [Volume IV, Section IV.5.2.4] (Disproportionate Impact Reporting), [Volume IV, Section IV.7.3.1] (Revenue Forecasting Under Uncertainty), [Part V.1, Section V.1.5.3] (Agent Drift Detection), [Part V.5] (Behavioral Economist Agent), [Part V.7] (Economy Designer Agent), [Part V.11] (Ethics Officer Agent — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-MONETIZE-001 through REQ-MONETIZE-004.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 10, 2026

---

## Part V.11 — Ethics Officer Agent

The Ethics Officer Agent is not a specialist agent among equals — it is the Agent Framework's implementation of the Ethics Layer already named as a governance-tier component in [Volume II, Section II.1.1.1]. Every other agent in this Volume produces Insights, Predictions, or Recommendation-draft components that feed the Orchestrator's synthesis; this agent produces the authoritative Ethics Score Card that gates whether a Recommendation may proceed at all. Section V.11.5's veto mechanism is where that authority becomes concrete and irreversible-by-any-agent: this Part exists to make sure that authority is exercised well, checked in both directions, and can be reversed by nothing except a human following the full escalation process already established in Volume II.

### V.11.1 Role and Responsibilities

**Ethics Scoring of All Recommendations (V.11.1.1).** Performs the actual, authoritative Ethics Scoring that produces the Ethics Score Card across all seven dimensions ([Volume I, Section I.5.2.3]), triggered by the Orchestrator's Ethics Scoring Trigger ([Volume II, Section II.2.1.9]; [Section V.2.2.7]). This agent occupies two roles simultaneously by design: implemented as an Agent per this Volume's architecture, but exercising governance-tier authority per Volume II — every Recommendation passes through it, without exception.

**Manipulation Risk Assessment (V.11.1.2).** Performs the authoritative scoring of the Manipulation Risk dimension specifically, applying the informed-endorsement test already established at [Volume I, Section I.5.1.3]. Other agents' own Manipulation Risk flagging — the Behavioral Economist's ([Section V.5.2.3]), the Monetization Advisor's mandatory self-check ([Section V.10.1.5]) — are inputs this agent weighs, not competing authoritative assessments; only this agent's score is the one the Recommendation Gate's guard actually checks.

**Vulnerable Population Protection (V.11.1.3).** Implements the Vulnerable Population Protections already established at [Volume I, Section I.5.1.4] at the agent level — checking whether a Recommendation's target population includes, or could disproportionately affect, minors under the unverifiable-age-as-minor default, or other vulnerable segments named in that Section.

**Compliance Verification (V.11.1.4).** Checks the Regulatory Risk dimension ([Volume I, Section I.5.2.3]) against actual applicable regulatory requirements, using the Regulatory Compliance Database Access specified in Section V.11.3.4 — the only specialist agent with this specific tool and responsibility, since legal and regulatory compliance is a distinct concern from behavioral ethics per se, even where the two frequently overlap.

**Ethical Veto Authority (V.11.1.5).** The authority, fully specified in Section V.11.5, to trigger a veto-level score on any veto-relevant dimension — a determination that, per the Recommendation Gate's guard mechanism ([Volume II, Section II.2.6.3], [REQ-FLOW-016]), is independently and unconditionally enforced at the backend. This agent's veto is not an opinion another agent could argue past; it is the specific input the Gate's guard is built to check against.

### V.11.2 Prompt Specification

**System Prompt (V.11.2.1).** Establishes this agent's independence and scoring authority, with an explicit instruction reinforcing the Component Responsibility Matrix boundary already established at [Volume II, Section II.1.1.2]: this agent scores, it never modifies a Recommendation's content. The separation between scoring authority and content authority is structural, not a matter of this agent's discretion or good judgment — the prompt states it as a hard boundary.

**Context Assembly Template (V.11.2.2).** The full Recommendation draft — every contributing agent's output, assembled per [Volume II, Section II.2.2.6] — plus the full graph and corpus access specified in Sections V.11.3.2–3. This is broader context access than any other specialist agent receives, appropriate because this agent must evaluate the whole picture a Recommendation represents, not a single domain slice of it.

**Output Format Specification — Ethics Score Card (V.11.2.3).** The concrete seven-dimension schema already specified at [Volume I, Section I.5.2.3], populated by this agent and attached to the Recommendation record as the artifact the rest of the pipeline — the Gate's guard, the human reviewer, the audit trail — all consume directly.

### V.11.3 Tools and Access

**Permitted Tools (V.11.3.1).** Full Knowledge Graph read access (Section V.11.3.2), Corpus Search scoped to ethics-relevant concepts across every domain (Section V.11.3.3), and Regulatory Compliance Database access (Section V.11.3.4). Notably absent: Simulation Trigger — this agent scores what has already been proposed and does not need to initiate new exploration — and, deliberately, the Ethics Scoring Tool itself ([Section V.1.4.5.h]), since that tool is precisely what *other* agents use to query this agent's function; this agent does not call itself.

**Full Knowledge Graph Read Access (V.11.3.2).** Unlike every other specialist agent's domain-scoped subgraph access, this agent receives unrestricted graph read access — the only agent besides the Chief Research Officer ([Section V.3.3.2]) with this scope, and in practice broader in application, since ethics scoring needs visibility into whichever subgraph — economy, social, narrative, mechanic — a given Recommendation happens to touch.

**Ethics Corpus Access (V.11.3.3).** A cross-cutting corpus scope distinct from the domain-restricted pattern every other specialist agent follows and distinct from the Chief Research Officer's genuinely unrestricted access ([Section V.3.3.3]): access to the ethics-relevant Corpus Concepts specifically, wherever they sit across all eleven domains — Loss Aversion ([Section III.2.3.1]), the Hook Model's Manipulation Boundary flag ([Section III.2.4.4]), Social Proof ([Section III.2.7.3]), Game Addiction's clinical criteria ([Section III.2.2.6]) — filtered by ethics relevance, not by domain boundary.

**Regulatory Compliance Database Access (V.11.3.4).** A specialized tool beyond the Standard Tool Catalog's original eight, mirroring the extensibility pattern already established for the Statistician's Statistical Computing Tools ([Section V.6.3.2]): access to an actively maintained database of applicable regulations — age-verification requirements, loot box regulations by jurisdiction, data privacy law (cross-referencing [Volume IX], forward reference) — that Compliance Verification (Section V.11.1.4) checks against.

### V.11.4 Evaluation Criteria

**Ethics Score Consistency (V.11.4.1).** Whether this agent produces consistent scores for similar Recommendations, extending Agent Drift Detection ([Section V.1.5.3]) with additional weight: inconsistent ethics scoring is a governance failure, not merely a quality regression, given what depends on this agent's output being trustworthy.

**False Negative Rate — Missing Ethical Issues (V.11.4.2).** The single most safety-critical metric in this Volume: tracks how often this agent fails to flag a Recommendation that should have been vetoed, discovered later via a post-deployment Rolled Back event ([Volume II, Section II.2.6.2.g]) or a human override surfacing something missed. The automated post-deployment ethics monitor already established at [Volume II, REQ-FLOW-014] is one detection source feeding this metric directly.

**False Positive Rate — Over-Flagging (V.11.4.3).** The other direction of the same calibration concern, extending the two-sided evaluation pattern already established for the Psychologist ([Section V.4.4.3]) and Behavioral Economist ([Section V.5.4.3]) to the highest-stakes agent in this Volume: does this agent over-veto or over-flag legitimate Recommendations, creating unnecessary friction and blocking genuinely valuable, ethical work. An Ethics Officer that vetoes everything is failing its function exactly as much as one that vetoes nothing — over-blocking has a real cost this criterion is designed to surface, not to be waved away as an acceptably safe failure direction merely because it errs toward caution.

**Calibration Against Human Ethics Review (V.11.4.4).** This agent's scores are periodically checked against actual human Ethics Board judgment on a sampled set of Recommendations, extending the real-versus-forecast comparison already established in Backtesting Methodology ([Volume IV, Section IV.5.3.1]) to ethics scoring specifically — the ultimate ground-truth check this agent is held to, since the Ethics Board's own judgment (per [Volume I, Section I.5.2.4]) is the human authority this agent's scoring is meant to approximate reliably at scale.

- **REQ-ETHICSAGENT-001 (MUST):** This agent MUST be evaluated for both False Negative Rate (V.11.4.2) and False Positive Rate (V.11.4.3); an evaluation process reporting only one direction MUST NOT be considered complete.
- **REQ-ETHICSAGENT-002 (MUST):** This agent's calibration against human Ethics Board judgment (V.11.4.4) MUST be checked on a recurring cadence, not validated once and assumed durable.

### V.11.5 Ethics Veto Mechanism

**Veto Conditions (V.11.5.1).** The precise conditions triggering a veto: any dimension crossing the veto threshold already established by the non-averaging, veto-dimension architecture at [Volume I, Section I.5.2.3]. This Section is where that Volume I principle receives its concrete, agent-level triggering logic — the specific condition this agent's scoring evaluates against, not a restatement of the principle alone.

**Veto Escalation to Human Review (V.11.5.2).** A vetoed Recommendation does not simply disappear — it escalates to human review carrying the veto's full reasoning attached, satisfying the human-readable-rationale requirement ([Volume I, REQ-ETH-008]) so a human reviewer has what they need to evaluate whether an Override (Section V.11.5.4) is warranted, per the Reviewed state already specified at [Volume II, Section II.2.6.2.b].

**Veto Audit Trail (V.11.5.3).** Every veto is logged per the Gate Decision Audit Trail already specified at [Volume II, Section II.2.6.4], feeding the same transparency reporting mechanism established at [Volume I, Section I.5.3.6] — a veto is exactly the kind of event that reporting exists to make visible without redaction.

**Override Process — Human Only (V.11.5.4).** Restates and reinforces the Emergency Override already fully specified at [Volume II, Section II.2.6.6]: only a human, at Board-level authority per [Volume I, Section I.5.2.4], can override this agent's veto. This agent itself has no self-override mechanism and cannot be argued out of a veto by another agent's persuasion within a single reasoning cycle — this is the specification's core separation-of-powers guarantee for the Agent Framework: an AI agent's veto can be reversed only by a human following the full escalation process, never by another AI agent, and never by this agent reconsidering under pressure.

- **REQ-ETHICSAGENT-003 (MUST):** A veto triggered under V.11.5.1 MUST escalate to human review with full reasoning attached; it MUST NOT be silently downgraded or dismissed by any subsequent agent processing, including a later invocation of this same agent.
- **REQ-ETHICSAGENT-004 (MUST):** Only a human, at Board-level authority per [Volume I, Section I.5.2.4], MUST be capable of overriding this agent's veto; no agent-to-agent negotiation, persuasion, or re-scoring pathway MUST be capable of reversing a veto.
- **REQ-ETHICSAGENT-005 (MUST):** Every veto MUST be logged to the audit trail per V.11.5.3 and MUST be included in transparency reporting without redaction, per [Volume I, Section I.5.3.6].

---

*End of Part V.11 — Ethics Officer Agent.*

*Cross-References:* [Volume I, Section I.5.1.3–4] (Manipulation Boundary, Vulnerable Population Protections), [Volume I, Section I.5.2.3–4] (Ethics Scoring Dimensions, Override and Escalation), [Volume I, Section I.5.3.6] (Transparency Reporting), [Volume I, REQ-ETH-008] (Human-Readable Rationale), [Volume II, Section II.1.1.1–2] (Ethics Layer Component, Component Responsibility Matrix), [Volume II, Section II.2.1.9] (Recommendation Generation), [Volume II, Section II.2.2.6] (Recommendation Draft Assembly), [Volume II, Section II.2.6.2–4, Section II.2.6.6] (Recommendation State Machine, Guards, Audit Trail, Emergency Override), [Volume II, REQ-FLOW-014, REQ-FLOW-016] (Post-Deployment Ethics Monitor, Gate Guard Enforcement), [Volume III, Section III.2.2.6, Section III.2.3.1, Section III.2.4.4, Section III.2.7.3] (Game Addiction, Loss Aversion, Hook Model, Social Proof), [Volume IV, Section IV.5.3.1] (Backtesting Methodology), [Volume IX] (Security and Compliance — forward reference), [Part V.2, Section V.2.2.7] (Ethics Scoring Trigger), [Part V.3, Section V.3.3.2–3] (Chief Research Officer Access Scope), [Part V.4, Section V.4.4.3] (Bias and Over-Pathologizing Checks), [Part V.5, Section V.5.4.3] (Manipulation Risk Assessment), [Part V.6, Section V.6.3.2] (Statistical Computing Tools), [Part V.10, Section V.10.1.5] (Ethical Monetization Boundary Enforcement), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-ETHICSAGENT-001 through REQ-ETHICSAGENT-005.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 10, 2026

---

## Part V.12 — Experiment Planner Agent

The Experiment Planner Agent turns a hypothesis or Recommendation into an actual, executable real-world experiment — the agent that operationalizes the Hybrid Sim + Real Validation Pipeline already specified in [Volume IV, Section IV.6.3.5] rather than leaving that workflow as an abstract pattern other agents apply inconsistently.

### V.12.1 Role and Responsibilities

**Experiment Design from Recommendations (V.12.1.1).** Takes a Recommendation draft or hypothesis — often originating from the Chief Research Officer's Hypothesis Generation ([Section V.3.1.2]) — and designs the actual real-world experiment structure needed to validate it, using the Control/Treatment Group design already specified at [Volume IV, Section IV.6.1.1].

**Hypothesis Formalization (V.12.1.2).** Converts an informal hypothesis into a precisely testable statistical hypothesis (null and alternative framing), working closely with the Statistician Agent ([Part V.6]), whose own Sample Size and Power Analysis role ([Section V.6.1.3]) depends on a hypothesis already being formalized to this level of precision.

**Sample Size and Duration Planning (V.12.1.3).** The agent-level execution of Statistical Power and Sample Size and Experiment Duration Estimation ([Volume IV, Section IV.6.1.3–4]): the Statistician performs the underlying power calculation itself ([Section V.6.1.3]), and this agent translates that calculation into an actual experiment plan — timeline, population size, checkpoints — a planning and coordination role built directly on the Statistician's computation rather than duplicating it.

**Success Metric Definition (V.12.1.4).** Defines what "success" means for a given experiment before it runs, extending the Multi-Metric Forecasting discipline already established at [Volume IV, Section IV.5.1.5] to real experiments specifically. Pre-registering success metrics before data collection begins is named explicitly as a methodology this agent enforces, preventing the post-hoc metric-shopping that would otherwise undermine an experiment's evidentiary value even with an adequate sample size.

**Simulation Pre-Screening Coordination (V.12.1.5).** The concrete agent-level implementation of the Hybrid Sim + Real Validation Pipeline already specified at [Volume IV, Section IV.6.3.5]: this agent coordinates the hand-off from simulation pre-screening — working with the Economy Designer or Game Designer, whichever domain agent triggers the relevant simulation type — to the narrower, simulation-informed real experiment that follows, operationalizing that Section's "combines both methods' strengths" workflow rather than leaving it as an unexecuted pattern.

### V.12.2 Prompt Specification

**System Prompt (V.12.2.1).** Establishes experimental design rigor with an explicit instruction to always pre-register success metrics (Section V.12.1.4) before an experiment begins, and to favor the Hybrid pipeline (Section V.12.1.5) over either pure-simulation or pure-real-experiment approaches by default.

**Context Assembly Template (V.12.2.2).** The hypothesis or Recommendation under investigation, relevant existing Simulation results where available (Section V.12.1.5), and Historical Experiment Data (Section V.12.3.3) for similar past experiments' design patterns.

**Output Format Specification (V.12.2.3).** A structured Experiment Plan — an Experiment node ([Volume III, Section III.1.2], type #13) — including control/treatment design, sample size and duration, and pre-registered success metrics: the artifact this agent hands off for actual execution, which this agent plans for but does not itself run.

### V.12.3 Tools and Access

**Permitted Tools (V.12.3.1).** Simulation Trigger (c, scoped per Section V.12.3.2) and Experiment Query Tool (f, scoped per Section V.12.3.3). Notably absent: direct Statistical Computing Tools access ([Section V.6.3.2]) — this agent coordinates with the Statistician for actual computation rather than duplicating that specialized capability, an example of the platform preferring inter-agent collaboration ([Section V.1.2.2]) over redundant tool grants across agents whose roles are meant to be complementary.

**Simulation Engine Access (V.12.3.2).** Scoped to triggering pre-screening simulations specifically (Section V.12.1.5), typically coordinated through or alongside whichever domain-specific agent's simulation type is actually relevant, rather than this agent triggering arbitrary simulation types on its own.

**Historical Experiment Data Access (V.12.3.3).** Access to past Experiment node records ([Volume III, Section III.1.2], type #13) and their outcomes, informing experiment design based on what has worked or failed before for similar hypotheses.

### V.12.4 Evaluation Criteria

**Experiment Design Quality (V.12.4.1).** Extends Randomization Integrity and Novelty Effects awareness already cataloged in [Volume IV, Section IV.6.2.1–2]: whether this agent's designed experiments actually avoid the validity threats that Part IV.6.2 specifies, not merely produce a plausible-looking design.

**Statistical Power Adequacy (V.12.4.2).** Extends [Volume IV, Section IV.6.1.3]: whether the planned sample size and duration actually achieved adequate power, checked after the fact — distinct from the a priori planning itself, this is a real outcome-based check on this agent's planning quality rather than a restatement of the planning requirement.

**Practical Feasibility (V.12.4.3).** Whether a planned experiment design actually fits real operational constraints — a design requiring an unrealistic sample size or duration given the game's actual player traffic (cross-referencing Experiment Duration Estimation's traffic-dependency, [Volume IV, Section IV.6.1.4]) is a real failure mode this criterion catches, distinct from a design that is statistically sound but operationally impossible to run.

- **REQ-EXPPLAN-001 (MUST):** Every Experiment Plan produced by this agent MUST include pre-registered success metrics (V.12.1.4) before data collection begins; a metric added after results are observed MUST NOT be presented as pre-registered.
- **REQ-EXPPLAN-002 (SHOULD):** This agent SHOULD default to the Hybrid Sim + Real Validation Pipeline (V.12.1.5) over a pure-real-experiment design where an existing or feasible simulation pre-screen could narrow the real experiment's required scope.
- **REQ-EXPPLAN-003 (MUST):** An Experiment Plan MUST be checked for Practical Feasibility (V.12.4.3) before being handed off for execution; a statistically well-powered but operationally infeasible design MUST NOT proceed without revision.

---

*End of Part V.12 — Experiment Planner Agent.*

*Cross-References:* [Volume III, Section III.1.2] (Experiment Node Type), [Volume IV, Section IV.5.1.5] (Multi-Metric Forecasting), [Volume IV, Section IV.6.1.1, Section IV.6.1.3–4] (Experiment Design, Statistical Power, Duration Estimation), [Volume IV, Section IV.6.2.1–2] (Randomization Integrity, Novelty Effects), [Volume IV, Section IV.6.3.5] (Hybrid Sim + Real Validation Pipelines), [Part V.1, Section V.1.2.2] (Message Routing and Dispatch), [Part V.3, Section V.3.1.2] (Hypothesis Generation), [Part V.6, Section V.6.1.3, Section V.6.3.2] (Statistician Sample Size Role, Statistical Computing Tools), [Part V.7] (Economy Designer Agent), [Part V.8] (Game Designer Agent), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-EXPPLAN-001 through REQ-EXPPLAN-003.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 10, 2026

---

## Part V.13 — Agent Interaction Specifications

Part V.13 formalizes the interaction patterns implicit throughout Parts V.1–V.12 into named, reusable shapes, consolidates the ten agent-specific Tools-and-Access sections into two lookup matrices, and gives the platform an explicit answer to a question the failure catalog in Section V.1.6 raised but did not fully resolve: what distinguishes a legitimate, required Consensus interaction from the Agent Collusion failure mode that consensus could otherwise be mistaken for.

### V.13.1 Standard Interaction Patterns

**Request-Response (V.13.1.1).** The basic pattern: Agent A sends a request using the Inter-Agent Message Format ([Section V.1.2.1]), Agent B replies with a response — the shape underlying most inter-agent tool-style queries.

**Consultation — One Agent Asks Another (V.13.1.2).** One agent asks another for domain input without expecting to act on it as a delegated sub-task — the Game Designer consulting the Psychologist about a mechanic's likely emotional reception, for example. Consultation output is explicitly advisory: it feeds the consulting agent's own reasoning rather than replacing it.

**Review — One Agent Reviews Another's Output (V.13.1.3).** One agent reviews another's output for correctness or validity — the Statistician reviewing a statistical claim ([Section V.6.1.1]) is the canonical instance — producing a Validity Assessment ([Section V.6.2.3]) attached to the reviewed output, not an independent new conclusion.

**Debate — Multiple Agents Argue Different Positions (V.13.1.4).** The formal pattern underlying Conflict Resolution's instruction to surface disagreement explicitly rather than average it away ([Section V.2.1.4]). Debate is not a failure mode; it is a deliberately structured interaction the Orchestrator invokes when it anticipates or detects genuine expert disagreement, giving each agent's position a full, distinct statement before the Orchestrator synthesizes or escalates.

**Consensus — Multiple Agents Must Agree (V.13.1.5).** A formally required interaction pattern for specific high-stakes decision types, distinct from ordinary agreement, which could otherwise reflect the Agent Collusion failure mode already cataloged at [Section V.1.6] (failure #3). What distinguishes legitimate Consensus from suspicious Collusion is disclosure and independence: Consensus is invoked deliberately by the Orchestrator for a named decision type, each participating agent reasons independently, and any agent that relied on another's prior input discloses that dependency per the provenance-chain-termination check already established ([Section V.1.6], failure #2) — Collusion is undisclosed or accidental convergence; Consensus is a transparent, structural requirement.

- **REQ-INTERACT-001 (MUST):** A Consensus interaction MUST require each participating agent to disclose any dependency on another participant's prior output; an undisclosed dependency invalidates the Consensus and MUST be treated as a potential Collusion signal per [Section V.1.6].

### V.13.2 Agent Interaction Diagrams

Five canonical flows, each a consolidated view of steps already fully specified elsewhere — this Section cross-references rather than restates, per [Volume I, CONST-ONEHOME-001], giving a reader one place to see each flow's full shape.

**Recommendation Generation Flow (V.13.2.1).** Intake and Classification ([Section V.2.2.1]) → Agent Selection ([Section V.2.2.2]) → Context Assembly and Dispatch ([Section V.2.2.3–4]) → parallel or sequential Execution → Result Collection ([Section V.2.2.5]) → Synthesis ([Section V.2.1.3]) → Recommendation Draft Assembly ([Section V.2.2.6]) → Ethics Scoring Trigger ([Section V.2.2.7]) → Human Review Queue Submission ([Section V.2.2.8]).

**Ethics Review Flow (V.13.2.2).** Recommendation Draft Assembly ([Section V.2.2.6]) → Ethics Scoring Trigger ([Section V.2.2.7]) → Ethics Officer scoring across all seven dimensions ([Section V.11.1.1–4]) → branch: a veto-level score triggers Veto Escalation with full reasoning attached ([Section V.11.5.2]) to human review; a non-veto score proceeds to the ordinary Proposed state entry ([Volume II, Section II.2.6.2.a]).

**Simulation Request Flow (V.13.2.3).** A domain agent's scoped Simulation Trigger call ([Section V.1.4.5.c], scoped per that agent's own Tools and Access subsection) → the Simulation Job Scheduler ([Volume IV, Section IV.1.2.1]) → execution → a Simulation Result returned to the triggering agent → incorporated into that agent's ongoing reasoning toward a Recommendation draft.

**Experiment Design Flow (V.13.2.4).** A hypothesis (typically from the Chief Research Officer, [Section V.3.1.2]) → the Experiment Planner's Hypothesis Formalization ([Section V.12.1.2]) → the Statistician's Sample Size and Power calculation ([Section V.6.1.3]) → the Experiment Planner's Plan Assembly ([Section V.12.2.3]) → handoff for real-experiment execution ([Volume IV, Part IV.6]).

**Conflict Resolution Flow (V.13.2.5).** A detected agent disagreement ([Section V.2.1.4]) → the Debate pattern invoked ([Section V.13.1.4]), or direct Escalation ([Section V.2.1.5]) where Debate would not resolve it → branch: a resolved disagreement proceeds to synthesis with the disagreement surfaced explicitly in the Recommendation's rationale; an unresolved disagreement escalates to the Idle-with-Escalation transition already specified at [Section V.2.3.2].

### V.13.3 Agent Boundaries

**What Each Agent Can and Cannot Do (V.13.3.1).** A consolidated index pointing to each agent's own Role and Responsibilities (Sections V.3.1 through V.12.1), extended with explicit negative-space statements mirroring the Component Responsibility Matrix's "Does Not Own" pattern already established at [Volume II, Section II.1.1.2]: the Chief Research Officer and Narrative Designer do not trigger Simulation runs by default; the Ethics Officer does not modify Recommendation content or call the Ethics Scoring Tool on itself; the Experiment Planner does not perform statistical computation directly. Consolidating these boundaries in one place avoids requiring a reader to reconstruct the negative space by reading all ten agent Parts individually.

**Agent Permission Matrix (V.13.3.2).** The full tool-access grant, consolidated from every agent's own Tools and Access section:

| Agent | KG Query (a) | Feature Engine (b) | Sim Trigger (c) | Player Model (d) | Corpus Search (e) | Experiment Query (f) | Data Lake (g) | Ethics Scoring (h) | Specialized Tool |
|---|---|---|---|---|---|---|---|---|---|
| Chief Research Officer | ✓ broad | — | — | — | ✓ all 11 domains | — | ✓ | — | — |
| Psychologist | ✓ scoped | — | — | ✓ | ✓ Psych-adjacent domains | — | — | — | — |
| Behavioral Economist | ✓ scoped | ✓ | — | — | ✓ Behavioral Econ. + Decision Theory | — | — | ✓ | — |
| Statistician | — | — | — | — | — | ✓ | ✓ full | — | Statistical Computing Tools |
| Economy Designer | ✓ scoped | ✓ | ✓ Economy sim only | — | — | — | — | — | — |
| Game Designer | ✓ scoped | ✓ | ✓ Player Behavior/Content sim | — | — | — | — | — | — |
| Narrative Designer | ✓ scoped | — | — | — | ✓ narrative-adjacent + Psych | — | — | — | — |
| Monetization Advisor | ✓ scoped | ✓ | — | — | ✓ Behavioral Econ. + Marketing + Decision Theory | — | — | ✓ | — |
| Ethics Officer | ✓ full, unrestricted | — | — | — | ✓ ethics-relevant, cross-domain | — | — | — (does not call itself) | Regulatory Compliance Database |
| Experiment Planner | — | — | ✓ pre-screening only | — | — | ✓ | — | — | — |

**Agent Data Access Matrix (V.13.3.3).** Graph and corpus scope, consolidated similarly:

| Agent | Knowledge Graph Scope | Corpus Domain Scope | Notable Privacy/Data Constraint |
|---|---|---|---|
| Chief Research Officer | Full, cross-domain traversal | All eleven domains, unrestricted | — |
| Psychologist | Player→Behavior→Emotion→Motivation subgraph | Game Psychology, Motivation Theory, Cognitive Science, Social Dynamics | Player Model access subject to pseudonymization ([Volume III, Section III.5.4]) |
| Behavioral Economist | Economy/Mechanic/Behavior subgraph | Behavioral Economics, Decision Theory | — |
| Statistician | Not graph-scoped; operates via Data Lake | — | Full batch/historical Data Lake access |
| Economy Designer | Economy/Mechanic subgraph | — | — |
| Game Designer | Mechanic/Behavior/Session subgraph | Game Design domain | — |
| Narrative Designer | Emotion/Behavior/narrative-Mechanic subgraph | Game Design (narrative subset), Game Psychology | — |
| Monetization Advisor | Economy/Mechanic/Behavior subgraph | Behavioral Economics, Marketing Science, Decision Theory | — |
| Ethics Officer | Full, unrestricted (broadest applied scope of any agent) | Ethics-relevant concepts, cross-domain | Regulatory Compliance Database access |
| Experiment Planner | Not graph-scoped; operates via Simulation/Experiment tools | — | Historical Experiment Data access |

- **REQ-INTERACT-002 (MUST):** The Agent Permission Matrix (V.13.3.2) and Agent Data Access Matrix (V.13.3.3) MUST be updated in the same change that modifies any individual agent's Tools and Access section; a matrix that has drifted from the individual agent specifications it consolidates is a documentation-synchronization defect under [Volume I, DOC-SYNC-001-equivalent].
- **REQ-INTERACT-003 (SHOULD):** The Debate pattern (V.13.1.4) SHOULD be preferred over silent Orchestrator-level synthesis whenever two or more agents' outputs diverge on a claim material to a Recommendation's rationale.

---

*End of Part V.13 — Agent Interaction Specifications.*

*Cross-References:* [Volume I, CONST-ONEHOME-001, DOC-SYNC-001] (One Canonical Home, Documentation Synchronization), [Volume II, Section II.1.1.2] (Component Responsibility Matrix), [Volume II, Section II.2.6.2.a] (Proposed State), [Volume III, Section III.5.4] (Player Model Privacy), [Volume IV, Section IV.1.2.1] (Simulation Job Scheduler), [Volume IV, Part IV.6] (Experimentation Framework), [Part V.1, Section V.1.2.1, Section V.1.6] (Message Format, Agent Failure Modes), [Part V.2] (Orchestrator), [Parts V.3–V.12] (all ten specialist agents, consolidated), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-INTERACT-001 through REQ-INTERACT-003.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 10, 2026

---

## Part V.14 — Agent Extension Framework

Part V.14 specifies how a studio adds an eleventh agent — a custom, domain-specific role the ten platform-shipped specialists don't cover — and how a third-party-built agent earns its way into a marketplace. Section V.14.1.4 states the load-bearing rule directly: adding a new agent is not exempt from the Ethics Gate every Recommendation is already held to. A studio cannot bypass this platform's governance by building a new agent instead of proposing a new Recommendation through an existing one.

### V.14.1 Custom Agent Development

**Agent Specification Template (V.14.1.1).** A new custom agent — a Localization Agent, for instance, or another studio-specific role the platform's ten specialists don't cover — is specified using the exact same anatomy already established at [Section V.1.1.2]: Prompt Specification, Memory, Tools, and Evaluation Criteria. A custom agent is not ad hoc; it conforms to the same architecture every platform-shipped agent does, and a specification missing any of the four components is incomplete by the same standard [REQ-AGENT-002] already applies.

**Agent Registration Process (V.14.1.2).** Extends Agent Discovery and Addressing ([Section V.1.2.3]) and the Model Registry pattern ([Volume III, Section III.5.5.1]): a new custom agent registers its identity and its explicit Tools-and-Access declaration before it is addressable by the Orchestrator. A newly registered agent receives no broader default access than any platform-shipped agent — the default-deny pattern established at [Section V.1.4.4] applies identically to a custom agent's very first registration, not only to established agents.

**Agent Validation and Testing (V.14.1.3).** A custom agent clears the same evaluation bar as any platform-shipped agent — Agent Performance Benchmarking and Agent A/B Testing ([Section V.1.5.4–5]) — before deployment. There is no lower validation standard for a studio-added agent merely because it was not built by the platform team.

**Agent Approval Workflow (V.14.1.4).** A custom agent passes an approval sequence directly analogous to the Model Approval Gates already established at [Volume III, Section III.5.5.2]: pre-deployment evaluation, bias and fairness review, explainability review, and — critically — the Ethics Gate. A newly proposed agent's design and prompt are reviewed by the Ethics Officer ([Part V.11]) before the agent is permitted to operate, exactly as a Recommendation would be. This closes what would otherwise be an obvious governance gap: a studio cannot route around the platform's ethics review by building a new agent to produce an outcome an existing agent's rationale would have been required to justify.

- **REQ-EXTEND-001 (MUST):** A custom agent MUST conform to the standard anatomy specified in [Section V.1.1.2] and MUST pass the same Approval Gate sequence as a platform-shipped agent, including Ethics Gate review by the Ethics Officer, before production deployment.
- **REQ-EXTEND-002 (MUST):** A newly registered custom agent MUST default to zero tool access; permissions MUST be explicitly granted per [Section V.1.4.4]'s default-deny pattern, with no exception for platform-team-authored agents versus studio-authored ones.

### V.14.2 Third-Party Agents

**Marketplace Agent Distribution (V.14.2.1).** Extends the platform's original corpus-market vision (cross-referencing FirstSteps.md and [Volume III, Section III.2.13.4]) to agent distribution: a well-built custom agent — a Live-Ops Event Planner one studio develops, for instance — can be shared or distributed to other studios through a marketplace, following standard plugin-and-extension distribution patterns.

**Agent Sandboxing for Third-Party (V.14.2.2).** A third-party agent — built by a party other than the platform team or the deploying studio — receives sandboxing beyond the standard Tool Execution Sandbox ([Section V.1.4.2]): its permitted tool set is scoped more restrictively by default, since its prompt and reasoning logic were not authored by a party the platform or the deploying studio directly trusts, and its outputs undergo additional validation before being weighted at the same level as a platform-native or studio-authored agent's output in Orchestrator synthesis.

**Agent Certification Process (V.14.2.3).** Extends the Model Card and Evaluation Card pattern ([Volume III, Section III.5.5.3–4]) to third-party agents specifically: a formal certification, against published criteria, that a third-party agent must earn before marketplace listing — with re-certification required on any prompt or underlying model change, per the same Agent Drift Detection discipline already established at [Section V.1.5.3].

**Agent Security Review (V.14.2.4).** A distinct review from Section V.14.1.4's Ethics Gate, addressing a different risk category: a third-party agent's prompt and tool-use patterns are reviewed specifically for prompt-injection vulnerability, data-exfiltration risk (whether a maliciously crafted agent could be designed to extract Player Model data through its permitted tool queries even within its sandboxed scope), and supply-chain risk (a post-certification update introducing a vulnerability that did not exist at initial certification). Security review and Ethics Gate review are both mandatory and address genuinely different concerns — passing one is never treated as sufficient for the other.

- **REQ-EXTEND-003 (MUST):** A third-party agent's tool access MUST be scoped more restrictively by default than an equivalent platform-native or studio-authored agent's access, per V.14.2.2.
- **REQ-EXTEND-004 (MUST):** A third-party agent MUST be both Ethics-Gate-approved (V.14.1.4) and separately security-reviewed (V.14.2.4) before marketplace listing; clearing one review MUST NOT be treated as sufficient grounds to waive the other.
- **REQ-EXTEND-005 (MUST):** A third-party agent MUST be re-certified (V.14.2.3) on any prompt or underlying model change; certification MUST NOT be treated as durable across an update without re-review.

---

*End of Part V.14 — Agent Extension Framework.*

*Cross-References:* [Volume III, Section III.2.13.4] (Supported Corpus Markets), [Volume III, Section III.5.5.1–3] (Model Registry, Approval Gates, Model Cards), [Part V.1, Section V.1.1.2, Section V.1.4.2, Section V.1.4.4, Section V.1.5.3–5] (Agent Anatomy, Tool Sandbox, Access Control, Drift Detection, Benchmarking, A/B Testing), [Part V.11] (Ethics Officer Agent), [FirstSteps.md] (original platform vision), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-EXTEND-001 through REQ-EXTEND-005.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 10, 2026

---

## End of Volume V — Agent Framework

Volume V is complete: fourteen Parts, specifying the shared agent architecture every specialist builds on (V.1), the Orchestrator that turns ten independent voices into one coherent reasoning cycle without averaging away genuine disagreement (V.2), the ten specialist agents themselves — from the deliberately non-specialized Chief Research Officer through the Ethics Officer's irreversible-by-any-agent veto authority (V.3–V.12) — the interaction patterns and consolidated access matrices that tie them together (V.13), and the extension framework that lets a studio or third party add an eleventh agent without that addition becoming a way to route around the platform's governance (V.14).

Requirement IDs issued across this Volume: REQ-AGENT-001–013, REQ-ORCH-001–006, REQ-CRO-001–002, REQ-PSYCH-001–002, REQ-BEHECON-001–002, REQ-STAT-001–002, REQ-ECONDESIGN-001–002, REQ-GAMEDESIGN-001–002, REQ-NARRATIVE-001–003, REQ-MONETIZE-001–004, REQ-ETHICSAGENT-001–005, REQ-EXPPLAN-001–003, REQ-INTERACT-001–003, REQ-EXTEND-001–005 — 54 requirements in total.

*Volume VI — Telemetry, SDK, and Data Integration follows, per [PsyForge_v1_Master_TOC.md].*
