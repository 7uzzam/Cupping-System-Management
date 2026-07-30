# V2-5.6 — Target Design

## Goals

Improve operational UX and visibility without changing correct business behavior.

## Target surfaces

1. **OpsProgress** — honest stage/percent events for backup, sync, restore (never jump to 100% without completion).
2. **RestoreWizard** — select → validate → pre-summary → confirm → progress → post-summary.
3. **OpsStatusBar / Owner Hub** — offline, reconnect, pending, conflicts, dead-letter, last sync, per-device.
4. **BackupHistory** — list local V2 backups, validation state, restore-point selection.
5. **DangerConfirm** — typed/confirm for wipe and restore overwrite.
6. **ErrorRecovery** — map classify categories to actionable Arabic/English recovery copy.
7. **RedactedExport** — strip secrets/tokens from diagnostics and system-log export.
8. **A11y/i18n** — EN/LTR toggle path, focus/aria on critical dialogs, responsive/overflow safe.

## Non-goals

- Changing Backup V2 crypto format
- Fake incremental backup
- Softening RBAC or license gates
