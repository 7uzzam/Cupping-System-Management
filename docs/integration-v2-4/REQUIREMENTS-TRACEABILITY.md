# V2-4 Requirements Traceability

**Phase:** V2-4 — Production Hybrid Cloud Sync, Multi-Device, Multi-Branch and Owner Operations
**Branch:** `integration/hybrid-cloud-owner-v2`
**Baseline:** V2-3.5 must remain green (REG-*).
**Rule:** No PASS without runtime evidence (Device A/B + remote when required). Empty cells forbidden. Do not remove rows.
**Cloud Sync:** Must become **PASS** (no MISSING exception in V2-4).

**Status legend:** `NOT_STARTED` | `IN_PROGRESS` | `FAIL` | `UNVERIFIED` | `PASS`

| ID | المطلوب | Definition of Done | Production files | Automated test | Device A evidence | Device B evidence | Remote evidence | Restart evidence | Failure-path evidence | Result |
|----|---------|--------------------|------------------|----------------|-------------------|-------------------|-----------------|------------------|----------------------|--------|
| PROTO-4-001 | Traceability file created with all V2-4 IDs before code changes | File committed; git history shows before production commits | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| PROTO-4-002 | Completion verifier scripts/verify-v2-4-completion.cjs fails if any row not PASS | Exit 1 on FAIL/UNVERIFIED; Cloud Sync must be PASS (no MISSING exception) | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| PROTO-4-003 | PR Release Gate workflow v2-4-release-gate.yml enforces tests/build/real-cloud/verify | GHA run URL; merge blocked on failure | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| PROTO-4-004 | Windows cloud test workflow v2-4-cloud-test.yml | GHA run URL + artifacts | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| PROTO-4-005 | Real-cloud UAT workflow v2-4-real-cloud-uat.yml with protected env | GHA run URL; secrets never logged | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| PROTO-4-006 | V2-3.5 regression suite remains green throughout V2-4 | npm test + install lifecycle evidence; REG rows PASS | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| PROTO-4-007 | Final report sections A/B/C with Unimplemented=NONE | 17-RELEASE-READINESS.md | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| PROTO-4-008 | Delivery pack: PR, runs, installer, ZIPs, SHA-256, evidence, clean git | 16-REAL-CLOUD-EVIDENCE-INDEX.md | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| ARCH-001 | Document current cloud reality from actual code (not stale docs) | 00-CURRENT-CLOUD-REALITY.md matches cloud/* + electron/* | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| ARCH-002 | Document target architecture Local SQLite → Outbox → Sync → Drive → peers | 01-TARGET-ARCHITECTURE.md | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| ARCH-003 | Module wiring matrix: REAL/WIRED/LOCAL/MOCK/DEAD/MISSING with imported/initialized/called/persisted | 02-MODULE-WIRING-MATRIX.md | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| ARCH-004 | Architecture docs updated to match production (SQLite primary; Drive is transport) | ARCHITECTURE-CURRENT.md or v2-4 docs reconciled | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| ARCH-005 | No module claimed REAL without end-to-end evidence | Traceability Result column | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| AUTH-001 | Google Authentication ≠ Owner Authorization enforced at trusted layer | Unauthorized Google cannot create Owner/org/branch | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| AUTH-002 | Role checks at Service/IPC/Repository/remote — not UI hide only | Direct IPC/service/role tamper rejected | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| AUTH-003 | Tampered local role rejected for authorization-sensitive ops | Evidence of denial + audit | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| AUTH-004 | DevTools manipulation cannot grant Owner/remote rights | Negative UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OAUTH-001 | Real Google OAuth Authorization Code (+PKCE if applicable) on installed release | 03-OAUTH-REAL-UAT.md + Device A connect log | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OAUTH-002 | Refresh token in OS-protected storage; Renderer never sees refresh token | token-store inspect + security test | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OAUTH-003 | Access token expiry triggers refresh and continues sync | Fault injection + real refresh evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OAUTH-004 | OAuth revoke/disconnect: local work continues; reconnect flushes queue | UAT Scenario 13 | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OAUTH-005 | Invalid grant / unauthorized account rejected for existing center | Negative UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OAUTH-006 | Callback server binds loopback only and stops cleanly | oauth-loopback test | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OAUTH-007 | Scopes minimal + documented; secrets not in Git/logs/artifacts | 03-OAUTH-REAL-UAT.md + redaction checks | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OAUTH-008 | Account disconnect does not delete local business DB/outbox | Before/after row counts | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| ORG-001 | Organization ID stable across restart/update/reinstall app-only | IDs before/after | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| ORG-002 | Organization visible in Owner Hub and remote structure | Owner Hub E2E | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| CENTER-001 | Center ID fixed for life; cloud root keyed by centerId not name | Rename center; paths unchanged | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| CENTER-002 | Rename center does not change centerId or Drive root | Remote path evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| CENTER-003 | Reconnect OAuth / license renew does not change centerId | UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| CENTER-004 | Cannot join second center without explicit Switch/Reset | Negative UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| CENTER-005 | Device cannot bind two centers simultaneously without authorized switch | Negative UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OWNER-001 | Valid bootstrap token creates first Owner once; usage/hash durable | 04-OWNER-HUB-END-TO-END-UAT.md | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OWNER-002 | Expired/invalid/reused token rejected | Negative tests | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OWNER-003 | Race: two devices same token — only one succeeds | Concurrent UAT evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OWNER-004 | Allowlist (if any) is remote/trusted policy not Renderer secret | Source + runtime | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OWNER-005 | Owner Hub shows org/center/branches/devices/sync health/license limits | Screenshots + remote verify | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OWNER-006 | Owner Hub branch create/rename/disable persists remotely and to Device B | A→B after sync | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OWNER-007 | Owner Hub device approve/reject/revoke works remotely | Device registry remote | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OWNER-008 | Owner Hub audit for every Owner action | Audit rows | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OWNER-009 | Employee cannot access Owner Hub (UI+IPC+Service) | Denial evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OWNER-010 | Branch Admin limited per policy; cannot create branches | Denial evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| BRANCH-001 | Device activation lists only allowed branches; no New Branch; no auto-enroll | UI + enrollment tests | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| BRANCH-002 | enrollBranch requires trusted source + real authorization | Service rejection without source | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| BRANCH-003 | Branch IDs stable; rename does not change branchId | Remote+local IDs | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| BRANCH-004 | Disable/reactivate branch enforced | UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| BRANCH-005 | Branch isolation in UI filters | 12-BRANCH-ISOLATION-UAT.md | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| BRANCH-006 | Branch isolation in IPC handlers | Hostile IPC attempt denied | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| BRANCH-007 | Branch isolation in Services | Direct service call denied | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| BRANCH-008 | Branch isolation in Repository/SQLite WHERE | Query evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| BRANCH-009 | Branch isolation in Outbox events | Outbox branchId checks | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| BRANCH-010 | Branch isolation in Cloud paths/manifests | Path traversal denied | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| BRANCH-011 | Branch isolation in backups/attachments/audit/export | Negative UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| DEVICE-001 | Device UUID stable across app-only uninstall/reinstall | Before/after deviceId | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| DEVICE-002 | Remote device registry with status pending/approved/revoked | Remote license/device doc | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| DEVICE-003 | Owner approval required per policy; license device limit enforced | Limit exceeded rejected | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| DEVICE-004 | Revoked device cannot push/pull; local DB preserved | Scenario 11 | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| DEVICE-005 | Full wipe creates new local identity requiring re-enrollment | Scenario 21 | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| DEVICE-006 | Cloned userData / duplicate device ID handled safely | Negative UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| DEVICE-007 | lastSync/pending/conflict counts real not hardcoded | Owner Hub values match SQLite | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| DB-001 | Local SQLite is source of truth for synced operational data | Writes land in SQLite first | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| DB-002 | Synced writes use SQLite transactions | Atomic commit evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| DB-003 | Record metadata: id, branchId, timestamps, revision, deviceId, actorId, schemaVersion, tombstone | Schema + row inspect | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| DB-004 | Soft delete/tombstone for synced deletes | Delete sync UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| DB-005 | Stable IDs never reused | Constraint/test | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| DB-006 | Failed open/migration never silently creates empty replacement DB | DATA-loss rules; diagnostic copy | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| DB-007 | Integrity check + backup-safe migrations | Migration UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| REPO-001 | Unified Repository path for all synced tables (no UI→Cloud direct writes) | Call tracing / coverage | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| REPO-002 | No direct localStorage writes for synced tables after V2-4 | Inventory + tests | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| REPO-003 | SQLite adapter for Repository operational tables | Repos via better-sqlite3 | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| REPO-004 | Branch-scoped repository queries enforced | Isolation tests | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OUTBOX-001 | Durable Outbox table in SQLite (not in-memory / not localStorage-only) | 06-OUTBOX-INBOX-DESIGN.md + schema | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OUTBOX-002 | Outbox fields: eventId, centerId, branchId, table, recordId, op, revisions, payload/hash, device/actor, attempts, status, idempotencyKey, lastError | Schema match | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OUTBOX-003 | Business mutation + outbox insert atomic in one transaction | Crash mid-write test | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OUTBOX-004 | Restart preserves pending outbox | Restart evidence Device A | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OUTBOX-005 | Failed push does not delete outbox event | Fault injection | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OUTBOX-006 | ACK only after verified remote write | Idempotent retry UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OUTBOX-007 | Dead-letter after bounded retries with recoverable UI | Dead-letter UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OUTBOX-008 | Exponential backoff + jitter; no infinite tight loop | Timing evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OUTBOX-009 | Logout/cloud disconnect does not wipe pending business events | Counts preserved | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OUTBOX-010 | Full wipe warns about unsynced pending changes | UI/NSIS or in-app warning | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OUTBOX-011 | Outbox scoped per branch | Isolation | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| INBOX-001 | Applied-event ledger for idempotent remote apply | Schema + replay test | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| INBOX-002 | Duplicate remote event/file revision ignored safely | Replay UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| INBOX-003 | Atomic local apply of remote batch; failure recoverable | Interrupted pull UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| SYNC-001 | Cloud Sync end-to-end REAL (not Backup, not manual snapshot) | Cloud Sync=PASS in gate | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| SYNC-002 | A→B automatic sync of create/edit/delete | Scenario 3 | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| SYNC-003 | B→A peer sync | Scenario 4 | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| SYNC-004 | Startup opens Local immediately; sync background non-blocking | Perf + UX | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| SYNC-005 | Manual Sync Now works | Scenario | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| SYNC-006 | Sleep/wake / network online triggers controlled flush without duplicate poll loops | Scenario 22 | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| SYNC-007 | Sync status observable: online/offline, pending, last push/pull, errors | UI + OBS rows | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| PUSH-001 | Push pipeline: local → outbox → remote file/event → manifest → ACK | Logs + remote IDs | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| PUSH-002 | Create client A→B | IDs match | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| PUSH-003 | Edit client A→B | Revisions | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| PUSH-004 | Visit create sync | Counts | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| PUSH-005 | Invoice+payment relation sync | Counts | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| PUSH-006 | Appointment sync | Counts | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| PUSH-007 | Employee/config per auth | Counts | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| PUSH-008 | Inventory movement sync | Ledger | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| PUSH-009 | Tombstone delete sync | Delete visible B | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| PUSH-010 | Attachment metadata sync | 14-ATTACHMENT-SYNC-UAT.md | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| PUSH-011 | Settings update sync | Settings | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| PUSH-012 | Rapid multi-edits same record coalesce/version correctly | No lost updates policy | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| PUSH-013 | 100+ queued changes flush | Perf profile | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| PUSH-014 | Restart during push recoverable/idempotent | Scenario 15 | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| PUSH-015 | Network drop after remote write before ACK → idempotent retry | Scenario 15 | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| PUSH-016 | Rate limit handling without data loss | Scenario 14 | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| POLL-001 | Poll manifest first; download only changed objects | API call counts / bytes | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| POLL-002 | No full Operational snapshot on no-change poll | Perf evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| POLL-003 | Overlap poll forbidden | Guard test | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| POLL-004 | App quit during pull leaves no half-applied state | Scenario 16 | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| POLL-005 | Corrupt remote quarantined; local preserved | Scenario 17 | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| POLL-006 | Remote newer/older schema handled per policy | 15-MIGRATION-COMPATIBILITY.md | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| POLL-007 | Manual sync during automatic poll safe | UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| POLL-008 | Device B closed then starts pulls A changes | Scenario 2/3 | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| VERS-001 | Remote versions/manifest with per-table/branch revision, checksum, schema/format versions | Remote JSON evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| VERS-002 | Atomic remote replace: temp → verify → commit → update manifest → cleanup | Adapter tests + remote listing | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| VERS-003 | Remote file IDs persisted; not name-only | Drive file IDs saved | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| VERS-004 | Branch A poll does not read Branch B operational manifests (except Owner aggregate) | Isolation | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| MERGE-001 | Per-table merge policies documented and implemented | 05-DATA-SYNC-CATALOG.md | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| MERGE-002 | Clients field-aware merge/conflict | UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| MERGE-003 | Visits append-focused rules | UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| MERGE-004 | Invoices/payments not blind LWW | UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| MERGE-005 | Appointments conflict rules | UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| MERGE-006 | Attendance event-based | UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| MERGE-007 | Inventory movements append-only ledger | UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| MERGE-008 | Settings owner/admin policy | UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| MERGE-009 | Users/roles authorization-sensitive remote trusted | UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| MERGE-010 | Deletes use tombstone retention policy | UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| CONF-001 | Same-record concurrent edit detects conflict (no silent overwrite) | 07-CONFLICT-RESOLUTION-UAT.md | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| CONF-002 | Conflict stores base/local/remote snapshots + actors | Conflict record inspect | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| CONF-003 | Conflict Center UI real and operable | Screenshot + resolution | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| CONF-004 | Keep local / keep remote / field merge per policy | Resolution UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| CONF-005 | Resolution creates new revision and syncs to all devices | Propagation A/B | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| CONF-006 | Update/delete and delete/update conflicts handled | Scenario 8 | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| CONF-007 | Duplicate identical change is not a conflict | UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| CONF-008 | Restart-safe conflict queue; no outbox storm | UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| LOCK-001 | Record locks if used: TTL, renew, release, stale recovery, branch scope, auth | Lock UAT or documented advisory-only | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| LOCK-002 | Lock is not substitute for conflict detection | Design doc + tests | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| LOCK-003 | No permanent locks after crash | Crash UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OFFLINE-001 | Full offline create/edit operational data on Device A | 13-OFFLINE-QUEUE-UAT.md | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OFFLINE-002 | Offline restart preserves data + outbox | Restart evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OFFLINE-003 | UI shows Offline + pending count without blocking work | Screenshot | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OFFLINE-004 | Reconnect flushes; B receives; no duplicates/loss | Scenario 5 | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OFFLINE-005 | Extended offline via clock abstraction/test mode without breaking signatures | Test mode evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| RETRY-001 | Error classification taxonomy implemented | Error codes in logs/UI | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| RETRY-002 | Retryable vs non-retryable mapping with backoff | Unit + fault injection | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| RETRY-003 | No empty catch; no silent queue wipe on error | Code + tests | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| ATT-001 | Attachments content-addressed or stable IDs with SHA-256 | 14-ATTACHMENT-SYNC-UAT.md | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| ATT-002 | Not embedded in huge JSON; separate upload path | Remote layout | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| ATT-003 | Resumable/interrupted upload recovery | UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| ATT-004 | MIME/extension validation; no path traversal; no exe auto-open | Security UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| ATT-005 | Branch-scoped attachment access | Isolation | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| ATT-006 | Dedup by hash; orphan cleanup policy | UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| ATT-007 | Corrupt download detected; retry | UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| BACKUP-001 | Backup remains separate from Sync (Snapshot) | 08-BACKUP-RESTORE-CLOUD-UAT.md | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| BACKUP-002 | Manual + scheduled backup with checksum/manifest/schema/center metadata | UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| BACKUP-003 | Restore to staging validate before apply; rollback | UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| BACKUP-004 | Restore then sync reconciles without duplicate storm | Scenario 18 | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| BACKUP-005 | Backup failure does not stop local work | UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| BACKUP-006 | Encrypted backup if policy requires | UAT or N/A documented with evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| RESTORE-001 | Restore wrong center/license/branch rejected | Negative UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| RESTORE-002 | Corrupt backup rejected with diagnostic | Negative UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| RESTORE-003 | Interrupted restore recoverable | UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| AUDIT-001 | Audit for owner/branch/device/license/sync/conflict/restore/authz failures | Audit rows | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| AUDIT-002 | Audit fields complete; no tokens/passwords/secrets logged | Redaction tests | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OBS-001 | Observability surfaces real pending/inflight/conflicts/dead-letter/quota | Owner Hub + Branch UI | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| OBS-002 | Log rotation; diagnostics redacted | Security report | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| SEC-001 | IPC allowlist + payload validation | 09-SECURITY-THREAT-MODEL-AND-UAT.md | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| SEC-002 | No arbitrary Drive/file path access | Negative UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| SEC-003 | Tampered remote JSON rejected | Negative UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| SEC-004 | CSP remains strict; no external QR/fonts regression | V2-3.5 hybrid baselines | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| SEC-005 | contextIsolation on; nodeIntegration off; preload minimal | Electron security tests | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| SEC-006 | Zip-bomb / size limits on backups | Negative UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| SEC-007 | Dependency lockfile reproducible; npm ci clean | GHA | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| SEC-008 | PII redaction in diagnostics | Sample log scan | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| PERF-001 | Performance profile with ≥3 runs median for all listed ops | 10-CLOUD-PERFORMANCE-PROFILE.md | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| PERF-002 | Offline startup cloud overhead ≤1s vs baseline | Median table | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| PERF-003 | No-change poll does not download Operational snapshots | Bytes/API evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| PERF-004 | UI main-thread sync work ≤100ms freeze budget | Timing | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| PERF-005 | 1000-event flush measured; memory bounded over 30m poll | Profile JSON | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| QUOTA-001 | Quota/rate-limit errors classified; no data loss; retry/backoff | Scenario 14 | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| MIG-001 | Local schemaVersion + cloud formatVersion + migration lock/backup/rollback | 15-MIGRATION-COMPATIBILITY.md | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| MIG-002 | Upgrade from V2-3.5 dataset | Migration UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| MIG-003 | Mixed app versions A new / B old safe | Scenario 25 | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| MIG-004 | Interrupted migration recoverable; idempotent | UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| MIG-005 | Unsupported newer remote schema does not corrupt local | Negative UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| UAT-001 | UAT-V2-4-CLOUD dataset created with required entities | Dataset manifest JSON | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| UAT-002 | Scenario 1 First Owner/Center bootstrap | 11-MULTI-DEVICE-WINDOWS-UAT.md | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| UAT-003 | Scenario 2 New Device Enrollment | Evidence A/B | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| UAT-004 | Scenario 3 A→B sync | Evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| UAT-005 | Scenario 4 B→A sync | Evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| UAT-006 | Scenario 5 Offline queue | Evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| UAT-007 | Scenario 6 Concurrent non-conflicting | Evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| UAT-008 | Scenario 7 Same-record conflict | Evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| UAT-009 | Scenario 8 Delete conflict | Evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| UAT-010 | Scenario 9 Branch isolation attack suite | Evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| UAT-011 | Scenario 10 Owner Hub runtime remote | Evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| UAT-012 | Scenario 11 Device revoke | Evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| UAT-013 | Scenario 12 Token expiry/refresh | Evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| UAT-014 | Scenario 13 OAuth revoke/reconnect | Evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| UAT-015 | Scenario 14 Quota/rate limit | Evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| UAT-016 | Scenario 15 Interrupted push | Evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| UAT-017 | Scenario 16 Interrupted pull | Evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| UAT-018 | Scenario 17 Corrupt remote | Evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| UAT-019 | Scenario 18 Backup/restore + sync | Evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| UAT-020 | Scenario 19 Update installed release preserves sync | Evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| UAT-021 | Scenario 20 App-only uninstall/reinstall preserves outbox+identity | Evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| UAT-022 | Scenario 21 Full wipe local only; remote not silently deleted | Evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| UAT-023 | Scenario 22 Sleep/wake/network change | Evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| UAT-024 | Scenario 23 Large queue ≥1000 events | Evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| UAT-025 | Scenario 24 Attachment sync | Evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| UAT-026 | Scenario 25 Different app versions | Evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| GHA-001 | v2-4-cloud-test.yml green | Run URL | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| GHA-002 | v2-4-real-cloud-uat.yml green with real Drive | Run URL | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| GHA-003 | v2-4-release-gate.yml green exit 0 | Run URL | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| GHA-004 | Artifacts uploaded; no secrets in logs | Artifact names + scan | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| REL-001 | Installed release (not npm start) used for final UAT on Device A and B | Installer SHA + install logs | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| REL-002 | Windows installer build succeeds | Artifact | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| REL-003 | verify:v2-4-release-gate exit 0 | Local+GHA log | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| REG-001 | V2-3.5 install/update/repair/uninstall data+license+device+branch preserved | Regression evidence | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |
| REG-002 | V2-3.5 icons/Electron/print/PDF/QR/backup/CSP/Owner RBAC still PASS | npm test + prior UAT | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED |

**Requirements total:** 223

## Closure checklist

- failed = 0
- unverified = 0
- unimplemented = NONE
- Cloud Sync = PASS
- V2-3.5 regression = PASS
- verify:v2-4-release-gate exit 0

