# SQLite Source of Truth Cutover

| Item | Status |
|------|--------|
| `enqueueAtomicPersistTable` in main syncOp | CODE |
| `SqliteBridge.commitOperational` | CODE |
| `enableSqlitePrimary` IPC | CODE |
| Write-through fails loudly (no silent LS-only success for users/settings) | CODE |
| Dual-write divergence eliminated on all paths | PARTIAL — legacy `DB.set` still optimistic-UI; commit failure notifies |
| Same-transaction outbox for every UI write | PARTIAL — Repository bump still best-effort enqueue |
| Windows proof | **UNVERIFIED** |

## Rule

Operational SoT = SQLite. localStorage = cache / UI prefs only.

## Tests

- Unit: v2-5.9 + rbac audit  
- Windows: MULTI-DEVICE-WINDOWS-UAT **UNVERIFIED**
