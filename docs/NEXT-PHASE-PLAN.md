# Next-Part Plan: P5 Evidence Registry and Corpus Intake Gate

## Why this is next

P0–P4 proves a consented local data path, but the next architectural dependency is not an agent or a high-scale simulation. Volumes III–V require a trustworthy, source-linked knowledge substrate first. P5 will establish the governance and provenance boundary needed before any corpus or graph claim is made.

## Proposed outcome

Implement a local, append-only evidence registry that records a source's identifier, owner, license/permission basis, content hash, acquisition date, domain, review status, and human approver. It will register metadata and a small, licensed synthetic test corpus only; it will not crawl the web, ingest copyrighted research, embed content, call an LLM, or create agent access.

## Dependency order

1. Write an ADR that chooses the local source-manifest format, hashing algorithm, review roles, and retention boundary.
2. Define a strict source-record schema plus a license/permission allow-list and an explicit rejection/quarantine record.
3. Add a tenant-independent evidence-registry store and immutable audit events, without coupling it to player telemetry.
4. Add a reproducible import command that accepts only a reviewed local fixture directory, records hashes before parsing, and rejects unsafe paths, duplicate versions, missing attribution, unsupported license, or changed content.
5. Add an operator UI for source inspection and review; no free-form content search or model summary is in scope.
6. Publish a provenance/export record and a deletion/revocation policy that treats source rights separately from player-consent revocation.

## Non-negotiable gates

- Every registered source must be traceable to a human-readable rights basis and exact content hash.
- Imports must be local, bounded, deterministic, idempotent, and fail closed.
- No source text may be sent to a provider, hosted API, or LLM. Docker-hosted Ollama remains a future, separately approved option only.
- Tests must prove path traversal rejection, duplicate handling, hash mismatch detection, license denial, audit immutability, and restart-safe persistence.
- A source review must be human-authorized. An agent may not approve, retrieve, or publish a source.
- No graph, embedding, persona, simulation, prediction, or recommendation action may be built on an unapproved source.

## Acceptance evidence

P5 is ready for the first graph-schema slice only when a clean install, lint, tests, build, dependency audit, and local artifact run pass; a reviewer can reconstruct one fixture source's rights, hash, import outcome, and audit history; and the documentation lists all intentionally unsupported source types.

## Decisions requiring director approval before implementation

1. The first allowed corpus source and its written license/permission basis.
2. Whether a source's full local text may be retained, or only its metadata/hash, at P5.
3. The human role authorized to approve source rights for WPAI.
4. The local backup and encryption-at-rest policy for the expanded evidence store.
