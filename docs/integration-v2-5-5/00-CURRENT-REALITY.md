# V2-5.5 — Current Reality (Performance, Scale & Reliability)

**Branch:** `cursor/v2-5-5-performance-c2ea`
**Baseline:** V2-5.4 tip `5e376de` (release gate green)

## Summary

WAL + outbox batching + Backup V2 full-only policy are REAL. Clinic-scale synthetic datasets MISSING. ANALYZE/VACUUM/busy_timeout MISSING. Perf harness with median-of-3 MISSING. UI search/dashboard still in-memory. Incremental backup unsupported (documented). Runtime mem/CPU soak MISSING. `pendingPushes` unbounded under failure.

## Gaps (pre-implementation)

1. Perf harness (host doc + median of 3) for startup/dash/search/report/export/import/backup/sync
2. Scale generators: 100k clients / 500k visits / 50k invoices & appointments / 10k attachments meta
3. SQLite maintenance: busy_timeout, ANALYZE, index inventory, query plans, VACUUM policy, WAL checkpoint, FK/integrity
4. Reliability: crash mid backup/sync/restore, soak/memory, idle CPU, retry backoff proof, disk-full, low-mem, log rotation, queue bound
5. Before/after benchmark + no claim without measurement
