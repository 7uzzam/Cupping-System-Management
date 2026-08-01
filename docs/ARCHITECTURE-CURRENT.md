# Architecture — Current Baseline (Phase 1)

**Product:** Tadawi Al-Madinah / Hijama Management System  
**Version:** 2.0.0  
**Publisher:** NajjarTech  
**Document date:** 2026-07-27  
**Phase:** 1 — Project Stabilization & Baseline

## Overview

Electron desktop application (Windows-first) for cupping/hijama clinic operations:
clients, visits (cases), bookings, employees, attendance, payroll, commissions,
invoices/tax, expenses, reports, printing, backup, and commercial licensing.

## Runtime Topology

```text
┌─────────────────────────────────────────────────────────┐
│ Renderer (index.html + cupping-*.js + cloud/ + license/) │
│  - UI + business logic                                   │
│  - localStorage via DB wrapper                           │
│  - window.cuppingElectron (preload bridge)               │
└───────────────────────────┬─────────────────────────────┘
                            │ IPC (named channels)
┌───────────────────────────▼─────────────────────────────┐
│ Main Process (electron/main.js)                          │
│  - BrowserWindow                                         │
│  - backup / devices / messaging / license-data / cache   │
└─────────────────────────────────────────────────────────┘
```

## Key Entry Points

| Layer | Path |
|-------|------|
| Electron main | `electron/main.js` |
| Preload bridge | `electron/preload.js` → `window.cuppingElectron` |
| UI shell | `index.html` (~25k lines) |
| Feature modules | `cupping-*.js` |
| Cloud V2 | `cloud/` |
| Licensing | `license/` (Engine V2, codec V5) |
| Import | `import-studio/`, `import-engine-*.js` |
| Migration helpers | `migration/` |

## Electron Security (as of Phase 2)

| Setting | Value |
|---------|--------|
| `contextIsolation` | `true` |
| `nodeIntegration` | `false` |
| `sandbox` | `true` |
| `webSecurity` | `true` |
| Main preload | `electron/preload.js` → `window.cuppingElectron` + `window.tadawi` |
| Child/print preload | `electron/security/preload-print.js` (devices/print only) |
| CSP | Applied via `session.webRequest` (`electron/security/window-policy.js`) |
| External links | `shell.openExternal` after protocol allowlist |
| IPC | Explicit channel allowlist + payload validation |

Modules: `electron/security/path-guard.js`, `ipc-validate.js`, `window-policy.js`, `sanitize-text.js`.

Phase 1 baseline noted `sandbox: false` and shared main preload on child windows — both hardened in Phase 2.

## Data Storage

| Store | Usage |
|-------|-------|
| `localStorage` (Chromium LevelDB under `userData`) | Primary operational data via `DB.get` / `DB.set` |
| Electron `userData` files | Device cache, CloudVault tokens, license shards |
| Documents/.../Backups | Local JSON backups |
| Google Drive / local vault | Encrypted clinic DB ZIP + AES backups |
| SQLite | **Not used yet** (planned Phase 4) |

### Primary DB keys

`users`, `settings`, `packages`, `services`, `doctors`, `cases`, `otRecords`,
`attendance`, `bookings`, `expenses`, `budget`, `invoiceCounter`,
`clientsRegistry`, `clientFileCounter`, `messageLog`, `backupLog`,
`backupRegistry`, `activityLog`, `nextSessions`, `employeeLeaveRequests`,
`employeeLedgerAccruals`, `employeeLedgerPayments`, `employeeLedgerEntries`,
`importHistory`, …

License/cloud keys: `commercial_license_data_v2`, `__tdw_lic__*`,
`__tdw_cloud_license__`, `__tdw_device_config__`, `__tdw_sync_state__`, …

## Licensing

- Engine: Commercial License Engine **V2**
- Key codec: **V5** (`TDWI2` magic) — HMAC (legacy, still supported)
- License **V6**: Ed25519-signed JSON / `TDW6.` tokens — verify-only in client
- Public key: `license/core/license-pubkey-v6.js`
- Admin issuance: `tools/license-admin` (private key never shipped in client)
- Registry version: **1.2.0**
- Storage keys: `commercial_license_data_v2` (V5), `commercial_license_v6` (V6)
- Shipped sample data: `license/data/`

## Backup Tracks

1. **JSON backup** — `buildFullBackupObject()` → local / cloud providers  
2. **Encrypted clinic DB** — LevelDB snapshot → ZIP → AES-256-GCM (`CDBK` magic)

## Branding & Currency

- Currency display: `﷼` via `fmtMoney`
- Digits: English via `toEN` / `fmtNum` (`en-US`)
- Branding config: `branding.config.json`
- Fixed packaged `userData` folder name: `Cupping Center`

## Build

- Packager: `electron-builder` (NSIS, win x64)
- App ID: `com.tadawi.cuppingcenter`
- Artifact: `HijamaManagement-Setup-${version}.exe`

## Test Surface (Phase 1)

| Command | Role |
|---------|------|
| `npm test` | Baseline + existing verify suite (`tests/run-all.js`) |
| `npm run lint` | ESLint on allowed paths |
| `npm run verify` | lint + test |
| `npm run verify:sensitive` | attendance, ledger, tax, backup, import, license |

## Out of Scope for This Document

Future phases (security hardening, SQLite, license V6, UI modernization, cloud
platform) are described in the executive roadmap and must not alter this
baseline without comparison tests.
