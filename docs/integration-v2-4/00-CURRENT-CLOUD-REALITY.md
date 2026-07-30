# 00 — Current Cloud Reality (from production code)

**Generated from code inspection on branch `integration/hybrid-cloud-owner-v2` at start of V2-4.**  
**Baseline commit before V2-4 code:** see git history after `docs(v2-4): register complete REQUIREMENTS-TRACEABILITY`.

## Topology (actual)

```
Renderer (index.html loads cloud/*.js)
  → Repository / DbBridge / SyncEngine / SyncState
  → DriveAdapter → BackupBridge (IPC)
Electron main
  → cloud-service → google-drive.js (OAuth + Drive API)
  → database/service.js (SQLite better-sqlite3) — parallel path
```

## Source of truth today

| Layer | Reality |
|-------|---------|
| Synced operational tables (clients/cases/…) | Primarily **localStorage / `DB` adapter** via `cloud/repository.js` |
| SQLite (`database/`, `electron/database/service.js`) | Present for Phase-4+ clinic data; **not** yet the Cloud Sync outbox/SoT for Drive push-poll |
| Pending sync queue | `cloud/sync-state.js` → `__tdw_sync_state__.pendingPushes` in local DB/localStorage — **not durable SQLite outbox** |
| Transport | **Google Drive JSON files** (versions.json + per-table JSON) — real when Electron + OAuth connected |
| Backup | Separate Backup V2 / BackupLayer snapshots — **must not be called Sync** |

## Module classification (pre–V2-4)

| Module | Class | Notes |
|--------|-------|-------|
| `cloud/sync-engine.js` | WIRED BUT UNPROVEN for multi-device E2E | Push/poll real code path; UAT was mock Drive in verify-cloud-v2 |
| `cloud/sync-state.js` | LOCAL ONLY | localStorage pending; lost on wipe; not SQLite |
| `cloud/drive-adapter.js` | REAL (Electron) / MOCK (browser vault) | |
| `electron/cloud-providers/google-drive.js` | REAL | OAuth + Drive API |
| `cloud/owner-hub.js` | REAL local + license Drive push | Remote peer proof incomplete for V2-4 |
| `cloud/branch-enrollment.js` | REAL | Requires `source:'owner_hub'` |
| `cloud/conflict-queue.js` | LOCAL ONLY | Not proven multi-device |
| `cloud/lock-manager.js` | LOCAL ONLY | Not synced by SyncEngine |
| SQL `sync_outbox` | MISSING | Target of V2-4 |
| Hosted sync API / Postgres | MISSING | Out of scope; Drive is transport |

## Gaps V2-4 must close

1. Durable SQLite Outbox + Inbox ledger (atomic with business writes).
2. Repository/SQLite as SoT for synced data path.
3. Real multi-device A↔B on installed Windows + real Google Drive.
4. Offline queue survives restart.
5. Conflict detection/resolution end-to-end.
6. Branch isolation at repository + cloud path layers.
7. Observability + audit without secrets in logs.
8. Cloud Sync status: **PASS** (not MISSING).

## Non-negotiable preservations (V2-3.5)

Install lifecycle, app-only license preserve, icons, Electron 43, better-sqlite3 13 N-API, CSP, local QR/fonts.
