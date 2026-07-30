# V2-5.2 Requirements Traceability

**Phase:** V2-5.2 — Backup & Cloud Synchronization Hardening
**Branch:** `cursor/v2-5-2-backup-sync-c2ea`
**Baseline:** V2-5.1 commit `200dc53` (release gate green).
**Rule:** No PASS without runtime evidence. Do not remove or merge rows after registration.
**Registration:** All Results start as `NOT_STARTED` before any production backup/sync hardening code.

**Accepted Result values:** `NOT_STARTED` | `IN_PROGRESS` | `PASS` | `FAIL` | `UNVERIFIED`
**Close rule:** every Result = `PASS`; failed=0; unverified=0.

| ID | المطلوب | Definition of Done | Production files | Automated test | Windows runtime evidence | Device A | Device B | Cloud/Remote evidence | Restart evidence | Failure-path evidence | Result |
|----|---------|--------------------|------------------|----------------|--------------------------|----------|----------|----------------------|------------------|----------------------|--------|
| BACK-252-001 | Full local backup | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BACK-252-002 | Full cloud backup | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BACK-252-003 | Incremental backup real or documented unsupported | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BACK-252-004 | Differential backup real or documented unsupported | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BACK-252-005 | Manual backup | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BACK-252-006 | Scheduled backup | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BACK-252-007 | Backup while app active | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BACK-252-008 | Consistent SQLite snapshot | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BACK-252-009 | Attachments included | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BACK-252-010 | Images included | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BACK-252-011 | Documents included | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BACK-252-012 | Settings included | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BACK-252-013 | Users/permissions metadata included | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BACK-252-014 | Backup manifest | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BACK-252-015 | Backup checksum | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BACK-252-016 | Compression verified | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BACK-252-017 | Encryption path verified | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BACK-252-018 | Retention policy | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BACK-252-019 | Version history | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BACK-252-020 | Prune old backups safely | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BACK-252-021 | Quota handling | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BACK-252-022 | Interrupted upload resume | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BACK-252-023 | No partial backup marked valid | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BACK-252-024 | Restore verification after every backup class | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| SYNC-252-001 | A→Cloud | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| SYNC-252-002 | Cloud→B | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| SYNC-252-003 | B→Cloud | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| SYNC-252-004 | Cloud→A | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| SYNC-252-005 | A↔B round trip | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| SYNC-252-006 | Third device C join and catch-up | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| SYNC-252-007 | Offline queue durable | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| SYNC-252-008 | Restart with pending queue | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| SYNC-252-009 | Reconnect flush | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| SYNC-252-010 | Idempotent duplicate handling | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| SYNC-252-011 | Tombstone propagation | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| SYNC-252-012 | Attachment sync | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| SYNC-252-013 | Large attachment retry | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| SYNC-252-014 | Conflict non-overlapping fields | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| SYNC-252-015 | Same-record conflict | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| SYNC-252-016 | Delete/update conflict | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| SYNC-252-017 | Conflict resolution propagation | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| SYNC-252-018 | Dead-letter visibility and recovery | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| SYNC-252-019 | Branch isolation in sync paths | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| SYNC-252-020 | No full snapshot poll when no changes | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| SYNC-252-021 | Token expiry recovery | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| SYNC-252-022 | 401/403 handling | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| SYNC-252-023 | 404 missing remote artifact | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| SYNC-252-024 | 429/rate limit backoff | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| SYNC-252-025 | Corrupt remote file handling | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| SYNC-252-026 | Stale manifest handling | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| SYNC-252-027 | No data loss on cloud disconnect | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| SYNC-252-028 | No pending events erased on logout | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| OBS-252-001 | Sync status accurate | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| OBS-252-002 | Pending/conflict/error counts accurate | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| OBS-252-003 | Audit trail for backup/sync | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| UAT-252-001 | Two-device real-cloud Windows UAT | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| UAT-252-002 | Offline/reconnect Windows UAT | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REG-252-001 | V2-5.1 + V2-4 regression PASS | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REL-252-001 | Phase release gate PASS | Runtime evidence + automated test + Windows/cloud as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
