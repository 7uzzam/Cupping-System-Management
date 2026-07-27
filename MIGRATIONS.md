# Migrations Log

Track **data structure / schema** changes only.

## Policy

- Every storage key change, field rename, backup format change, or DB schema
  bump must be recorded here.
- Application behavior refactors without data shape change do **not** belong here
  (use `CHANGELOG.md`).

---

## Phase 4 — 2026-07-27 — SQLite Migration

**Schema impact:** New SQLite DB (schema version **4**). localStorage keys unchanged (mirror retained).

| Item | Change |
|------|--------|
| New DB file | `userData/database/tadawi.db` |
| Schema version | `branding.config.json` `dbSchemaVersion`: **3 → 4** |
| Tables | `clients`, `visits`, `visit_cups`, `invoices`, `appointments`, `employees`, `attendance`, `expenses`, `kv_store`, `meta`, `schema_migrations`, … |
| Meta flags | `sqlitePrimary`, `localStorageRetained`, `migratedFrom`, `migratedAt` |
| localStorage | **Not deleted**; remains mirror + fallback until later phases |
| Backup | Pre-migrate copy under `userData/database/backups/`; report JSON beside DB |

**Migrator:** `database/migrate-from-json.js` — dedupe by id, orphan visits without clients handled, bad attendance skipped, comparison report (counts + visit totals). Idempotent re-run supported.

### Rollback

1. Keep using localStorage mirror (never deleted in Phase 4).
2. Set meta `sqlitePrimary` off / skip hydrate, or delete `tadawi.db` and restore from `database/backups/`.
3. Revert Phase 4 branch if needed. Restore `dbSchemaVersion` to `3` only if no SQLite consumers remain.

---

## Phase 3 — 2026-07-27 — Commercial Licensing V6

**Schema impact:** Additive only.

| Item | Change |
|------|--------|
| New storage key | `commercial_license_v6` (activated V6 license snapshot) |
| New storage key | `commercial_license_v6_revocations` |
| Marker | `commercial_license_v6_prev_marker` (records that V5 store was retained) |
| V5 store `commercial_license_data_v2` | **Unchanged / retained** after V6 activation |
| License file format | New signed JSON `schemaVersion: 6` (+ optional `TDW6.` token) |

**Notes:** No automatic deletion of V5 data. Migration request is generated client-side; Admin signs V6 offline.

### Rollback

Remove V6 keys from localStorage and keep using V5 product keys. Revert Phase 3 branch if needed.

---

## Phase 2 — 2026-07-27 — Electron Security Hardening

**Schema impact:** None.

| Item | Change |
|------|--------|
| localStorage keys | Unchanged |
| Backup JSON / AES formats | Unchanged |
| License storage | Unchanged |
| Path policy for backup `localPath` hints | Absolute / UNC / traversal hints from renderer are **rejected** (Documents-relative hints still work) |

**Notes:** Security hardening only. Existing Documents-relative backup paths remain valid.

### Rollback

Revert Phase 2 commits; restore previous `electron/main.js` / `preload.js` if a client relied on absolute backup path hints (unsupported going forward).

---

## Phase 1 — 2026-07-27 — Stabilization Baseline

**Schema impact:** None.

| Item | Change |
|------|--------|
| localStorage keys | Unchanged |
| Backup format (JSON v3 / clinic AES `CDBK`) | Unchanged |
| License storage (`commercial_license_data_v2`) | Unchanged |
| `branding.config.json` `dbSchemaVersion` | Remains `3` |
| SQLite | Not introduced |

**Notes:** Phase 1 established documentation, baseline golden tests, and npm
scripts only. No migration scripts required. No data rewrite.

### Rollback

N/A — no data migration performed.
