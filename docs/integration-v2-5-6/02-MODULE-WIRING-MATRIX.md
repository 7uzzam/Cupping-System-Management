# V2-5.6 — Module Wiring Matrix (Gate A plan)

| Target module | Status pre-B | Will wire into |
|---------------|--------------|----------------|
| `cloud/ops-progress.js` | MISSING | backup/sync/restore callers + UI |
| `cloud/restore-wizard.js` | MISSING | index.html / IPC |
| `cloud/ops-status.js` | MISSING | Owner Hub + settings status |
| `cloud/backup-history-ui.js` | MISSING | Backup V2 list/inspect |
| `cloud/danger-confirm.js` | MISSING | wipe/restore overwrite |
| `cloud/error-recovery-ux.js` | MISSING | drive-errors / classify |
| `cloud/ops-log-redact.js` | MISSING | exportSystemLogs / diagnostics |
| `cloud/ux-i18n.js` | MISSING | lang/dir toggle helpers |
| `renderer/styles/design-system.css` | UNWIRED | index.html link |
| electron progress events | PARTIAL | preload + main IPC stream |

Imported / Initialized / Called / Persisted / Restart-safe columns filled after Gate B.
