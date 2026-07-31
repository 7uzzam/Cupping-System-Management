# V2-5.8 Current Reality

Fragmented Google/license/branch/owner UIs consolidated into BootFlow V2-5.8 wizard.
Duplicate login/license Google panels hidden. Owner password mandatory (min 8).
Dashboard gated until activation complete.

Owner creation paths (self-healing):
1. **Method 1 (primary):** BootFlow → Google → License → Organization → Owner Bootstrap
2. **Method 2 (automatic):** If Organization has NO Owner → auto-open Owner Bootstrap Wizard (restore/migration/transfer/upgrade/rebinding) — not Developer Tools
3. **Method 3 (emergency only):** Developer Tools → Owner Emergency Recovery (repair/diagnostics/create-first)

Day-to-day Owner CRUD after first Owner: **Owner Hub** (same `OwnerManagement.createOwner()`).
Live production close blocked until `LIVE-PRODUCTION-SMOKE.md` is fully exercised on installed Windows Setup EXE.
