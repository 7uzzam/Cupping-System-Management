# Migrations Log

Track **data structure / schema** changes only.

## Policy

- Every storage key change, field rename, backup format change, or DB schema
  bump must be recorded here.
- Application behavior refactors without data shape change do **not** belong here
  (use `CHANGELOG.md`).

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
