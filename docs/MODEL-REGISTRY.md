# PsyForge Executable Local Model Registry

The local P3/P4 workflow has exactly one executable registry entry. The registry is enforced by `server/domain/model-registry.ts` before a persisted model result may create a recommendation.

| Model version | Status | Required inputs | Output | Enforced approval boundary |
|---|---|---|---|---|
| `1.0` — Descriptive Engagement Baseline | `local_review_only` | Four observed P2 features at definition version `1.0` | Descriptive engagement index, explanation, `low` confidence | A model result with any other version, confidence, feature set, definition version, or epistemic tier is rejected before entering the P4 recommendation queue. |

The registry is intentionally static for this narrow local slice: registering a new model version requires a model card, evaluation card, feature/purpose review, source and license record where applicable, deterministic tests, rollback artifact, named human approval, and a versioned registry change. No unregistered model result may enter the recommendation queue.

## Data-contract drift signals

The registry evaluates the feature snapshot before recommendation creation. It fails closed on:

- `FEATURE_SET_MISMATCH` — missing, extra, or duplicate feature keys;
- `FEATURE_DEFINITION_VERSION_MISMATCH` — a feature was produced by a definition other than the registered version;
- `EPISTEMIC_TIER_MISMATCH` — a local baseline input is not an observed feature.

These are integrity signals, not statistical drift metrics or an effectiveness claim. The full local response and rollback boundary remains in [DRIFT-AND-ROLLBACK.md](DRIFT-AND-ROLLBACK.md).