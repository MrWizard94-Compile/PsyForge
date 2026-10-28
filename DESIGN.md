# PsyForge Demonstrator Design

## Purpose and boundary

The React application in `src/` is primarily a deterministic visual demonstrator for the PsyForge specification. It lets a reviewer navigate representative corpus, graph, player-model, simulation, agent, backend, and platform views. Its **Local Review** view is the narrow exception: it connects only to the optional loopback P0–P5 service after a local operator establishes a session.

The dashboard has no remote provider, cloud credential, telemetry collector, or production action. All existing product panels use static example data. The **Evidence Registry** view is the other local-service surface: it submits a bounded local source only for hashing/metadata registration, clears the source text after successful registration, displays no source content in the registry list, and supports credential-bound evidence review and approved-source revocation. The Local Review view sends requests only to `/api/v1` in Vite development or `/v1` when served by the local service; it does not persist the local actor token and cannot ingest telemetry or alter a production system. The simulation control remains a local deterministic UI state machine.

## Implemented UI architecture

- `src/App.tsx` owns view selection and labels the demonstrator boundary.
- `src/data/` holds typed, static example records.
- `src/views/` renders one presentational area per product capability.
- `src/hooks/useSimulation.ts` owns the deterministic demo state transition `idle → running → complete → idle`.
- `src/hooks/useBackendStatus.ts` and `src/hooks/useDesignAgents.ts` expose stable sample state; neither simulates live activity.
- `src/hooks/useEvidenceRegistry.ts` establishes an in-memory local evidence session, registers metadata plus transient source text for hashing only, clears the form content after a successful registration, and records terminal reviewer decisions or approved-source revocations without rendering source text in registry records.
- `src/hooks/useLocalReview.ts` establishes an in-memory, cookie-backed local-review session, retrieves a recommendation, submits a terminal human decision, and exports audit JSON.
- `server/` contains the transport-independent domain service, strict JSON boundary, SQLite repository, and loopback server described in [docs/LOCAL-SERVICE.md](docs/LOCAL-SERVICE.md).

## Invariants

1. The UI must visibly distinguish static sample panels from local-service data.
2. The UI must remain local and runnable without secrets or a provider account.
3. The demo must not contain a control capable of writing to a game, model, or production system.
4. Navigation, the Local Review entry point, simulation-state transition, and the local-service consent/review lifecycle are covered by behavior tests.
5. Product claims belong in the normative specification; implementation claims belong in this document and the audit report.

## Remaining implementation boundary

The P0–P5 vertical slices in [docs/IMPLEMENTATION-PLAN.md](docs/IMPLEMENTATION-PLAN.md) are implemented and tested. The remaining program begins with a formally gated extension of the corpus, graph, simulation, local-LLM/agent, SDK, and deployment capabilities; none is represented as implemented.
