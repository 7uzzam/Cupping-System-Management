# V2-5.1 — Windows UAT Plan

**Status:** NOT_STARTED (plan only — no fabricated results)

## Device A — full restore UAT (UAT-251-001)

1. Install release NSIS / run win-unpacked from Gate D build.
2. Activate license, select organization + authorized branch.
3. Seed operational data + attachments/images/documents.
4. Create Backup V2 `.tdw` (local) and optional cloud upload.
5. Record row counts + attachment hashes.
6. Simulate loss (delete `database/tadawi.db` or wipe operational AppData keeping backup).
7. Restore via production UI/IPC.
8. Restart application.
9. Verify counts, hashes, integrity_check, users/permissions, settings.
10. Run sync; confirm no duplicates (REST-251-020).

## Device B — new-device restore UAT (UAT-251-002)

1. Clean install on second profile/device path.
2. License + org + authorized branch only.
3. Restore from cloud backup (no local backup) or copy authorized `.tdw`.
4. Reject wrong-center and wrong-branch backups.
5. Restart; verify identity binding preserved and data present.

## Artifacts to collect (no secrets)

- Installer path + SHA-256
- win-unpacked path
- Before/after row count JSON
- Attachment hash JSON
- Restore logs (redacted)
- Screenshots of restore progress/success/failure messages
- Commit SHA + PR URL + GHA run URL

## Environment note

Cloud agent host may be Linux; Windows evidence comes from `npm run build:win` artifacts plus Windows GHA runner and/or local Windows UAT when available. Unit-only Linux smoke is not sufficient for UAT-251-* PASS.
