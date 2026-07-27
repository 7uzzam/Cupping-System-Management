# Changelog

All notable project changes are documented in this file.

## [Unreleased]

### Phase 12 — Build Reliability Gates (2026-07-27)

#### Added

- Build baseline gate test: `tests/baseline/test-phase12-build.js`
- Script: `npm run build:test`

#### Changed

- Unified verify pipeline now checks build configuration invariants (files/asarUnpack/prebuild/product-name consistency)

#### Security / Data

- No runtime behavior change
- No DB schema or finance logic changes

### Phase 11 — Booking Status Lifecycle (2026-07-27)

#### Changed

- Added booking status normalization with alias mapping (`normalizeBookingStatus`)
- Expanded lifecycle statuses to include `completed` and `cancelled`
- Added booking actions: complete, cancel (soft), and reopen to pending
- Booking table now renders normalized status badges for the expanded lifecycle
- Added Phase 11 baseline test: `tests/baseline/test-phase11-booking-statuses.js`
- Added script: `npm run bookings:test`

#### Security / Data

- No finance formula changes
- No DB schema changes
- Backward-compatible normalization for legacy status aliases

### Phase 10 — Setup Wizard & Product Tour Hardening (2026-07-27)

#### Changed

- Added explicit audit events for setup wizard pause/skip/restart
- Added duplicate-username guard in setup wizard user creation step
- Added product-tour audit metadata for skip/complete/restart actions
- Persisted final `tourStep` on product tour completion
- Added Phase 10 baseline test: `tests/baseline/test-phase10-wizard-tour.js`
- Added script: `npm run wizard:test`

#### Security / Data

- No licensing-crypto changes
- No DB schema or finance logic changes
- Improves traceability of onboarding control actions

### Phase 9 — Branding Consistency (2026-07-27)

#### Changed

- Unified English center-name defaults to APP metadata product name in `index.html`
- Receipt English header fallback now uses `APP_META.productName` instead of legacy `'Cupping Center'`
- Added Phase 9 baseline test: `tests/baseline/test-phase9-branding-consistency.js`
- Added script: `npm run branding:test`

#### Security / Data

- No data-path or storage migration
- Preserved fixed `userData` folder naming for backward compatibility

### Phase 8 — Developer Panel Diagnostics (2026-07-27)

#### Added

- Diagnostics snapshot builder in `license/ui/developer-panel.js`
- New Dev Panel action: **Diagnostics Snapshot** (renders JSON snapshot in-panel)
- Public API hook: `licDevDiagnosticsSnapshot()`
- Baseline test: `tests/baseline/test-phase8-dev-panel.js`
- Script: `npm run devpanel:test`

#### Changed

- Diagnostics metrics now include `integrityIssues` and `integrityWarnings`
- Snapshot toast now highlights warning state when integrity or license health is degraded

#### Security / Data

- No licensing-engine behavior change
- No database schema or finance logic changes

### Phase 7 — Backup & Restore Hardening (2026-07-27)

#### Added

- Backup snapshot ZIP inspection helper (`inspectClinicZipBuffer`) in `electron/clinic-snapshot.js`
- Phase 7 baseline test: `tests/baseline/test-phase7-backup.js`
- Script: `npm run backup:test`

#### Changed

- Restore flow now verifies remote `.meta.json` hash (when available) before decrypt/restore
- Restore flow now rejects malformed ZIP backups missing required `clinic.db` or `backup.manifest`
- Restore result now includes parsed backup manifest when present

#### Security / Data

- Prevents restore from tampered backup payloads (hash mismatch)
- Prevents destructive restore from structurally invalid archive

### Phase 6 — Permissions Hardening (2026-07-27)

#### Changed

- Added permission map sanitization for custom and preset role resolution (`cupping-ext-modules.js`)
- Unknown permission keys are denied explicitly in `hasPermission`
- Exposed `window.PermissionPolicy.sanitizePermissionMap` for secure normalization at user-save time
- Strengthened users management save path (`saveUserAsync`) with explicit admin guard
- Added duplicate username protection (case-insensitive)
- Protected primary admin account (`id=1`) from role downgrade or deactivation

#### Security / Data

- Reduces privilege-escalation surface through forged permission objects or console-triggered user edits
- No finance formulas or DB schema changes

### Phase 5 — Data Security & Credentials (2026-07-27)

#### Changed

- Removed committed OAuth secret source file `electron/cloud-oauth.embedded.json`
- OAuth resolver no longer falls back to embedded secret files
- Build generator `scripts/generate-oauth-config.mjs` now requires local/env credentials (no embedded secret path)
- Verification `scripts/verify-google-oauth-config.js` now fails if embedded secret file is committed
- `.gitignore` now blocks `electron/cloud-oauth.embedded.json`

#### Security / Data

- Eliminates client-secret-at-rest in repository for Google OAuth bootstrap
- Keeps runtime compatibility via encrypted userData override and build-time config file

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
