# PsyForge ADR Index

This is the chronological and topical index required by Volume II §II.1.3.2. Entries 001–006 are normative architecture decisions issued in the specification; P0 implementation records continue the sequence at 007. A status of **specified** is not an implementation claim.

| ID | Decision | Status | Component / volume home | Record or source |
|---|---|---|---|---|
| ADR-001 | Event-Driven Ingestion Pipeline | Specified | Architecture / Volume II §II.1.2 | `PsyForge_VolumeII.md` |
| ADR-002 | Event Sourcing for Audit, Lifecycle, and Corpus History | Specified | Architecture / Volume II §II.1.2 | `PsyForge_VolumeII.md` |
| ADR-003 | Modular Monolith with Simulation and Telemetry Extraction Points | Specified | Architecture / Volume II §II.1.2 | `PsyForge_VolumeII.md` |
| ADR-004 | Local-First as Default Deployment Target | Specified | Architecture / Volume II §II.1.2 | `PsyForge_VolumeII.md` |
| ADR-005 | Opt-In Granular Cloud-Edge Sync | Specified | Architecture / Volume II §II.1.2 | `PsyForge_VolumeII.md` |
| ADR-006 | Polyglot Persistence by Access Pattern | Specified | Architecture / Volume II §II.1.2 | `PsyForge_VolumeII.md` |
| ADR-007 | Local Vertical-Slice Runtime and Persistence | Accepted and implemented | P0–P5 local runtime / Volume II and IX | [ADR-007-LOCAL-VERTICAL-SLICE.md](ADR-007-LOCAL-VERTICAL-SLICE.md) |
| ADR-008 | Retain Evidence Metadata and Hash, Not Source Text | Accepted and implemented | P5 evidence registry / Volume III and IX | [ADR-008-EVIDENCE-REGISTRY.md](ADR-008-EVIDENCE-REGISTRY.md) |
| ADR-009 | Synthetic, Provenance-Bound Structural Graph Kernel | Accepted and implemented | P6 local graph kernel / Volume III and IX | [ADR-009-SYNTHETIC-GRAPH-KERNEL.md](ADR-009-SYNTHETIC-GRAPH-KERNEL.md) |

The index must change in the same reviewable change as any new ADR. Superseded records remain in this index and link to their replacement.