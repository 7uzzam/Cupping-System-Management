# Stage 2 Prep Report — Architecture Consolidation (NOT STARTED)

**Stage status:** **BLOCKED** (waiting Stage-1 PASS)  
**Destructive consolidation:** **NOT STARTED**  
**Prep landed:** inventory test + Backup V1 IPC deny (shared with Stage-1)

## Completed (prep only)

| Prep item | Status |
|-----------|--------|
| Dual-store inventory unit | PASS (`test-v2-5-10-stage2-inventory.js`) |
| Backup V1 main/IPC hard deny | CODE PASS |
| Sheets role assertion in inventory | PASS (license_registry_integration) |
| Documented merge targets | PASS (conflicts, attachments, activation surfaces) |

## Remains (after Stage-1 PASS only)

1. SQLite exclusive operational SoT — remove operational LS fallbacks  
2. Merge conflict storage → `sync_conflicts`  
3. Merge attachment metadata → one authoritative table  
4. BootFlow = only customer activation path  
5. Backup V2 = only official DR (delete V1 internals after migration proof)  
6. Remove duplicate login/license/restore panels  
7. Archive legacy runtime paths after proof  

## Blocks Stage 3

Stage 3 UX consolidation waits until Stage-2 migration proof (no breaking SoT changes mid-UX).

## Scores

Unchanged — Stage-2 not executed. See Stage-1 report baseline.
