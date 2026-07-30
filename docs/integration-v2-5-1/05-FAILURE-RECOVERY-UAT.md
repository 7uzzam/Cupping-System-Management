# V2-5.1 — Failure & Recovery UAT Plan

**Status:** NOT_STARTED (plan only)

| Scenario | Expected | Requirement |
|----------|----------|-------------|
| Wrong password | Fail; live DB untouched | REST-251-026 |
| Corrupt `.tdw` | Fail; diagnostic; live intact | REST-251-026, DR-251-014 |
| Wrong centerId | Reject before swap | REST-251-024 |
| Unauthorized branch | Reject before swap | REST-251-025 |
| Failpoint after first swap | Rollback; reopen DB | REST-251-027 |
| Network drop mid cloud download | Resume or clear recoverable error | REST-251-028 |
| App kill mid restore | No silent empty DB; recoverable message | REST-251-029, DR-251-013/015 |
| Partial attachment failure | Report unrestorable; no silent ignore | DR-251-007/012 |
| Disk full (ENOSPC) | Friendly error; no wipe | DR-251-015 |
| No local + no cloud | Clear failure; no empty fallback | DR-251-005/006/013 |

Evidence paths will be recorded under `docs/integration-v2-5-1/evidence/` after real runs.
