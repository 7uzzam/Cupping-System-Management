# Changelog

All notable project changes are documented in this file.

## [Unreleased]

### Phase 2 — Electron Security Hardening (2026-07-27)

#### Added

- `electron/security/` modules: path-guard, ipc-validate, window-policy, sanitize-text, preload-print
- Typed `window.tadawi` alias (same surface as `cuppingElectron`)
- Preload IPC channel allowlist (no generic invoke)
- Session CSP + Chromium permission denials
- `app:openExternal` gated IPC
- Phase 2 security test suite

#### Changed

- BrowserWindow: `sandbox: true`, `webSecurity: true`
- Child `window.open` windows use print-only preload (not main preload)
- External http(s)/sms/mailto open via `shell.openExternal` after protocol checks
- Navigation guards block leaving the local app shell
- Backup local paths reject absolute/UNC/traversal hints from renderer
- License/cache IDs validated against path traversal

#### Security / Data

- No financial/payroll/commission behavior changes
- No database migration

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
