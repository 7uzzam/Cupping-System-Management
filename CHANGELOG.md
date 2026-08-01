# Changelog

All notable project changes are documented in this file.

## [Unreleased]

### Phase 1 — Project Stabilization & Baseline (2026-07-27)

#### Added

- Extracted full application source from archive into the Git repository root.
- Documentation baseline:
  - `docs/ARCHITECTURE-CURRENT.md`
  - `docs/FEATURE-INVENTORY.md`
  - `docs/KNOWN-ISSUES.md`
  - `docs/BASELINE-RESULTS.md`
- `CHANGELOG.md` and `MIGRATIONS.md`
- Unified test runner: `tests/run-all.js`
- Baseline / golden tests under `tests/baseline/`
- npm scripts: `test`, `lint`, `verify`, `build:win`
- ESLint flat config (`eslint.config.mjs`) with Phase-1 scoped ignores
- Archived historical artifacts under `docs/archive/` (source ZIP + `pat-reports`)

#### Changed

- Root `README.md` updated for clone → install → verify workflow
- `.gitignore` extended for ESLint cache and test artifacts

#### Security / Data

- No functional security changes (deferred to Phase 2+)
- No data migrations
- No changes to financial, commission, payroll, or attendance calculations

#### Compatibility

- Fully backward compatible with existing localStorage / backup / license data
