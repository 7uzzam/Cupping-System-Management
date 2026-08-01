# Changelog

All notable project changes are documented in this file.

## [Unreleased]

### Phase 4 — SQLite Migration (2026-07-27)

#### Added

- SQLite layer via `better-sqlite3`: `database/connection.js`, `database/migrations/001_initial.js`, repositories
- Main-process service `electron/database/service.js` + IPC (`database:status|hydrate|persistTable|persistKv|migrateFromBackup|querySafe|exportSnapshot`)
- LocalStorage/backup → SQLite migrator (`database/migrate-from-json.js`, CLI `scripts/migrate-local-backup-to-sqlite.js`)
- Renderer bridge `cupping-sqlite-bridge.js` (hydrate + write-through; localStorage mirror retained)
- Phase 4 tests (`tests/baseline/test-phase4-sqlite.js`); scripts `db:test`, `db:migrate:file`
- `branding.config.json` `dbSchemaVersion` → **4**

#### Changed

- electron-builder packs `database/**/*` and unpacks `better-sqlite3` from asar
- Preload exposes typed `tadawi.database.*` / `cuppingElectron.database.*` (no arbitrary SQL)

#### Security / Data

- Dual-run: SQLite can become primary after migrate; **localStorage is not deleted**
- `querySafe` allowlist only — no raw SQL from renderer
- Pre-migrate DB file backup + migration JSON report under `userData/database/`

### Phase 3 — Commercial Licensing V6 (2026-07-27)

#### Added

- Ed25519 License V6 verify modules (`license/core/license-pubkey-v6.js`, `license-codec-v6.js`, `device-fingerprint.js`)
- V6 verification / migration / online-client stubs under `license/engine` and `license/api`
- Router support for V6 activation alongside V5
- `tools/license-admin` CLI (issue / renew / revoke / migrate-v5 / verify / generate-keypair)
- Dev Ed25519 keypair under `tools/license-admin/keys/dev` (test only)
- Phase 3 automated tests
- `app:getDeviceFingerprintParts` IPC for stable device signals

#### Changed

- `index.html` loads V6 scripts; `_licApplyCode` prefers V6 when input matches
- electron-builder `files` explicitly excludes `tools/`, `tests/`, `docs/`

#### Security

- Private key is **not** in the Electron client tree
- Client can verify but cannot sign V6 licenses
- V5 HMAC path retained for compatibility (legacy)

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
