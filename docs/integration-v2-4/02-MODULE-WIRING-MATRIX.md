# 02 — Module Wiring Matrix

| Module | Imported | Initialized | Called | Persisted | Restart-safe | Class (start of V2-4) | V2-4 target |
|--------|----------|-------------|--------|-----------|--------------|----------------------|-------------|
| SyncEngine | index.html | CloudV2.init | VersionsIndex bump | via SyncState | partial | WIRED BUT UNPROVEN | REAL + outbox |
| SyncState pendingPushes | yes | load() | queuePush | localStorage | weak | LOCAL ONLY | Replace/augment with SQLite outbox |
| DriveAdapter | yes | ensureConnected | upload/download | remote | yes if Electron | REAL/MOCK | REAL |
| google-drive provider | main | connect | uploadBackup/uploadSyncFile | Drive | token store | REAL | REAL |
| Repository | yes | createRepository | setAll | localStorage adapter | yes | LOCAL SoT | SQLite SoT + outbox |
| OwnerHub | yes | render | enroll/push | license.json Drive | partial | REAL local | REAL remote E2E |
| BranchEnrollment | yes | enrollBranch | Owner Hub | local+Drive license | yes | REAL | REAL + isolation |
| ConflictQueue | yes | enqueue | UI | localStorage | local only | LOCAL ONLY | REAL multi-device |
| LockManager | yes | rarely | local | localStorage | local | LOCAL ONLY | Advisory or synced w/ TTL |
| SQLite db service | main IPC | ensureDb | hydrate/persist | tadawi.db | yes | REAL clinic | + outbox/inbox |
| sync_outbox table | — | — | — | — | — | MISSING | REQUIRED |
| applied_events ledger | — | — | — | — | — | MISSING | REQUIRED |

Update this matrix as modules graduate to REAL with evidence links.
