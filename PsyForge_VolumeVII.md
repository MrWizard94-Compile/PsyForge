# PsyForge v1.0 — Volume VII: Enterprise Platform

*Part of the PsyForge Master Specification. See [PsyForge_v1_Master_TOC.md](PsyForge_v1_Master_TOC.md) for the full document map, and Volumes I through VI for Strategic Foundation, System Architecture, Knowledge Graph and AI Core, Simulation Engine, Agent Framework, and Telemetry/SDK/Data Integration respectively.*

*Document Status: Living Specification — Volume VII complete (Parts VII.1–VII.6).*

---

Volume VII specifies the user-facing layer sitting atop everything the previous six Volumes have built: the Dashboard, Studio Tools, Reporting, API, and Plugin System that give a human being — or another program, via API — actual access to the platform's underlying architecture, AI core, simulation, agents, and telemetry. This Volume introduces no new backend capability; it exposes what already exists, which means every access-control claim it makes has to trace back to a real enforcement mechanism already specified in an earlier Volume, not merely assert a permission at the UI layer and hope the backend agrees.

---

## Part VII.1 — Platform Overview

### VII.1.1 Platform Architecture

**Platform Component Map (VII.1.1.1).** The Platform is the user-facing layer over everything already specified: the Dashboard ([Part VII.2]), Studio Tools ([Part VII.4]), Reporting ([Part VII.3]), and API ([Part VII.5]) provide human and programmatic access respectively to the System Architecture ([Volume II]), Knowledge Graph and AI Core ([Volume III]), Simulation Engine ([Volume IV]), Agent Framework ([Volume V]), and Telemetry pipeline ([Volume VI]). Nothing in this Volume creates new processing capability; it creates visibility and control surfaces over capability that already exists.

**Platform vs. SDK vs. Engine Distinction (VII.1.1.2).** Three related but distinct terms, clarified here because they are easy to conflate: the **SDK** ([Volume VI, Part VI.2]) is what a studio integrates into their game client; the **Engine** is the backend processing and reasoning capability specified across Volumes II through V; the **Platform** (this Volume) is the interface humans and external systems use to interact with the Engine's output. Each serves a different actor at a different point in the pipeline — a studio's engineers touch the SDK, the Engine runs unattended, and the Platform is what a designer, analyst, or executive actually opens.

**Multi-Tenant Architecture (VII.1.1.3).** Extends the tenant boundary and trust-boundary architecture already established at [Volume II, Section II.1.1.5] and [Volume II, Section II.6.2.3] into the Platform's own structure: each studio is a tenant, and the Platform provides tenant-scoped views into that studio's own data exclusively.

**Tenant Isolation Model (VII.1.1.4).** The concrete UI and API-layer enforcement of tenant isolation: every Dashboard view and every API call is scoped to the authenticated tenant's own data, backed by the storage-layer tenant partitioning already established at [Volume II, Section II.6.2.1, Section II.6.2.3]. This Section's obligation is to confirm the isolation guarantee holds all the way up through the user-facing layer — a Platform bug that leaked cross-tenant data through the UI would violate a guarantee the storage layer alone cannot make good on if the layer above it doesn't honor the same boundary.

- **REQ-PLATFORM-001 (MUST):** Every Dashboard view and API response MUST be scoped to the authenticated tenant's own data; a Platform-layer defect that surfaces another tenant's data MUST be treated as a Severity-1 incident per [Volume II, Section II.7.4.2]'s tenant-isolation-breach classification.

### VII.1.2 User Roles

Seven roles, six held by human users and one representing programmatic access, each carrying a distinct scope across the Dashboard, Studio Tools, Reporting, and API surfaces this Volume specifies in the Parts that follow.

**Studio Administrator (VII.1.2.1).** Full tenant-level administrative access: user management, billing, API key management, and overall tenant configuration.

**Game Designer (VII.1.2.2).** Access to design-relevant Studio Tools (Simulation Studio, Recommendation Studio, [Part VII.4]) and design-relevant Dashboard views (Player Behavior Explorer, Economy Monitor, [Part VII.2]).

**Data Analyst (VII.1.2.3).** Broader read access to Feature, Player Model, and Knowledge Graph data, analytical Dashboard views, and full Reporting access ([Part VII.3]), without Recommendation approval authority.

**Producer / Executive (VII.1.2.4).** Executive Overview Dashboard access and Reporting access for high-level KPI and trend visibility, without the deep technical tool access (Simulation Studio, Agent Studio) a Game Designer or Data Analyst would use directly.

**Ethics Reviewer (VII.1.2.5).** The Platform role corresponding to membership on the Ethics Board already specified at [Volume I, Section I.5.3.1]: Ethics Score Dashboard access, Audit Log access, and Recommendation review authority specifically for ethics-flagged items. This role is what gives the Ethics Board's authority — the Override and Escalation process at [Volume I, Section I.5.2.4] and the Emergency Override at [Volume II, Section II.2.6.6] — an actual user interface. The Board is not an abstraction; specific Platform users hold this role and exercise that authority through the screens this Volume specifies.

**Read-Only Viewer (VII.1.2.6).** View-only access across a permitted subset of Dashboard views, with no write, approval, or configuration capability — suited to external stakeholders, auditors, or broader internal visibility without governance risk.

**API Consumer — Service Account (VII.1.2.7).** A non-human role: a service account for programmatic API access ([Part VII.5]), authenticating via API key ([Section VII.5.2.1]) rather than a human login, typically scoped to specific endpoints rather than the full role-based Dashboard access a human role receives.

**Role Permission Matrix (VII.1.2.8).** A category-level consolidation, in the spirit of the Agent Permission Matrix already established at [Volume V, Section V.13.3.2]. This table is intentionally stated at the category level — Dashboard, Studio Tools, Reporting, Recommendation Approval, Ethics Override, API — rather than claiming precision down to every individual view Part VII.2 has not yet specified; each subsequent Part refines this table further as its own access requirements are defined, consistent with not asserting detail this specification does not yet have.

| Role | Dashboard | Studio Tools | Reporting | Recommendation Approval | Ethics Override Authority | API Access |
|---|---|---|---|---|---|---|
| Studio Administrator | Full | Full | Full | Yes (non-ethics-gated) | No | Full |
| Game Designer | Design-relevant views | Simulation/Recommendation Studio | Design reports | Propose/comment only | No | Limited, own work |
| Data Analyst | Analytical views | Knowledge Graph/Feature views | Full | No | No | Read-heavy |
| Producer/Executive | Executive Overview | Limited | Executive summaries | No | No | Minimal |
| Ethics Reviewer | Ethics Score Dashboard, Audit Log | Recommendation Studio (ethics review) | Ethics Audit Reports | Yes, ethics-gated items only | Yes, per [Volume I, Section I.5.2.4] | Ethics API scope |
| Read-Only Viewer | View-only, permitted subset | No | View-only | No | No | No |
| API Consumer (Service Account) | N/A | N/A | N/A | Configurable per key scope | No | Scoped per API key |

- **REQ-PLATFORM-002 (MUST):** Only a user holding the Ethics Reviewer role MUST be capable of exercising Board-level Override authority ([Volume I, Section I.5.2.4]) through the Platform; no other role's Recommendation Approval permission MUST extend to overriding a veto-level Ethics Score.
- **REQ-PLATFORM-003 (MUST):** The Role Permission Matrix (VII.1.2.8) MUST be updated in the same change that alters any role's access in a later Part, mirroring the synchronization requirement already established for the Agent Permission Matrix at [Volume V, REQ-INTERACT-002].
- **REQ-PLATFORM-004 (MUST):** An API Consumer service account MUST authenticate via API key ([Section VII.5.2.1]), not a human credential; a service account MUST NOT be granted the full role-based Dashboard access a human role receives by default.

---

*End of Part VII.1 — Platform Overview.*

*Cross-References:* [Volume I, Section I.5.2.4, Section I.5.3.1] (Ethics Board, Override and Escalation), [Volume II, Section II.1.1.5] (Trust Boundaries), [Volume II, Section II.2.6.6] (Emergency Override), [Volume II, Section II.6.2.1, Section II.6.2.3] (Database Sharding, Data Partitioning by Tenant), [Volume II, Section II.7.4.2] (Alert Severity Levels), [Volume V, Section V.13.3.2, REQ-INTERACT-002] (Agent Permission Matrix, Matrix Synchronization), [Volume VI, Part VI.2] (SDK Architecture), [Part VII.2] (Dashboard — forward reference), [Part VII.3] (Reporting — forward reference), [Part VII.4] (Studio Tools — forward reference), [Part VII.5, Section VII.5.2.1] (API Specification, API Key Authentication — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-PLATFORM-001 through REQ-PLATFORM-004.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 14, 2026

---

## Part VII.2 — Dashboard

Part VII.2 specifies the twelve views a human user actually opens, each a window onto backend capability already fully specified in an earlier Volume. Section VII.2.2.6 closes a loop this specification has left open since Volume I: the Ethics Score Dashboard is the concrete implementation of the Studio Ethics Dashboard first required at [Volume I, REQ-ETH-065] and cited forward from [Volume II, Section II.7.2.4] ever since — this is the screen that claim has been pointing to the whole time.

### VII.2.1 Dashboard Architecture

**Frontend Technology Stack (VII.2.1.1).** A modern, component-based UI framework (named illustratively per this specification's technology-neutral convention), distinct from and consuming the platform's backend stack ([Volume II]) through the API surface ([Part VII.5]) rather than any direct backend coupling.

**Real-Time Data WebSocket Layer (VII.2.1.2).** The mechanism that actually delivers the real-time dashboard latency target already established at [Volume II, Section II.1.4.1] to the UI: a WebSocket or equivalent push connection streaming updates, rather than the Dashboard polling repeatedly — extending the platform's event-driven architecture ([Volume II, Section II.1.2.1]) up through the UI layer instead of terminating it at the backend.

**Dashboard Component Library (VII.2.1.3).** A shared library of reusable components — charts, tables, cards — used consistently across all twelve views ([Section VII.2.2]) and the Customization system ([Section VII.2.3]), so visual and interaction consistency is a property of shared components rather than something each view happens to achieve independently.

**Responsive Design Requirements (VII.2.1.4).** The Dashboard functions across common desktop and tablet viewport sizes; given the Dashboard's data density, mobile phone-sized viewports are a lower-priority target rather than a guaranteed first-class experience, stated honestly rather than claiming universal responsive support this specification has not actually detailed.

- **REQ-DASH-001 (MUST):** Dashboard views MUST update via the WebSocket push layer (VII.2.1.2) for any data covered by the real-time latency target at [Volume II, Section II.1.4.1]; polling MUST NOT be the primary update mechanism for real-time-classified views.

### VII.2.2 Dashboard Views

Twelve views, each backed by capability already specified in an earlier Volume:

| View | Purpose | Primary Backend Source |
|---|---|---|
| Executive Overview | Aggregate KPIs, health, trends | Outcome and Economy Health metrics ([Volume III, Section III.5.3], [Volume IV, Section IV.3.3]) |
| Player Behavior Explorer | Individual and cohort behavior inspection | Player Model ([Volume III, Part III.5]), Knowledge Graph ([Volume III, Part III.1]) |
| Economy Monitor | Live economy health | Economy Health Metrics ([Volume IV, Section IV.3.3]) |
| Simulation Results Viewer | Forecast inspection | Forecasting output ([Volume IV, Part IV.5]) |
| Recommendation Queue | Pending Recommendations awaiting review | Recommendation Gate state machine ([Volume II, Section II.2.6.2]) |
| Ethics Score Dashboard | Real-time ethics posture | Ethics Score Card ([Volume I, Section I.5.2.3]), Ethics metrics ([Volume II, Section II.7.2.1]) |
| Experiment Tracker | Running and completed experiments | Experiment node ([Volume III, Section III.1.2], type #13), [Volume IV, Part IV.6] |
| Agent Activity Monitor | Live agent reasoning activity | Agent Framework ([Volume V]) |
| Knowledge Graph Explorer | Graph browsing and lineage | Knowledge Graph ([Volume III, Part III.1]), Lineage Visualization ([Volume II, Section II.2.2.4]) |
| Feature Inspector | Feature value and definition browsing | Feature Catalog ([Volume III, Section III.3.2]) |
| Alert Center | Active alerts | Observability alerting ([Volume II, Section II.7.4]) |
| Audit Log Viewer | Audit trail browsing | Audit trail ([Volume I, Section I.5.2.5], [Volume II, Section II.2.6.4]) |

Three views carry additional significance beyond the table's summary. The **Recommendation Queue** is the actual interface a human reviewer uses to move a Recommendation through the Reviewed state ([Volume II, Section II.2.6.2.b]) — approving, rejecting, or modifying it is a Recommendation Queue interaction, not an abstract state-machine transition happening somewhere unseen. The **Ethics Score Dashboard** is, as noted above, the concrete implementation of the Studio Ethics Dashboard's real-time posture claim first required at [Volume I, REQ-ETH-065]; every Ethics Score Card ever produced is visible here, not only the ones attached to a currently pending Recommendation. The **Knowledge Graph Explorer** is the human-facing rendering of backward lineage ([Volume II, Section II.2.2.4]) first described in the abstract at that Section and now given an actual browsable interface.

- **REQ-DASH-002 (MUST):** The Ethics Score Dashboard MUST display Ethics Score Cards in real time as they are produced, per [Volume I, REQ-ETH-065]; a delayed or batch-refreshed ethics view MUST NOT be represented as satisfying that requirement.
- **REQ-DASH-003 (MUST):** The Recommendation Queue MUST be the sole Dashboard-layer interface through which a human reviewer transitions a Recommendation's state; no other view MUST expose an equivalent state-transition control outside the governed state machine.

### VII.2.3 Dashboard Customization

**Custom Dashboard Builder (VII.2.3.1).** Lets a user assemble a personal dashboard from the Widget Catalog ([Section VII.2.3.2]), subject to that user's own role permissions ([Section VII.1.2.8]) — customization narrows or rearranges what a role can already see; it does not expand access beyond it.

**Widget Catalog (VII.2.3.2).** Individual, composable widgets — a chart, a metric card, a table — drawn from the Component Library ([Section VII.2.1.3]), each backed by a specific, declared data query rather than an open-ended query surface a widget could use to reach beyond its intended scope.

**Saved Views and Sharing (VII.2.3.3).** A user can save a custom configuration and share it with other users within the same tenant; sharing stays strictly within-tenant, consistent with the Tenant Isolation Model already established at [Section VII.1.1.4] — a saved view is never shareable across tenant boundaries.

**Dashboard Templates by Role (VII.2.3.4).** Default configurations pre-built per the seven roles specified at [Section VII.1.2] — a Producer/Executive's default view centers on Executive Overview; an Ethics Reviewer's default centers on the Ethics Score Dashboard — so a new user's first experience already reflects what their role most needs to see.

**Export and Embed Options (VII.2.3.5).** Exporting a view (image or PDF, coordinating with Report Rendering, [Section VII.3.2.3], forward reference) or embedding it elsewhere is subject to the same Export Privacy Filtering discipline already established at [Volume VI, Section VI.5.3.3], since a dashboard export is itself a data export and receives no exemption for originating from a UI action rather than the bulk Export API.

- **REQ-DASH-004 (MUST):** Saved Views and Sharing (VII.2.3.3) MUST NOT permit sharing across tenant boundaries; a share action targeting a user outside the originating tenant MUST be rejected.
- **REQ-DASH-005 (MUST):** A dashboard export or embed (VII.2.3.5) MUST pass through Export Privacy Filtering ([Volume VI, Section VI.5.3.3]) before the exported content is generated; a UI-initiated export MUST NOT bypass the filtering a bulk API export would be subject to.

---

*End of Part VII.2 — Dashboard.*

*Cross-References:* [Volume I, Section I.5.2.3, Section I.5.2.5, REQ-ETH-065] (Ethics Scoring Dimensions, Audit Trail, Studio Ethics Dashboard), [Volume II, Section II.1.2.1, Section II.1.4.1] (Event-Driven Architecture, Performance Targets), [Volume II, Section II.2.2.4, Section II.2.6.2.b, Section II.2.6.4] (Lineage Visualization, Reviewed State, Gate Decision Audit Trail), [Volume II, Section II.7.2.1, Section II.7.4] (Metric Taxonomy, Alerting), [Volume III, Part III.1, Section III.3.2, Part III.5] (Knowledge Graph, Feature Catalog, Player Modeling), [Volume III, Section III.1.2] (Experiment Node Type), [Volume IV, Part IV.5, Section IV.3.3] (Forecasting and Prediction, Economy Health Metrics), [Volume IV, Part IV.6] (Experimentation Framework), [Volume V] (Agent Framework), [Volume VI, Section VI.5.3.3] (Export Privacy Filtering), [Section VII.1.1.4, Section VII.1.2.8] (Tenant Isolation Model, Role Permission Matrix), [Section VII.3.2.3] (Report Rendering — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-DASH-001 through REQ-DASH-005.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 14, 2026

---

## Part VII.3 — Reporting

Part VII.3 specifies the periodic, distributable counterpart to the Dashboard's real-time views. Section VII.3.3, Natural Language Reports, is this Part's most distinctive content: it is where the Reasoning Engine's Natural Language Explanation Generation capability, first specified at [Volume III, Section III.7.3.4], gets applied to report writing itself — and where that Section's traceability and anti-spin requirements have to be re-applied explicitly, because an AI-generated report narrative is exactly the kind of output that could otherwise drift into sounding more confident than the data underneath it actually supports.

### VII.3.1 Report Types

**Scheduled Reports — Daily, Weekly, Monthly (VII.3.1.1).** Recurring reports generated on a defined cadence, per the scheduling mechanism specified in Section VII.3.2.4 — the general category every periodic report in this Part is an instance of.

**Ad-Hoc Reports (VII.3.1.2).** Reports generated outside any schedule, triggered on demand — ahead of a board meeting, for instance, or in response to a specific question a scheduled report wasn't built to answer.

**Recommendation Reports (VII.3.1.3).** Reports on Recommendation pipeline activity — proposed, approved, rejected, and deployed counts, cycle time — drawing on the Business metric category already specified at [Volume II, Section II.7.2.1], and on Forecast Accuracy Tracking ([Volume IV, Section IV.5.3.2]) for deployed Recommendations' measured impact against their original forecast.

**Experiment Reports (VII.3.1.4).** Reports on running and completed experiments, drawing on the Experimentation Framework ([Volume IV, Part IV.6]) and Sim-to-Real Transfer Validation ([Volume IV, Section IV.6.3.1]) for how well Simulation forecasts matched real outcomes.

**Ethics Audit Reports (VII.3.1.5).** Implements the Transparency Reporting requirement already established at [Volume I, Section I.5.3.6] — Ethics Score distributions, veto and override frequency, incident summaries, drawing on the Ethics metric category already specified at [Volume II, Section II.7.2.1]. This is the periodic, archivable counterpart to the real-time Ethics Score Dashboard ([Section VII.2.2]): same underlying data, different consumption pattern, and the primary artifact a studio would present to an actual external auditor or regulator alongside the Regulatory Risk and Compliance Verification data already specified at [Volume I, Section I.5.2.3] and [Volume V, Section V.11.1.4].

**Executive Summaries (VII.3.1.6).** High-level KPI and trend reports for Producer/Executive consumption ([Section VII.1.2.4]), aggregating across Recommendation, Economy Health ([Volume IV, Section IV.3.3]), and Business metrics into a single condensed view.

**Custom Report Builder (VII.3.1.7).** User-built reports assembled from the Report Template Engine ([Section VII.3.2.1]), following the same customization pattern already established for the Dashboard's Widget Catalog ([Section VII.2.3.2]).

- **REQ-REPORT-001 (MUST):** Ethics Audit Reports (VII.3.1.5) MUST be generated on the cadence required by [Volume I, Section I.5.3.6]; this report type MUST NOT be demoted to ad-hoc-only generation.

### VII.3.2 Report Generation

**Report Template Engine (VII.3.2.1).** Extends the Dashboard Templates pattern already established at [Section VII.2.3.4]: each report type in Section VII.3.1 has a defined template, and custom reports build from the same template system.

**Data Aggregation Pipeline (VII.3.2.2).** A report's underlying data assembly is itself a batch job, using the async job-flow patterns already established at [Volume II, Part II.2.8] — distinct from the Dashboard's real-time query path, since a report is built to be a stable, reproducible snapshot rather than a continuously updating view.

**Report Rendering — PDF, HTML, CSV (VII.3.2.3).** Reports render in presentation-oriented formats for PDF and HTML, and CSV where the report content is itself tabular data a recipient may want to further process — distinct from the data-engineering-oriented Export Formats already specified at [Volume VI, Section VI.5.3.2] (JSON, CSV, Parquet), since a report is built primarily for human reading and archiving, not programmatic ingestion.

**Report Scheduling and Distribution (VII.3.2.4).** Extends the Import Scheduling pattern already established at [Volume VI, Section VI.5.2.3] to report generation and delivery together: a Scheduled Report ([Section VII.3.1.1]) generates and distributes automatically on its defined cadence without manual triggering, using the distribution channels specified in [Section VII.3.3].

**Report Versioning (VII.3.2.5).** A report is versioned against the template that generated it, per the same additive-versioning discipline already established at [Volume II, REQ-STOR-009]: if a report template changes, a prior report instance remains tied to the template version that actually produced it, so a historical report is never silently reinterpreted under a template it was not generated from.

**Report Access Control (VII.3.2.6).** A report's distribution list respects the Role Permission Matrix already established at [Section VII.1.2.8] — the Compliance-relevant Ethics Audit Report, for instance, may be restricted to Studio Administrator and Ethics Reviewer roles rather than broadcast to every role.

- **REQ-REPORT-002 (MUST):** Every generated report MUST display an explicit data-as-of timestamp; a report without a stated freshness timestamp MUST NOT be distributed.
- **REQ-REPORT-003 (MUST):** A report instance MUST remain tied to the template version that generated it (VII.3.2.5); a template change MUST NOT retroactively alter the interpretation of an already-generated report.

### VII.3.3 Natural Language Reports

**AI-Generated Insights (VII.3.3.1).** Reports include actual AI-generated prose insight text, not data tables and charts alone — drawing on agent reasoning, typically the Chief Research Officer's cross-domain synthesis capability ([Volume V, Section V.3.1.4]), to produce a written summary of what a report's underlying data shows.

**Narrative Explanation of Data (VII.3.3.2).** Applies Natural Language Explanation Generation, already specified at [Volume III, Section III.7.3.4], to report generation specifically: structured report data converts to readable prose, and the same traceability requirement that Section establishes — generated text must be traceable back to the structured evidence it renders — applies here without exception. This is restated explicitly because a report's AI-generated narrative is exactly the output most tempted to sound more certain than its underlying data justifies, and the traceability discipline is what prevents that drift.

**Anomaly Summaries (VII.3.3.3).** AI-generated summaries specifically flagging anomalies within a report's data, drawing on Anomaly Detection ([Volume III, Section III.4.3.3]) — stating in prose what is unusual about the reporting period, rather than leaving a reader to spot it unassisted in a chart.

**Recommendation Explanations (VII.3.3.4).** AI-generated plain-language explanations of why specific Recommendations were made, feeding Recommendation Reports ([Section VII.3.1.3]) with the same Natural Language Explanation Generation capability that powers the Rationale Explorer in Studio Tools ([Section VII.4.2.2]).

**Audience-Adapted Language (VII.3.3.5).** Applies Explanation Audience Adaptation, already specified at [Volume III, Section III.7.3.6], to reports specifically: an Executive Summary and a Data Analyst's detailed report render the same underlying findings in different vocabulary and framing, but carry identical confidence and evidence claims — the anti-spin requirement that Section establishes (adaptation changes framing, never substance) is directly operational here, not merely a principle stated once and left unapplied at the reporting layer.

- **REQ-REPORT-004 (MUST):** All AI-generated report narrative (VII.3.3.1–4) MUST be traceable to structured evidence per [Volume III, REQ-REASON-006]; a generated insight, summary, or explanation MUST NOT introduce a claim the underlying report data does not support.
- **REQ-REPORT-005 (MUST):** Audience-Adapted report language (VII.3.3.5) MUST preserve identical confidence and evidence claims across every audience variant of the same finding, per [Volume III, REQ-REASON-008]; only framing and vocabulary MAY vary.

---

*End of Part VII.3 — Reporting.*

*Cross-References:* [Volume I, Section I.5.2.3, Section I.5.3.6] (Ethics Scoring Dimensions, Transparency Reporting), [Volume II, Part II.2.8] (Asynchronous Processing Flows), [Volume II, Section II.7.2.1] (Metric Taxonomy), [Volume II, REQ-STOR-009] (Additive Schema Versioning), [Volume III, Section III.4.3.3] (Anomaly Detection), [Volume III, Section III.7.3.4, Section III.7.3.6, REQ-REASON-006, REQ-REASON-008] (Natural Language Explanation Generation, Audience Adaptation, Traceability, Confidence Preservation), [Volume IV, Section IV.3.3] (Economy Health Metrics), [Volume IV, Section IV.5.3.2] (Forecast Accuracy Tracking), [Volume IV, Section IV.6.3.1] (Sim-to-Real Transfer Validation), [Volume IV, Part IV.6] (Experimentation Framework), [Volume V, Section V.3.1.4] (Cross-Domain Synthesis), [Volume V, Section V.11.1.4] (Compliance Verification), [Volume VI, Section VI.5.2.3, Section VI.5.3.2] (Import Scheduling, Export Formats), [Section VII.1.2.8] (Role Permission Matrix), [Section VII.2.3.2, Section VII.2.3.4] (Widget Catalog, Dashboard Templates), [Section VII.4.2.2] (Rationale Explorer — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-REPORT-001 through REQ-REPORT-005.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 14, 2026

---

## Part VII.4 — Studio Tools

Part VII.4 specifies the five workbenches where a studio's own people actually do the work this platform exists to support. Section VII.4.2, Recommendation Studio, carries this Part's greatest weight: it is the literal button-level implementation of the Recommendation Gate state machine specified in the abstract at [Volume II, Section II.2.6.2] — every transition that Section describes as a state-machine edge is, in this Part, an actual control a human clicks. Section VII.4.4's Behavioral Ontology Editor deserves a specific caution stated up front: it drafts a proposed change to the Knowledge Graph's closed schema, it does not unilaterally apply one — the amendment process already required at [Volume III, REQ-GRAPH-002] still governs whether a drafted proposal ever takes effect.

### VII.4.1 Simulation Studio

**Scenario Builder Interface (VII.4.1.1).** The visual, form-based interface implementing the Scenario Definition Language already specified at [Volume IV, Section IV.1.3.1], letting a Game or Economy Designer configure a simulation run without writing the underlying DSL directly.

**Parameter Configuration UI (VII.4.1.2).** The interface for both single-scenario parameters and Parameter Space Definition sweeps ([Volume IV, Section IV.1.3.1–2]): configuring a candidate change's values, or the minimum, maximum, and step values for a swept range.

**Simulation Run Monitor (VII.4.1.3).** Live monitoring of an in-progress run, distinct from browsing completed runs — showing real-time progress against the Simulation Job Scheduler's state ([Volume IV, Section IV.1.2.1]), including checkpoint progress for a long-running, large-population job ([Volume IV, Section IV.1.2.4]).

**Results Comparison Tool (VII.4.1.4).** Implements Scenario Comparison ([Volume IV, Section IV.5.1.3]) — the A-versus-B-versus-C candidate comparison interface.

**Forecast Explorer (VII.4.1.5).** A dedicated interface for exploring forecast output specifically, distinct from raw simulation results — Best/Worst/Expected Case framing ([Volume IV, Section IV.5.2.3]) and Disproportionate Impact Reporting ([Volume IV, Section IV.5.2.4]) rendered as an interactive view a reviewer drills into by distribution, confidence interval, and behavioral segment.

- **REQ-STUDIO-001 (MUST):** The Simulation Run Monitor (VII.4.1.3) MUST reflect the actual Job Scheduler state in real time for an in-progress run; a monitor showing stale or cached progress MUST NOT be presented as live.

### VII.4.2 Recommendation Studio

**Recommendation Inbox (VII.4.2.1).** The list and queue view of Recommendations awaiting or under review — the Studio counterpart to the Dashboard's Recommendation Queue ([Section VII.2.2]), built as an interactive workspace rather than a monitoring-only view.

**Recommendation Detail View (VII.4.2.2).** The primary screen for inspecting a single Recommendation: the full Recommendation Record ([Volume II, Appendix B.9]), current state ([Volume II, Section II.2.6.2]), and every attached artifact, including an Agent Contribution panel showing which agents contributed what — the concrete realization of the attribution-preservation requirement already established at [Volume V, Section V.2.1.3] — and a Rationale Explorer panel implementing Graph Path Explanation and Natural Language Explanation Generation ([Volume III, Section III.7.3.3–4]), letting a reviewer walk the causal chain behind the Recommendation exactly as the worked example at [Volume III, Section III.1.7] demonstrated by hand.

**Ethics Score Card Display (VII.4.2.3).** Shows the full seven-dimension Ethics Score Card ([Volume I, Section I.5.2.3]) with per-dimension detail; where Ethics Score Sensitivity Analysis ([Volume IV, Section IV.7.3.4]) is available for a borderline Recommendation, this is where that diagnostic insight surfaces to the reviewer directly.

**Review and Approval Interface (VII.4.2.4).** The literal controls implementing the Approved and Rejected transitions ([Volume II, Section II.2.6.2.c, Section II.2.6.2.e], [Volume II, REQ-FLOW-011]).

**Modification and Feedback Tools (VII.4.2.5).** The literal control implementing the Modified transition ([Volume II, Section II.2.6.2.d]), paired with a Comment and Discussion Thread supporting multi-reviewer deliberation before a final decision — particularly relevant for the Consensus interaction pattern already established at [Volume V, Section V.13.1.5]. Extends the Modified-state re-scoring requirement ([Volume II, REQ-FLOW-012]): every revision carries its own attached Ethics Score Card, so a reviewer sees how a Recommendation evolved through iteration, not only its current state in isolation.

**Deployment Action (VII.4.2.6).** The literal control implementing the Deployed transition ([Volume II, Section II.2.6.2.f]) — treated as its own distinct action rather than folded into Review and Approval, since deployment happens at a later pipeline stage, from Approved rather than from Reviewed.

**Rollback Action (VII.4.2.7).** The literal control implementing the Rolled Back transition ([Volume II, Section II.2.6.2.g]), available to a human reviewer and, per the automated post-deployment ethics monitor already established at [Volume II, REQ-FLOW-014], triggerable by that monitor as well — this Studio surface is where either path actually resolves into a recorded rollback.

- **REQ-STUDIO-002 (MUST):** Every action in this Section (Review and Approval, Modification, Deployment, Rollback) MUST call the same backend state-transition guards already specified at [Volume II, Section II.2.6.3]; a Studio-layer action MUST NOT bypass the independent, backend-enforced guard by assuming the UI's own validation is sufficient.
- **REQ-STUDIO-003 (MUST):** The Modification and Feedback Tools (VII.4.2.5) MUST display every Modified-state revision with its own attached Ethics Score Card; a revision history showing only the current state MUST NOT be considered complete.

### VII.4.3 Experiment Studio

**Experiment Designer UI (VII.4.3.1).** Implements the Experiment Design Flow already established at [Volume V, Section V.13.2.4], working from the Experiment Planner Agent's own Plan Assembly output ([Volume V, Section V.12.2.3]) — a human-facing counterpart and override point for what the Experiment Planner Agent proposes, not a replacement for its work.

**Experiment Monitor (VII.4.3.2).** Live monitoring of a running real experiment, distinct from the Simulation Run Monitor ([Section VII.4.1.3]) in that this tracks an actual A/B test against real players ([Volume IV, Part IV.6]) rather than a simulation — showing accumulating results, useful for observing whether a Sequential Testing early-stop condition ([Volume IV, Section IV.6.2.3]) is approaching.

**Results Analyzer (VII.4.3.3).** The interface for analyzing a completed experiment's results, extending the Sim-to-Real Transfer Validation methodology already established at [Volume IV, Section IV.6.3.1].

**Statistical Significance Viewer (VII.4.3.4).** Shows p-values, confidence intervals, and significance status for an experiment's metrics, working directly from the Statistician Agent's Significance Testing output ([Volume V, Section V.6.1.2]) and respecting the Multiple Comparison Corrections already established at [Volume IV, Section IV.6.2.4].

- **REQ-STUDIO-004 (MUST):** The Statistical Significance Viewer (VII.4.3.4) MUST display corrected significance values wherever Multiple Comparison Corrections apply ([Volume IV, Section IV.6.2.4]); an uncorrected p-value MUST NOT be presented as the primary significance figure for a multi-metric or multi-segment experiment.

### VII.4.4 Knowledge Graph Studio

**Graph Visualization (VII.4.4.1).** The deeper, interactive counterpart to the Dashboard's Knowledge Graph Explorer ([Section VII.2.2]) — a visual rendering of graph structure ([Volume III, Part III.1]) built for sustained analytical work rather than monitoring.

**Graph Query Interface (VII.4.4.2).** Constructs and runs Causal Chain and Behavioral Path queries ([Volume III, Section III.1.6]) without requiring raw query syntax, the Studio counterpart to the Graph Query API ([Section VII.5.6]).

**Corpus Browser (VII.4.4.3).** Search and filter across the registered concepts in all eleven Psychology Corpus domains ([Volume III, Part III.2]), including concept contribution (implementing the Corpus Update and Contribution Process, [Volume III, Section III.2.1.4]) and the structured citation metadata already specified at [Volume III, Section III.2.12.4], unified into a single browsing and contribution surface rather than separate dedicated tools.

**Pattern Explorer (VII.4.4.4).** Browses discovered Patterns from Pattern Mining ([Volume III, Part III.6]) — their corpus-mapping status ([Volume III, Section III.6.2.2]), confidence, and any Pattern-Triggered activity ([Volume III, Section III.6.3]) they have generated.

**Behavioral Ontology Editor (VII.4.4.5).** Drafts a proposed amendment to the Knowledge Graph's closed node and edge type catalog ([Volume III, Part III.1]). This Editor supports *drafting* a proposal; it does not itself apply a change to the live schema. A drafted amendment still passes through the full governance process already required at [Volume III, REQ-GRAPH-002] and [Volume I, Section I.2.4.2] before a new type is used in production — this Editor is a drafting tool for that process, not a bypass of it.

- **REQ-STUDIO-005 (MUST):** The Behavioral Ontology Editor (VII.4.4.5) MUST NOT apply a schema change directly to the production Knowledge Graph; every drafted amendment MUST route through the amendment process at [Volume III, REQ-GRAPH-002] before taking effect.

### VII.4.5 Agent Studio

**Agent Status Dashboard (VII.4.5.1).** Live status of all agents across their lifecycle states ([Volume V, Section V.1.1.3]) within the Studio work context — a more detailed, interactive counterpart to the Dashboard's Agent Activity Monitor ([Section VII.2.2]).

**Agent Configuration (VII.4.5.2).** Adjusts an agent's Tools and Access grants within the bounds a Studio Administrator role is permitted to change, per [Volume V, Section V.1.4.4] — not the core prompt or anatomy of a platform-shipped agent, which remains outside studio-level configuration.

**Agent Prompt Editor (VII.4.5.3).** For custom agents specifically ([Volume V, Section V.14.1.1]): a studio building a custom agent edits its prompt here, with full version history, feeding the same Agent Validation and Testing gate ([Volume V, Section V.14.1.3]) that holds a custom agent to the same evaluation bar as a platform-shipped one.

**Agent Evaluation Viewer (VII.4.5.4).** Shows Agent Performance Benchmarking results ([Volume V, Section V.1.5.4]) and supports Agent A/B Testing ([Volume V, Section V.1.5.5]) — including pre-submission testing of a custom agent or prompt revision against sample scenarios before it enters the formal Approval Workflow ([Volume V, Section V.14.1.4]).

**Agent Interaction Tracer (VII.4.5.5).** Visualizes the actual interaction pattern — Request-Response, Consultation, Review, Debate, or Consensus ([Volume V, Section V.13.1]) — that occurred for a specific reasoning cycle, letting a developer or analyst trace exactly how agents communicated for a given Recommendation. This is a direct debugging tool for the Circular Reasoning and Agent Collusion failure modes already cataloged at [Volume V, Section V.1.6], since both failure modes are specifically about inter-agent communication patterns this Tracer makes visible.

- **REQ-STUDIO-006 (MUST):** The Agent Configuration interface (VII.4.5.2) MUST NOT expose the core prompt or anatomy of a platform-shipped agent for studio-level editing; only Tools and Access configuration within the bounds already established at [Volume V, Section V.1.4.4] MUST be adjustable.
- **REQ-STUDIO-007 (SHOULD):** The Agent Interaction Tracer (VII.4.5.5) SHOULD be consulted whenever Orchestrator Conflict Resolution ([Volume V, Section V.2.1.4]) flags a suspiciously perfect agreement, to support the Collusion-versus-Consensus determination already established at [Volume V, Section V.13.1.5].

---

*End of Part VII.4 — Studio Tools.*

*Cross-References:* [Volume I, Section I.2.4.2, Section I.5.2.3] (Amendment Process, Ethics Scoring Dimensions), [Volume II, Appendix B.9] (Recommendation Record Schema), [Volume II, Section II.2.6.2–3] (Recommendation State Machine, State Transition Guards), [Volume II, REQ-FLOW-011–012, REQ-FLOW-014] (Human-Triggered Transitions, Modified-State Re-Scoring, Automated Post-Deployment Monitor), [Volume III, Part III.1, REQ-GRAPH-002] (Knowledge Graph Schema, Closed Type Catalog), [Volume III, Section III.1.6, Section III.1.7] (Graph Queries, Worked Example), [Volume III, Part III.2, Section III.2.1.4, Section III.2.12.4] (Psychology Corpus, Update Process, Citation Metadata), [Volume III, Part III.6, Section III.6.2.2, Section III.6.3] (Pattern Mining, Pattern-to-Corpus Mapping, Pattern-Triggered Activity), [Volume III, Section III.7.3.3–4] (Graph Path Explanation, Natural Language Explanation Generation), [Volume IV, Section IV.1.2.1, Section IV.1.2.4, Section IV.1.3.1–2] (Simulation Job Scheduler, Checkpoint and Resume, Scenario/Parameter Configuration), [Volume IV, Section IV.5.1.3, Section IV.5.2.3–4] (Scenario Comparison, Best/Worst/Expected Case, Disproportionate Impact), [Volume IV, Section IV.6.2.3–4, Section IV.6.3.1] (Sequential Testing, Multiple Comparison Corrections, Sim-to-Real Transfer), [Volume IV, Section IV.7.3.4] (Ethics Score Sensitivity Analysis), [Volume V, Section V.1.1.3, Section V.1.4.4, Section V.1.5.4–5, Section V.1.6] (Agent Lifecycle, Tool Access Control, Benchmarking, A/B Testing, Failure Modes), [Volume V, Section V.2.1.3–4] (Result Aggregation and Synthesis, Conflict Resolution), [Volume V, Section V.6.1.2] (Significance Testing), [Volume V, Section V.12.2.3] (Experiment Plan Assembly), [Volume V, Section V.13.1, Section V.13.2.4] (Standard Interaction Patterns, Experiment Design Flow), [Volume V, Section V.14.1.1, Section V.14.1.3–4] (Agent Specification Template, Validation and Testing, Approval Workflow), [Section VII.2.2] (Dashboard Views), [Section VII.5.6] (Knowledge Graph API — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-STUDIO-001 through REQ-STUDIO-007.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 14, 2026

---

## Part VII.5 — API Specification

Part VII.5 specifies the programmatic surface over everything this Volume's Dashboard and Studio Tools already expose to a human. Section VII.5.8, the Recommendation API, carries this Part's most important constraint: an API consumer approving or rejecting a Recommendation calls the *same* backend guards the Studio Tools UI calls ([Section VII.4.2.4], [REQ-STUDIO-002]) — there is no weaker, programmatic side door into the Recommendation Gate.

### VII.5.1 API Design Principles

**RESTful Design Standards (VII.5.1.1).** Resource-oriented URLs, standard HTTP methods, JSON payloads — standard REST convention, fronted by the API Gateway architecture already established at [Volume II, Section II.4.4].

**Versioning Strategy (VII.5.1.2).** Extends Routing and Versioning ([Volume II, Section II.4.4.2]): URL-path versioning (`/v1/...`), with a breaking change shipping as a new version alongside the prior one for the established deprecation window, never as an in-place change to an existing version.

**Pagination and Filtering (VII.5.1.3).** Standard cursor-based pagination for list endpoints (Recommendation lists, Experiment lists), with filter query parameters — necessary given the platform's data volume and the throughput targets already established at [Volume II, Section II.1.4.1].

**Error Response Format (VII.5.1.4).** A standardized error schema — error code, message, and request ID — consistent across every endpoint, with the request ID tracing back to Trace Context Propagation already established at [Volume II, Section II.7.3.2].

**Rate Limiting (VII.5.1.5).** Extends Rate Limiting already fully specified at [Volume II, Section II.4.4.3], applied per API key and tenant.

**Idempotency Keys (VII.5.1.6).** Extends Idempotency already established at [Volume II, Section II.4.2.6]: write endpoints (approving a Recommendation, creating a Simulation) accept an idempotency key so a retried request cannot duplicate the action it represents.

- **REQ-API-001 (MUST):** Every write endpoint in this Part MUST accept an idempotency key per VII.5.1.6; a write endpoint without idempotency support MUST NOT be considered complete.

### VII.5.2 Authentication and Authorization API

**API Key Authentication (VII.5.2.1).** The primary authentication mechanism for the API Consumer service account role already established at [Section VII.1.2.7].

**OAuth 2.0 Flow (VII.5.2.2).** For human-delegated access — a third-party integration acting on a human user's behalf — using the standard OAuth 2.0 authorization code flow.

**Token Refresh and Expiry (VII.5.2.3).** Standard token lifecycle management: bounded token lifetime, refresh flow, and expiry handling.

**Scope and Permission Model (VII.5.2.4).** API scopes map directly to the Role Permission Matrix already established at [Section VII.1.2.8] — not a parallel, independently maintained permission system that could drift from the role-based model the rest of the Platform uses.

- **REQ-API-002 (MUST):** API scopes MUST derive from the Role Permission Matrix (VII.1.2.8); an API-layer permission MUST NOT be independently defined in a way that grants broader access than the corresponding role would receive through the Dashboard.

### VII.5.3 Telemetry API

The API-layer entry point for server-side event submission that does not pass through the SDK ([Volume VI, Part VI.2]) — the SDK remains the primary client-side integration path, and this API exists for backend systems submitting events directly.

| Endpoint | Method | Purpose |
|---|---|---|
| `/v1/events` | POST | Single event ingestion, conforming to the Event Envelope ([Volume VI, Section VI.1.2.1]) |
| `/v1/events/batch` | POST | Batch ingestion — the server-side counterpart to the SDK's Batch Sender ([Volume VI, Section VI.2.2.3]) |
| `/v1/events/schema` | GET | Query registered event schemas ([Volume VI, Section VI.1.2.4]) |
| `/v1/events/validate` | POST | Pre-flight validation without committing the event, the server-side equivalent of Event Validation in Development ([Volume VI, Section VI.2.6.4]) |

### VII.5.4 Feature API

| Endpoint | Method | Purpose |
|---|---|---|
| `/v1/features/{playerId}` | GET | A player's current feature values ([Volume III, Part III.3]) |
| `/v1/features/{playerId}/vector` | GET | The full assembled Feature Vector ([Volume III, Section III.3.5.1]) |
| `/v1/features/{featureId}/metadata` | GET | Feature definition metadata ([Volume III, Section III.3.3.1]) |
| `/v1/features/catalog` | GET | The full Feature Catalog listing ([Volume III, Section III.3.2]) |

### VII.5.5 Player Model API

| Endpoint | Method | Purpose |
|---|---|---|
| `/v1/players/{playerId}` | GET | The full Player Model ([Volume III, Section III.5.1]) |
| `/v1/players/{playerId}/predictions` | GET | The five Predictive Model scores ([Volume III, Section III.5.3]) |
| `/v1/players/{playerId}/segment` | GET | Archetype and segment assignment ([Volume III, Section III.5.2]) |
| `/v1/players/{playerId}/similar` | GET | Similarity query results ([Volume III, Section III.1.6.3, Section III.4.3.1]) |

Every endpoint in this Section returns data addressed by pseudonymized Player ID only, per the Identity Model already established at [Volume VI, Section VI.3.1.1] — no endpoint in this Section resolves or returns a raw, studio-side player identifier.

- **REQ-API-003 (MUST):** Player Model API responses MUST address players by pseudonymized ID exclusively; an endpoint MUST NOT return a raw studio-side player identifier without a separate, explicitly authorized identity-resolution call against the Identity Mapping store ([Volume VI, Section VI.3.1.3]).

### VII.5.6 Knowledge Graph API

| Endpoint | Method | Purpose |
|---|---|---|
| `/v1/graph/query` | POST | Arbitrary graph query ([Volume III, Section III.1.6]) |
| `/v1/graph/nodes/{nodeId}` | GET | Single node lookup |
| `/v1/graph/path` | POST | Causal Chain or Behavioral Path query ([Volume III, Section III.1.6.1–2]) |
| `/v1/graph/subgraph` | POST | Bounded subgraph extraction ([Volume III, Section III.1.6.5]) |

- **REQ-API-004 (MUST):** The Path query endpoint (`/v1/graph/path`) MUST label each hop's edge type explicitly in its response when a path mixes Correlates_With and Causes edges, per [Volume III, REQ-GRAPH-014]; the API surface MUST enforce this labeling, not only the internal query engine.

### VII.5.7 Simulation API

| Endpoint | Method | Purpose |
|---|---|---|
| `/v1/simulations` | POST | Create a Simulation Job from a Scenario configuration ([Volume IV, Section IV.1.3]) |
| `/v1/simulations/{jobId}` | GET | Job status ([Volume IV, Section IV.1.2.1]) |
| `/v1/simulations/{jobId}/results` | GET | Results ([Volume IV, Part IV.5]) |
| `/v1/simulations/{jobId}` | DELETE | Cancellation |
| `/v1/simulations/{jobId}/forecast` | GET | Forecast-formatted output ([Volume IV, Section IV.5.2]) |

- **REQ-API-005 (MUST):** The Results and Forecast endpoints MUST include the fidelity tier that produced the result, per [Volume IV, REQ-SIM-002]; a fidelity-unlabeled result MUST NOT be returned.

### VII.5.8 Recommendation API

The literal API implementation of the Recommendation Gate state machine ([Volume II, Section II.2.6.2]).

| Endpoint | Method | Purpose |
|---|---|---|
| `/v1/recommendations` | GET | List, filterable by state |
| `/v1/recommendations/{id}` | GET | Detail |
| `/v1/recommendations/{id}/approve` | POST | Approved transition ([Volume II, Section II.2.6.2.e]) |
| `/v1/recommendations/{id}/reject` | POST | Rejected transition ([Volume II, Section II.2.6.2.c]) |
| `/v1/recommendations/{id}/modify` | POST | Modified transition, triggering re-scoring ([Volume II, REQ-FLOW-012]) |
| `/v1/recommendations/{id}/deploy` | POST | Deployed transition ([Volume II, Section II.2.6.2.f]) |
| `/v1/recommendations/{id}/rollback` | POST | Rolled Back transition ([Volume II, Section II.2.6.2.g]) |

- **REQ-API-006 (MUST):** Every state-transition endpoint in this Section MUST invoke the same backend guards specified at [Volume II, Section II.2.6.3], identically to the Studio Tools UI path ([REQ-STUDIO-002]); an API-initiated transition MUST NOT bypass a guard the UI path enforces.

### VII.5.9 Experiment API

| Endpoint | Method | Purpose |
|---|---|---|
| `/v1/experiments` | POST | Create, per Experiment Design ([Volume IV, Section IV.6.1]) |
| `/v1/experiments/{id}` | GET | Status |
| `/v1/experiments/{id}/results` | GET | Results ([Volume IV, Section IV.6.3]) |
| `/v1/experiments/{id}/end` | POST | End — early stopping ([Volume IV, Section IV.6.2.3]) or natural completion |

### VII.5.10 Agent API

| Endpoint | Method | Purpose |
|---|---|---|
| `/v1/agents/{agentId}/invoke` | POST | Trigger agent reasoning ([Volume V]) |
| `/v1/agents/{agentId}/status` | GET | Status |
| `/v1/agents/{agentId}/results` | GET | Results |
| `/v1/agents/{agentId}/config` | GET/PUT | Configuration, the API counterpart to the Agent Configuration interface ([Section VII.4.5.2]) |

- **REQ-API-007 (MUST):** The Agent Configuration endpoint MUST NOT permit editing a platform-shipped agent's core prompt or anatomy, per the same restriction already established at [REQ-STUDIO-006]; only Tools and Access configuration is adjustable through this endpoint.

### VII.5.11 Ethics API

| Endpoint | Method | Purpose |
|---|---|---|
| `/v1/ethics/score` | POST | Informational scoring query |
| `/v1/ethics/audit` | GET | Audit trail query |
| `/v1/ethics/report` | GET | Transparency report retrieval ([Volume I, Section I.5.3.6]) |

The scoring endpoint carries the same limitation already established for the internal Ethics Scoring Tool at [Volume V, Section V.1.4.5.h]: it scores, it does not gate. An external API consumer calling this endpoint receives an informational assessment as input to their own reasoning — it is not, and cannot be represented as, clearance that substitutes for the actual Recommendation Gate.

- **REQ-API-008 (MUST):** The `/v1/ethics/score` endpoint's output MUST NOT be usable as a substitute for passing the Recommendation Gate; a Recommendation MUST still pass the authoritative Ethics Scoring Trigger ([Volume V, Section V.2.2.7]) regardless of any prior external query to this endpoint.

### VII.5.12 Management API

| Endpoint | Method | Purpose |
|---|---|---|
| `/v1/tenant` | GET/PUT | Tenant Management ([Section VII.1.1.3]) |
| `/v1/users` | GET/POST | User Management |
| `/v1/roles` | GET/PUT | Role Management, the seven roles at [Section VII.1.2] |
| `/v1/api-keys` | GET/POST/DELETE | API Key Management |
| `/v1/webhooks` | GET/POST/DELETE | Webhook Management ([Section VII.5.13]) |

### VII.5.13 Webhooks

**Webhook Event Catalog (VII.5.13.1).** The set of platform events a webhook can subscribe to — Recommendation state transitions, Ethics veto events, Simulation completion, alert firing — mirroring the severity taxonomy already established at [Volume II, Section II.7.4] for which events matter enough to notify on.

**Webhook Registration (VII.5.13.2).** A tenant registers a webhook URL and event subscription list through the Management API ([Section VII.5.12]).

**Webhook Delivery and Retry (VII.5.13.3).** Extends the Retry and Timeout Policies already established at [Volume II, Section II.4.2.5] to webhook delivery specifically: bounded retry with backoff if the receiving endpoint fails or times out.

**Webhook Signature Verification (VII.5.13.4).** Every webhook payload is signed (an HMAC-class signature, named illustratively), so the receiving system can verify the payload genuinely originated from the platform and was not spoofed — an important control specific to this outbound push mechanism, since the receiving endpoint has no other way to authenticate the sender of an unsolicited HTTP request.

- **REQ-API-009 (MUST):** Every webhook payload MUST carry a verifiable signature per VII.5.13.4; an unsigned webhook delivery mechanism MUST NOT be offered as an option.

---

*End of Part VII.5 — API Specification.*

*Cross-References:* [Volume I, Section I.5.3.6] (Transparency Reporting), [Volume II, Section II.1.4.1] (Performance Targets), [Volume II, Section II.2.6.2–3] (Recommendation State Machine, Guards), [Volume II, Section II.4.2.5–6] (Retry/Timeout, Idempotency), [Volume II, Section II.4.4] (API Gateway), [Volume II, Section II.7.3.2, Section II.7.4] (Trace Context Propagation, Alerting), [Volume II, REQ-FLOW-012] (Modified-State Re-Scoring), [Volume III, Section III.1.6, REQ-GRAPH-014] (Graph Queries, Causal Chain Labeling), [Volume III, Part III.3, Section III.5] (Feature Engineering, Player Modeling), [Volume IV, Section IV.1.2.1, Section IV.1.3, REQ-SIM-002] (Simulation Job Scheduler, Scenario Configuration, Fidelity Labeling), [Volume IV, Part IV.5, Part IV.6] (Forecasting, Experimentation Framework), [Volume V, Section V.1.4.5.h, Section V.2.2.7] (Ethics Scoring Tool, Ethics Scoring Trigger), [Volume VI, Part VI.2, Section VI.3.1.1, Section VI.3.1.3] (SDK Architecture, Identity Model, Identity Mapping), [Section VII.1.2.7–8] (API Consumer Role, Role Permission Matrix), [Section VII.4.2.4, REQ-STUDIO-002, REQ-STUDIO-006] (Review and Approval Interface, Agent Configuration), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-API-001 through REQ-API-009.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 14, 2026

---

*Volume VII continues with Part VII.6 — Plugin System, per [PsyForge_v1_Master_TOC.md].*

## Part VII.6 — Plugin System

Part VII.6 generalizes the extension mechanism this specification has invoked by name since [Volume II, Section II.1.4.4] into an actual system. Section VII.6.2.2, Custom Agents, is explicitly not a second, competing extension path: it is the same mechanism already fully specified at [Volume V, Part V.14], addressed here as one of seven plugin types rather than re-specified from scratch. Section VII.6.2.7, Custom Simulation Models, carries the highest stakes of the seven: a plugin-contributed decision model still has to satisfy the corpus-grounding requirement that makes every platform-native persona's behavior traceable to the Psychology Corpus rather than an arbitrary black box.

### VII.6.1 Plugin Architecture

**Plugin Model Overview (VII.6.1.1).** A Plugin is a registered, sandboxed extension point, generalizing the extensibility principle already invoked across multiple Volumes ([Volume II, Section II.1.4.4]; [Volume V, Section V.1.4.5]'s Standard Tool Catalog extensibility) into a single system every extension type in Section VII.6.2 implements.

**Plugin Lifecycle (VII.6.1.2).** Install, Enable, Disable, Uninstall states, extending the Agent Lifecycle pattern already established at [Volume V, Section V.1.1.3] to plugins generally.

**Plugin Sandbox and Isolation (VII.6.1.3).** Extends the Tool Execution Sandbox ([Volume V, Section V.1.4.2]) and Third-Party Agent Sandboxing ([Volume V, Section V.14.2.2]): a plugin of any type runs within a sandboxed execution context with no direct production-write path, mirroring the No-Direct-Production-Write Doctrine ([Volume II, Section II.2.6.1]) extended to the Plugin System as a whole, not only to agent-type plugins.

**Plugin API Surface (VII.6.1.4).** The interface a plugin implements to integrate with the platform, generalizing the standard Connector interface pattern already established at [Volume VI, Section VI.5.2.1] — a Connector is itself one instance of a plugin under this broader system, not a separate mechanism.

- **REQ-PLUGIN-001 (MUST):** Every plugin, regardless of type (Section VII.6.2), MUST run within the sandbox specified at VII.6.1.3; no plugin type MUST be exempted from sandboxing on the basis of its category.

### VII.6.2 Plugin Types

Seven plugin types, each extending a specific extension point already established elsewhere in this specification.

**Custom Feature Extractors (VII.6.2.1).** Implements a new feature beyond the platform's 25-feature catalog ([Volume III, Section III.3.2]), using the Feature Definition Language ([Volume III, Section III.3.3.1]) and passing through the same Feature Lifecycle gates — Proposed, Experimental, Production ([Volume III, Section III.3.1.4]) — as a platform-native feature. No lower validation bar applies merely because the feature originated from a plugin.

**Custom Agents (VII.6.2.2).** This plugin type *is* the Agent Extension Framework already fully specified at [Volume V, Part V.14] — Agent Specification Template, Registration, Validation, and the Approval Workflow including mandatory Ethics Gate review. It is named here as one of seven plugin types for completeness of this Part's catalog, not re-specified as a second, independent mechanism; a custom agent submitted through the Plugin System and one submitted directly through Volume V's own process are the same submission going through the same gates.

**Custom Corpus Domains (VII.6.2.3).** Implements a new Psychology Corpus domain, extending Domain-Agnostic Corpus Swapping ([Volume III, Section III.2.13]) — including the Workplace Psychology and Healthcare Engagement domains already flagged as unsupported-but-plannable at [Volume III, Section III.2.13.4.d–e] — and must satisfy the Corpus Interface Specification ([Volume III, Section III.2.13.1]) any replacement or additional domain is already required to meet.

**Custom Visualization Widgets (VII.6.2.4).** Adds a new Dashboard widget type beyond the platform-native Widget Catalog ([Section VII.2.3.2]).

**Custom Report Templates (VII.6.2.5).** Adds a new report template beyond the platform-native set, extending the Report Template Engine ([Section VII.3.2.1]).

**Custom Event Sources (VII.6.2.6).** Implements a new external data source connector beyond the six platform-native sources ([Volume VI, Section VI.5.1]), extending the Connector Framework ([Volume VI, Section VI.5.2.1]) and subject to the same Import Validation discipline every external source is already held to ([Volume VI, REQ-INTEG-002]).

**Custom Simulation Models (VII.6.2.7).** Implements an alternative or additional persona decision-making model, extending the Persona Behavioral Model ([Volume IV, Section IV.2.3]). This is a notably high-stakes plugin type: the platform's core commitment to corpus-grounded decision modeling — the explicit rejection of pure expected-utility maximization in favor of the behavioral-economics departures specified at [Volume IV, REQ-PERSONA-004] — applies to a plugin-contributed model with no exception. A custom simulation model that substitutes an ungrounded decision rule for the corpus-grounded one is not a valid plugin under this Section, regardless of how well it otherwise performs.

- **REQ-PLUGIN-002 (MUST):** A Custom Agent plugin (VII.6.2.2) MUST pass through the identical Approval Workflow already specified at [Volume V, Section V.14.1.4], including Ethics Gate review; the Plugin System MUST NOT offer an alternate approval path with a lower bar.
- **REQ-PLUGIN-003 (MUST):** A Custom Simulation Model plugin (VII.6.2.7) MUST implement the corpus-grounded decision-making departures required at [Volume IV, REQ-PERSONA-004]; a model implementing pure expected-utility maximization without those departures MUST NOT be certified.
- **REQ-PLUGIN-004 (MUST):** A Custom Feature Extractor (VII.6.2.1) MUST pass the full Feature Validation discipline at [Volume III, Section III.3.4], including the mandatory Bias and Fairness Assessment, before reaching the Production lifecycle state.

### VII.6.3 Plugin Marketplace

**Marketplace Architecture (VII.6.3.1).** Generalizes Marketplace Agent Distribution, already specified at [Volume V, Section V.14.2.1], from agents specifically to all seven plugin types in Section VII.6.2.

**Plugin Submission Process (VII.6.3.2).** Generalizes the Agent Registration Process ([Volume V, Section V.14.1.2]) to every plugin type: registration of identity and an explicit, default-deny access declaration before a submission is eligible for review.

**Plugin Review and Certification (VII.6.3.3).** Generalizes the Agent Certification Process ([Volume V, Section V.14.2.3]): every plugin type, not agents alone, requires certification against published criteria before marketplace listing.

**Plugin Security Review (VII.6.3.4).** Generalizes Agent Security Review ([Volume V, Section V.14.2.4]) across all plugin types — the specific vulnerability class reviewed varies by type (prompt injection for a Custom Agent; code injection or data-exfiltration risk via an external network call for a Custom Event Source) but the requirement that security review is distinct from and mandatory alongside certification review applies uniformly.

**Plugin Versioning and Updates (VII.6.3.5).** Generalizes the re-certification-on-update requirement already established at [Volume V, REQ-EXTEND-005]: a plugin update requires re-certification; certification is never treated as durable across a change to any plugin type.

**Plugin Monetization (VII.6.3.6).** A plugin developer may charge for a listed plugin, with the platform taking a revenue share on marketplace transactions — the specific share terms are a business decision specified in [Volume VIII], forward reference, rather than fixed by this architectural specification; this Section establishes that the mechanism exists, not what its exact economics are.

- **REQ-PLUGIN-005 (MUST):** Every plugin type MUST undergo Security Review (VII.6.3.4) independent of and in addition to certification review (VII.6.3.3); passing one MUST NOT be treated as sufficient grounds to waive the other, mirroring [Volume V, REQ-EXTEND-004].
- **REQ-PLUGIN-006 (MUST):** A plugin update, regardless of type, MUST trigger re-certification per VII.6.3.5; certification MUST NOT be treated as durable across a prompt, model, or code change.

---

*End of Part VII.6 — Plugin System.*

*Cross-References:* [Volume II, Section II.1.4.4] (Maintainability and Extensibility), [Volume II, Section II.2.6.1] (No-Direct-Production-Write Doctrine), [Volume III, Section III.2.13, Section III.2.13.1, Section III.2.13.4.d–e] (Domain-Agnostic Corpus Swapping, Corpus Interface Specification, Unsupported Markets), [Volume III, Section III.3.1.4, Section III.3.2, Section III.3.3.1, Section III.3.4] (Feature Lifecycle, Feature Catalog, Feature Definition Language, Feature Validation), [Volume IV, Section IV.2.3, REQ-PERSONA-004] (Persona Behavioral Model, Corpus-Grounded Decision-Making), [Volume V, Part V.14, Section V.1.1.3, Section V.1.4.2, Section V.1.4.5] (Agent Extension Framework, Agent Lifecycle, Tool Execution Sandbox, Standard Tool Catalog), [Volume V, Section V.14.1.2, Section V.14.1.4, Section V.14.2.1–2, Section V.14.2.3–4, REQ-EXTEND-004–5] (Registration, Approval Workflow, Marketplace Distribution, Sandboxing, Certification, Security Review), [Volume VI, Section VI.5.1–2, REQ-INTEG-002] (External Data Sources, Connector Framework, Import Validation), [Section VII.2.3.2] (Widget Catalog), [Section VII.3.2.1] (Report Template Engine), [Volume VIII] (Business — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-PLUGIN-001 through REQ-PLUGIN-006.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 14, 2026

---

## End of Volume VII — Enterprise Platform

Volume VII is complete: six Parts, specifying the multi-tenant platform architecture and seven user roles — including the Ethics Reviewer role that gives Volume I's Ethics Board an actual login (VII.1), twelve Dashboard views culminating in the real-time Ethics Score Dashboard that finally implements REQ-ETH-065's long-standing requirement (VII.2), periodic reports including AI-generated natural-language narrative held to the same traceability and anti-spin discipline as any other generated explanation (VII.3), five Studio Tools workbenches with the Recommendation Studio serving as the literal button-level implementation of the Recommendation Gate (VII.4), the full programmatic API surface enforcing the same backend guards as every UI path (VII.5), and a Plugin System that generalizes extensibility across seven plugin types without ever lowering the bar a platform-native equivalent would have to clear (VII.6).

This Volume required a substantive mid-course correction: Parts VII.3 and VII.4 were initially drafted from an assumed template rather than the verified Master TOC, producing genuinely incorrect substructure rather than only mislabeled sections. Both were rewritten in full against the verified TOC before this Volume was considered complete.

Requirement IDs issued across this Volume: REQ-PLATFORM-001–004, REQ-DASH-001–005, REQ-REPORT-001–005, REQ-STUDIO-001–007, REQ-API-001–009, REQ-PLUGIN-001–006 — 36 requirements in total.

*Volume VIII — Business follows, per [PsyForge_v1_Master_TOC.md].*
