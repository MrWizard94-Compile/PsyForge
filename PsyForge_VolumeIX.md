# PsyForge v1.0 — Volume IX: Security, Privacy, and Compliance

*Part of the PsyForge Master Specification. This is an engineering control specification, not legal advice or a declaration of compliance. Counsel and the accountable operator must validate applicability, implementation, and jurisdiction-specific obligations before processing production data.*

## Part IX.1 — Threat Model

### IX.1.1 Threat Modeling Approach

**Methodology (IX.1.1.1).** PsyForge uses STRIDE for system and interface threats, privacy threat analysis for personal data, and misuse-case review for behavioral and agent workflows. Every material change records assets, trust boundaries, attacker capabilities, controls, residual risk, owner, and retest date.

**Scope (IX.1.1.2), Cadence (IX.1.1.3), and Reviews (IX.1.1.4).** The model covers SDKs, telemetry, data stores, feature/model/corpus pipelines, agents, simulation, APIs, administration, marketplace artifacts, and air-gapped transfer. Review is required before release, on material architectural or supplier change, after a relevant incident, and at least annually.

### IX.1.2 Threat Actors

**External Attacker (IX.1.2.1), Malicious Insider (IX.1.2.2), Compromised Insider (IX.1.2.3), Third Party/Supply Chain (IX.1.2.4), Nation-State Actor (IX.1.2.5), and Curious Developer (IX.1.2.6).** Controls assume every actor can exploit overbroad access, poisoned inputs, secrets exposure, weak tenant boundaries, and unreviewed dependencies. The system grants no privileged diagnostic access merely for convenience.

### IX.1.3 Threat Catalog

**Data Exfiltration (IX.1.3.1).** Tenant-scoped authorization, minimization, encrypted storage, exports with policy checks, and immutable access events defend telemetry, player models, and recommendations.

**Model Theft (IX.1.3.2), Model Poisoning (IX.1.3.3), Corpus Tampering (IX.1.3.4), and Knowledge Graph Injection (IX.1.3.5).** Provenance, signed releases, review gates, quality checks, append-only lineage, outlier controls, and rollback protect intellectual property and evidence integrity.

**Agent Prompt Injection (IX.1.3.6), Simulation Manipulation (IX.1.3.7), Recommendation Tampering (IX.1.3.8), and Ethics Bypass (IX.1.3.9).** Untrusted content remains data, never authority; tool calls use schemas and allow-lists; simulations retain immutable inputs/seeds; recommendations require attributable evidence and a human review state; no agent may override the ethics veto.

**Tenant Isolation (IX.1.3.10), Privilege Escalation (IX.1.3.11), Supply Chain Attack (IX.1.3.12), Side Channel (IX.1.3.13), and Inference Attack (IX.1.3.14).** Row/column/purpose controls, least privilege, signed/pinned artifacts, secrets isolation, resource partitioning, rate limits, output minimization, and privacy testing are required.

### IX.1.4 Attack Surface Map

**External API (IX.1.4.1), SDK (IX.1.4.2), Internal Service (IX.1.4.3), Admin (IX.1.4.4), Storage (IX.1.4.5), and Agent Interaction (IX.1.4.6) Surfaces.** Each surface has an owner, authentication method, authorized operations, input contract, rate limit, audit event set, dependencies, and disabled-by-default posture. Public exposure requires explicit approval.

- **REQ-THREAT-001 (MUST):** A material release MUST have a current threat model and named residual-risk owner.
- **REQ-THREAT-002 (MUST):** Agent- or corpus-supplied text MUST be treated as untrusted input and MUST NOT grant tool authority.

## Part IX.2 — Encryption

### IX.2.1 Data at Rest

**Database (IX.2.1.1), Data Lake (IX.2.1.2), Object Storage (IX.2.1.3), Vector Database (IX.2.1.4), and Graph Database (IX.2.1.5) Encryption.** Production stores use provider or deployment-managed encryption with separately authorized key access. Implementations select current, reviewed primitives; this document deliberately does not freeze an algorithm where lifecycle guidance changes.

**Key Management (IX.2.1.6), Rotation (IX.2.1.7), and Backups (IX.2.1.8).** A key-management service or air-gapped equivalent owns generation, scoped access, rotation, revocation, recovery, and key-access audit. Backups receive equivalent encryption and restoration testing; keys never reside in source, images, logs, or telemetry.

### IX.2.2 Data in Transit

**TLS (IX.2.2.1), mTLS (IX.2.2.2), Certificates (IX.2.2.3), SDK Transport (IX.2.2.4), and Forward Secrecy (IX.2.2.5).** External traffic uses a current TLS baseline, authenticated internal service channels where a trust boundary exists, automated certificate inventory/renewal, SDK certificate validation, and configurations that preserve forward secrecy when supported.

### IX.2.3 Data in Use

**Confidential Computing (IX.2.3.1), Homomorphic Encryption (IX.2.3.2), and Secure Multi-Party Computation (IX.2.3.3).** These are optional controls requiring documented threat-model benefit and measured operational cost; they are not marketing claims. **Differential Privacy (IX.2.3.4)** is considered for aggregate reporting with a documented privacy budget, sensitivity, release policy, and utility test.

### IX.2.4 Application-Level Encryption

**Field-Level PII (IX.2.4.1), Envelope Encryption (IX.2.4.2), and Key Hierarchy (IX.2.4.3).** Sensitive fields receive application-level protection when storage-layer encryption and access policy do not sufficiently reduce exposure. Per-tenant data keys are wrapped by a rotating key-encryption key; decrypt capability is purpose-scoped and audited.

- **REQ-CRYPT-001 (MUST):** Secret and key material MUST be generated, stored, distributed, rotated, and audited outside source control and application logs.
- **REQ-CRYPT-002 (MUST):** Backup restoration tests MUST prove encrypted data can be recovered by authorized operators without weakening key separation.

## Part IX.3 — Access Control

### IX.3.1 Role-Based Access Control (RBAC)

**Roles (IX.3.1.1), Permissions (IX.3.1.2), Assignment (IX.3.1.3), and Recertification (IX.3.1.4).** Roles are job-oriented and least-privilege: no general administrator role includes unrestricted player-model or secret access. Assignment has an approver, expiry when appropriate, and periodic recertification.

### IX.3.2 Attribute-Based Access Control (ABAC)

**Attributes (IX.3.2.1), Policy Language (IX.3.2.2), Evaluation (IX.3.2.3), and Dynamic Decisions (IX.3.2.4).** Policy combines authenticated subject, tenant, data classification, purpose, consent state, region, device/session assurance, and time. Policies are versioned, tested, default-deny, and evaluated on every protected operation rather than inferred from a UI route.

### IX.3.3 Data Access Control

**Row (IX.3.3.1) and Column (IX.3.3.2) Security, Tenant Isolation (IX.3.3.3), Time Restrictions (IX.3.3.4), and Purpose Restrictions (IX.3.3.5).** Controls apply in query services, storage policies, export jobs, cache keys, background workers, and observability pipelines. A valid identity without a valid consented purpose is denied.

### IX.3.4 API Access Control

**API Keys (IX.3.4.1), OAuth Tokens (IX.3.4.2), Per-Key Limits (IX.3.4.3), and Permission Scopes (IX.3.4.4).** Keys are individually attributable, scoped, encrypted at rest, revealable only once, rotatable, revocable, and never used as an end-user identity substitute.

### IX.3.5 Secrets Management

**Vault Storage (IX.3.5.1), Rotation (IX.3.5.2), Access Audit (IX.3.5.3), and Service Distribution (IX.3.5.4).** Services receive short-lived, workload-bound credentials at runtime. Break-glass access is human-approved, time-limited, fully audited, and reviewed after use.

- **REQ-ACCESS-001 (MUST):** Every protected data operation MUST be authenticated, tenant-scoped, purpose-checked, and auditable.
- **REQ-ACCESS-002 (MUST):** Authorization is default-deny; UI visibility MUST NOT be the only access control.

## Part IX.4 — Audit and Logging

### IX.4.1 Audit Log Architecture

**Event Types (IX.4.1.1), Append-Only Storage (IX.4.1.2), Retention (IX.4.1.3), and Integrity (IX.4.1.4).** Audit records are structured, tenant-aware, time-synchronized, append-only, retained by documented policy, access-controlled, and protected with tamper-evident chaining and immutable/WORM-capable storage where required. Operational logs are separate and redact secrets and unnecessary personal data.

### IX.4.2 Audit Events

The audit schema records **authentication (IX.4.2.1), authorization grant/deny (IX.4.2.2), data access (IX.4.2.3), data modification (IX.4.2.4), configuration (IX.4.2.5), recommendation lifecycle (IX.4.2.6), ethics decision (IX.4.2.7), agent action (IX.4.2.8), simulation run (IX.4.2.9), deployment (IX.4.2.10), admin (IX.4.2.11), and export (IX.4.2.12) events** with actor, action, target class, tenant, purpose, outcome, correlation ID, policy/version references, and reason where available.

### IX.4.3 Audit Query and Reporting

**Search (IX.4.3.1), Report Templates (IX.4.3.2), Compliance Export (IX.4.3.3), and Tamper Detection (IX.4.3.4).** Queries are separately authorized and audited; exports minimize personal data; integrity verification is automated and alerts an independent security function.

- **REQ-AUDIT-001 (MUST):** Every recommendation, ethics decision, export, privileged access, and deployment action MUST emit a durable, tamper-evident audit event.

## Part IX.5 — Compliance Framework

### IX.5.1 GDPR Compliance

**Lawful Basis (IX.5.1.1), DPIA (IX.5.1.2), Data-Subject Rights (IX.5.1.3), Cross-Border Transfer (IX.5.1.4), DPO (IX.5.1.5), and Breach Notification (IX.5.1.6).** The operator records a processing purpose and lawful basis before ingestion, assesses high-risk processing, supports rights workflows with identity verification, maps transfers, appoints the appropriate accountable role, and rehearses breach response. Official legal text and regulator guidance govern the final determination.

### IX.5.2 CCPA / CPRA Compliance

**Consumer Rights (IX.5.2.1), Opt-Out (IX.5.2.2), and Service-Provider Provisions (IX.5.2.3).** The platform supports documented access, deletion, correction, limitation, and opt-out workflows where applicable; it honors applicable preference signals and binds downstream providers by contract and technical policy.

### IX.5.3 COPPA Compliance

**Age Gate (IX.5.3.1), Parental Consent (IX.5.3.2), and Under-13 Restrictions (IX.5.3.3).** Child-directed or actual-knowledge flows are blocked from collection until the accountable operator implements a counsel-approved notice and verifiable parental-consent process. Collection is minimized and no behavioral optimization is allowed for protected minors.

### IX.5.4 EU AI Act Compliance

**Risk Classification (IX.5.4.1), Transparency (IX.5.4.2), Human Oversight (IX.5.4.3), Conformity Assessment (IX.5.4.4), and Post-Market Monitoring (IX.5.4.5).** Classification is use-case-specific. The design preserves technical documentation, logs, understandable outputs, human control, monitoring, incident handling, and retraining/release governance; counsel validates obligations and dates.

### IX.5.5 Sector-Specific Compliance

**HIPAA (IX.5.5.1), SOC 2 (IX.5.5.2), ISO 27001 (IX.5.5.3), PCI DSS (IX.5.5.4), and Regional Rules (IX.5.5.5).** These controls apply only after a scoped applicability assessment; payment data should be tokenized or delegated to a compliant payment service rather than stored by PsyForge.

### IX.5.6 Compliance Matrix

**Regulation-to-Feature Mapping (IX.5.6.1), Status Dashboard (IX.5.6.2), and Gap Remediation (IX.5.6.3).** Appendix H maps obligations to design controls, evidence, owner, applicability decision, validation date, and remediation. “Implemented” never means “legally certified.”

- **REQ-COMP-001 (MUST):** Production processing requires an approved applicability assessment and evidence-backed control matrix; no product claim may state compliance without accountable validation.
- **REQ-COMP-002 (MUST):** Minor-protection controls MUST fail closed on unknown or unverified consent state where the operator's policy or applicable law requires it.

## Part IX.6 — Air-Gapped Deployment

### IX.6.1 Air-Gapped Architecture

**Offline Operation (IX.6.1.1), Local LLM Runtime (IX.6.1.2), Model Registry (IX.6.1.3), Corpus Storage (IX.6.1.4), and Feature Engine (IX.6.1.5).** The air-gapped mode has no runtime dependence on remote inference, telemetry, license validation, font/CDN, or package registry. Models, corpus, dependencies, and configuration are locally versioned and integrity-checked.

### IX.6.2 Air-Gapped Data Transfer

**Secure Import/Export (IX.6.2.1), Import Validation (IX.6.2.2), Physical Media (IX.6.2.3), and Transfer Audit (IX.6.2.4).** Transfers use a signed manifest, hash verification, malware scanning in an approved staging zone, schema validation, tenant/purpose check, quarantined failure path, and chain-of-custody audit.

### IX.6.3 Air-Gapped Updates

**Offline Package (IX.6.3.1), Verification and Signing (IX.6.3.2), and Rollback (IX.6.3.3).** Updates are reproducible, signed, compatibility-checked, staged, approved, and rollbackable to a verified known-good release.

- **REQ-AIRGAP-001 (MUST):** Air-gapped deployment MUST remain operational without a network dependency and MUST reject unsigned, invalid, or incompatible transfers.

## Part IX.7 — Security Operations

### IX.7.1 Vulnerability Management

**Scanning (IX.7.1.1), Dependency Scanning (IX.7.1.2), Image Scanning (IX.7.1.3), Penetration Testing (IX.7.1.4), Bug Bounty (IX.7.1.5), and Remediation SLA (IX.7.1.6).** Findings receive severity, owner, due date, exploitability assessment, verification evidence, and customer communication criteria. No known critical vulnerability is accepted silently.

### IX.7.2 Incident Response

**Classification (IX.7.2.1), Plan (IX.7.2.2), Communications (IX.7.2.3), Forensics (IX.7.2.4), and Review (IX.7.2.5).** The incident runbook defines authority, containment, evidence preservation, customer/regulator coordination through counsel, recovery, and corrective-action verification.

### IX.7.3 Security Monitoring

**SIEM (IX.7.3.1), Anomaly Detection (IX.7.3.2), Intrusion Detection (IX.7.3.3), DLP (IX.7.3.4), and Dashboards (IX.7.3.5).** Monitoring receives structured, redacted events; alerts are tuned, owned, tested, and connected to incident response rather than treated as passive telemetry.

- **REQ-SECOPS-001 (MUST):** Security findings and incidents MUST have an accountable owner, severity, remediation/recovery record, and verification before closure.

## End of Volume IX — Security, Privacy, and Compliance

*Primary legal-reference starting points, verified August 20, 2026:* [EU AI Act, Regulation (EU) 2024/1689](https://eur-lex.europa.eu/eli/reg/2024/1689/oj), [FTC COPPA guidance](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions), and [California Privacy Protection Agency CCPA FAQ](https://cppa.ca.gov/faq). These sources inform control design but do not replace legal advice.

*Requirement IDs issued in this Volume:* REQ-THREAT-001–002, REQ-CRYPT-001–002, REQ-ACCESS-001–002, REQ-AUDIT-001, REQ-COMP-001–002, REQ-AIRGAP-001, REQ-SECOPS-001.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 20, 2026
