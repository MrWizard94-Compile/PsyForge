# Model Card: Descriptive Engagement Baseline 1.0

## Intended use

This deterministic baseline summarizes approved, consented seven-day interaction features as an `engagementIndex` from 0 to 100. Its sole use is a product-experience discussion input that must go through a human review. It is never an autonomous action authority.

## Inputs and method

The approved inputs are session count, active-day count, average session duration, and exploration-activity ratio. The code uses a fixed, bounded formula in `server/domain/model.ts`; output includes all source features, an explanation, version `1.0`, and `low` confidence.

## Explicit non-uses

Do not use this output for churn, addiction, mental-health, protected-class, vulnerability, purchase, pricing, matchmaking, disciplinary, employment, or eligibility decisions. It is not calibrated against labels and must not be presented as a prediction or diagnosis.

## Limitations and safeguards

Small samples, incomplete telemetry, event-schema shifts, seasonality, and different game loops can all distort the index. The model has no subgroup evaluation and no production calibration. Each derived recommendation is marked review-required with zero numerical risk values only because P0 does not make a behavioral intervention; that score is not evidence of safety for a future action.

## Ownership and review

The local operator owns creation. A reviewer may approve, reject, or modify a pending recommendation; an ethics reviewer may veto it. Every terminal decision is immutable and auditable. Any new feature, use case, model change, calibration claim, or deployment path requires a new model card, evaluation evidence, privacy review, and human approval.
