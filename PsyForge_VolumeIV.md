# PsyForge v1.0 — Volume IV: Simulation Engine

*Part of the PsyForge Master Specification. See [PsyForge_v1_Master_TOC.md](PsyForge_v1_Master_TOC.md) for the full document map, [PsyForge_VolumeI.md](PsyForge_VolumeI.md) for Volume I, [PsyForge_VolumeII.md](PsyForge_VolumeII.md) for Volume II, and [PsyForge_VolumeIII.md](PsyForge_VolumeIII.md) for Volume III.*

*Document Status: Living Specification — Volume IV complete (Parts IV.1–IV.9).*

---

Volume IV specifies the Simulation Engine: the platform's forward-execution counterpart to the backward-looking causal inference specified in [Volume III, Section III.7.2]. Where Section III.7.2 estimates causal effects from data that already exists, Simulation forecasts outcomes for a change that has not happened yet, by running persona-based behavioral models forward through time — formally, a Simulation run is a computed counterfactual estimate ([Volume III, Section III.7.2.3]), and this Volume's core obligation is to make that estimate as trustworthy as the observational and experimental methods Volume III already specified, not a persuasive but unvalidated alternative to them.

---

## Part IV.1 — Simulation Architecture

Part IV.1 establishes the Simulation Engine's foundational architecture — what it's for, how it's resourced, and how a run is configured — before Parts IV.2 through IV.9 specify personas, domain-specific simulation types, forecasting output, experimentation, Monte Carlo methods, optimization, and scale.

### IV.1.1 Simulation Engine Overview

**Purpose: Predict Outcomes Before Deployment (IV.1.1.1).** The Simulation Engine exists to answer, before a Recommendation reaches deployment, the counterfactual question Volume III's causal framework formalized: what would happen if this change were made. A simulation run computes this by forward-executing persona behavior models (Part IV.2) rather than by backward statistical estimation from historical data — the platform's second causal-estimation method, complementary to Section III.7.2's observational and experimental methods rather than a replacement for them.

**Simulation as Competitive Moat (IV.1.1.2).** Extends the intellectual-property framing already established for the Feature Engine ([Volume III, Section III.3.1.2]): while the Feature Catalog and even the Psychology Corpus could, in principle, be replicated by a sufficiently resourced competitor, a Simulation Engine whose forecasts have been calibrated against years of real deployment outcomes (via Feedback Loop Closure, [Volume II, Section II.2.1.13]) compounds in accuracy and value over time in a way a competitor cannot shortcut — this is named explicitly here because it was identified as a strategic asset in the platform's original vision (cross-referencing FirstSteps.md) and Volume IV is where that claim becomes a concrete architecture rather than a business-pitch assertion.

**Simulation Types (IV.1.1.3).** Four composable types: Player Behavior simulation (persona-driven, the primary type, specified in full in Part IV.2), Economy simulation (Part IV.3), Social simulation (Part IV.4), and Content simulation (forecasting engagement with not-yet-released content, drawing on the Content Scaling and Game Design corpus concepts, [Volume III, Section III.2.6.8]). A typical simulation run combines Player Behavior with one or more of the other three, rather than running any type in isolation as the platform's default mode.

**Simulation Fidelity Levels (IV.1.1.4).** Three tiers trading forecast detail against compute cost: Low-fidelity (fast, statistically approximated, suited to quick pre-screening — Section IV.6.4.1, forward reference), Medium-fidelity (the standard tier, running the full persona behavioral model specified in Part IV.2), and High-fidelity (detailed and computationally expensive, reserved for high-stakes Recommendations or final validation immediately before the Approved state). Section IV.9.2.4's Hierarchical Simulation, forward reference, formalizes moving a single simulation question through these tiers progressively rather than committing to one tier upfront.

- **REQ-SIM-001 (MUST):** A simulation run's fidelity tier MUST be declared explicitly (Section IV.1.3.1) and MUST NOT default silently to the cheapest available tier for a Recommendation approaching the Approved state; high-stakes Recommendations MUST be validated at High-fidelity before deployment.
- **REQ-SIM-002 (MUST):** A Simulation forecast MUST be labeled with the fidelity tier that produced it wherever the forecast is presented to a human reviewer, so that a Low-fidelity pre-screening result is never mistaken for a High-fidelity validation result.

### IV.1.2 Simulation Infrastructure

**Simulation Job Scheduler (IV.1.2.1).** Extends the Simulation Batch Flow and Job Queue Scaling already specified in [Volume II, Section II.2.8.2, Section II.6.3.5] with the scheduler's actual priority policy: a simulation blocking a Recommendation's progress toward Approved outranks a proactive or exploratory simulation run in queue ordering, and queue-depth-based autoscaling (already established in [Volume II, Section II.6.1.3]) triggers worker-pool scaling accordingly.

**Compute Resource Allocation (IV.1.2.2).** Extends GPU Allocation and Node Pool Strategy ([Volume II, Section II.6.3.3, Section II.5.3.10]) with the Simulation-specific policy: a job's fidelity tier (Section IV.1.1.4) determines its resource allocation, and High-fidelity jobs receive dedicated allocation rather than competing in the same resource pool as Low-fidelity pre-screening jobs, so that a burst of cheap exploratory runs cannot starve the high-stakes validation run a Recommendation is waiting on.

**Simulation Parallelism Strategy (IV.1.2.3).** Parallelizes primarily across personas within a timestep (each persona's behavior computed independently) rather than across timesteps (which are inherently sequential, since timestep N+1 depends on timestep N's resulting state) — persona-independence is the more exploitable parallelism dimension for Player Behavior simulation specifically. Economy and Social simulation types carry more cross-persona dependency within a timestep, addressed by the inter-persona communication mechanism specified in Section IV.9.1.4, forward reference, rather than by abandoning persona-level parallelism as the default strategy.

**Checkpoint and Resume (IV.1.2.4).** Long-running, large-population simulation runs (Part IV.9, forward reference) checkpoint periodically so that a Simulation Engine failure (failure mode #7 in [Volume II, Section II.8.1]) resumes from the last checkpoint rather than restarting at timestep zero — extending the job-retry mechanism already specified in [Volume II, Section II.4.2.5] with checkpoint-awareness specifically for jobs whose full re-execution cost would otherwise be prohibitive.

**Simulation Result Storage (IV.1.2.5).** Full raw simulation output — potentially very large for the ten-million-persona runs specified in Section IV.9.1.1, forward reference — stores in the Object Storage tier already specified in [Volume II, Section II.3.7]. A Simulation Result node ([Volume III, Section III.1.2], type #14) carries a reference to that stored artifact plus key summary statistics directly as graph properties, so a graph query can retrieve a run's headline results without requiring a full object fetch.

**Simulation Isolation and Sandbox (IV.1.2.6).** A simulation run operates against a snapshot or copy of relevant state (Player Models, Feature Vectors), never against a live reference into production data — the simulation-layer analog of the No-Direct-Production-Write Doctrine already specified in [Volume II, Section II.2.6.1]. A simulation exploring a candidate change, including a change the simulation itself determines is harmful, MUST NOT be able to leak that exploration into production state regardless of what it simulates or how it terminates.

- **REQ-SIM-003 (MUST):** A simulation run MUST operate against a snapshot of Player Model and Feature Vector state, never against a live read-write reference to production data.
- **REQ-SIM-004 (MUST):** Long-running simulation jobs (exceeding a configured duration threshold) MUST checkpoint periodically; a checkpoint-eligible job that fails without a usable checkpoint is a defect under the completeness discipline this specification applies elsewhere.

### IV.1.3 Simulation Configuration

**Scenario Definition Language (IV.1.3.1).** A declarative language (technology-neutral, matching the Feature Definition Language and Transformation Pipeline DSL convention already established in [Volume III, Section III.3.3.1] and [Volume II, Section II.2.4.1]) specifies what a simulation run tests: the candidate mechanic or parameter change, the target persona population, the fidelity tier (Section IV.1.1.4), and the run's duration in timesteps.

**Parameter Space Definition (IV.1.3.2).** For a simulation exploring a bounded range of parameter values rather than a single candidate change — distinct from the full multi-objective search specified in Part IV.8, forward reference — the scenario declares a parameter space (minimum, maximum, and step per parameter) the run sweeps across.

**Initial State Specification (IV.1.3.3).** Cross-references the persona-initialization mechanism already specified in [Volume III, Section III.4.3.5] and adds the run-specific initial condition: whether the run simulates forward from the current live population's actual state, or from a synthetic cohort (a new-player population, or an archetype-representative population per [Volume III, Section III.5.2.2]) constructed for the specific question the run is meant to answer.

**Termination Conditions (IV.1.3.4).** A run terminates on a fixed timestep count, on convergence (outcome metrics stabilizing within a configured tolerance), or — critically — on early stopping when an ethics-relevant outcome threshold is crossed mid-run, per the rejection mechanism specified in Section IV.9.3.3, forward reference. A simulation is permitted, and in the ethics-threshold case required, to terminate early specifically because the forecast it is producing is ethically concerning, not only for compute-efficiency reasons.

**Output Specification (IV.1.3.5).** The scenario declares which of the output formats specified in Part IV.5 (forward reference) — point estimates, full distributions, scenario comparisons, disproportionate-impact breakdowns — the run should produce, since a quick pre-screening run and a full pre-deployment validation run do not require the same reporting depth.

- **REQ-SIM-005 (MUST):** Every simulation run MUST declare its termination conditions (IV.1.3.4) before execution; a run without a declared termination condition MUST NOT be scheduled.
- **REQ-SIM-006 (MUST):** A simulation run MUST support early termination on a mid-run ethics-threshold breach; a run configuration MUST NOT disable this capability, consistent with the Ethics Layer's non-configurable-floor pattern already established at [Volume II, REQ-ARCH-033].

---

*End of Part IV.1 — Simulation Architecture.*

*Cross-References:* [Volume II, Section II.2.6.1] (No-Direct-Production-Write Doctrine), [Volume II, Section II.2.8.2] (Simulation Batch Flow), [Volume II, Section II.3.7] (Object Storage), [Volume II, Section II.6.3.3] (GPU Allocation), [Volume II, Section II.8.1] (Failure Mode Catalog), [Volume III, Section III.1.2] (Simulation Result Node Type), [Volume III, Section III.3.3.1] (Feature Definition Language), [Volume III, Section III.4.3.5] (Simulation Persona Initialization), [Volume III, Section III.5.2.2] (Archetype Taxonomy), [Volume III, Section III.7.2.3] (Counterfactual Reasoning), [Part IV.2] (Virtual Personas — forward reference), [Part IV.5] (Forecasting and Prediction — forward reference), [Part IV.8] (Evolutionary Search and Optimization — forward reference), [Part IV.9] (Simulation at Scale — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-SIM-001 through REQ-SIM-006.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 9, 2026

---

## Part IV.2 — Virtual Personas

Part IV.2 specifies the Persona: the active, forward-simulating construct built from a Player Model, an archetype, or synthetic corpus-derived parameters, that actually does the deciding, feeling, and acting a simulation run forecasts. Section IV.2.3 is where this Volume's central claim becomes concrete — that Simulation is grounded in the same Psychology Corpus as the rest of the platform, not a generic agent-based model borrowed from an unrelated domain — because a persona's decision logic is, quite literally, corpus theory made executable.

### IV.2.1 Persona Architecture

**Persona Definition and Structure (IV.2.1.1).** A Persona is an active, decision-making simulated entity built from a Player Model — distinct from the Player Model itself, which is a passive, current-state representation ([Volume III, Section III.5.1.1]). A Persona's structure mirrors the Player Model's components but adds the simulation-specific behavioral parameters (Section IV.2.1.3) that drive forward execution rather than passive representation.

**Persona Derived from Player Models vs. Synthetic (IV.2.1.2).** Three sourcing paths exist (Section IV.2.2): cluster-representative, archetypal, and fully synthetic. A Player-Model-derived persona carries its source Player Model's own confidence ([Volume III, Section III.5.1.4]) forward into the simulation; a fully synthetic persona (Section IV.2.2.3) carries explicit "synthetic, no real-player grounding" provenance instead. A simulation's results MUST be interpreted differently depending on which sourcing path predominates in the run's population, which is why population composition (Section IV.2.2.4) is itself a declared, reviewable configuration choice rather than an implementation detail.

**Persona Behavioral Parameters (IV.2.1.3).** The parameters that actually drive a persona's simulated choices: decision weights derived from the persona's Feature Vector (Risk Tolerance, Loss Sensitivity, and the rest of the catalog in [Volume III, Section III.3.2]) and corpus-concept-linked behavioral rules — Prospect Theory's loss-aversion weighting ([Volume III, Section III.2.3.1]), for example, is implemented directly as a parameter in the Decision-Making Model (Section IV.2.3.1). This is the concrete bridge where the Psychology Corpus, specified in the abstract throughout Volume III, becomes executable simulation logic.

**Persona Memory and State (IV.2.1.4).** A persona accumulates simulated experience across timesteps — mood, recent outcomes, accumulated resources — distinct from and simpler than the episodic reasoning memory Volume V will specify for agents ([Volume V, Section V.1.3], forward reference). Persona memory is behavioral state, not reasoning memory; a persona does not reflect on its own history the way a specialist agent does, it merely carries forward the effects of it.

**Persona Lifecycle (IV.2.1.5).** Creation (Section IV.2.2), Evolution (a persona's state changes across timesteps per its behavioral model, Section IV.2.3), and Retirement — a persona may "churn" within the simulation itself when its own decision model predicts disengagement, or the run simply ends. A persona's simulated churn is itself a data point the run reports, feeding directly into Churn Forecasting (Section IV.5.1.4, forward reference) rather than being discarded once it occurs.

- **REQ-PERSONA-001 (MUST):** A Persona MUST declare its sourcing path (cluster-representative, archetypal, or synthetic) and MUST carry the corresponding confidence or provenance annotation from Section IV.2.1.2; an unlabeled persona MUST NOT be included in a Recommendation-facing simulation population.

### IV.2.2 Persona Generation

**From Player Clusters — Representative Personas (IV.2.2.1).** Built by sampling or averaging within a cluster from the same underlying clustering that powers Behavioral Archetype Discovery ([Volume III, Section III.5.2.1], Section III.4.3.2) — not the named archetype itself, but a specific representative point within a cluster, giving finer granularity than one persona per archetype.

**From Archetypes — Archetypal Personas (IV.2.2.2).** Built directly from the named Archetype Taxonomy ([Volume III, Section III.5.2.2]) — one canonical persona per archetype, well suited to quick, interpretable questions ("how would an Achiever react") where cluster-representative sampling's finer granularity is unnecessary overhead.

**Synthetic Generation — Novel Personas (IV.2.2.3).** Fully synthetic personas constructed from corpus theory alone, with no real player data behind them — used where no real player population yet exists (a genuinely novel mechanic type) or to deliberately stress-test behavioral boundaries (an extremely risk-tolerant or extremely loss-averse synthetic persona probing edge-case behavior). Explicitly the least-grounded persona type, carrying the corresponding confidence caveat established in Section IV.2.1.2.

**Persona Population Composition (IV.2.2.4).** A run's population is a declared mixture of the three sourcing types, weighted to either match or deliberately diverge from the real player base's actual archetype distribution — composition is part of the Scenario Definition ([Section IV.1.3.1]) and directly determines how representative the run's aggregate forecast actually is of the real player population it claims to forecast for.

**Persona Diversity and Coverage Metrics (IV.2.2.5).** Measures whether a population adequately covers the behavioral space, not merely the archetype-frequency-weighted average — a population overly concentrated on "typical" personas would fail to surface the disproportionate-impact findings Section IV.5.2.4 (forward reference) exists to report for minority behavioral segments. A run is flagged when coverage is inadequate for the specific question it was configured to answer.

- **REQ-PERSONA-002 (MUST):** Persona population composition MUST be explicitly declared as part of the Scenario Definition; it MUST NOT default silently to an unweighted or arbitrary sample of available personas.
- **REQ-PERSONA-003 (SHOULD):** A simulation run intended to detect disproportionate impact across behavioral segments SHOULD be checked against coverage metrics (IV.2.2.5) before its results are trusted for that specific purpose.

### IV.2.3 Persona Behavioral Model

**Decision-Making Model (IV.2.3.1).** The mechanism a persona uses to choose actions each timestep, drawing on Behavioral Economics and Decision Theory corpus concepts ([Volume III, Section III.2.3, Section III.2.11]) operationalized as a utility-style choice function weighted by the persona's behavioral parameters (Section IV.2.1.3). This is deliberately **not** pure expected-utility maximization (Rational Choice, [Volume III, Section III.2.11.1]) — it implements the behaviorally realistic departures from it (Prospect Theory's asymmetric weighting, hyperbolic discounting, bounded rationality per [Volume III, Section III.2.11.2]) — because grounding simulated decisions in this platform's specific corpus, rather than in a classical rational-agent model, is the entire point of building Simulation on top of Volume III instead of importing a generic agent-based modeling library.

**Emotional State Model (IV.2.3.2).** A persona's simulated Emotion state (mirroring the Emotion node type, [Volume III, Section III.1.2], type #3) updates each timestep based on experienced outcomes — a loss triggers simulated frustration per Loss Aversion ([Volume III, Section III.2.3.1]); a mastery moment triggers simulated satisfaction per Flow Theory ([Volume III, Section III.2.2.3]). Emotional state feeds back into the Decision-Making Model as a modifier: a frustrated persona's decision weights shift toward higher quit-probability, mirroring the Recovery From Failure feature ([Volume III, Section III.3.2], #8).

**Motivational Driver Model (IV.2.3.3).** Each persona carries weighted motivational drivers from Self-Determination Theory ([Volume III, Section III.2.4.1]) and the player-type taxonomies ([Volume III, Section III.2.2.1–2]); these weights bias which actions a persona considers or prefers at each decision point, distinct from but feeding into the Decision-Making Model's actual choice mechanics.

**Learning and Adaptation Model (IV.2.3.4).** Personas update their own behavioral parameters across timesteps based on simulated experience, mirroring real player skill growth per Expertise Development ([Volume III, Section III.2.5.6]) — a persona is not static across a multi-timestep run, which is what makes longer-horizon simulations (retention forecasts spanning weeks) behaviorally meaningful rather than the same static decision replayed unchanged at every step.

**Social Interaction Model (IV.2.3.5).** For the Social Simulation type ([Section IV.1.1.3], fully specified in Part IV.4, forward reference), a persona's decision model can take other personas' recent actions and state as input, not only the environment's state — this Section specifies the persona-level hook Part IV.4's social simulation architecture builds on, connected to the inter-persona communication mechanism in Section IV.9.1.4, forward reference.

**Economic Behavior Model (IV.2.3.6).** For the Economy Simulation type (fully specified in Part IV.3, forward reference), a persona's spending, saving, and trading decisions draw on the Economic Rationality Index feature ([Volume III, Section III.3.2], #15) and Mental Accounting ([Volume III, Section III.2.3.4]) — this Section specifies the persona-level hook Part IV.3 builds on.

- **REQ-PERSONA-004 (MUST):** The Decision-Making Model MUST implement the behavioral-economics departures from rational choice specified in [Volume III, Section III.2.3, Section III.2.11.2]; a decision model implementing pure expected-utility maximization without these departures MUST NOT be represented as corpus-grounded.
- **REQ-PERSONA-005 (MUST):** A persona's Emotional State MUST feed back into its Decision-Making Model as a weight modifier; an emotional state tracked but not connected to decision-making MUST NOT be presented as behaviorally influential in a Simulation Result.

### IV.2.4 Persona Validation

**Calibration Against Observed Behavior (IV.2.4.1).** Before a persona population is trusted for forecasting, its behavioral model's parameters are calibrated against actual historical player behavior, so that simulating "what already happened" reproduces what actually happened within tolerance — the foundational validation step, directly analogous to the Backtesting Methodology specified in Section IV.5.3.1, forward reference.

**Behavioral Distribution Matching (IV.2.4.2).** Validation extends beyond point accuracy: the full distribution of simulated outcomes across a persona population must match the full distribution of real outcomes across the corresponding real population, not only the mean. A model that gets the average right while getting the variance wrong would understate or overstate exactly the disproportionate-impact findings ([Section IV.5.2.4], forward reference) this platform exists to surface.

**Outcome Prediction Accuracy (IV.2.4.3).** Extends the Predictive and Causal Validity discipline already established for individual features and models ([Volume III, Section III.3.4.2–3]) to full persona-population simulation outcomes specifically, distinct from single-feature or single-model validity assessed in isolation.

**Persona Drift Detection (IV.2.4.4).** Extends the canonical drift-detection mechanism ([Volume II, Section II.2.5.4]) to persona behavioral models: if real player behavior shifts — a corpus update, or a genuine behavioral trend surfaced by Emerging Pattern Detection ([Volume III, Section III.6.1.4]) — while persona calibration does not, personas drift out of sync with the population they claim to represent, and this Section is what detects that drift and triggers recalibration rather than letting it silently degrade forecast accuracy.

**Validation Metrics and Thresholds (IV.2.4.5).** A persona population must clear an explicit, domain-appropriate quantitative bar (distributional-distance metrics, prediction-interval coverage) before its output is trusted for a Recommendation-facing High-fidelity run (Section IV.1.1.4). A population that has not cleared this bar — uncalibrated, or drifted per Section IV.2.4.4 — remains usable for Low-fidelity exploratory work only, not for gating an actual deployment decision.

- **REQ-PERSONA-006 (MUST):** A persona population MUST be calibrated against observed historical behavior (IV.2.4.1) and MUST pass the validation thresholds in IV.2.4.5 before its output may be cited in a High-fidelity, Recommendation-facing simulation.
- **REQ-PERSONA-007 (MUST):** Persona drift MUST be monitored continuously per IV.2.4.4; a persona population MUST NOT be assumed valid indefinitely from its initial calibration alone.
- **REQ-PERSONA-008 (MUST):** Validation MUST assess full outcome-distribution matching (IV.2.4.2), not point accuracy alone; a population matching the mean while failing distributional matching MUST NOT be certified for disproportionate-impact analysis.

---

*End of Part IV.2 — Virtual Personas.*

*Cross-References:* [Volume II, Section II.2.5.4] (Drift Detection), [Volume III, Section III.1.2] (Emotion Node Type), [Volume III, Section III.2.2] (Game Psychology Domain), [Volume III, Section III.2.3] (Behavioral Economics Domain), [Volume III, Section III.2.4.1] (Self-Determination Theory), [Volume III, Section III.2.11] (Decision Theory Domain), [Volume III, Section III.3.2] (Feature Catalog), [Volume III, Section III.3.4] (Feature Validation), [Volume III, Section III.5.1] (Player Model Overview), [Volume III, Section III.5.2] (Behavioral Archetypes), [Volume III, Section III.6.1.4] (Emerging Pattern Detection), [Volume V, Section V.1.3] (Agent Memory — forward reference), [Part IV.1] (Simulation Architecture), [Part IV.3] (Economy Simulation — forward reference), [Part IV.4] (Social Simulation — forward reference), [Part IV.5] (Forecasting and Prediction — forward reference), [Part IV.9] (Simulation at Scale — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-PERSONA-001 through REQ-PERSONA-008.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 9, 2026

---

## Part IV.3 — Economy Simulation

Part IV.3 specifies how the Simulation Engine models a game's virtual economy — currency and resource flows, supply and demand, price formation, and the health metrics that determine whether a simulated economy is one worth deploying. This Part operationalizes the Economy Design corpus concepts ([Volume III, Section III.2.6.5]) as actual accounted simulation logic rather than design guidance alone.

### IV.3.1 Economic Model

**Virtual Currency and Resource Flows (IV.3.1.1).** Models the Economy node type and Influences edge ([Volume III, Section III.1.2, type #6; Section III.1.3, type #5]) at simulation-execution granularity: currency and resource quantities flow between personas (via the Economic Behavior Model, Section IV.2.3.6) and system-level faucets and sinks, operationalizing the faucets-and-sinks framework already named in Economy Design Principles ([Volume III, Section III.2.6.5]) as actual accounted flow rather than design guidance alone.

**Supply and Demand Modeling (IV.3.1.2).** For tradeable resources and items, simulated supply (production and drop rates, net of sink consumption) and demand (aggregate persona purchase and trade decisions per Section IV.2.3.6) interact to determine a simulated market-clearing outcome, using standard supply-and-demand modeling technique selected per this specification's technology-neutral convention.

**Price Discovery Mechanisms (IV.3.1.3).** Distinct from IV.3.1.2's aggregate modeling: for player-to-player trading systems specifically, this Section models the mechanism by which a specific price actually gets set — auction-house clearing dynamics, or direct trade negotiation shaped by a persona's Economic Rationality Index and the Anchoring corpus concept ([Volume III, Section III.2.3.3]) biasing what price a persona will accept.

**Inflation and Deflation Simulation (IV.3.1.4).** Tracks currency supply growth against sink consumption over simulated time to forecast inflationary or deflationary pressure, directly informing Economy Design Recommendations about faucet and sink tuning before a studio observes the same pressure emerge in a live, already-deployed economy.

**Economic Sink and Source Modeling (IV.3.1.5).** An explicit, independently tunable registry of every simulated faucet (currency or resource source) and sink (consumption) in a scenario, each addressable through the Parameter Space Definition ([Section IV.1.3.2]) so that an Evolutionary Search run (Part IV.8, forward reference) can search specifically over sink-and-source tuning rather than treating the economy as an unstructured black box.

- **REQ-ECON-001 (MUST):** Every simulated faucet and sink in a scenario MUST be individually registered per IV.3.1.5, not modeled as an aggregate, undifferentiated inflow/outflow rate.

### IV.3.2 Economic Agent Behavior

**Spending Patterns (IV.3.2.1).** Aggregates persona spending behavior (Section IV.2.3.6) across the population to forecast overall spend patterns — this Section is also where a real Spending Prediction model's forecast ([Volume III, Section III.5.3]) can be cross-checked against an independent, simulation-derived forecast for the same quantity, giving the platform a two-method agreement check rather than relying on a single predictive method alone.

**Saving and Hoarding (IV.3.2.2).** Personas with high Loss Sensitivity or low Risk Tolerance ([Volume III, Section III.3.2]) exhibit simulated saving or hoarding behavior rather than spending — relevant specifically for forecasting how a new sink (a limited-time offer, for example) affects a hoarding-prone segment, a population standard aggregate spend forecasts could otherwise miss entirely.

**Trading Behavior (IV.3.2.3).** Combines the Social Interaction Model (Section IV.2.3.5) with the Economic Behavior Model (Section IV.2.3.6) to simulate emergent persona-to-persona trading networks, providing the realistic baseline trading activity that Market Manipulation Detection (Section IV.3.2.4) needs in order to distinguish manipulative behavior from ordinary trading noise.

**Market Manipulation Detection (IV.3.2.4).** Simulates manipulative trading patterns (price fixing, wash trading) within the run itself, serving two purposes: validating that a proposed economy design is robust against manipulation before deployment — tested against deliberately adversarial persona behavior, not only cooperative behavior — and providing a controlled environment to test the platform's own real-world Anomaly Detection mechanism ([Volume III, Section III.4.3.3]) against known-manipulative patterns before that mechanism is relied on in production.

- **REQ-ECON-002 (SHOULD):** An economy-touching Recommendation SHOULD be simulated against adversarial trading behavior (IV.3.2.4) in addition to cooperative baseline behavior before reaching the Approved state.

### IV.3.3 Economy Health Metrics

**Currency Velocity (IV.3.3.1).** The rate of currency circulation, computed from simulated flows (Section IV.3.1.1) — a healthy velocity range indicates a "living" economy, distinguishing it from a stagnant, hoarding-dominated economy or a hyperactive one that may signal an exploit-driven flow pattern.

**Wealth Distribution — Gini Coefficient (IV.3.3.2).** The standard inequality measure computed across the simulated population's accumulated wealth. This metric is directly Fairness-relevant ([Volume I, Section I.5.2.3]): a design that simulation predicts will produce extreme wealth concentration — a small population of high-spending personas dominating the simulated economy — is exactly the finding the Ethics Layer needs surfaced before deployment, not discovered afterward from real player complaints.

**Price Stability (IV.3.3.3).** The variance and volatility of simulated prices (Section IV.3.1.3) over the run's duration — excessive volatility is itself a negative signal for player experience, independent of whether any single price level is individually "fair."

**Economic Participation Rate (IV.3.3.4).** The fraction of the persona population actively engaging with the simulated economy versus non-participants — a low participation rate suggests the economic system is relevant only to a narrow player segment, a finding that informs whether an economy Recommendation needs broader design reach rather than deeper tuning of what already exists.

**Sink/Source Balance (IV.3.3.5).** The aggregate measured ratio between the registered sinks and sources from Section IV.3.1.5 over the course of the run — the actual computed answer to whether a scenario's faucet-and-sink tuning is balanced, closing the loop from the design-time registry to a simulation-time measured outcome rather than leaving balance as an untested design assumption.

- **REQ-ECON-003 (MUST):** Wealth Distribution (Gini Coefficient) MUST be reported as a standard output for any economy-touching simulation feeding a Recommendation, per the Fairness-dimension relevance established in IV.3.3.2; it MUST NOT be an optional or opt-in metric.

---

*End of Part IV.3 — Economy Simulation.*

*Cross-References:* [Volume I, Section I.5.2.3] (Ethics Scoring Dimensions — Fairness), [Volume III, Section III.1.2] (Economy Node Type), [Volume III, Section III.1.3] (Influences Edge Type), [Volume III, Section III.2.3.3] (Anchoring and Adjustment), [Volume III, Section III.2.6.5] (Economy Design Principles), [Volume III, Section III.3.2] (Feature Catalog), [Volume III, Section III.4.3.3] (Anomaly Detection), [Volume III, Section III.5.3] (Predictive Models — Spending Prediction), [Part IV.1, Section IV.1.3.2] (Parameter Space Definition), [Part IV.2, Section IV.2.3.5–6] (Social Interaction Model, Economic Behavior Model), [Part IV.8] (Evolutionary Search and Optimization — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-ECON-001 through REQ-ECON-003.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 9, 2026

---

## Part IV.4 — Social Simulation

Part IV.4 specifies how the Simulation Engine models players as a connected network rather than a population of independently deciding individuals — social influence propagation, group formation, contagion effects, and, in Section IV.4.2, community-level health and toxicity dynamics. This Part treats moderation and safety simulation with the same rigor as monetization simulation elsewhere in this Volume: a proposed moderation intervention is validated by simulation before deployment exactly as a proposed economy change is, not treated as a lower-priority feature class exempt from the same pre-deployment discipline.

### IV.4.1 Social Network Simulation

**Friend/Guild Network Modeling (IV.4.1.1).** Simulates the social graph as an actual network topology within a run: personas are connected via simulated friend and guild relationships, drawing on Social Identity Theory and Group Formation research ([Volume III, Section III.2.7.1–2]), and this network structure determines which other personas' actions are visible to a given persona — the concrete data structure the Social Interaction Model (Section IV.2.3.5) operates over.

**Social Influence Propagation (IV.4.1.2).** Simulates how a behavior or attitude spreads through the network per Social Proof and Conformity ([Volume III, Section III.2.7.3]): a persona's decision weights shift based on connected personas' recently observed actions, modeling the actual propagation mechanism social-proof theory predicts rather than treating each persona's decisions as independent of their network.

**Group Formation Dynamics (IV.4.1.3).** Simulates guilds and groups forming, growing, and dissolving over the run's duration, per Group Formation and Cohesion research (the Tuckman stages, [Volume III, Section III.2.7.2]) — relevant for forecasting how a proposed new social feature affects group-formation rates before it exists in the live game.

**Social Contagion — Viral Mechanics (IV.4.1.4).** Models word-of-mouth propagation: a persona's positive or negative experience with a feature increases or decreases connected personas' likelihood of trying it themselves — relevant for forecasting organic feature-adoption curves distinct from directly incentivized adoption (a push notification, an explicit reward for invitation).

**Network Effects on Retention (IV.4.1.5).** Models the compounding effect of Social Dependency ([Volume III, Section III.3.2], feature #5) at network scale: a persona whose connected friends have left the game is more likely to churn, a network-effect churn pattern distinct from the individually-modeled Churn Prediction specified in [Volume III, Section III.5.3.1]. This Section specifies how that compounding is simulated, so a persona's churn probability is not computed as though their network's state were irrelevant to it.

- **REQ-SOCIAL-001 (MUST):** A persona's churn probability within a Social Simulation run MUST account for the churn state of that persona's connected network, per the Network Effects model in IV.4.1.5; independently-computed churn without network coupling MUST NOT be represented as a Social Simulation result.

### IV.4.2 Community Simulation

**Community Health Forecasting (IV.4.2.1).** Aggregates the network-level metrics from Section IV.4.1 into a forecasted community health trajectory, cross-referencing the Community Lifecycle research ([Volume III, Section III.2.7.6]) to forecast which lifecycle stage — growth, maturity, decline — a simulated community is heading toward under a proposed change.

**Toxicity Spread Modeling (IV.4.2.2).** Simulates how toxic behavior propagates through the network, drawing on Toxicity and Moderation Psychology ([Volume III, Section III.2.7.7]) and the online-disinhibition research it cites — a safety-relevant simulation type that directly informs whether a proposed social feature might inadvertently amplify toxicity spread, tested before deployment rather than discovered from real player harm afterward.

**Moderation Intervention Simulation (IV.4.2.3).** Simulates the effect of a proposed moderation intervention — a new reporting flow, an auto-mute threshold — on the toxicity spread modeled in Section IV.4.2.2, *before* that intervention is deployed. This Section exists specifically to give moderation and safety tooling the same pre-deployment simulation-validation rigor already applied to monetization and economy changes elsewhere in this Volume; a moderation feature is not exempt from the standard this Volume otherwise holds every Recommendation-feeding forecast to.

**Community Event Impact Simulation (IV.4.2.4).** Simulates the effect of a scheduled, time-bounded community event (a seasonal event, a competitive tournament) on network engagement and cohesion metrics — distinct from the Section IV.4.1 baseline simulation, this models a deliberate perturbation rather than the network's steady-state dynamics.

- **REQ-SOCIAL-002 (MUST):** A moderation or safety-tooling Recommendation MUST be validated through Moderation Intervention Simulation (IV.4.2.3) with the same rigor — fidelity tier, Ethics Gate review — applied to monetization or economy Recommendations; moderation features MUST NOT receive a lower simulation-validation standard by default.
- **REQ-SOCIAL-003 (SHOULD):** Toxicity Spread Modeling (IV.4.2.2) SHOULD be run against any proposed social feature capable of increasing player-to-player visibility or interaction frequency, given the direct relevance of network structure to toxicity propagation established in this Section.

---

*End of Part IV.4 — Social Simulation.*

*Cross-References:* [Volume III, Section III.2.7] (Social Dynamics Domain), [Volume III, Section III.3.2] (Feature Catalog — Social Dependency), [Volume III, Section III.5.3.1] (Churn Prediction), [Part IV.1] (Simulation Architecture), [Part IV.2, Section IV.2.3.5] (Social Interaction Model), [Part IV.3] (Economy Simulation), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-SOCIAL-001 through REQ-SOCIAL-003.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 9, 2026

---

## Part IV.5 — Forecasting and Prediction

Part IV.5 specifies what a simulation run actually outputs, how that output is presented to a human reviewer, and how the platform validates that its forecasts are worth trusting in the first place. Section IV.5.2.4, Disproportionate Impact Reporting, is this Part's most consequential Section: it is the mechanism that makes Persona Diversity and Coverage ([Section IV.2.2.5]) matter in practice rather than as an abstract validation requirement, because without it, a Recommendation that harms an underrepresented segment while helping the aggregate population would be invisible until real players experienced the harm.

### IV.5.1 Forecast Generation

**Point Estimates vs. Distributions (IV.5.1.1).** A forecast defaults to reporting a full distribution, not a single point estimate — a point estimate alone would hide exactly the variance and risk information the Ethics Layer and human reviewers need, and generating one presupposes the underlying persona population has already passed Behavioral Distribution Matching ([Section IV.2.4.2]). A point estimate (a distribution's mean or median) MAY be reported as a convenience summary, but never as the forecast's sole output.

**Confidence Intervals (IV.5.1.2).** Every point estimate is accompanied by a confidence or credible interval derived from the underlying run's variance — across the persona population, and, where Monte Carlo methods are used, across repeated runs (Part IV.7, forward reference). This extends the Model Confidence discipline already established at [Volume III, Section III.5.1.4] to forecast output specifically.

**Scenario Comparison — A vs. B vs. C (IV.5.1.3).** Supports side-by-side forecast comparison across multiple candidate designs, run under identical persona-population and environmental conditions — holding population constant is the one control that makes a comparison fair — directly supporting Agent Reasoning's evaluation of multiple candidate Recommendations before it decides which one to actually propose.

**Time-Horizon Forecasting (IV.5.1.4).** Three horizons — Short (session or day-level), Medium (week to month), Long-term (a quarter or more) — each potentially requiring a different method: a long-horizon forecast depends more heavily on the Learning and Adaptation Model ([Section IV.2.3.4]), since persona behavior genuinely evolves meaningfully over that span, while a short-horizon forecast can often be adequately served by comparatively static persona parameters.

**Multi-Metric Forecasting (IV.5.1.5).** A single run forecasts multiple outcome metrics simultaneously, not only the one metric a Recommendation is nominally framed around — a Recommendation targeting Retention may carry Spending or Satisfaction side effects, and multi-metric forecasting is what actually populates all seven Ethics Score dimensions ([Volume I, Section I.5.2.3]) with forecast evidence, rather than leaving five of the seven dimensions to be scored on speculation about a metric the run never actually forecast.

**Forecast Aggregation Across Personas (IV.5.1.6).** Specifies how individual persona-level simulated outcomes aggregate into a population-level forecast, weighted by the declared population composition ([Section IV.2.2.4]) — the aggregation method (mean, median, or weighted-by-subsegment) is specified explicitly because the choice materially affects what the final forecast number actually represents, and an unstated aggregation method would leave that representation ambiguous.

- **REQ-FORECAST-001 (MUST):** A forecast MUST report a full distribution and confidence interval, not a point estimate alone; a point estimate MAY be shown as a summary but MUST NOT be the only value presented.
- **REQ-FORECAST-002 (MUST):** A simulation run feeding a Recommendation MUST forecast all seven Ethics Score dimensions' relevant metrics (per Multi-Metric Forecasting, IV.5.1.5), not only the metric the Recommendation is nominally framed around.

### IV.5.2 Forecast Presentation

**Forecast Visualization Requirements (IV.5.2.1).** Forecast output renders as an actual visualization — distribution charts, scenario-comparison tables — within the Studio Tools review interface ([Volume II, Part VII.4], forward reference), not as raw numbers a reviewer must interpret unaided.

**Uncertainty Communication (IV.5.2.2).** Confidence intervals (Section IV.5.1.2) are communicated with equal visual and textual prominence to the point estimate — never relegated to a tooltip or footnote — extending the confidence-surfacing requirement already established for generated explanations ([Volume III, REQ-REASON-007]) to forecast presentation specifically.

**Best/Worst/Expected Case Framing (IV.5.2.3).** Forecasts present three named scenarios rather than a bare distribution: Best case, Expected case (the distribution's central tendency), and Worst case (an explicit tail-risk scenario) — because a reviewer evaluating an ethically sensitive Recommendation needs the worst case stated directly, not left for them to infer from a distribution's tail unassisted.

**Disproportionate Impact Reporting (IV.5.2.4).** Breaks down predicted impact by behavioral segment and archetype ([Volume III, Section III.5.2]), not only by population aggregate — the mechanism that makes a Recommendation which looks positive in aggregate but harms a specific vulnerable segment (a high-Loss-Sensitivity subpopulation, for instance) visible before deployment rather than after. This Section is precisely why Persona Diversity and Coverage Metrics ([Section IV.2.2.5]) matter operationally: without adequate coverage of minority behavioral segments in the simulated population, a disproportionate impact on an underrepresented segment could not be detected here even in principle.

**Forecast-to-Recommendation Linkage (IV.5.2.5).** Every Recommendation record ([Volume II, Section II.2.1.9]) citing a simulation forecast carries an explicit, queryable link to that specific forecast — not a prose summary alone — so the Ethics Layer's rationale-inspection tooling ([Volume II, Section II.2.2.4]) and the Lineage Query API ([Volume II, Section II.2.2.3]) can retrieve the full forecast, including its distribution, confidence interval, and disproportionate-impact breakdown, directly rather than trusting an agent's chosen summary number.

- **REQ-FORECAST-003 (MUST):** Every simulation forecast feeding a Recommendation MUST include a Disproportionate Impact breakdown by behavioral segment (IV.5.2.4); an aggregate-only forecast MUST NOT be treated as sufficient for Ethics Gate review.
- **REQ-FORECAST-004 (MUST):** A Recommendation citing a simulation forecast MUST carry a queryable link to the specific forecast record, not a prose-only summary.

### IV.5.3 Forecast Validation

**Backtesting Methodology (IV.5.3.1).** Runs the simulation forward from a historical starting point to a point where real outcomes are already known, then compares forecast against actual — the formal validation method underlying Persona Calibration ([Section IV.2.4.1]) and Outcome Prediction Accuracy ([Section IV.2.4.3]), specified here at the forecast-validation layer that consumes those persona-level checks.

**Forecast Accuracy Tracking Over Time (IV.5.3.2).** Extends Feedback Loop Closure ([Volume II, Section II.2.1.13]): every deployed Recommendation's actual measured outcome is compared against its original forecast, and this comparison is tracked longitudinally, building a running accuracy record for the Simulation Engine as a whole rather than a series of disconnected per-instance comparisons. This running record is the concrete mechanism that makes the Simulation-as-Competitive-Moat claim ([Section IV.1.1.2]) actually true over time, rather than an assertion the platform has no way to substantiate.

**Forecast Bias Detection (IV.5.3.3).** Checks whether forecast errors are systematically biased in a particular direction — consistently over- or under-forecasting a specific metric, or for a specific segment (cross-referencing Disproportionate Impact Reporting, Section IV.5.2.4, since a forecast could be systematically *more* wrong for one segment than others, itself a Fairness-relevant finding). Distinct from Persona Drift Detection ([Section IV.2.4.4]): drift concerns the underlying population changing, while bias detection concerns the forecasting method itself carrying a systematic error even against a stable, unchanged population.

**Recalibration Triggers (IV.5.3.4).** Accuracy degradation (Section IV.5.3.2) or detected bias (Section IV.5.3.3) beyond threshold triggers recalibration, governed by the same Model Governance discipline already established for predictive models ([Volume III, Section III.5.5]), extended here to Simulation's persona-calibration parameters specifically rather than reinvented as a separate governance process.

- **REQ-FORECAST-005 (MUST):** Forecast accuracy MUST be tracked longitudinally against measured outcomes per IV.5.3.2; a single-instance accuracy check at initial validation MUST NOT be treated as sufficient ongoing assurance.
- **REQ-FORECAST-006 (MUST):** Forecast Bias Detection MUST check for segment-specific bias (IV.5.3.3), not aggregate accuracy alone; a forecasting method systematically less accurate for a specific behavioral segment MUST trigger recalibration review under the same Model Governance process as accuracy degradation.

---

*End of Part IV.5 — Forecasting and Prediction.*

*Cross-References:* [Volume I, Section I.5.2.3] (Ethics Scoring Dimensions), [Volume II, Section II.2.1.13] (Feedback Loop Closure), [Volume II, Section II.2.2.3–4] (Lineage Query API, Lineage Visualization), [Volume II, Section II.2.1.9] (Recommendation Generation), [Volume II, Part VII.4] (Studio Tools — forward reference), [Volume III, Section III.5.2] (Behavioral Archetypes), [Volume III, Section III.5.5] (Model Governance), [Volume III, REQ-REASON-007] (Confidence in Explanations), [Part IV.1, Section IV.1.1.2] (Simulation as Competitive Moat), [Part IV.2, Section IV.2.2.5, Section IV.2.4] (Persona Coverage, Persona Validation), [Part IV.7] (Monte Carlo Simulation — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-FORECAST-001 through REQ-FORECAST-006.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 9, 2026

---

## Part IV.6 — Experimentation Framework

Part IV.6 specifies how the platform runs real, controlled experiments against actual players — the gold-standard causal evidence named in [Volume III, Section III.7.2.7] — and, critically, when simulation evidence alone is and isn't sufficient without one. Section IV.6.3 is this Part's center of gravity: an honest, maintained account of where the Simulation Engine's forecasts can and cannot be trusted, which is what keeps this entire Volume's forecasting apparatus from becoming a way to skip real validation rather than a way to make it more efficient.

### IV.6.1 A/B Testing Framework

**Experiment Design — Control/Treatment Groups (IV.6.1.1).** Specifies standard experiment structure for a real-world test (an Experiment node, [Volume III, Section III.1.2], type #13): a control group receiving no change and a treatment group receiving the candidate Recommendation's change, with randomized assignment (Section IV.6.2.1). This is the real-world counterpart to Simulation's forecast, and the mechanism by which the platform actually produces the randomized-experiment gold-standard evidence named in [Volume III, Section III.7.2.7] when a Recommendation warrants it.

**Simulated vs. Real-World Experiments (IV.6.1.2).** States the distinction explicitly: a Simulation run (Parts IV.1–IV.5) forecasts what *might* happen based on modeled persona behavior; a real experiment measures what *actually* happens for a real, controlled subset of real players. Simulation is the default for pre-screening and the majority of Recommendations; real experiments are reserved for high-stakes or genuinely novel-mechanic Recommendations where simulation confidence (Section IV.6.3.4) is insufficient on its own.

**Statistical Power and Sample Size (IV.6.1.3).** Specifies the standard power-analysis methodology — minimum detectable effect, required sample size — governing how large a real experiment must be to produce a trustworthy result, preventing an underpowered experiment from producing a false negative that gets read as "no effect" when the true effect was simply too small for the sample to detect.

**Experiment Duration Estimation (IV.6.1.4).** Derived from Section IV.6.1.3's sample-size requirement combined with the specific game's actual player-traffic volume, estimating how long a real experiment must run to reach adequate sample size before its result can be trusted.

**Multi-Armed Bandit Alternatives (IV.6.1.5).** For cases where the ethical cost of a full-duration fixed A/B test — potentially exposing the entire control group to a worse experience for the test's full duration — is itself a material concern, a multi-armed bandit approach (adaptively shifting traffic toward the better-performing arm as evidence accumulates) is specified as an available alternative. This is itself an ethics-relevant design choice, not merely a statistical-efficiency one: a bandit approach minimizes the population exposed to a confirmed-worse variant, a direct harm-reduction property worth stating explicitly rather than leaving implicit in a purely technical description.

- **REQ-EXP-001 (MUST):** A real experiment MUST be power-analyzed per Section IV.6.1.3 before it runs; an underpowered experiment MUST NOT be used to support a "no effect" conclusion in a Recommendation's rationale.
- **REQ-EXP-002 (SHOULD):** A Multi-Armed Bandit approach SHOULD be considered over a fixed-duration A/B test wherever the candidate treatment carries meaningful risk of being worse for the control-equivalent population, per the harm-reduction property in IV.6.1.5.

### IV.6.2 Experiment Validity

**Randomization Integrity (IV.6.2.1).** Specifies the mechanism ensuring real experiment assignment is genuinely random, not confounded by any player attribute correlated with the outcome being measured — directly connected to the Confounders discipline already established in [Volume III, Section III.7.2.4], since broken randomization is precisely what would reintroduce confounding into what is supposed to be the platform's cleanest causal-identification method.

**Novelty Effects and Learning Curves (IV.6.2.2).** Real experiments can be confounded by novelty: players react differently to *any* change simply because it is new, independent of the change's actual merit. Experiment duration and interpretation account for novelty decay, distinguishing a genuine sustained effect from a temporary novelty spike that would otherwise overstate a Recommendation's expected impact.

**Sequential Testing and Early Stopping (IV.6.2.3).** Specifies the statistical methodology for monitoring accumulating results and stopping early when a clear result emerges, with the appropriate statistical correction to prevent false-positive inflation from repeated interim analysis ("peeking"). This is distinct from the ethics-triggered early termination already specified in [Section IV.1.3.4]: that Section governs stopping because an outcome is ethically concerning; this Section governs stopping because the statistical result is already clear enough to conclude early — two different reasons to stop, each with its own discipline.

**Multiple Comparison Corrections (IV.6.2.4).** When multiple metrics or segments are tested simultaneously — the real-experiment counterpart to Multi-Metric Forecasting ([Section IV.5.1.5]) and Disproportionate Impact Reporting ([Section IV.5.2.4]) — the platform applies statistical correction (a Bonferroni-class or false-discovery-rate method, named illustratively per this specification's technology-neutral convention) to prevent spurious "significant" findings arising merely from testing many hypotheses at once. This matters specifically because segment-level disproportionate-impact testing multiplies the number of comparisons being made, and without correction, that multiplication would itself manufacture false positives.

- **REQ-EXP-003 (MUST):** Real experiment randomization MUST be verified for integrity (IV.6.2.1) before results are trusted; a randomization mechanism correlated with any outcome-relevant player attribute MUST be treated as invalid.
- **REQ-EXP-004 (MUST):** Multiple comparison correction (IV.6.2.4) MUST be applied whenever an experiment tests multiple metrics or segments simultaneously; an uncorrected multi-segment finding MUST NOT be cited as statistically significant in a Recommendation's rationale.

### IV.6.3 Simulation-to-Reality Gap

**Sim-to-Real Transfer Validation (IV.6.3.1).** Checks whether Simulation Engine forecasts match real experiment outcomes when both are run for the same candidate change — a stricter, more direct validation than the general Forecast Accuracy Tracking already specified in [Section IV.5.3.2], since it compares against a controlled experiment's result specifically rather than against general post-deployment telemetry, giving a cleaner signal of exactly how much to trust the Simulation Engine.

**Known Simulation Limitations (IV.6.3.2).** An explicit, honestly maintained registry of where the Simulation Engine is known to be less reliable: genuinely novel mechanic types with no similar precedent in the corpus or historical telemetry, very long time horizons where compounding persona-model error accumulates beyond the confidence intervals can reliably bound, and edge-case population segments with insufficient calibration data. This registry is the Simulation Engine's own instance of the honesty-about-limitations discipline already established for the Psychology Corpus ([Volume III, Section III.2.1.5]'s replication-status transparency) — applied here to the platform's own forecasting capability rather than to a cited external theory.

**When to Trust Simulation vs. Require Real Testing (IV.6.3.3).** The decision rule combining Section IV.6.3.1's validated accuracy record, Section IV.6.3.2's known-limitations registry, and the specific Recommendation's characteristics (whether it falls into a known-limitation category) to determine whether simulation evidence alone is sufficient or a real experiment (Section IV.6.1) is required before the Recommendation may reach Approved.

**Simulation Confidence Thresholds for Deployment (IV.6.3.4).** The concrete threshold, cross-referencing the Persona Validation Metrics already established in [Section IV.2.4.5]: a Recommendation may proceed to Approved on simulation evidence alone only when simulation confidence clears this threshold. Below it, Section IV.6.3.3's decision rule requires a real experiment before the Recommendation can advance further.

**Hybrid Sim + Real Validation Pipelines (IV.6.3.5).** The platform's actual recommended default workflow: simulation pre-screens and narrows candidate designs cheaply and quickly; the most promising candidate proceeds to a real confirmatory experiment — typically smaller in scale or shorter in duration than a standalone experiment would require, since simulation has already narrowed the uncertainty a real experiment would otherwise need to resolve from scratch — before full deployment. This combines both methods' strengths rather than treating simulation and real experimentation as mutually exclusive alternatives.

- **REQ-EXP-005 (MUST):** Known Simulation Limitations (IV.6.3.2) MUST be maintained as an actively updated registry, not a one-time assessment; a Recommendation falling into a registered limitation category MUST route through Section IV.6.3.3's decision rule rather than proceeding on simulation confidence alone.
- **REQ-EXP-006 (MUST):** A Recommendation MUST NOT reach Approved on simulation evidence alone if its simulation confidence falls below the threshold specified in IV.6.3.4.

### IV.6.4 Pre-Deployment Testing Requirements

**Minimum Simulation Coverage Before Human Review (IV.6.4.1).** A Recommendation MUST NOT reach the Reviewed state ([Volume II, Section II.2.6.2.b]) without at least a Medium-fidelity simulation run satisfying the Multi-Metric Forecasting and Disproportionate Impact Reporting requirements already established ([Section IV.5.1.5], [Section IV.5.2.4]) — this Section states the actual pre-deployment testing gate as a requirement layered on top of the state-machine mechanics Volume II already specifies, rather than leaving simulation coverage as an assumed but unstated precondition.

**Required Confidence Thresholds by Risk Tier (IV.6.4.2).** Ties a Recommendation's risk tier — informed by its Manipulation Risk and Regulatory Risk dimension scores and the magnitude of the change it proposes ([Volume I, Section I.5.2.3]) — to the confidence threshold required under Section IV.6.3.4. A low-risk Recommendation may proceed on Medium-fidelity simulation alone; a high-risk Recommendation requires High-fidelity simulation and, per Section IV.6.3.3's decision rule, potentially a confirmatory real experiment as well.

**Escalation for Low-Confidence Recommendations (IV.6.4.3).** A Recommendation whose simulation confidence falls below its risk tier's required threshold (Section IV.6.4.2) does not proceed with a caveat attached — it escalates, either into the Hybrid pipeline (Section IV.6.3.5, requiring real-experiment confirmation) or to a higher review authority, following the same escalation-authority pattern already established for Emergency Override ([Volume II, Section II.2.6.6]) and Human Override ([Volume III, Section III.5.5.7]). This closes the loop that would otherwise let a low-confidence, high-stakes Recommendation slip through on a technicality rather than being forced to either gather better evidence or receive elevated human scrutiny.

- **REQ-EXP-007 (MUST):** A Recommendation MUST NOT reach Reviewed without the minimum simulation coverage specified in IV.6.4.1.
- **REQ-EXP-008 (MUST):** A Recommendation's required simulation confidence threshold MUST scale with its risk tier per IV.6.4.2; a uniform threshold applied regardless of risk tier MUST NOT be treated as compliant.
- **REQ-EXP-009 (MUST):** A Recommendation falling below its required confidence threshold MUST escalate per IV.6.4.3; it MUST NOT proceed toward Approved with the shortfall merely noted in its rationale.

---

*End of Part IV.6 — Experimentation Framework.*

*Cross-References:* [Volume I, Section I.5.2.3] (Ethics Scoring Dimensions), [Volume II, Section II.2.6.2, Section II.2.6.6] (Recommendation State Machine, Emergency Override), [Volume III, Section III.1.2] (Experiment Node Type), [Volume III, Section III.2.1.5] (Corpus Quality Metrics), [Volume III, Section III.5.5.7] (Human Override Policy), [Volume III, Section III.7.2.4, Section III.7.2.7] (Confounders, Causal Effect Estimation Methods), [Part IV.1, Section IV.1.3.4] (Termination Conditions), [Part IV.2, Section IV.2.4.5] (Persona Validation Metrics), [Part IV.5] (Forecasting and Prediction), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-EXP-001 through REQ-EXP-009.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 9, 2026

---

## Part IV.7 — Monte Carlo Simulation

Part IV.7 specifies the sampling methodology that actually produces the distributions Part IV.5 reports, and the risk-modeling techniques built on top of it. Section IV.7.2's tail-risk and worst-case work matters for a specific structural reason: the Ethics Score's veto-dimension architecture ([Volume III, Section III.2.11.3]) is a hard constraint, not an expected-value optimization, and a hard constraint needs a worst-case bound to check against — a probability-weighted average risk estimate alone cannot tell a reviewer whether a catastrophic outcome, however unlikely, remains possible at all.

### IV.7.1 Monte Carlo Methods

**Random Sampling Strategies (IV.7.1.1).** The mechanism that actually produces the distributions Forecast Generation ([Section IV.5.1.1]) reports: repeated random draws from persona parameter distributions, not a single deterministic persona per archetype — sampling across the full distribution of behavioral parameters within a cluster or archetype captures within-segment variance that a single representative persona per segment would flatten away entirely.

**Variance Reduction Techniques (IV.7.1.2).** Standard methods (stratified sampling, importance sampling, antithetic variates, named illustratively per this specification's technology-neutral convention) that produce a stable distribution estimate from fewer simulation runs than naive random sampling would require — a direct compute-efficiency concern given the resource allocation constraints already established in [Section IV.1.2.2].

**Convergence Criteria (IV.7.1.3).** Defines precisely, for Monte Carlo runs specifically, the convergence-based stopping rule already named generally in Termination Conditions ([Section IV.1.3.4]): a run continues sampling until the estimated distribution's parameters (mean, variance) stabilize within a configured tolerance across additional samples, at which point further sampling would add compute cost without materially improving the estimate.

**Sensitivity Analysis (IV.7.1.4).** Systematically varies one input parameter at a time (or via more sophisticated joint-variation methods) to determine which parameters most strongly influence a given outcome — telling a designer or agent not only *what* will happen but *what is driving it*, which is what makes a forecast diagnostically useful rather than only predictively useful.

- **REQ-MC-001 (MUST):** Monte Carlo sampling MUST draw from the full parameter distribution within a persona segment (IV.7.1.1), not from a single deterministic representative value, wherever a run is used to produce a distributional forecast.
- **REQ-MC-002 (MUST):** A Monte Carlo run's convergence criteria (IV.7.1.3) MUST be declared before execution; a run terminated on a fixed sample count without checking convergence MUST NOT be presented as having converged.

### IV.7.2 Risk Modeling

**Tail Risk Estimation (IV.7.2.1).** Estimates the probability and magnitude of low-probability, high-impact outcomes specifically — the distribution's tail — feeding the Worst Case framing already established in [Section IV.5.2.3] with an actual quantified tail-risk figure rather than an impressionistic worst-case example a reviewer has to take on faith.

**Black Swan Scenario Modeling (IV.7.2.2).** Explicitly models genuinely unprecedented, extreme scenarios beyond what calibrated historical data would typically suggest — directly connected to the honest limitation already acknowledged in Known Simulation Limitations ([Section IV.6.3.2]): the Simulation Engine is weaker for genuinely novel scenarios by construction, and this Section is the platform's structured attempt to say something useful about such scenarios anyway, via deliberate stress-scenario construction rather than pure historical extrapolation — with the resulting confidence level explicitly flagged as lower, per Section IV.6.3.2's registry, rather than presented with the same confidence as a well-calibrated forecast.

**Stress Testing (IV.7.2.3).** Deliberately simulates the persona population under adverse or extreme conditions — a sudden large population influx, a coordinated bad-actor campaign, an economic shock (Section IV.7.3.3) — to verify a proposed design remains acceptable (does not cross an ethics threshold, does not collapse economically) even outside the expected, typical case a standard simulation run would test.

**Worst-Case Bounds (IV.7.2.4).** Distinct from Section IV.7.2.1's probabilistic tail-risk estimate: specifies the deterministic worst-case bound — the theoretical maximum possible negative outcome given a mechanic's design parameters, independent of how probable that outcome is. This matters because the Ethics Score's veto-dimension architecture ([Volume III, Section III.2.11.3]'s MCDM grounding) is a hard constraint, not an expected-value optimization, and a hard constraint is exactly what a deterministic worst-case bound is suited to checking against — a probabilistic tail-risk estimate alone, however small the stated probability, cannot substitute for confirming a catastrophic outcome is structurally impossible rather than merely unlikely.

- **REQ-MC-003 (MUST):** Tail Risk Estimation (IV.7.2.1) MUST be computed for any Recommendation whose Ethics Score approaches a veto threshold on any dimension, per [Volume I, Section I.5.2.3]; expected-value framing alone MUST NOT be treated as sufficient for a near-threshold Recommendation.
- **REQ-MC-004 (MUST):** Worst-Case Bounds (IV.7.2.4) MUST be computed and reported as a deterministic bound, not inferred from a percentile of the probabilistic distribution; the two figures MUST be presented as distinct, not conflated.

### IV.7.3 Applications

**Revenue Forecasting Under Uncertainty (IV.7.3.1).** Applies Monte Carlo methods to Spending Prediction ([Volume III, Section III.5.3])-adjacent forecasts, producing a full revenue distribution rather than a point estimate for business-planning purposes (cross-referencing Volume VIII, forward reference).

**Player Population Growth Scenarios (IV.7.3.2).** Runs Monte Carlo over uncertain future player-acquisition and growth rates to forecast how a Recommendation's impact varies depending on population growth trajectory — relevant because a design's Fairness and economy-health implications, per [Section IV.3.3], can differ substantially between a stagnant and a rapidly growing player base.

**Economic Shock Simulation (IV.7.3.3).** Applies Stress Testing (Section IV.7.2.3) specifically to Economy Simulation (Part IV.3): sudden currency devaluation, market crashes, or exploit-driven currency injection, verifying an Economy Design's resilience against the registered faucet-and-sink mechanisms already specified in [Section IV.3.1.5].

**Ethics Score Sensitivity Analysis (IV.7.3.4).** Applies Sensitivity Analysis (Section IV.7.1.4) specifically to the seven Ethics Score dimensions ([Volume I, Section I.5.2.3]): which underlying simulation parameter most strongly drives a Manipulation Risk or Fairness score. This gives reviewers and designers actionable diagnostic insight into exactly what to change about a Recommendation to improve its ethics profile, rather than a pass/fail score alone with no indication of which lever would actually move it.

- **REQ-MC-005 (MUST):** Ethics Score Sensitivity Analysis (IV.7.3.4) MUST be available to a human reviewer for any Recommendation with a borderline Ethics Score on any dimension, giving the reviewer a diagnostic basis for a Modified-state revision rather than only an Approve/Reject binary.

---

*End of Part IV.7 — Monte Carlo Simulation.*

*Cross-References:* [Volume I, Section I.5.2.3] (Ethics Scoring Dimensions), [Volume III, Section III.2.11.3] (Multi-Criteria Decision Making), [Volume III, Section III.5.3] (Predictive Models), [Part IV.1, Section IV.1.2.2, Section IV.1.3.4] (Compute Resource Allocation, Termination Conditions), [Part IV.3, Section IV.3.1.5, Section IV.3.3] (Economic Sink and Source Modeling, Economy Health Metrics), [Part IV.5, Section IV.5.1.1, Section IV.5.2.3] (Forecast Generation, Best/Worst/Expected Case Framing), [Part IV.6, Section IV.6.3.2] (Known Simulation Limitations), [Volume VIII] (Business — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-MC-001 through REQ-MC-005.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 9, 2026

---

## Part IV.8 — Evolutionary Search and Optimization

Part IV.8 specifies how the platform searches a design space for good candidate mechanics rather than only evaluating candidates a human already proposed — and, in Section IV.8.3, how that search is prevented from doing what optimization processes are structurally prone to doing: finding a solution that scores well on the letter of an objective while violating its intent. This is not a hypothetical risk specific to this platform; it is the well-documented failure mode of optimization generally, and Section IV.8.3 exists because Sections IV.8.1 and IV.8.2 alone — however carefully the objective function is defined — cannot be trusted to prevent it on their own.

### IV.8.1 Optimization Framework

**Objective Function Definition (IV.8.1.1).** An objective function is never defined as a single unconstrained scalar (never simply "maximize revenue") — it is always defined jointly with the constraints specified in Section IV.8.1.3. A raw, constraint-free objective is explicitly disallowed as a starting point, given the reward-hacking risk it immediately creates.

**Multi-Objective Optimization (IV.8.1.2).** Optimizes across competing objectives — Retention, Revenue, Satisfaction, and the non-veto Ethics Score dimensions ([Volume I, Section I.5.2.3]) — simultaneously, using Pareto-based multi-objective methods (Section IV.8.2.3) rather than collapsing objectives into a single weighted-sum scalar. A weighted sum can hide a catastrophic score on one objective behind a strong score on another — precisely the reasoning that already justified the Ethics Score's non-averaging rule ([Volume I, Section I.5.2.3]), now applied to the search process itself rather than only to final scoring.

**Constraint Satisfaction — Ethics as Hard Constraints (IV.8.1.3).** The veto-relevant Ethics dimensions (Manipulation Risk, Fairness, Regulatory Risk in particular) are treated as hard constraints the search must satisfy, not as objectives traded off alongside the others. This is the critical safety architecture of this Part: the search space itself *excludes* ethics-violating solutions structurally, rather than including them and relying on multi-objective trade-off to steer away from them by chance. This is the concrete implementation of the veto-dimension MCDM grounding already established in [Volume III, Section III.2.11.3] — a literal constraint on the search space, not merely a post-hoc scoring rule applied after candidates are already generated.

**Genetic Algorithm Design Space Exploration (IV.8.1.4).** One available search method (genetic and evolutionary algorithms as a technology-neutral class): mutation, crossover, and selection applied to the mechanic-design parameter space, suited to design spaces too large or discontinuous for gradient-based methods to navigate.

**Gradient-Free Optimization Methods (IV.8.1.5).** A broader class beyond genetic algorithms (simulated annealing, particle swarm methods, named illustratively) appropriate wherever the objective function — a full Simulation Engine run — has no accessible gradient, since a simulation run is, from the optimizer's perspective, an opaque black-box function.

**Bayesian Optimization for Expensive Simulations (IV.8.1.6).** Preferred specifically when each candidate evaluation is costly (a High-fidelity simulation run per [Section IV.1.1.4]), since Bayesian Optimization is designed to find good solutions using fewer expensive evaluations than genetic algorithms typically require — a direct application of compute-cost awareness to the search process itself, not only to the simulation runs it invokes.

- **REQ-OPT-001 (MUST):** An objective function MUST be defined jointly with its constraints (IV.8.1.3); an unconstrained single-objective function MUST NOT be used to drive a search over mechanic designs.
- **REQ-OPT-002 (MUST):** Ethics-veto-relevant dimensions MUST be implemented as hard constraints excluding non-compliant solutions from the search space, not as objectives weighted alongside Retention, Revenue, or Satisfaction.

### IV.8.2 Design Space Search

**Parameter Space Exploration (IV.8.2.1).** The actual search execution over the Parameter Space Definition already established in [Section IV.1.3.2], using the methods specified in Sections IV.8.1.4 through IV.8.1.6.

**Novel Mechanic Generation — Constrained Creativity (IV.8.2.2).** The search may propose genuinely novel mechanic structures, not only parameter tuning within an existing mechanic — but only within the constraint boundaries of Section IV.8.1.3, and only by composing registered node and edge types from the Knowledge Graph's closed schema ([Volume III, Section III.1], [REQ-GRAPH-001–002]). A search process MUST NOT be permitted to invent a mechanic type falling outside what the platform's schema and Ethics Framework can even represent or evaluate — creative search stays strictly within the bounds of what the rest of the platform is actually equipped to govern.

**Pareto Frontier Analysis (IV.8.2.3).** The actual output of multi-objective optimization (Section IV.8.1.2): a Pareto frontier — a set of non-dominated solutions, each optimal on some trade-off between objectives, none strictly better than another across every objective simultaneously — rather than a single automated "best" answer, presented to human reviewers as a set of options to choose among.

**Human-in-the-Loop Optimization (IV.8.2.4).** The search proposes candidates from the Pareto frontier (Section IV.8.2.3); a human makes the final selection among them. This mirrors the human-in-the-loop principle already established throughout this specification ([Volume I, Section I.2.1.6], the Recommendation Gate in [Volume II, Section II.2.6]), applied specifically to the search process: the optimizer narrows the option space, it does not decide.

- **REQ-OPT-003 (MUST):** Novel mechanic generation MUST compose only registered node and edge types from the Knowledge Graph schema ([Volume III, REQ-GRAPH-001–002]); a search process MUST NOT introduce an unregistered structural element.
- **REQ-OPT-004 (MUST):** Multi-objective search output MUST be presented as a Pareto frontier for human selection; the search process MUST NOT auto-select and directly propose a single "optimal" candidate as a Recommendation without human selection from the frontier.

### IV.8.3 Optimization Safety

**Preventing Reward Hacking (IV.8.3.1).** An optimizer will, given the chance, find a solution that scores well on the letter of an objective function while violating its intent — a mechanic that scores high on Retention by exploiting a measurement gap (an edge case the Feature Catalog underweights, or a boundary condition in how a metric is computed) rather than by genuinely improving the player experience the metric was meant to proxy. Countermeasures are twofold: objective functions and the search process itself are periodically red-teamed — tested adversarially, treating the optimizer as if it were actively trying to game the metric, extending the same adversarial-testing precedent already established for Market Manipulation Detection ([Section IV.3.2.4]) to the optimizer rather than only to simulated trading behavior — and any search result significantly outperforming historical baselines is flagged for elevated scrutiny rather than accepted uncritically as a good outcome. An unusually strong result is itself a signal worth investigating, not a result to celebrate without first checking how it was achieved.

**Preventing Manipulation-Optimized Solutions (IV.8.3.2).** Constraint Satisfaction (Section IV.8.1.3) already excludes ethics-violating solutions from the search space structurally — this Section adds a second, independent check: every search-proposed solution is re-scored through the *full* standard Ethics Gate process ([Volume II, Section II.2.6], [Volume III, Section III.5.5.2.d]), rather than the platform trusting the search's own constraint-satisfaction claim alone. This is deliberate defense in depth: a bug or gap in the constraint-satisfaction implementation should never be the only thing standing between an optimizer and a manipulative solution reaching a human reviewer.

**Optimization Boundary Enforcement (IV.8.3.3).** The technical enforcement mechanism preventing Constrained Creativity (Section IV.8.2.2) from silently exceeding its bounds: a hard filter rejects any candidate solution that structurally cannot satisfy the constraints *before* it is ever simulated or scored — a first line of defense — with the full Ethics Gate re-scoring (Section IV.8.3.2) as the second, independent line. Neither line is treated as sufficient alone.

**Human Review of Optimization Results (IV.8.3.4).** Every optimization run's full output — not only the human-selected final choice, but the search process's complete exploration, including candidates filtered out for constraint violations — is retained and available for human audit, per the audit-trail discipline already established in [Volume I, Section I.5.2.5]. This lets a reviewer or auditor verify that the search process itself behaved as specified, rather than trusting only the final selected output and having no visibility into what the search considered and rejected along the way.

- **REQ-OPT-005 (MUST):** Objective functions and the search process MUST be periodically red-teamed via adversarial testing (IV.8.3.1); a search result significantly outperforming historical baselines MUST be flagged for elevated review rather than accepted at face value.
- **REQ-OPT-006 (MUST):** Every search-proposed solution MUST pass the full standard Ethics Gate process (IV.8.3.2) independent of and in addition to the search's own constraint-satisfaction filtering; constraint satisfaction alone MUST NOT be treated as sufficient for Ethics Gate clearance.
- **REQ-OPT-007 (MUST):** The complete exploration history of an optimization run — including filtered-out candidates — MUST be retained and available for audit, not only the final selected candidate.

---

*End of Part IV.8 — Evolutionary Search and Optimization.*

*Cross-References:* [Volume I, Section I.2.1.6] (Human-in-the-Loop), [Volume I, Section I.5.1.3] (Manipulation Boundary), [Volume I, Section I.5.2.3] (Ethics Scoring Dimensions), [Volume I, Section I.5.2.5] (Audit and Evidence Trail), [Volume II, Section II.2.6] (Recommendation Gate Architecture), [Volume III, Section III.1] (Knowledge Graph Schema), [Volume III, REQ-GRAPH-001–002] (Closed Type Catalog), [Volume III, Section III.2.11.3] (Multi-Criteria Decision Making), [Volume III, Section III.5.5.2.d] (Ethics Gate), [Part IV.1, Section IV.1.1.4, Section IV.1.3.2] (Simulation Fidelity, Parameter Space Definition), [Part IV.3, Section IV.3.2.4] (Market Manipulation Detection), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-OPT-001 through REQ-OPT-007.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 9, 2026

---

## Part IV.9 — Simulation at Scale

Part IV.9 closes Volume IV by specifying how everything Parts IV.1 through IV.8 established still holds at the platform's stated ceiling: ten million personas in a single run. Section IV.9.3 is where this Part does its most important work — closing the loop on every forward reference this Volume has made to ethics-constraint rejection, reproducibility, and audit, and making explicit that none of those commitments is permitted to soften merely because the platform is now operating at a scale where honoring them costs more.

### IV.9.1 Large-Scale Simulation

**10 Million Persona Simulations (IV.9.1.1).** Specifies ten million personas as the architecture's upper-bound target, not the typical case — most runs use far smaller populations per the composition rules in [Section IV.2.2.4]; this ceiling exists for the highest-stakes questions, such as a platform-wide change affecting an entire large player base, where the Disproportionate Impact Reporting requirement ([Section IV.5.2.4]) needs enough population to actually resolve minority-segment effects at scale.

**Distributed Simulation Architecture (IV.9.1.2).** At ten-million-persona scale, the single-node parallelism strategy already specified in [Section IV.1.2.3] is insufficient; this Section specifies multi-node distributed execution, extending the Simulation Engine's independent-scaling extraction point already established in [Volume II, Section II.1.2.3] and running atop the Cloud deployment model's orchestration layer ([Volume II, Section II.5.3]).

**Simulation Sharding Strategies (IV.9.1.3).** Personas are partitioned across nodes by independence where possible — Player Behavior simulation, which has minimal cross-persona dependency, shards freely — and by network locality where it isn't: Social Simulation ([Part IV.4]) co-locates personas within the same friend or guild network on the same shard, minimizing how often the expensive cross-node communication case in Section IV.9.1.4 is actually needed.

**Inter-Persona Communication at Scale (IV.9.1.4).** The mechanism forward-referenced from [Section IV.1.2.3] and [Section IV.2.3.5]: when personas must interact across a shard boundary (Social or Economy simulation types), a message-passing protocol between simulation worker nodes carries that interaction — deliberately the expensive case, which is exactly why Sharding Strategies (Section IV.9.1.3) are designed to minimize its frequency rather than treating it as the common path.

**Simulation Result Aggregation at Scale (IV.9.1.5).** At ten-million-persona scale, Forecast Aggregation ([Section IV.5.1.6]) is itself a distributed computation — a distributed reduce operation, not an in-memory summary — using the same streaming and batch aggregation patterns already established at the platform level in [Volume II, Section II.2.3] rather than a separately invented aggregation mechanism specific to Simulation.

- **REQ-SIMSCALE-001 (MUST):** The Simulation Engine's distributed architecture MUST support ten million concurrent personas in a single run without requiring architectural changes beyond horizontal scaling of the existing sharding mechanism (IV.9.1.3).
- **REQ-SIMSCALE-002 (MUST):** Persona sharding MUST co-locate network-connected personas for Social and Economy simulation types, per IV.9.1.3, to minimize cross-shard communication overhead.

### IV.9.2 Performance Optimization

**Simulation Throughput Targets (IV.9.2.1).** Extends the platform-level quality attributes already specified in [Volume II, Section II.1.4.1] with a Simulation-specific target: a ten-million-persona, multi-timestep run completes within a wall-clock window appropriate to the Recommendation pipeline's cycle-time needs, so that even the platform's most expensive simulation type does not indefinitely block a Recommendation awaiting its forecast.

**GPU Acceleration for Persona Computation (IV.9.2.2).** Extends GPU Allocation ([Volume II, Section II.6.3.3]) and Compute Resource Allocation ([Section IV.1.2.2]): persona decision-model computation (Section IV.2.3) is GPU-accelerated wherever the model architecture supports batched parallel computation — many personas' decisions computed as a single batched tensor operation rather than sequentially, one persona at a time.

**Approximate Simulation for Speed (IV.9.2.3).** Trades some accuracy for speed at massive scale by simulating a statistically valid representative sub-sample of the full population and extrapolating, using the Monte Carlo sampling methods already specified in [Section IV.7.1], rather than literally simulating all ten million personas for every run regardless of the question being asked. Explicitly tied to the Fidelity Tier system ([Section IV.1.1.4]): approximate, sampled simulation is appropriate at Low and Medium fidelity; full-population simulation is reserved for High-fidelity validation of the highest-stakes Recommendations, per the fidelity requirements already established in [REQ-SIM-001].

**Hierarchical Simulation — Coarse-to-Fine (IV.9.2.4).** Formalizes the tiered-fidelity workflow forward-referenced from [Section IV.1.1.4]: a candidate design is first screened with a fast, coarse (Low-fidelity, small or approximate population) run; only candidates surviving that coarser screen receive progressively more compute investment (Medium, then High fidelity, larger population) — an efficient funnel rather than evaluating every candidate at full fidelity and scale from the outset.

- **REQ-SIMSCALE-003 (MUST):** Approximate Simulation (IV.9.2.3) MUST NOT be used for High-fidelity, Recommendation-gating validation runs; full-population or fully valid statistical sampling per the confidence requirements in [Section IV.6.3.4] is required at that tier.
- **REQ-SIMSCALE-004 (SHOULD):** Candidate designs SHOULD be screened through Hierarchical Simulation's coarse-to-fine funnel (IV.9.2.4) by default, reserving High-fidelity, full-scale runs for candidates that have already survived coarser screening.

### IV.9.3 Simulation Governance

**Simulation Result Audit Trail (IV.9.3.1).** Every simulation run — not only runs that produced a Recommendation — is logged per the audit-trail discipline already established in [Volume I, Section I.5.2.5], including runs at the full ten-million-persona scale. This is stated explicitly because scale pressure is exactly the condition under which an engineering shortcut might be tempted to treat full audit logging as impractical or too costly to maintain; this Section forecloses that shortcut rather than leaving it as an implicit expectation scale could quietly erode.

**Simulation Reproducibility Requirements (IV.9.3.2).** Extends the fixed-seed reproducibility requirement already cited throughout this Volume (Part X.3, forward reference) to distributed execution specifically: a large-scale, multi-node simulation run must remain reproducible given the same seed and inputs despite the added complexity distributed execution introduces — race conditions, network timing variance, non-deterministic aggregation ordering. Distributed execution MUST NOT be permitted to sacrifice the reproducibility guarantee for the sake of scale or speed; deterministic aggregation and ordering are required even in the distributed case, not only in the simpler single-node case.

**Rejecting Simulations That Violate Ethics Constraints (IV.9.3.3).** The mechanism forward-referenced from Termination Conditions ([Section IV.1.3.4]) and Constraint Satisfaction ([Section IV.8.1.3]): a simulation run itself — not only its resulting Recommendation — can be rejected, terminated, or flagged when the run's configuration or interim results indicate it is simulating a scenario that violates an ethics constraint, closing the loop on every one of this Volume's forward references to ethics-triggered rejection with the actual authority and mechanism that performs it.

**Simulation Cost Accounting (IV.9.3.4).** Tracks the actual compute cost of every simulation run, extending the Cost Efficiency quality attribute already specified in [Volume II, Section II.1.4.8]. Cost is attributed per run — to the specific Recommendation it supports, or to exploratory and proactive use per the scheduler priority already established in [Section IV.1.2.1] — so that cost accountability exists at the scale this Volume's most expensive operations can actually reach, rather than compute cost becoming an untracked, unattributed platform-wide expense.

- **REQ-SIMSCALE-005 (MUST):** Every simulation run MUST be logged to the audit trail regardless of scale or whether it produced a Recommendation; audit logging MUST NOT be selectively disabled for large-scale runs on cost or performance grounds.
- **REQ-SIMSCALE-006 (MUST):** Distributed simulation execution MUST produce deterministic, reproducible results given identical seed and inputs; non-deterministic aggregation ordering MUST NOT be introduced for performance reasons.
- **REQ-SIMSCALE-007 (MUST):** A simulation run detected to be simulating an ethics-constraint-violating scenario MUST be rejectable or terminable independent of whether it has yet produced a Recommendation, per Section IV.9.3.3.
- **REQ-SIMSCALE-008 (MUST):** Simulation compute cost MUST be tracked and attributed per run; untracked or unattributed simulation compute expenditure MUST NOT be permitted at scale.

---

*End of Part IV.9 — Simulation at Scale.*

*Cross-References:* [Volume I, Section I.5.2.5] (Audit and Evidence Trail), [Volume II, Section II.1.2.3] (Modular Monolith with Extraction Points), [Volume II, Section II.1.4.1, Section II.1.4.8] (Performance Targets, Cost Efficiency), [Volume II, Section II.2.3] (Event Flow Patterns), [Volume II, Section II.5.3] (Kubernetes Architecture), [Volume II, Section II.6.3.3] (GPU Allocation), [Part IV.1] (Simulation Architecture), [Part IV.2, Section IV.2.2.4, Section IV.2.3.5] (Population Composition, Social Interaction Model), [Part IV.4] (Social Simulation), [Part IV.5, Section IV.5.1.6, Section IV.5.2.4] (Forecast Aggregation, Disproportionate Impact Reporting), [Part IV.6, Section IV.6.3.4] (Simulation Confidence Thresholds), [Part IV.7, Section IV.7.1] (Monte Carlo Methods), [Part IV.8, Section IV.8.1.3] (Constraint Satisfaction), [Part X.3] (Reproducibility — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-SIMSCALE-001 through REQ-SIMSCALE-008.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 9, 2026

---

## End of Volume IV — Simulation Engine

Volume IV is complete: nine Parts, specifying the Simulation Engine's foundational architecture (IV.1), the Virtual Personas whose decision logic makes the Psychology Corpus executable (IV.2), Economy and Social simulation (IV.3–IV.4), Forecasting output built to surface disproportionate impact rather than hide it in an aggregate (IV.5), the Experimentation Framework that keeps simulation honest against real-world results (IV.6), Monte Carlo risk modeling with hard worst-case bounds alongside probabilistic estimates (IV.7), Evolutionary Search with ethics constraints built into the search space itself rather than bolted on after (IV.8), and Simulation at Scale, which closes the Volume by confirming none of the preceding eight Parts' commitments — audit, reproducibility, ethics rejection — are permitted to soften under the pressure of ten-million-persona scale (IV.9).

Requirement IDs issued across this Volume: REQ-SIM-001–006, REQ-PERSONA-001–008, REQ-ECON-001–003, REQ-SOCIAL-001–003, REQ-FORECAST-001–006, REQ-EXP-001–009, REQ-MC-001–005, REQ-OPT-001–007, REQ-SIMSCALE-001–008 — 55 requirements in total.

*Volume V — Agent Framework follows, per [PsyForge_v1_Master_TOC.md].*
