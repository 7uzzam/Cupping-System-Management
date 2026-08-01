# V2-5.9 Residual Closure Tracker

| Blocker | Code | Unit | Windows Setup EXE |
|---------|------|------|-------------------|
| Residual optimistic `DB.set` operational cache | REMOVED (`__noOptimisticOperational`, commit-then-cache, restoreLastCommit) | `test-v2-5-9-residual-closure.js` | **UNVERIFIED** |
| Legacy silent `branchId→BR-MAIN` | Explicit `LegacyBranchMigration` + mapping + push block | same | **UNVERIFIED** |
| Attachment lifecycle live path | `AttachmentLifecycle` + `attachments-ipc` | same | **UNVERIFIED** |
| Google Sheets Windows harness | `SHEETS_ROLE` + `simulateHttpFailure` + capability matrix | same | **UNVERIFIED** |

**Sheets role (official):** `license_registry_integration` — **NOT** Source of Truth.  
Operational SoT = SQLite. Runtime branches/devices = signed Drive `license.json`.  
Vault never overwrites Drive/SQLite ops from a stale/manual spreadsheet.

Ready for release: **NO**  
Ready for main: **NO**
