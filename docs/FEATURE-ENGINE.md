# P2 Deterministic Feature Engine

## Boundary

P2 computes only four local, observed, seven-day aggregates from already stored, consented P0 telemetry. The feature engine has no inference about protected or vulnerable characteristics, no prediction, no provider access, no retained corpus source, and no production-action path.

Definitions live as typed declarative data in `server/domain/feature-definitions.ts`; the executor in `server/domain/features.ts` interprets the selected event inputs, aggregation, window, unit, epistemic tier, and definition version. A new definition must pass the definition invariants before it can run.

| Feature key | Input selection | Aggregation | Window | Unit |
|---|---|---|---|---|
| `session_count_7d` | `session.ended` | count | 7 days | count |
| `active_day_count_7d` | all allowed events | distinct occurrence date | 7 days | days |
| `average_session_duration_seconds_7d` | `session.ended` | mean `durationSeconds` | 7 days | seconds |
| `exploration_activity_ratio_7d` | `activity.completed` | exploration count / activity count | 7 days | ratio |

Every output preserves its source event IDs in sorted order and carries `definitionVersion: "1.0"` plus `epistemicTier: "observed"`. The executor has no free-form expression language or arbitrary callback surface.

## Reproducible local recomputation

The service API can recompute features for an operator session. The equivalent bounded local command is:

```powershell
npm run recompute:features -- --data-dir .\data --tenant-id studio-alpha --subject-id player-001 --window-end 2026-08-21T12:00:00.000Z
```

The command accepts exactly four named arguments, rejects duplicate/unknown/malformed arguments before opening SQLite, opens only the specified local data directory, recomputes from existing stored events, and prints a compact JSON result containing feature keys, values, and definition versions. It does not ingest events or grant consent.

Repeated execution with the same database and window yields byte-stable feature values and ordering. Changing the feature language requires a new definition version; historical values remain attributed to the version that produced them.

## Verification

```powershell
npm run lint
npm run test
npm run build:server
npm run recompute:features -- --data-dir .\data --tenant-id studio-alpha --subject-id player-001 --window-end 2026-08-21T12:00:00.000Z
```

Automated tests prove definition invariants, declared event selection, deterministic recomputation over a persisted temporary SQLite store, and malformed/duplicate/path-traversal-like subject argument rejection.