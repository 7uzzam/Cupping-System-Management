# V2-5.6 — Current Reality (UX Hardening & Operational Visibility)

**Branch:** `cursor/v2-5-6-ux-hardening-c2ea`
**Baseline:** V2-5.5 tip `ddbefda` (GHA green)

## Summary

Engine-level Backup V2 / sync outbox / conflict queue / Owner Hub / error classify are largely **REAL**. Operator UX for restore wizard, live progress, pause/cancel/retry, backup history picker, redacted ops export, EN/a11y, and guided recovery is largely **MISSING** or **WIRED BUT UNPROVEN**.

## Module classification (Gate A)

| Area | Status |
|------|--------|
| Backup V2 create/restore (electron) | REAL |
| Transfer byte progress helpers | REAL |
| Live progress UI / progress bar | MISSING |
| Restore multi-step wizard | MISSING |
| Sync pause/resume engine | REAL |
| Sync pause/resume/retry operator UI | MISSING |
| Offline banner | REAL |
| Pending/DL/conflict counts in Hub | WIRED BUT UNPROVEN |
| Backup V2 history + restore-point picker UI | MISSING |
| Factory wipe confirmation | REAL |
| Restore overwrite typed confirm + pre/post summary | MISSING / PARTIAL |
| AR + RTL default | REAL |
| EN toggle + design-system.css wired | MISSING / UNWIRED |
| Ops log export | REAL (unredacted) |
| Redacted export | MISSING |
| Token/quota/permission messages | REAL |
| Guided recovery surface | MISSING |
| Fake 100% backup progress bar | N/A (no bar yet) |

## Gaps before Gate B

1. Restore wizard + honest progress streaming
2. Sync/backup/restore pause·cancel·retry UX
3. Ops visibility (pending/DL/conflicts/offline/reconnect/last sync/per-device)
4. Backup history + restore-point + validation state
5. Dangerous restore confirm + pre/post summaries
6. Redacted ops export + Owner Hub overview hardening
7. i18n EN/LTR + a11y focus/aria on critical dialogs
8. Screenshots / visual regression evidence
