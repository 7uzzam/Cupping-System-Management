# V2-5.5 — Target Design

## Measurement

Every PERF metric: document host → run 3× → report median ms + samples. No claim without JSON evidence.

## Scale

Synthetic SQLite datasets at required cardinalities, measured load times, used by search/report/sync/backup benches.

## DB ops

`DbMaintenance`: ANALYZE strategy, index inventory + missing-index heuristic, EXPLAIN QUERY PLAN evidence, safe VACUUM policy, WAL checkpoint, FK + integrity checks. `busy_timeout` on open.

## Reliability

Crash markers during backup/sync/restore; bounded queues; retry backoff (no tight loop); log rotation; disk-full / low-memory classified errors; soak harness (SOAK_MS, 8h mode for UAT).

## Incremental backup

Remain unsupported; PERF-255-013 evidence = policy + measurement proving full-only path.
