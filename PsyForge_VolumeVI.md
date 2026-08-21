# PsyForge v1.0 — Volume VI: Telemetry, SDK, and Data Integration

*Part of the PsyForge Master Specification. See [PsyForge_v1_Master_TOC.md](PsyForge_v1_Master_TOC.md) for the full document map, [PsyForge_VolumeI_Complete.md](PsyForge_VolumeI_Complete.md) for Volume I, [PsyForge_VolumeII.md](PsyForge_VolumeII.md) for Volume II, [PsyForge_VolumeIII.md](PsyForge_VolumeIII.md) for Volume III, [PsyForge_VolumeIV.md](PsyForge_VolumeIV.md) for Volume IV, and [PsyForge_VolumeV.md](PsyForge_VolumeV.md) for Volume V.*

*Document Status: Living Specification — Volume VI complete (Parts VI.1–VI.5).*

---

Volume VI specifies the platform's front door: the Telemetry Collector and Event Schema first named as components in [Volume II, Section II.1.1.1] and specified as pipeline stages in [Volume II, Section II.2.1.1–2], now specified at implementation detail; the SDK that game clients actually integrate; the identity and privacy architecture that makes every downstream Volume's pseudonymization and consent claims concrete rather than assumed; the streaming infrastructure telemetry runs on; and the connectors that bring external studio data in. This is also where the client-to-collector trust boundary first named at [Volume II, Section II.1.1.5] gets its full specification — the platform's widest, least-trusted attack surface, and the place untrusted-input discipline matters most.

---

## Part VI.1 — Telemetry Specification

### VI.1.1 Telemetry Architecture

**Telemetry Collector Design (VI.1.1.1).** Specifies the Collector's internal architecture, extending the component and pipeline-stage definitions already established at [Volume II, Section II.1.1.1, Section II.2.1.1]: an ingestion listener, an authentication and validation layer applying the untrusted-input discipline required at the client-to-collector trust boundary ([Volume II, Section II.1.1.5]), and a local queue ahead of handoff to Event Normalization ([Volume II, Section II.2.1.2]).

**Collector Deployment Models (VI.1.1.2).** Three models, extending the platform-level deployment models already specified at [Volume II, Section II.5.1] to Collector-specific granularity: Embedded (compiled directly into the game client or server process, lowest latency, the default for Local-First deployments per [Volume II, Section II.1.2.4]), Sidecar (a co-located separate process, typical in containerized Cloud deployments per [Volume II, Section II.5.3]), and Remote (a fully separate, network-reachable collector service, used where the client cannot host a collector directly — a web game, notably).

**Collector Configuration (VI.1.1.3).** Configurable parameters: buffering thresholds, batch sizes (coordinated with the SDK's own Batch Sender, [Section VI.2.2.3]), sampling rates for extremely high-volume event types where full capture is not necessary or affordable, and endpoint routing between Local-First and Cloud targets.

**Collector Health Monitoring (VI.1.1.4).** Extends the Health Checks already specified at [Volume II, Section II.7.5] to the Collector specifically: liveness and readiness probes plus ingestion-rate monitoring feeding the platform's existing observability stack, not a separately invented monitoring path.

- **REQ-TELEM-001 (MUST):** Every Collector deployment model MUST authenticate and validate incoming events per the untrusted-input discipline at [Volume II, Section II.1.1.5] before any event is queued for normalization.

### VI.1.2 Event Schema

**Event Envelope — Common Fields (VI.1.2.1).** Every event, regardless of type, carries the following envelope:

| Field | Purpose |
|---|---|
| a. Event ID | Unique identifier for this event instance |
| b. Event Type | Which catalog type ([Section VI.1.2.2]) this event belongs to |
| c. Timestamp (Client, Server) | Both client-observed and server-received timestamps, retained separately — the *difference* between them is itself diagnostic data for clock skew and network delay ([Volume II, failure mode #12, Section II.8.1]) |
| d. Player ID (Pseudonymized) | Never raw PII at this layer, per the Identity Model ([Section VI.3.1]) |
| e. Session ID | Links to the Session node ([Volume III, Section III.1.2], type #8) |
| f. Client Version | The SDK or game client version that produced the event, essential for schema-compatibility triage and bug diagnosis |
| g. Platform | PC, console, mobile, or web |
| h. Sequence Number | Per-session monotonic sequence, supporting Event Ordering and Deduplication ([Volume II, Section II.2.3.4]) |
| i. Schema Version | Which Event Schema version this event conforms to ([Section VI.1.2.5]) |

**Event Type Catalog (VI.1.2.2).** Seven standard categories:

| Category | Examples |
|---|---|
| a. Interaction Events | Click, Navigate, Dwell |
| b. Gameplay Events | Combat, Craft, Trade |
| c. Economy Events | Purchase, Earn, Spend |
| d. Social Events | Message, Trade, Group |
| e. Session Events | Login, Logout, AFK |
| f. UI Events | Menu Open, Settings Change |
| g. System Events | Error, Crash, Performance |

**Custom Event Extension (VI.1.2.3).** Extends the Domain Entity extensibility precedent already established at [Volume III, Section III.1.2] (type #17) to the telemetry layer: a studio registers custom event types conforming to the Envelope schema ([Section VI.1.2.1]) while extending the payload structure with game-specific data the seven standard categories don't capture.

**Event Schema Registry (VI.1.2.4).** Extends the Model Registry pattern already established at [Volume III, Section III.5.5.1]: every event type, standard or custom, is registered with its payload schema before the platform accepts events of that type.

**Schema Evolution and Backward Compatibility (VI.1.2.5).** Extends the additive-versioning discipline already required for Data Lake schemas ([Volume II, REQ-STOR-009]) to event schemas specifically: a schema change produces a new version; events under a prior version remain valid and interpretable under that version rather than being silently reinterpreted.

**Schema Validation Rules (VI.1.2.6).** The actual validation logic applied at ingestion (Event Normalization, [Volume II, Section II.2.1.2]): required-field presence, type checking, and Event Type validated against the live registry ([Section VI.1.2.4]) — an event failing any check does not proceed to normalization as though valid.

- **REQ-TELEM-002 (MUST):** An event type, standard or custom, MUST be registered with a payload schema ([Section VI.1.2.4]) before the platform accepts events of that type in production.
- **REQ-TELEM-003 (MUST):** A schema version change MUST be additive; events recorded under a prior schema version MUST remain valid and correctly interpretable under that version.

### VI.1.3 Event Normalization Layer

**Normalization Pipeline (VI.1.3.1).** The actual sequence executed at the Event Normalization stage ([Volume II, Section II.2.1.2]): schema validation ([Section VI.1.2.6]) → field mapping ([Section VI.1.3.2]) → unit standardization ([Section VI.1.3.3]) → time zone normalization ([Section VI.1.3.4]) → ID resolution ([Section VI.1.3.5]) → enrichment ([Section VI.1.3.6]) → output as a canonical Normalized Event.

**Field Mapping and Transformation Rules (VI.1.3.2).** Maps studio-specific or custom field names to the platform's canonical schema, using the Transformation DSL already established at [Volume II, Section II.2.4.1] rather than a separately invented mapping mechanism.

**Unit Standardization (VI.1.3.3).** Currency amounts, distances, and durations normalize to consistent canonical units — feeding Economy node properties ([Volume III, Section III.1.2], type #6) — regardless of what units a specific game client happened to report in natively.

**Time Zone Normalization (VI.1.3.4).** All timestamps normalize to UTC internally for canonical ordering and windowing purposes; the client-local timestamp is preserved separately per the Event Envelope ([Section VI.1.2.1.c]), not discarded, since the two together are what makes clock-skew detection possible.

**ID Resolution and Deduplication (VI.1.3.5).** The actual execution, at this layer, of player-identity resolution and duplicate-event detection already specified in principle at [Volume II, Section II.2.3.4] and [Volume III, Section III.1.5.3].

**Enrichment — Adding Derived Fields (VI.1.3.6).** Adds lightweight, event-level derived fields not present in the raw event — a geographic region derived from IP address at ingestion time, with the IP address itself then discarded per data-minimization practice. This is distinct from and lighter-weight than the full Feature Extraction pipeline stage ([Volume III, Part III.3]), which happens later and computes genuine behavioral features rather than simple per-event derived fields.

**Validation and Rejection Handling (VI.1.3.7).** Extends the Dead Letter Queue discipline already established at [Volume II, Section II.2.3.6]: an event failing normalization routes there, consistent with the platform's quarantine-not-drop standard rather than being silently discarded.

- **REQ-TELEM-004 (MUST):** Enrichment ([Section VI.1.3.6]) MUST discard source fields (such as raw IP address) once a privacy-minimizing derived field has been computed from them, unless the source field is independently required and retained under its own documented retention policy.
- **REQ-TELEM-005 (MUST):** An event failing normalization MUST route to the Dead Letter Queue per [Volume II, Section II.2.3.6]; it MUST NOT be silently dropped or force-normalized with fabricated field values.

### VI.1.4 Event Quality

**Completeness Checks (VI.1.4.1).** Ongoing monitoring of whether expected and required fields are present across the event stream — distinct from the per-event Schema Validation check ([Section VI.1.2.6]), this tracks completeness *rates* over time, surfacing a systematic drop before it becomes a per-event validation failure statistic nobody is watching in aggregate.

**Accuracy Checks (VI.1.4.2).** Extends Data Quality Gates ([Volume II, Section II.2.5]): whether field *values* are plausible, not merely present — a timestamp in the future, a negative currency amount where negative values are not a valid state, and similar implausibility signals.

**Timeliness Checks (VI.1.4.3).** Whether telemetry arrives within the latency budget already established at [Volume II, Section II.1.4.1]; a sudden latency spike is itself a quality signal worth monitoring independent of any single event's content.

**Consistency Checks (VI.1.4.4).** Internal consistency within a scope — a Session's events should be internally coherent; a Logout event preceding the corresponding Login for the same session is a consistency failure worth flagging regardless of whether either individual event passed its own schema validation.

**Quality Scoring (VI.1.4.5).** Aggregates Sections VI.1.4.1–4 into an overall quality score per source (per game-client version, per platform), feeding the Studio Tools data-quality view already established at [Volume II, Section II.2.3.6].

**Quality Dashboards and Alerts (VI.1.4.6).** Extends the platform's Observability Architecture ([Volume II, Part II.7]): quality scores and degradation surface as dashboard views and alerts, using the existing severity taxonomy rather than a separately invented telemetry-specific alerting path.

- **REQ-TELEM-006 (MUST):** Event quality metrics (VI.1.4.1–4) MUST be tracked per source (client version and platform), not only as an undifferentiated platform-wide aggregate, so a degradation specific to one client version or platform is detectable.
- **REQ-TELEM-007 (SHOULD):** A sustained drop in Quality Scoring (VI.1.4.5) for a specific source SHOULD trigger an alert per [Volume II, Section II.7.4]'s severity taxonomy, not only appear passively on a dashboard awaiting manual review.

---

*End of Part VI.1 — Telemetry Specification.*

*Cross-References:* [Volume II, Section II.1.1.1, Section II.1.1.5] (Telemetry Collector Component, Trust Boundaries), [Volume II, Section II.2.1.1–2] (Telemetry Collection, Event Normalization Pipeline Stages), [Volume II, Section II.2.3.4, Section II.2.3.6] (Ordering and Deduplication, Dead Letter Queue), [Volume II, Section II.2.4.1] (Transformation Pipeline Architecture), [Volume II, Section II.2.5] (Data Quality and Validation Gates), [Volume II, Section II.5.1, Section II.5.3] (Deployment Models, Kubernetes Architecture), [Volume II, Section II.7] (Observability Architecture), [Volume II, REQ-STOR-009] (Additive Schema Versioning), [Volume III, Section III.1.2] (Session and Economy Node Types), [Volume III, Section III.1.5.3] (Entity Resolution and Deduplication), [Volume III, Part III.3] (Feature Engineering Pipeline), [Volume III, Section III.5.5.1] (Model Registry), [Section VI.2.2.3] (SDK Batch Sender — forward reference), [Section VI.3.1] (Identity Model — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-TELEM-001 through REQ-TELEM-007.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 13, 2026

---

## Part VI.2 — SDK Architecture

Part VI.2 specifies the SDK studios actually integrate into their game clients — the software that turns the Telemetry Specification in Part VI.1 into something a developer can call from inside Unity, Unreal, or a browser. Section VI.2.1.4's Framework Agnostic principle is the architectural key to this whole Part: eight language surfaces are not eight independently maintained codebases, they are eight thin bindings over one shared core, which is what keeps this Part's scope from becoming eight times the maintenance burden it would otherwise be.

### VI.2.1 SDK Design Principles

**Local-First Integration (VI.2.1.1).** The SDK is the client-side instantiation of the platform's Local-First principle: it buffers and queues events locally ([Section VI.2.2.2]) and functions fully offline, syncing when connectivity allows, extending the Offline Buffering pattern already specified at [Volume II, Section II.4.3.3] and the Local-First deployment model at [Volume II, Section II.1.2.4].

**Minimal Performance Impact (VI.2.1.2).** The SDK must not meaningfully degrade game performance — frame rate or memory footprint — a concrete engineering constraint given the SDK runs inside the game process under the Embedded deployment model ([Section VI.1.1.2]). Every language implementation is held to the same performance budget (sub-millisecond overhead per recorded event, a bounded local-buffer memory footprint), not a per-language target that could quietly vary.

**Developer Ergonomics (VI.2.1.3).** The SDK's API is simple and intuitive to integrate correctly — ideally a single function call per recorded event ([Section VI.2.3.2]) — because integration errors at this layer become Event Quality problems ([Section VI.1.4]) at the source, and the cheapest place to prevent a quality defect is before a malformed event is ever sent, not after.

**Framework Agnostic (VI.2.1.4).** Core SDK logic — buffering, batching, sync — is implemented once, in the shared Rust core ([Section VI.2.4.4]), with thin per-language bindings for the other seven targets. The eight language implementations in Section VI.2.4 are not eight independently maintained codebases; they are eight bindings over one shared implementation, which is what makes consistent behavior across every engine and platform an architectural property rather than a coordination burden maintained by discipline alone.

**Type Safety (VI.2.1.5).** The event-recording API is strongly typed wherever the target language supports it, schema-validated at compile time where possible against the Event Schema Registry ([Section VI.1.2.4]) — catching a schema mismatch before an event is ever sent, not only at server-side validation ([Section VI.1.2.6]).

**Backward Compatibility Guarantees (VI.2.1.6).** An older SDK version continues to function against a newer platform version for a defined support window, per the versioning discipline in Section VI.2.5, so a studio is not forced into synchronized SDK-and-platform upgrades merely to keep telemetry flowing.

- **REQ-SDK-001 (MUST):** Core SDK logic (buffering, batching, sync) MUST be implemented once in the shared core; a per-language reimplementation of this logic MUST NOT be introduced without an ADR justifying the deviation from the Framework Agnostic principle.
- **REQ-SDK-002 (MUST):** Every language implementation MUST meet the same performance budget declared under Minimal Performance Impact (VI.2.1.2); a language-specific exception MUST be documented and justified, not silently tolerated.

### VI.2.2 SDK Components

**Event Recorder (VI.2.2.1).** The primary developer-facing component: captures an event and hands it to the Local Buffer ([Section VI.2.2.2]) — the single most frequently called component in the SDK's API surface.

**Local Buffer and Queue (VI.2.2.2).** The client-side queue implementation, extending Offline Buffering ([Volume II, Section II.4.3.3]) with a bounded size to prevent unbounded memory growth during an extended connectivity loss, and an eviction policy — oldest-first by default, or priority-scoped by event-type criticality — for when that bound is reached.

**Batch Sender (VI.2.2.3).** Transmits batched events to the Collector, applying the Batching and Compression discipline already specified at [Volume II, Section II.4.3.2] and respecting the Collector's own batch-size configuration ([Section VI.1.1.3]).

**Offline Storage and Sync (VI.2.2.4).** Persistent local storage — surviving an app restart, not memory-only — for events queued while offline, syncing on reconnect using the same idempotency-key deduplication already established at [Volume II, Section II.2.3.4].

**Configuration Manager (VI.2.2.5).** Manages SDK runtime configuration — endpoint, sampling rate, feature flags — distinct from Collector Configuration ([Section VI.1.1.3]) in that a client-side sampling rate reduces what is even *sent*, while a collector-side sampling rate would discard events already received; the two operate at different points in the pipeline and are configured independently.

**Identity Manager (VI.2.2.6).** Manages the player's pseudonymized identity client-side, extending the Identity Model ([Section VI.3.1]): generates and persists a stable pseudonymous ID across sessions.

**Privacy Controls (VI.2.2.7).** The client-side enforcement point for Consent Management ([Section VI.3.2]): when a player withdraws consent, this component is what actually stops the Event Recorder from capturing further events, or restricts capture to only consented categories per Granular Consent Options ([Section VI.3.2.5]). This is the concrete mechanism that makes a consent choice technically real at the point of capture, not merely a database flag checked somewhere downstream after data has already been collected.

**Debug and Validation Tools (VI.2.2.8).** Developer-facing tools within the SDK itself, extending Event Validation in Development ([Section VI.2.6.4]): a local schema check against the Event Schema Registry ([Section VI.1.2.4]) that catches malformed events before they ever leave the client, without requiring a round-trip to the actual server to discover the problem.

- **REQ-SDK-003 (MUST):** Privacy Controls (VI.2.2.7) MUST stop event capture at the client when consent is withdrawn; consent enforcement MUST NOT depend solely on server-side filtering of already-captured events.
- **REQ-SDK-004 (MUST):** The Local Buffer (VI.2.2.2) MUST enforce a bounded size with a defined eviction policy; unbounded local buffer growth during an extended offline period is prohibited.

### VI.2.3 SDK API Surface

**Initialization API (VI.2.3.1).** `initialize(config)` — establishes the Collector endpoint and loads the persisted Identity ([Section VI.2.2.6]).

**Event Recording API (VI.2.3.2).** `record(eventType, payload)` — the core call, designed to satisfy the single-call-per-event goal established under Developer Ergonomics ([Section VI.2.1.3]).

**Session Management API (VI.2.3.3).** `startSession()` / `endSession()` — explicit session boundary management, feeding the Session ID ([Section VI.1.2.1.e]) into every event recorded during that session.

**Player Identification API (VI.2.3.4).** `identify(playerId)` — links the SDK's local pseudonymous ID to a studio-side player identifier via the Identity Mapping mechanism ([Section VI.3.1.3], forward reference).

**Configuration API (VI.2.3.5).** `configure(...)` — runtime configuration changes distinct from Initialization, allowing sampling or feature-flag adjustment without a full SDK re-initialization.

**Privacy Control API (VI.2.3.6).** `setConsent(...)` / `withdrawConsent()` — the developer-facing hook into Privacy Controls ([Section VI.2.2.7]), letting a game's own consent UI propagate a player's actual choice into the SDK immediately.

**Flush and Shutdown API (VI.2.3.7).** `flush()` / `shutdown()` — ensures buffered events ([Section VI.2.2.2]) are sent before the application closes, preventing loss of a session's final moments of telemetry, which is otherwise a common and easily overlooked data-loss point.

**Callback and Hook System (VI.2.3.8).** Registerable callbacks for SDK lifecycle events — batch sent successfully, validation error encountered — supporting the Debug and Validation Tools ([Section VI.2.2.8]) and general integration debugging.

- **REQ-SDK-005 (MUST):** The SDK MUST expose a Flush API (VI.2.3.7) and game integrations MUST be documented to call it on application shutdown; buffered-but-unflushed events at process termination are a preventable data-loss condition.

### VI.2.4 SDK Language Implementations

Eight language surfaces, each a binding over the shared Rust core (Section VI.2.1.4) except the core itself:

| Language | Target Engine/Platform | Distribution | Notes |
|---|---|---|---|
| C++ | Unreal Engine | Unreal Marketplace plugin / source integration | FFI binding to the Rust core |
| C# | Unity | Unity Asset Store package / UPM | FFI/P-Invoke binding to the Rust core |
| JavaScript/TypeScript | Web games | npm package | WASM-compiled core for browser environments |
| Rust | Native/Core | crates.io, internal | The shared core implementation every other binding wraps |
| Python | Server-side / Tooling | PyPI package | Backend integration and internal tooling, not client-embedded |
| Go | Server-side | Go module | Server-side integration, a role similar to Python |
| Java | Android / Server | Maven/Gradle package | Android client binding plus JVM server-side use |
| Swift | iOS | Swift Package Manager | iOS client binding |

- **REQ-SDK-006 (MUST):** A new language binding MUST wrap the shared Rust core rather than reimplementing buffering, batching, or sync logic independently, per [REQ-SDK-001].

### VI.2.5 SDK Versioning and Lifecycle

**Semantic Versioning Policy (VI.2.5.1).** Standard semantic versioning (major.minor.patch) — major for a breaking API change, minor for a backward-compatible new capability, patch for a bugfix — applied uniformly across all eight language implementations, so a given version number carries the same compatibility guarantee regardless of which binding a studio uses.

**Deprecation Policy (VI.2.5.2).** A deprecated API surface remains functional for a minimum notice period before removal, with deprecation warnings surfaced through the Debug and Validation Tools ([Section VI.2.2.8]) rather than only in changelog text a developer might not read.

**Migration Guides (VI.2.5.3).** Published for every major version bump, with the automated counterpart specified in Migration Tools ([Section VI.2.6.6]).

**Breaking Change Management (VI.2.5.4).** Extends the API versioning discipline already established at [Volume II, Section II.4.4.2]: a breaking change ships as a new major version alongside the prior one for the deprecation window, never as an in-place modification to an existing version.

**Long-Term Support Versions (VI.2.5.5).** Designated LTS versions receive security and critical-bugfix patches for an extended window beyond standard support, giving studios with slower upgrade cycles a stable target rather than forcing continuous upgrade to stay supported.

- **REQ-SDK-007 (MUST):** A breaking SDK change MUST ship as a new major version alongside the prior one for the deprecation window specified in VI.2.5.2; an in-place breaking change to an existing version is prohibited.

### VI.2.6 SDK Developer Experience

**Onboarding Guide (VI.2.6.1).** The developer-facing documentation entry point for SDK integration.

**Quick Start Templates (VI.2.6.2).** Starter project templates per engine and language target ([Section VI.2.4]) demonstrating minimal correct integration.

**Integration Samples (VI.2.6.3).** Fuller example integrations per engine or framework, showing realistic usage patterns beyond the minimal quick-start.

**Event Validation in Development (VI.2.6.4).** A development-mode-only feature, disabled in production builds to preserve the performance budget ([Section VI.2.1.2]), that validates events against the schema registry locally and surfaces warnings immediately in the developer's own environment rather than only after events reach the server.

**Debug Dashboard (VI.2.6.5).** A local, developer-facing dashboard — distinct from the Studio Tools production dashboard ([Volume II, Part VII.4], forward reference) — showing real-time event flow during development and testing.

**Migration Tools (VI.2.6.6).** Automated tooling assisting a studio's upgrade across major SDK versions, the automated counterpart to the Migration Guides ([Section VI.2.5.3]) — for example, codemod-style automated find-and-replace for renamed API calls.

- **REQ-SDK-008 (MUST):** Event Validation in Development (VI.2.6.4) MUST be compiled out of or disabled in production builds; it MUST NOT contribute to the production performance budget established at [Section VI.2.1.2].

---

*End of Part VI.2 — SDK Architecture.*

*Cross-References:* [Volume II, Section II.1.2.4] (Local-First Architecture Pattern), [Volume II, Section II.2.3.4] (Event Ordering and Deduplication), [Volume II, Section II.4.3.2–3] (Batching and Compression, Offline Buffering), [Volume II, Section II.4.4.2] (API Versioning), [Volume II, Part VII.4] (Studio Tools — forward reference), [Section VI.1.1.2–3] (Collector Deployment Models, Collector Configuration), [Section VI.1.2.1, Section VI.1.2.4, Section VI.1.2.6] (Event Envelope, Schema Registry, Validation Rules), [Section VI.1.4] (Event Quality), [Section VI.3.1–2] (Identity Model, Consent Management — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-SDK-001 through REQ-SDK-008.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 13, 2026

---

## Part VI.3 — Identity and Privacy

Part VI.3 is where every pseudonymization and deletion claim made throughout this specification — Volume II's Right-to-Be-Forgotten, Volume III's Player Model Privacy, Volume V's Player Model Query Tool scoping — gets its actual generating architecture. Section VI.3.5, Minor Protections, carries this Part's most weight: it converts Volume I's Vulnerable Population Protections from a stated commitment into hard, non-configurable platform restrictions a studio cannot consent, override, or configure its way around.

### VI.3.1 Identity Model

**Player Identity Architecture (VI.3.1.1).** A Player is represented internally by a PsyForge pseudonymous ID (feeding the Player node, [Volume III, Section III.1.2], type #1) — never by the studio's own raw player-identifying data (email, real name, studio account ID) directly. This is the generating architecture behind every "never directly identifying at this layer" claim already asserted elsewhere — the Event Envelope's pseudonymized Player ID field ([Section VI.1.2.1.d]), Player Model pseudonymization ([Volume III, Section III.5.4.1]) — those claims are true because this Section's architecture makes them true, not merely by policy.

**Pseudonymization Strategy (VI.3.1.2).** A one-way, salted transformation (technology-neutral) of the studio-provided player identifier generates the stable PsyForge ID. "One-way" is the operative word: the platform's internal ID is not trivially reversible back to the studio's identifier without the separate, access-controlled Identity Mapping store ([Section VI.3.1.3]).

**Identity Mapping — Studio ID to PsyForge ID (VI.3.1.3).** A separate, access-controlled store linking a studio's own player ID to the platform's pseudonymous ID, populated through the Player Identification API ([Section VI.2.3.4]). This mapping store is the *only* place re-identification is possible, and it is deliberately isolated from the rest of the platform's behavioral data — most platform processes (agents, models, Simulation) never need and never receive access to it; only specific identity-resolution processes do.

**Cross-Game Identity — When Permitted (VI.3.1.4).** For a studio or publisher running multiple games, an optional, explicitly consented linkage allows a player's identity to be recognized across titles — for a cross-game loyalty program, for instance. Opt-in, never default, consistent with the never-synced-by-default posture already established for Local-First data residency ([Volume II, Section II.5.5.5]) applied here to cross-game linkage specifically.

**Anonymous Sessions (VI.3.1.5).** Sessions where no player identity is established at all — a guest or trial session before account creation, or a player who has declined identification. The platform still processes telemetry, subject to Consent Management ([Section VI.3.2]), but with no persistent Player node linkage across sessions; each anonymous session is its own ephemeral, unlinked record.

- **REQ-PRIVACY-001 (MUST):** The Identity Mapping store (VI.3.1.3) MUST be access-controlled separately from the platform's general behavioral data stores; agents, models, and Simulation processes MUST NOT hold default access to it.
- **REQ-PRIVACY-002 (MUST):** Cross-Game Identity linkage (VI.3.1.4) MUST require explicit, separate consent; it MUST NOT be enabled by default or bundled into general telemetry consent.

### VI.3.2 Consent Management

**Consent Capture Mechanism (VI.3.2.1).** The touchpoint where a player's consent is captured, exposed through the Privacy Control API ([Section VI.2.3.6]). Presenting the actual consent UI is explicitly the studio's responsibility — the platform provides the API and enforcement mechanism, not the interface itself, the same division of labor a payment processor has with a merchant's checkout page.

**Consent States — Granted, Withdrawn, Partial (VI.3.2.2).** Three states, with Partial supporting the Granular Consent Options specified in Section VI.3.2.5 — a player might consent to gameplay telemetry while declining cross-game identity linkage ([Section VI.3.1.4]), for instance.

**Consent-to-Data-Flow Enforcement (VI.3.2.3).** The mechanism connecting a consent state to actual pipeline behavior operates at two points, not one: the client-side Privacy Controls ([Section VI.2.2.7]) stop capture at the source, and a server-side enforcement layer handles the case where consent changes *after* data has already been collected under a prior state, requiring retroactive enforcement against already-stored data as well as future capture.

**Consent Audit Trail (VI.3.2.4).** Extends the platform's general audit-trail discipline ([Volume I, Section I.5.2.5]) to consent specifically: every grant, withdrawal, or change is logged immutably, providing the evidence a studio needs to demonstrate compliance if audited.

**Granular Consent Options (VI.3.2.5).** Extends the Event Type Catalog's seven categories ([Section VI.1.2.2]): consent can be granted or withdrawn per category — Gameplay Events but not Social Events, for example — rather than only through a single all-or-nothing toggle, supporting genuinely informed, specific consent.

- **REQ-PRIVACY-003 (MUST):** Consent-to-Data-Flow Enforcement MUST operate at both the client (Section VI.2.2.7) and server layers; server-side enforcement MUST retroactively apply a consent withdrawal to already-collected data, not only to future capture.
- **REQ-PRIVACY-004 (MUST):** Every consent state change MUST be logged to an immutable audit trail (VI.3.2.4) before the change takes effect in the data pipeline.

### VI.3.3 Data Subject Rights

**Right to Access — DSAR (VI.3.3.1).** A player may request a copy of all data the platform holds about them. The Lineage Query API already specified at [Volume II, Section II.2.2.3] is the technical enabler: the same backward-lineage capability built for Recommendation rationale inspection also serves DSAR fulfillment, tracing every artifact connected to a given Player ID.

**Right to Deletion — Right to Be Forgotten (VI.3.3.2).** This Section is the SDK and identity-layer entry point into the full mechanism already specified at [Volume II, Section II.3.3.6] and [Volume III, Section III.5.4.3]: a deletion request arrives, the Identity Mapping ([Section VI.3.1.3]) resolves which PsyForge ID it corresponds to, and the full cross-store purge already specified elsewhere triggers from there.

**Right to Data Portability (VI.3.3.3).** A player's data is provided in a machine-readable, transferable format ([Section VI.5.3.2], forward reference) — distinct from the Access right in that portability specifically supports moving data to another provider, not only viewing it.

**Right to Rectification (VI.3.3.4).** A player may request correction of inaccurate data. This applies most directly to observed, factual data — a raw event genuinely misrecorded. An *inferred* conclusion a player disputes (an Emotion or Motivation node's state) is handled differently: as a confidence and evidence reassessment trigger, per the confidence discipline already established at [Volume III, Section III.1.4.5], rather than as a simple factual correction — an inference is not "wrong" in the same sense a misrecorded fact is, and treating it identically would misrepresent what kind of claim it is.

**Right to Object to Processing (VI.3.3.5).** A player may object to a specific processing use — being included in Simulation persona-training data ([Volume IV, Section IV.2.1.2]), for instance — without requesting full deletion. A narrower right than deletion: opting out of one specific use while remaining otherwise in the system.

**DSAR Workflow and Automation (VI.3.3.6).** Request intake → identity verification (confirming the requester is genuinely the player in question, an anti-fraud safeguard) → automated data compilation using the lineage-query mechanism (Section VI.3.3.1) → response within the legally required window (jurisdiction-specific deadlines, cross-referencing [Volume IX], forward reference).

**Deletion Propagation — All Stores, Models, Embeddings, Graph (VI.3.3.7).** The single consolidated checklist confirming every store touched by a Player ID is covered by a deletion request: Data Lake purge ([Volume II, Section II.3.3.6]), Player Model deletion ([Volume III, Section III.5.4.3]), embedding deletion (cascading from Player Model deletion), and graph node/edge anonymization where an audit obligation conflicts with full deletion (the anonymize-not-delete resolution already established at [Volume II, Section II.3.3.6]). This Section exists specifically to close any gap that could otherwise exist from each store's deletion mechanism having been specified independently, in different Volumes, by different Parts — the consolidation itself is the safeguard.

- **REQ-PRIVACY-005 (MUST):** A deletion request MUST propagate to every store enumerated in VI.3.3.7 — Data Lake, Player Model, embeddings, and graph — within the same request, not as separately triggered, independently timed purges.
- **REQ-PRIVACY-006 (MUST):** An inferred conclusion (Emotion, Motivation, or similar) disputed under Right to Rectification MUST trigger a confidence and evidence reassessment (VI.3.3.4); it MUST NOT be silently altered as though it were a misrecorded fact.
- **REQ-PRIVACY-007 (MUST):** DSAR identity verification (VI.3.3.6) MUST occur before data compilation begins; a request MUST NOT be fulfilled without confirming the requester's identity.

### VI.3.4 Data Retention

**Retention Policy by Data Type (VI.3.4.1).** Restates the retention windows already established by Data Lifecycle Management and zone-specific retention ([Volume II, Section II.3.1.3, Section II.3.3.5]) from the privacy and data-minimization justification specifically — the same mechanism, but grounded here in why retention should be bounded for privacy reasons, alongside the storage-cost justification Volume II already gave it.

**Retention by Consent Scope (VI.3.4.2).** Retention windows can vary by what was actually consented to, per Granular Consent Options ([Section VI.3.2.5]) — data collected under a narrower consent scope may carry a shorter default retention than data collected under broader consent, reflecting the different risk profile each represents.

**Automated Retention Enforcement (VI.3.4.3).** Extends the automated tiering already established at [Volume II, Section II.3.1.3]: purge or anonymization triggers automatically when a retention window expires, without requiring manual intervention per record.

**Legal Hold Exception (VI.3.4.4).** A distinct exception category from the audit-retention exception already established at [Volume II, Section II.3.3.5]: active litigation or a regulatory investigation can override standard retention and deletion, triggered and authorized by legal counsel specifically, not the Ethics Board — the two exception categories exist for different reasons and are invoked by different authorities.

**Retention Audit (VI.3.4.5).** Periodic verification that Automated Retention Enforcement (Section VI.3.4.3) is actually functioning as specified, extending the "verify, don't just implement" discipline already established for disaster recovery testing ([Volume II, Section II.8.3.4]): an untested retention policy is an unverified claim, held to the same standard as everywhere else in this specification.

- **REQ-PRIVACY-008 (MUST):** Automated Retention Enforcement (VI.3.4.3) MUST be periodically audited (VI.3.4.5) against its specified behavior; a retention policy that has never been verified to actually execute MUST NOT be represented as compliant.
- **REQ-PRIVACY-009 (MUST):** A Legal Hold (VI.3.4.4) MUST be authorized by legal counsel, distinct from and not substitutable for Ethics Board audit-retention authority.

### VI.3.5 Minor Protections

**Age Verification Approach (VI.3.5.1).** The platform does not itself perform robust age verification — that responsibility typically sits with the studio or platform storefront (an app-store age gate, for instance) — and instead consumes whatever age signal the studio provides. Where no reliable signal is provided, the platform defaults to minor protections applied, per the conservative default already established at [Volume I, REQ-ETH-014]: unverifiable age is treated as a minor, not as an adult by default.

**Enhanced Consent for Minors (VI.3.5.2).** For a player flagged as a minor, Consent Capture ([Section VI.3.2.1]) requires the enhanced flow — parental or guardian consent where legally required, age-appropriate consent language — rather than the standard adult consent flow.

**Data Collection Restrictions for Minors (VI.3.5.3).** Certain data categories are not collected for minors even where consent has been granted — extending the Inferential Privacy prohibition already established at [Volume III, Section III.5.4.4]: no Cross-Game Identity linkage ([Section VI.3.1.4]) for a minor regardless of consent, no external marketing-campaign-data enrichment ([Section VI.5.1.3], forward reference) for a minor. These are hard restrictions, not consent-gateable, mirroring the non-configurable-floor pattern already established for the Ethics Layer at [Volume II, REQ-ARCH-033] — a studio cannot obtain parental consent to re-enable a restriction this Section places on minors specifically.

**COPPA Compliance (VI.3.5.4).** Specifies the platform's technical requirements under the US Children's Online Privacy Protection Act specifically: verifiable parental consent mechanisms, restricted data collection, and no behavioral advertising directed at minors. COPPA is named explicitly as one jurisdiction's framework among several the platform must address — GDPR-K, the UK Age Appropriate Design Code, and other regimes carry their own distinct requirements, treated in full at [Volume IX], forward reference; this Section does not claim COPPA compliance alone satisfies every jurisdiction's minor-protection law. The Regulatory Compliance Database ([Volume V, Section V.11.3.4]) is the mechanism that keeps this Section's requirements current as law evolves.

**Behavioral Modeling Restrictions for Minors (VI.3.5.5).** The most consequential Section in this Part: restricts what behavioral modeling, simulation, and recommendation activity is *permitted* for a minor player, beyond data collection restrictions alone — extending the Vulnerable Population Protections and Manipulation Boundary's heightened scrutiny for minors already established at [Volume I, Section I.5.1.3–4]. Concretely and without exception: the Monetization Advisor ([Volume V, Part V.10]) MUST NOT produce Recommendations targeting a minor-flagged population; monetization mechanics MUST NOT be A/B tested ([Volume IV, Part IV.6]) against minors; and Simulation personas representing minors are excluded from Evolutionary Search's Novel Mechanic Generation ([Volume IV, Section IV.8.2.2]) for any monetization-related optimization. These are hard platform-level restrictions a studio cannot configure away — the non-configurable-floor pattern applied at the highest stakes this specification addresses.

- **REQ-PRIVACY-010 (MUST):** Data Collection Restrictions for Minors (VI.3.5.3) MUST NOT be reconfigurable by studio settings or overridable by parental consent; these are platform-enforced floors, not defaults.
- **REQ-PRIVACY-011 (MUST):** The Monetization Advisor Agent MUST NOT produce a Recommendation targeting a population flagged as minors; this restriction MUST be enforced at the Recommendation Gate independent of the agent's own behavior, mirroring the backend-independent guard pattern at [Volume II, REQ-FLOW-016].
- **REQ-PRIVACY-012 (MUST):** Monetization mechanics MUST NOT be included in an A/B test whose population includes minor-flagged players; Experiment Design (Section V.12.1.1) MUST exclude minor-flagged personas from any monetization-related experiment arm.
- **REQ-PRIVACY-013 (MUST):** Evolutionary Search's Novel Mechanic Generation MUST exclude minor-representing personas from monetization-related optimization objectives, per [Volume IV, Section IV.8.2.2].

---

*End of Part VI.3 — Identity and Privacy.*

*Cross-References:* [Volume I, Section I.5.1.3–4] (Manipulation Boundary, Vulnerable Population Protections), [Volume I, Section I.5.2.5] (Audit and Evidence Trail), [Volume I, REQ-ETH-014] (Unverifiable Age as Minor Default), [Volume II, Section II.2.2.3] (Lineage Query API), [Volume II, Section II.3.1.3, Section II.3.3.5–6] (Data Lifecycle, Retention by Zone, Right-to-Be-Forgotten), [Volume II, Section II.5.5.5] (Data Residency on Local Machine), [Volume II, Section II.8.3.4] (Disaster Recovery Testing), [Volume II, REQ-ARCH-033, REQ-FLOW-016] (Non-Configurable Ethics Floor, Gate Guard Enforcement), [Volume III, Section III.1.2] (Player Node Type), [Volume III, Section III.1.4.5] (Confidence and Provenance), [Volume III, Section III.5.4.3–4] (Model Deletion, Inferential Privacy), [Volume IV, Section IV.2.1.2] (Persona Sourcing), [Volume IV, Section IV.8.2.2] (Novel Mechanic Generation), [Volume IV, Part IV.6] (Experimentation Framework), [Volume V, Section V.11.3.4] (Regulatory Compliance Database Access), [Volume V, Part V.10] (Monetization Advisor Agent), [Volume V, Section V.12.1.1] (Experiment Design from Recommendations), [Volume IX] (Security and Compliance — forward reference), [Section VI.2.2.7, Section VI.2.3.4, Section VI.2.3.6] (Privacy Controls, Player Identification API, Privacy Control API), [Section VI.1.2.2] (Event Type Catalog), [Section VI.5.1.3, Section VI.5.3.2] (Marketing Campaign Data, Export Formats — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-PRIVACY-001 through REQ-PRIVACY-013.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 13, 2026

---

## Part VI.4 — Streaming Architecture

Part VI.4 specifies the actual stream-processing technology underneath the real-time pipeline stages already established at [Volume II, Section II.2.3.2–3]. Section VI.4.1.5 resolves an architectural ambiguity those earlier sections left open: given the platform already supports event replay ([Volume II, Section II.4.5.5]), it commits to a Kappa-style, stream-first architecture rather than maintaining a separate Lambda-style batch path.

### VI.4.1 Real-Time Event Streaming

**Stream Processing Framework (VI.4.1.1).** Selection criteria for the underlying stream-processing framework (a Flink- or Kafka-Streams-class processor, named illustratively): stateful processing support, exactly-once semantics preferred, and native windowing support — criteria, not a restatement of the event-flow-pattern behavior already specified at [Volume II, Section II.2.3.2–3].

**Stream Topology Design (VI.4.1.2).** The literal source-operators-sink topology implementing the logical Normalization Pipeline already specified at [Section VI.1.3.1]: Normalization → Feature Extraction → Enrichment as an actual stream-processing DAG, not only a described sequence.

**Windowing Strategy (VI.4.1.3).** Maps to the Feature Windowing tiers already established at [Volume III, Section III.3.3.4]: Tumbling windows (fixed, non-overlapping periods) suit the standard short and medium windows; Sliding windows (overlapping, continuous) suit trend-sensitive features; Session windows (bounded by session activity) are the natural fit for session-level features specifically.

**Watermarking and Late Event Handling (VI.4.1.4).** Watermarks track how far the stream processor has progressed relative to event-time, distinct from processing-time, handling events that arrive late — due to Offline Storage and Sync ([Section VI.2.2.4]) or network delay — after their window has notionally closed. A grace period precedes window finalization; events arriving after that grace period route to batch reconciliation rather than being silently dropped or forcing an already-finalized window to reopen indefinitely.

**Stream-to-Batch Architecture — Kappa (VI.4.1.5).** The platform adopts a Kappa-style architecture — a single stream-first pipeline with batch reprocessing performed via event replay ([Volume II, Section II.4.5.5]) — rather than a Lambda-style architecture maintaining separate stream and batch pipelines reconciled after the fact. This is stated explicitly because the real-time/batch split described generally at [Volume II, Section II.2.3.2] left the underlying architectural pattern unresolved; replay-based reprocessing is the specific mechanism that makes Kappa viable here, so the platform does not carry the dual-pipeline complexity and reconciliation risk Lambda architectures are known for.

- **REQ-STREAM-001 (MUST):** The platform MUST use event replay ([Volume II, Section II.4.5.5]) for batch reprocessing rather than maintaining a separate batch pipeline computing the same features independently; a dual-pipeline Lambda-style implementation MUST NOT be introduced without an ADR justifying the deviation from VI.4.1.5.
- **REQ-STREAM-002 (MUST):** A late-arriving event past its window's grace period MUST route to batch reconciliation, not be silently dropped or force an indefinite window reopen.

### VI.4.2 Real-Time Feature Computation

**Streaming Feature Definitions (VI.4.2.1).** A feature is eligible for streaming computation, per the Feature Definition Language already established at [Volume III, Section III.3.3.1], only when its windowing requirement ([Section VI.4.1.3]) and aggregation function are incrementally computable — a feature requiring a non-incremental, full-history recomputation each time remains batch-only regardless of how useful streaming computation would otherwise be.

**Stateful Stream Processing (VI.4.2.2).** The actual state management for streaming feature computation: a running per-player aggregate maintained across events without reloading full history each time — distinct from Feature Caching ([Volume II, Section II.3.8]), which caches post-computation values, whereas this Section's state is the in-flight computation state a streaming aggregate depends on while it is still accumulating.

**Feature Freshness Guarantees (VI.4.2.3).** An explicit, measurable freshness bound — a streaming-computed feature reflects events up to a stated number of seconds old — extending the real-time latency target already established at [Volume II, Section II.1.4.1] into a concrete, feature-level SLA rather than an implied "real-time" claim with no stated bound.

**Fallback to Batch Features (VI.4.2.4).** When streaming computation fails or lags beyond the Freshness Guarantee (Section VI.4.2.3), the platform falls back to the last valid batch-computed feature value rather than serving a broken or absent one — extending the Graceful Degradation pattern already established at [Volume II, Section II.8.2.5]. Features are not a tier-1 component, so graceful degradation is the correct response here, in deliberate contrast to the Ethics Layer's fail-closed requirement, which governs a different, higher-stakes class of component.

- **REQ-STREAM-003 (MUST):** A feature's eligibility for streaming computation MUST be determined by whether its aggregation is incrementally computable (VI.4.2.1); a non-incremental feature MUST NOT be forced into the streaming path.
- **REQ-STREAM-004 (MUST):** Feature Freshness Guarantees MUST be stated as an explicit, measurable bound per feature; an undocumented or implied freshness claim MUST NOT be presented to a consumer as an SLA.

### VI.4.3 Real-Time Alerts

**Alert Rule Definition (VI.4.3.1).** Extends Alert Rule Design ([Volume II, Section II.7.4.1]) with rules that trigger from streaming data specifically — a real-time spike in error events, or an emerging safety-relevant pattern detected in-stream per the Pattern-Triggered Alerts already established at [Volume III, Section III.6.3.3] — distinct from the batch-oriented alerting Volume II's general Alert Rule Design already covers.

**Alert Triggering from Stream (VI.4.3.2).** A streaming rule evaluates continuously against the live event stream, not on a periodic batch query, triggering immediately when its condition is met — the lower latency this enables is precisely why the safety-relevant, time-sensitive cases already flagged at [Volume III, Section III.6.3.3] route through streaming detection rather than waiting on the standard batch-alerting cadence.

**Alert Deduplication and Suppression (VI.4.3.3).** A streaming rule evaluated continuously against a sustained condition could otherwise fire once per triggering event rather than once per incident; deduplication collapses repeated triggers of the same underlying condition into a single alert, and suppression prevents an already-acknowledged alert from re-firing — extending Alert Fatigue Management ([Volume II, Section II.7.4.5]) to address the specific re-fire risk continuous stream evaluation introduces.

**Alert Routing (VI.4.3.4).** Streaming-triggered alerts route through the same severity taxonomy and escalation rules already established at [Volume II, Section II.7.4.3]; this Part does not introduce a separate, streaming-specific alerting path.

- **REQ-STREAM-005 (MUST):** A streaming alert rule MUST deduplicate repeated triggers of the same sustained condition into a single incident-level alert, per VI.4.3.3; per-event re-firing for an ongoing condition is prohibited.
- **REQ-STREAM-006 (MUST):** Streaming-triggered alerts MUST use the severity taxonomy and routing already established at [Volume II, Section II.7.4.2–3]; a separate streaming-specific severity scale MUST NOT be introduced.

---

*End of Part VI.4 — Streaming Architecture.*

*Cross-References:* [Volume II, Section II.1.4.1] (Performance Targets), [Volume II, Section II.2.3.2–3] (Real-Time vs. Batch, Stream Processing Architecture), [Volume II, Section II.3.8] (Caching Layer), [Volume II, Section II.4.5.5] (Event Replay and Time Travel), [Volume II, Section II.7.4.1–3, Section II.7.4.5] (Alert Rule Design, Severity Levels, Routing, Alert Fatigue Management), [Volume II, Section II.8.2.5] (Fallback and Graceful Degradation), [Volume III, Section III.3.3.1, Section III.3.3.4] (Feature Definition Language, Feature Windowing), [Volume III, Section III.6.3.3] (Pattern-Triggered Alerts), [Section VI.1.3.1] (Normalization Pipeline), [Section VI.2.2.4] (Offline Storage and Sync), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-STREAM-001 through REQ-STREAM-006.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 13, 2026

---

## Part VI.5 — Data Integration

Part VI.5 closes Volume VI by specifying the connectors that bring external studio data in and the export path that sends platform data back out. Section VI.5.3.3, Export Privacy Filtering, is this Part's load-bearing safeguard: an export is a data flow like any other, and it does not get to skip the consent and minor-protection discipline already established at [Part VI.3] merely because a studio's own team is the one requesting it.

### VI.5.1 External Data Sources

**CRM Integration (VI.5.1.1).** Connects to a studio's customer relationship management system, feeding the External Data Enrichment mechanism already established at [Volume II, Section II.2.4.2] — pulling player-adjacent business context (support tier, account status) as enrichment rather than a separately invented ingestion path.

**Customer Support Data (VI.5.1.2).** Pulls support ticket history and sentiment — a rich signal of player frustration or satisfaction that gameplay telemetry alone does not capture, feeding both Satisfaction Prediction ([Volume III, Section III.5.3]) and the Psychologist Agent's interpretive work ([Volume V, Part V.4]).

**Marketing Campaign Data (VI.5.1.3).** Pulls campaign exposure and attribution data, informing Marketing Science domain reasoning ([Volume III, Section III.2.9]) and the Monetization Advisor's conversion-funnel work — this is the same marketing-campaign-data category already named as restricted for minors at [Section VI.3.5.3].

**Platform Analytics — Steam, Console, Mobile (VI.5.1.4).** Pulls platform-native analytics (storefront playtime and achievement data, console platform analytics, mobile app-store analytics) as a data source complementary to the platform's own SDK telemetry — useful for pre-integration historical baselines and for cross-validating SDK-collected data against an independent source.

**Social Media Signals (VI.5.1.5).** Pulls public, aggregate social media signals — sentiment about the game, community discussion volume — feeding Community Health Forecasting ([Volume IV, Section IV.4.2.1]) and the Social Dynamics domain ([Volume III, Section III.2.7]). This is explicitly public and aggregate signal only; it MUST NOT extend to individual, player-linked social media monitoring, a privacy boundary stated directly here because the line between aggregate community sentiment and individual surveillance is exactly the kind of boundary that erodes quietly if it isn't stated as a hard limit.

**External Survey and Feedback Data (VI.5.1.6).** Player survey responses, NPS scores, and feedback forms — direct, self-reported data, valuable as a ground-truth check against the platform's *inferred* Satisfaction Prediction ([Volume III, Section III.5.3.5]). Self-reported survey data is one of the few genuinely observed-tier signals available for a subjective state like satisfaction, per the epistemic-tier discipline already established at [Volume I, REQ-PHI-001] — worth noting explicitly, since most of what the platform calls "satisfaction" elsewhere is inferred, not observed.

- **REQ-INTEG-001 (MUST):** Social Media Signals (VI.5.1.5) MUST be limited to public, aggregate data; individual player-linked social media monitoring MUST NOT be introduced through this connector without a separate, explicit specification and consent basis.

### VI.5.2 Data Import Pipeline

**Connector Framework (VI.5.2.1).** A plugin-style connector architecture, extending the extensibility pattern already established at [Volume II, Section II.1.4.4]: each external source type ([Section VI.5.1]) implements a standard Connector interface rather than being integrated through bespoke, one-off code per source.

**Data Mapping and Transformation (VI.5.2.2).** External source data maps into the platform's canonical schema through the same Transformation DSL already established at [Volume II, Section II.2.4.1] — not a separately invented mapping mechanism specific to external data.

**Import Scheduling (VI.5.2.3).** External data typically imports on a schedule (a daily CRM sync, for instance), distinct from telemetry's real-time or near-real-time flow, using the async job-flow patterns already established at [Volume II, Part II.2.8].

**Import Validation (VI.5.2.4).** Extends Data Quality Gates ([Volume II, Section II.2.5]) to external-source data specifically: external data is held to the same validation discipline as internal telemetry, not exempted because it originates from a system the studio otherwise trusts — an external CRM or analytics platform is just as capable of schema drift and data quality defects as any internal source.

**Error Handling and Retry (VI.5.2.5).** Extends the Retry and Timeout Policies already established at [Volume II, Section II.4.2.5] to external connector calls specifically, which are especially prone to transient failure — rate limits, downtime — given they depend on third-party systems entirely outside the platform's own control.

- **REQ-INTEG-002 (MUST):** External-source data MUST pass the same Import Validation discipline as internal telemetry (VI.5.2.4); a source being externally operated MUST NOT exempt its data from quality gating.

### VI.5.3 Data Export

**Export API (VI.5.3.1).** Covers bulk, analytical export specifically — distinct from the per-record query APIs Volume VII specifies for the Recommendation, Feature, and Player Model surfaces ([Volume VII, Part VII.5], forward reference) — serving a studio's own data engineering team pulling platform data for external analysis.

**Export Formats (VI.5.3.2).** JSON, CSV, and Parquet — standard interchange formats directly serving the Right to Data Portability already established at [Section VI.3.3.3], alongside general studio-side data engineering needs.

**Export Privacy Filtering (VI.5.3.3).** Every export passes through the same privacy, pseudonymization, and consent-scoping discipline already established at [Part VI.3] *before* leaving the platform. An export is itself a data flow subject to Consent-to-Data-Flow Enforcement ([Section VI.3.2.3]), and filtering happens at export time, as the platform's own responsibility — it is not left to the receiving studio to apply correctly after the fact. The platform does not export data a consent state or a minor-protection restriction ([Section VI.3.5.3]) would prohibit, regardless of who is requesting the export or for what internal purpose.

**Export Rate Limiting (VI.5.3.4).** Extends Rate Limiting ([Volume II, Section II.4.4.3]) to bulk export specifically, preventing a large export request from degrading platform performance for other tenants — the same multi-tenant protection concern already established for Hot Partition Mitigation ([Volume II, Section II.6.2.4]).

- **REQ-INTEG-003 (MUST):** Export Privacy Filtering MUST be enforced by the platform at export time; a studio's own downstream handling MUST NOT be relied upon as the sole safeguard against exporting consent-prohibited or minor-restricted data.
- **REQ-INTEG-004 (MUST):** A bulk export request MUST be rate-limited per [Volume II, Section II.4.4.3] to prevent degradation of platform performance for other tenants.

---

*End of Part VI.5 — Data Integration.*

*Cross-References:* [Volume I, REQ-PHI-001] (Epistemic Tiers), [Volume II, Section II.1.4.4] (Maintainability and Extensibility), [Volume II, Section II.2.4.1–2] (Transformation Pipeline Architecture, External Data Enrichment), [Volume II, Section II.2.5] (Data Quality and Validation Gates), [Volume II, Section II.2.8] (Asynchronous Processing Flows), [Volume II, Section II.4.2.5] (Retry and Timeout Policies), [Volume II, Section II.4.4.3] (Rate Limiting), [Volume II, Section II.6.2.4] (Hot Partition Mitigation), [Volume III, Section III.2.7, Section III.2.9] (Social Dynamics, Marketing Science Domains), [Volume III, Section III.5.3, Section III.5.3.5] (Predictive Models, Satisfaction Prediction), [Volume IV, Section IV.4.2.1] (Community Health Forecasting), [Volume V, Part V.4] (Psychologist Agent), [Section VI.3.2.3, Section VI.3.3.3, Section VI.3.5.3] (Consent Enforcement, Data Portability, Minor Data Restrictions), [Volume VII, Part VII.5] (API Specification — forward reference), [Appendix G] (Requirements Traceability Matrix).

*Requirement IDs issued in this Part:* REQ-INTEG-001 through REQ-INTEG-004.

*Document Version:* 1.0
*Part Status:* Normative
*Last Updated:* August 14, 2026

---

## End of Volume VI — Telemetry, SDK, and Data Integration

Volume VI is complete: five Parts, specifying the Telemetry Collector and Event Schema at implementation detail (VI.1), the SDK studios actually integrate — eight language surfaces over one shared core (VI.2), the identity and privacy architecture that makes every prior Volume's pseudonymization and deletion claims concrete, with non-configurable protections for minors (VI.3), the streaming infrastructure telemetry runs on (VI.4), and the external connectors and export path that bring studio data in and send platform data back out without leaking past consent boundaries (VI.5).

Requirement IDs issued across this Volume: REQ-TELEM-001–007, REQ-SDK-001–008, REQ-PRIVACY-001–013, REQ-STREAM-001–006, REQ-INTEG-001–004 — 38 requirements in total.

*Volume VII — Enterprise Platform follows, per [PsyForge_v1_Master_TOC.md].*
