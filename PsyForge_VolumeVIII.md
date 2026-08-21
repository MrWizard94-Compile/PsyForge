# PsyForge v1.0 — Volume VIII: Business Architecture

*Part of the PsyForge Master Specification. See [PsyForge_v1_Master_TOC.md](PsyForge_v1_Master_TOC.md) for the full document map, and Volumes I through VII for the technical specification this Volume commercializes.*

*Document Status: Living Specification — complete against the master TOC.*

---

Volume VIII specifies the commercial architecture around everything Volumes I through VII have already built: the business model, licensing, pricing, marketplace and partner ecosystem, white-label and OEM paths, and go-to-market strategy. This Volume's obligation is narrower than it might first appear — every revenue stream, license tier, and product name it introduces has to trace back to a real, already-specified technical capability. A business model claiming a capability the technical Volumes don't actually support would be exactly the kind of overclaim this specification's own honesty discipline, maintained since Volume I, exists to prevent.

---

## Part VIII.1 — Business Model

Part VIII.1 states the business model using the standard Business Model Canvas structure (Osterwalder), and introduces the product hierarchy every subsequent Part in this Volume references by name.

### VIII.1.1 Business Model Overview

**Value Proposition (VIII.1.1.1).** Synthesizes the eight Strategic Differentiators already established at [Volume I, Section I.1.5] into customer-facing value: predictive, causally grounded — not merely correlational — behavioral intelligence, with ethics governance built into the architecture rather than bolted on afterward, deployable on a studio's own infrastructure rather than requiring data to leave it. The value proposition is not a separate claim from those differentiators; it is those differentiators stated for a buyer rather than an engineer.

**Customer Segments (VIII.1.1.2).** Game studios are the primary segment, addressing the stakeholder pain points already catalogued at [Volume I, Section I.1.3.6]. Adjacent segments map directly to the corpus markets already named at [Volume III, Section III.2.13.4]: marketing agencies, EdTech, HR and training, digital health, and FinTech — each segment corresponds to a specific corpus swap or addition already specified (or, for two of those markets, already honestly flagged as not yet supported) rather than an independently invented market category.

**Revenue Streams (VIII.1.1.3).** Four categories, each detailed in a later Part: license fees ([Part VIII.2]), usage-based fees ([Section VIII.3.1]), marketplace revenue share (from the Corpus, Agent, and Plugin marketplaces already specified at [Volume III, Section III.2.13], [Volume V, Section V.14.2.1], and [Volume VII, Section VII.6.3.6]), and partner revenue share ([Section VIII.4.1.3]).

**Cost Structure (VIII.1.1.4).** The primary cost drivers trace directly to already-specified technical capability: Simulation compute (particularly at the ten-million-persona ceiling established at [Volume IV, Section IV.9.1.1]), polyglot storage ([Volume II, Part II.3]), AI and LLM inference cost (the Agent Framework, [Volume V], and the Local Model Runtime, [Volume II, Section II.5.5.3]), and ongoing Corpus research and maintenance ([Volume III, Section III.2.1.4]'s update process).

**Key Resources (VIII.1.1.5).** The Feature Engine as intellectual property ([Volume III, Section III.3.1.2]), the Psychology Corpus ([Volume III, Part III.2]), the Simulation Engine's accumulated calibration history — the concrete substance behind the Simulation-as-Competitive-Moat claim first made at [Volume IV, Section IV.1.1.2] — and the Agent Framework ([Volume V]).

**Key Activities (VIII.1.1.6).** Corpus and Feature Engine research and development, platform operations ([Volume II]), and studio onboarding and support, tiered per the Support Level structure specified at [Section VIII.2.2.5].

**Key Partnerships (VIII.1.1.7).** Implementation partners, technology partners (cloud infrastructure providers supporting the Cloud deployment model, [Volume II, Section II.5.1.2]), and reseller partners, formalized through the Partner Program specified at [Section VIII.4.1].

**Customer Relationships (VIII.1.1.8).** Ranges from self-serve (the Community Edition, [Section VIII.2.1.1]) to high-touch enterprise support (the Enterprise Edition, [Section VIII.2.1.3]), varying by license tier rather than applied uniformly across every customer.

- **REQ-BIZ-001 (MUST):** Every revenue stream named in VIII.1.1.3 MUST trace to a mechanism already specified in Volumes II through VII; a revenue stream implying a capability this specification does not technically support MUST NOT be introduced without first specifying that capability.
- **REQ-BIZ-002 (MUST):** The Cost Structure (VIII.1.1.4) MUST reflect the actual cost drivers already established in the technical Volumes, particularly Simulation compute at scale ([Volume IV, Section IV.9.1.1]) and AI inference cost; a cost model omitting a known major driver MUST NOT be represented as complete.

### VIII.1.2 Product Hierarchy

**WPAI (Parent Brand) (VIII.1.2.1).** The umbrella company brand under which PsyForge and its sibling products exist.

**PsyForge (Platform) (VIII.1.2.2).** The core platform this entire specification describes — Volumes I through VII and IX through X.

**Echoes of the Frontier (Demonstration Product) (VIII.1.2.3).** A flagship game product built to demonstrate the platform's capability directly, feeding the Case Study Development work specified at [Section VIII.6.1.4] — the standard "use your own product" strategy for a B2B platform in a domain where a working example is substantially more persuasive to a prospective studio customer than an abstract capability pitch.

**PsyForge SDK (Integration Toolkit) (VIII.1.2.4).** The client-integration product specifically ([Volume VI, Part VI.2]), distributed and referenced as its own product-line entry even though it is architecturally part of the broader platform.

**PsyForge Cloud (Enterprise Deployment) (VIII.1.2.5).** The managed, hosted product tier, extending the Cloud deployment model already specified at [Volume II, Section II.5.1.2] — distinct from the Local-First, self-hosted deployment a studio might run entirely on its own infrastructure.

**PsyForge Research (Behavioral Corpus) (VIII.1.2.6).** The Psychology Corpus ([Volume III, Part III.2]) framed as its own product line, feeding the Corpus Marketplace ([Section VIII.4.3.2]) and the Research Edition license ([Section VIII.2.1.4]) for academic access to the corpus specifically — the corpus's value is significant enough to be sold as its own product, not only maintained as an internal platform component.

- **REQ-BIZ-003 (MUST):** Every product named in the Product Hierarchy (VIII.1.2) MUST map to a component or capability already specified in an earlier Volume; a named product with no corresponding technical specification MUST NOT be introduced.

---

*End of Part VIII.1 — Business Model.*

*Cross-References:* [Volume I, Section I.1.3.6] (Market Pain Points by Stakeholder Role), [Volume I, Section I.1.5] (Strategic Differentiators), [Volume II, Part II.3] (Storage Architecture), [Volume II, Section II.5.1.2, Section II.5.5.3] (Cloud Deployment Model, Local Model Runtime), [Volume III, Section III.2.1.4] (Corpus Update and Contribution Process), [Volume III, Section III.2.13.4] (Supported Corpus Markets), [Volume III, Section III.3.1.2] (Feature Engine as Intellectual Property), [Volume IV, Section IV.1.1.2] (Simulation as Competitive Moat), [Volume IV, Section IV.9.1.1] (10 Million Persona Simulations), [Volume V, Section V.14.2.1] (Marketplace Agent Distribution), [Volume VI, Part VI.2] (SDK Architecture), [Volume VII, Section VII.6.3.6] (Plugin Monetization), [Part VIII.2] (Licensing Strategy — forward reference), [Section VIII.2.1.1, Section VIII.2.1.3\u20134, Section VIII.2.2.5] (License Tiers, Support Level — forward reference), [Section VIII.3.1] (Pricing Models — forward reference), [Section VIII.4.1, Section VIII.4.1.3, Section VIII.4.3.2, Section VIII.4.3.6] (Partner Program, Corpus Marketplace — forward reference), [Section VIII.6.1.4] (Case Study Development — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-BIZ-001 through REQ-BIZ-003.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 14, 2026

---

## Part VIII.2 — Licensing Strategy

### VIII.2.1 Licensing Models

**Community Edition (VIII.2.1.1).** A local, non-production evaluation license may expose sample corpus material and the demonstrator only. It excludes personal-data ingestion, production recommendation workflows, marketplace publishing, and managed hosting.

**Studio Edition (VIII.2.1.2).** A per-studio license covers a named operator's self-hosted deployment, bounded consented event volume, the core SDK, and the human review gate. It does not grant resale, white-label, or corpus redistribution rights.

**Enterprise Edition (VIII.2.1.3).** An enterprise license supports negotiated scale, enterprise identity integration, support commitments, multi-environment deployment, and documented security review. It does not waive the Ethics Charter or privacy controls.

**Research Edition (VIII.2.1.4).** Academic or non-commercial research use receives a constrained corpus and synthetic or appropriately authorized data only. Publication, re-identification, and use for behavioral manipulation are prohibited.

**White Label License (VIII.2.1.5).** The license grants the brand and presentation configuration described in Part VIII.5, while retaining platform integrity, auditability, and customer disclosure duties.

**OEM License (VIII.2.1.6).** The license permits embedding defined APIs or SDK components inside a partner product. It is bounded by approved integration surfaces, support ownership, data-controller allocation, and re-certification on material change.

### VIII.2.2 License Feature Matrix

| Capability | Community | Studio | Enterprise | Research | White Label / OEM |
|---|---|---|---|---|---|
| Sample-only demonstrator | Yes | Yes | Yes | Yes | Contractual |
| Consented telemetry ingestion | No | Bounded | Negotiated | Synthetic/approved only | Contractual |
| Local-first deployment | Yes | Yes | Yes | Yes | Contractual |
| Specialist agents / simulation | Sample only | Bounded | Negotiated | Research protocol | Contractual |
| Marketplace publishing | No | Review required | Review required | No | Contractual |

**Feature Availability (VIII.2.2.1), Data Volume Limits (VIII.2.2.2), Agent Count Limits (VIII.2.2.3), and Simulation Compute Limits (VIII.2.2.4).** Limits are enforced by deployment configuration and meter records, never by silently degrading ethics, consent, audit, or deletion controls. A limit change is versioned and visible to the customer.

**Support Level by Tier (VIII.2.2.5).** Community is documentation-led; Studio has business-hours support; Enterprise and approved OEM terms define response objectives, security contacts, and escalation. No support tier promises legal compliance or model accuracy without evidence.

### VIII.2.3 License Terms

**License Agreement Structure (VIII.2.3.1).** Every agreement identifies the licensed artifacts, permitted deployment topology, term, support schedule, security annex, data-processing allocation, and change process.

**Usage Restrictions (VIII.2.3.2).** Licensees may not bypass the ethics gate, infer sensitive characteristics without a documented lawful basis and approval, use the platform to target vulnerable populations, or claim simulated output is certainty.

**Data Ownership Terms (VIII.2.3.3).** The customer retains rights in its source telemetry subject to the applicable agreement; PsyForge receives only the minimum processing rights required for the selected deployment. Derived artifacts, retention, export, deletion, and controller/processor roles are written down per deployment.

**IP Ownership (VIII.2.3.4).** The Feature Engine, core corpus curation, platform source, and product marks remain WPAI property unless a written agreement says otherwise. Customer data, approved custom integrations, and independently created plugins follow the agreement's explicit allocation.

**Termination and Data Return (VIII.2.3.5).** Termination triggers export and deletion procedures with a dated certificate or a documented legal-hold exception. Hosted keys are revoked and access is removed; local deployments receive an auditable decommissioning checklist.

**Audit Rights (VIII.2.3.6).** Audits are proportional, scoped, secure, and non-disruptive. They verify license scope and control operation without exposing unrelated customer or trade-secret data.

- **REQ-LIC-001 (MUST):** A commercial term MUST NOT grant a right that bypasses consent, ethics, audit, or human-review controls.
- **REQ-LIC-002 (MUST):** Every data-bearing license MUST define data-role allocation, retention, export, deletion, and incident responsibilities.

## Part VIII.3 — Pricing Strategy

### VIII.3.1 Pricing Models

**Per-Seat (VIII.3.1.1), Per-MAU (VIII.3.1.2), Per-Event (VIII.3.1.3), Per-Simulation-Hour (VIII.3.1.4), and Flat Enterprise (VIII.3.1.5).** Each model may be offered only where its meter is measurable, inspectable, and not personal data beyond what billing needs. The invoice must identify its meter and aggregation period.

**Hybrid Models (VIII.3.1.6), Usage Caps (VIII.3.1.7), and Revenue Share (VIII.3.1.8).** Hybrids pair a predictable base with a bounded overage; caps default to warn and require explicit customer action before any service-affecting enforcement. Revenue share is limited to a documented, independently auditable demonstrated-ROI program and cannot create incentives to evade the manipulation boundary.

### VIII.3.2 Pricing Tiers

**Tier Structure (VIII.3.2.1).** Published tiers identify included capacity and excluded capabilities; pricing is not a security boundary. **Volume (VIII.3.2.2), Commitment (VIII.3.2.3), Startup/Indie (VIII.3.2.4), and Educational/Non-Profit (VIII.3.2.5) Discounts** alter commercial terms only and leave safety controls intact.

### VIII.3.3 Cost Models

**Per-Customer Cost (VIII.3.3.1).** Cost is modeled as fixed platform allocation plus observed compute, storage, support, and security overhead. **Infrastructure (VIII.3.3.2), AI/LLM (VIII.3.3.3), and Support (VIII.3.3.4) Costs** are forecast separately. **Gross Margin Targets (VIII.3.3.5)** are targets, not a rationale to weaken controls. **Optimization Levers (VIII.3.3.6)** prioritize local models, batching, retention minimization, caching of non-sensitive artifacts, and workload quotas.

- **REQ-PRICE-001 (MUST):** Billing meters MUST be documented, customer-auditable, and separated from behavioral profiling.
- **REQ-PRICE-002 (MUST):** Cost optimization MUST NOT reduce consent, security, ethics, or deletion guarantees.

## Part VIII.4 — Marketplace and Partner Ecosystem

### VIII.4.1 Partner Program

**Partner Tiers (VIII.4.1.1).** Implementation, reseller, and technology partners have distinct scopes. **Requirements (VIII.4.1.2)** include training, security review, and customer transparency. **Revenue Share (VIII.4.1.3)** is contractual and traceable. **Enablement (VIII.4.1.4)** includes versioned integration material. **Certification (VIII.4.1.5)** expires on material product, model, or security change.

### VIII.4.2 Partner APIs

**Partner Management (VIII.4.2.1), Provisioning (VIII.4.2.2), Billing (VIII.4.2.3), and Analytics (VIII.4.2.4) APIs** are extensions of Volume VII's API contract: least-privilege scopes, tenant isolation, rate limits, audit events, versioning, and a revocation path are mandatory. Billing and analytics endpoints expose aggregates only unless an explicit data agreement authorizes more.

### VIII.4.3 Marketplace

**Marketplace Overview (VIII.4.3.1).** The marketplace distributes reviewed extensions, not unrestricted executable code. **Corpus (VIII.4.3.2), Agent (VIII.4.3.3), Plugin (VIII.4.3.4), and Feature Pack (VIII.4.3.5) Marketplaces** each require provenance, version pinning, compatibility metadata, rollback, and re-review on update. **Revenue (VIII.4.3.6)** is transparent to creators and customers. **Quality and Security Review (VIII.4.3.7)** combines functional certification, license review, vulnerability review, privacy impact review, and ethics review.

- **REQ-MKT-001 (MUST):** No marketplace artifact may be installed or updated without provenance, a versioned manifest, compatibility validation, security review, and rollback metadata.

## Part VIII.5 — White Label and OEM

### VIII.5.1 White Label Architecture

**Branding (VIII.5.1.1), UI/UX (VIII.5.1.2), and Domain (VIII.5.1.3) Customization** are configuration-led and must not hide PsyForge's human-review, consent, or ethics state from authorized users. **Deployment (VIII.5.1.4)** keeps tenant isolation, audit ownership, and support escalation explicit.

### VIII.5.2 OEM Integration

**Embedding (VIII.5.2.1)** uses stable, minimal integration contracts. **API Surface (VIII.5.2.2)** is scoped and versioned. **Licensing (VIII.5.2.3)** assigns data, support, and downstream disclosure responsibilities. **Support (VIII.5.2.4)** records triage ownership and coordinated vulnerability disclosure.

- **REQ-OEM-001 (MUST):** White-label or OEM presentation MUST NOT conceal required consent, audit, or human-oversight information.

## Part VIII.6 — Go-to-Market Strategy

### VIII.6.1 Market Entry

**Initial Target (VIII.6.1.1).** Begin with game studios that can supply consented telemetry and retain human design review. **Beachhead (VIII.6.1.2).** Sell a constrained evidence-and-simulation workflow rather than an autonomous optimization promise. **Pilot Design (VIII.6.1.3).** A pilot defines a hypothesis, data scope, success metric, ethics review, rollback, and exit decision before collection begins. **Case Study Development (VIII.6.1.4).** Echoes of the Frontier may demonstrate the platform only with disclosed methodology and without claiming generalizable results from a single product.

### VIII.6.2 Market Expansion

**Adjacent Markets (VIII.6.2.1), Corpus Development (VIII.6.2.2), Partnership-Led Expansion (VIII.6.2.3), and Geographic Expansion (VIII.6.2.4)** require a domain-specific impact assessment, corpus evidence review, legal review, and a new acceptance decision before sales activity.

### VIII.6.3 Competitive Positioning

**Competitor Landscape (VIII.6.3.1).** Compare analytics, BI, and AI tools by evidenced capability rather than unverified superiority. **Differentiation (VIII.6.3.2)** is the local-first, causally evidenced, ethics-gated behavioral reasoning workflow. **Category Narrative (VIII.6.3.3)** never promises behavioral certainty or autonomous deployment. **Analyst Relations (VIII.6.3.4)** uses source-linked technical demonstrations and disclosed limitations.

- **REQ-GTM-001 (MUST):** Sales, partner, and case-study material MUST distinguish a demonstrated result from a hypothesis, simulation, or roadmap claim.

---

## End of Volume VIII — Business Architecture

Volume VIII is complete: it commercializes only capabilities the technical specification defines, keeps license and pricing terms subordinate to privacy and ethics controls, and makes marketplace, white-label, OEM, and go-to-market growth reviewable rather than a route around governance.

*Requirement IDs issued in this Volume:* REQ-BIZ-001–003, REQ-LIC-001–002, REQ-PRICE-001–002, REQ-MKT-001, REQ-OEM-001, REQ-GTM-001.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 20, 2026
