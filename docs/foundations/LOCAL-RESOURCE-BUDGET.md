# PsyForge Local P0 Resource Budget

## Scope

This budget applies only to the implemented local P0 workload: 1,000 synthetic, non-personal telemetry events written to an in-memory SQLite repository, followed by deterministic feature recomputation and baseline construction. It is a repeatable development gate—not a multi-user capacity claim, production service-level objective, or simulation benchmark.

## Reference workstation

The measurement below was taken on 2026-08-21 from the current local workstation:

| Property | Verified value |
|---|---|
| System | HP OMEN by HP Obelisk Desktop 875-0xxx |
| CPU | Intel Core i7-9700, 8 cores / 8 logical processors, 3.00 GHz |
| Memory | 51,409,330,176 bytes (47.88 GiB) |
| Runtime | Node.js 25.6.0 with the locked PsyForge dependencies |

## Enforced benchmark budget

| Metric | Limit | Measured reference result | Result |
|---|---:|---:|---|
| Synthetic events accepted | exactly 1,000 | 1,000 | Pass |
| End-to-end in-memory elapsed time | at most 5,000 ms | 176.728 ms | Pass |
| Node.js heap delta during workload | at most 64 MiB | 5,026,688 bytes (4.79 MiB) | Pass |
| Feature outputs | exactly 4 | 4 | Pass |
| Baseline confidence | `low` | `low` | Pass |

Run the compiled, bounded benchmark with:

```powershell
npm run benchmark:local
```

It rebuilds the server artifact, runs the fixed synthetic workload, prints a JSON measurement, and exits non-zero if the default workload exceeds either enforced limit. `--events <1-10000>` is available for diagnosis only; non-default sizes report a measurement but are not evaluated against the default budget.

## Interpretation and limits

The benchmark creates no persistent database file and sends no network traffic. It intentionally excludes the dashboard, HTTP serialization, SQLite disk I/O, retained corpus content, graph traversal, embeddings, models beyond the P3 descriptive baseline, simulations, agents, SDKs, and concurrent users. Those capabilities need their own workload, budget, and acceptance gate before they may be represented as capacity-tested.

The 5-second/64-MiB thresholds are deliberately conservative for the verified 8-core/47.88-GiB workstation while still detecting a large regression in this small local slice. Re-run and update this record when the workload, runtime, SQLite adapter, or reference hardware materially changes.