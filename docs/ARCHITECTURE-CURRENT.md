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

## Electron Security (as of baseline)

| Setting | Current value | Phase 2 target |
|---------|---------------|----------------|
| `contextIsolation` | `true` | keep |
| `nodeIntegration` | `false` | keep |
| `sandbox` | `false` | `true` |
| `webSecurity` | default | explicit `true` |
| Preload API | typed `cuppingElectron.*` | expand validation |

Child windows created via `setWindowOpenHandler` currently inherit the **same**
main preload — flagged for Phase 2 hardening.

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
- Key codec: **V5** (`TDWI2` magic)
- Registry version: **1.2.0**
- Storage key: `commercial_license_data_v2`
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
