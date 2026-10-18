# WPAI Constitution adoption

## Authority and source pin

The accepted `main` of
[MrWizard94-Compile/Agents-Constitution](https://github.com/MrWizard94-Compile/Agents-Constitution)
is the single editable source of constitutional law. `AGENTS.md` is a loader
and project-local guidance, not a law copy. Each invocation freezes one verified
accepted revision; this dated audit pin is not permanently current law.

The CI source is accepted **v6.16.3**, commit
`89f8771df5a6fa8627cb9576afca1eefd0486d27`. CI checks out this exact revision,
validates its source and tests, and runs its adoption audit against this project.
The ongoing consolidation invocation remains governed by its earlier v6.16.2
freeze; a later accepted tool does not retroactively govern that invocation.

## Scoped changes and recovery

- Add the canonical loader, source-pinned CI, positive loader and ignore-boundary
  tests, and a bounded regression for the repaired source-map dependency.
- Replace all five Volume I governing-law declarations without changing their
  referenced quality-rule IDs or any normative product requirement.
- Retire 71 tracked v5.0.1 distribution files. They remain recoverable in base
  commit [`2d0f3cab8a16002aff09347813c11a5a2e30aac6`](https://github.com/MrWizard94-Compile/PsyForge/tree/2d0f3cab8a16002aff09347813c11a5a2e30aac6).
  Historical recovery is not a new active distribution.
- Keep the published P0–P4 boundary. Unrelated unpublished local implementation,
  operational records, credentials, private recovery sets, and generated output
  are not part of this public change. An isolated worktree prevents those states
  from being accidentally combined.

## Approved baseline repairs

The unchanged published baseline failed type-checking because the broad `data/`
ignore rule also excluded four required synthetic `src/data/*.ts` modules. Those
existing, reviewed static examples are restored; `/data/` remains ignored for
runtime records, and regression checks protect both sides of that boundary.
No live service, real telemetry, account, or real user record is needed.

A fresh baseline audit also reported a high transitive `source-map-js` advisory.
The focused lock repair updates **1.2.1 → 1.2.2**, retains the package's registry
integrity digest, and synchronizes stale lock-root Node metadata to the already
declared `>=22` manifest. No direct dependency or unrelated optional-package
resolution changes. The [reviewed advisory](https://github.com/advisories/GHSA-68fv-2mgg-jv7q)
and [upstream release](https://github.com/7rulnik/source-map-js/releases/tag/v1.2.2)
describe CVE-2026-93749 and the patched version.

The security regression rejects six malformed/excessive indexed offsets,
including an excessive nested total, then proves valid bounded mapping
enumeration and serialization. The identical checks fail promptly against
1.2.1 and pass 1.2.2 without expanding an oversized mapping payload.

An initial valid-input probe also found an upstream indexed lookup quirk at a
section's column zero in both versions; it returns no original location there.
This adoption does not repair that separate API limitation or claim every
source-map operation is correct. The new regression exercises the repaired
constructor and the mapping-copy/serialization flow, not that unrelated lookup.
PsyForge's runtime source does not call these source-map APIs directly; the
package is a transitive build dependency. Audit results are known-advisory
evidence, not proof of universal security or runtime exploitability.

## Verification

All 13 original product test cases and their assertions are preserved:

```powershell
npm ci --no-fund
python -m unittest discover -s governance_tests -v
node tools/check-source-map-security.mjs
npm run lint
npm test
npm run build
npm audit --audit-level=low
```

Local source verification used Node 24.19.0 and npm 11.8.0. The new CI matrix
independently checks Node 22/24 with npm 11.8.0 on Windows and Linux; a configured matrix is not
a passing-run claim. Python 3.11 is used for CI governance checks, not required
by the product runtime. GitHub Actions are pinned to immutable commits with
read-only repository permission and checkout credential persistence disabled.

To reproduce the canonical adoption check, use a separate, verified checkout
of the exact accepted pin above:

```powershell
$projectRoot = (Get-Location).Path
$sourceRoot = 'C:\path\to\verified-constitution-checkout'
git -C $sourceRoot rev-parse HEAD
# Require 89f8771df5a6fa8627cb9576afca1eefd0486d27 for this dated audit.
python (Join-Path $sourceRoot 'tools/validate-source.py')
python (Join-Path $sourceRoot 'tools/check-adoption.py') $projectRoot
```

Run from the project root and require each command to exit zero. A clean static
audit also requires review of manifests, CI, specifications, packaging and
indirect consumers; it does not prove every long-running agent refreshed its
instructions. No production service launch, installation, physical acceptance,
new product milestone, or autonomous production write is claimed by this PR.
