# Drift and Rollback Policy for Baseline 1.0

Baseline 1.0 has no effectiveness claim, so its first drift checks are data-contract checks rather than statistical production monitoring. An operator must halt recommendation creation and investigate if any of these occur: an unknown event schema or field is submitted, the approved purpose changes, a feature definition/model version changes without registry approval, consent is absent or revoked, or the local audit trail cannot be read.

Rollback is deliberately simple: stop the local service, preserve the immutable audit database, and disable creation of new recommendations. Existing pending recommendations can be rejected or ethics-vetoed; a terminal decision cannot be altered. A future model rollback must identify the last approved registry version, restore only a verified local database backup, rerun the full automated suite, and record the human decision in the audit history.

No automatic remediation, automatic reprocessing, or autonomous production action is authorized by this policy.
