# 17 — Release Readiness (V2-3.5)

## Cloud status (mandatory wording)

```text
Cloud Sync: MISSING — expected until V2-4
Backup: see hybrid backup tests (PASS only if all backup/restore tests pass)
Drive License Push/Pull: NOT Event Sync
Automatic latest branch restore: MISSING
Incremental sync: MISSING
Cross-device real-time sync: MISSING
```

## Gate

`npm run verify:release-gate` must exit 0.

## Ready flags

| Gate | Value |
|------|-------|
| Ready for V2-4 | YES only if failed=0 and unverified=0 (CLOUD-001 exception only) |
| Ready for develop | YES only if release gate passes |
| Ready for main | **NO** |

## Final report template

Filled after Windows UAT evidence lands — see PR description and `REQUIREMENTS-TRACEABILITY.md`.
