# 16 — License Persistence UAT

## Policy (V2-3.5)

| Event | License |
|-------|---------|
| Update | PRESERVE |
| Repair | PRESERVE |
| App-only uninstall | PRESERVE |
| App-only uninstall → reinstall | PRESERVE |
| Explicit full wipe (`/FULLWIPE=1` or UI double-confirm) | DELETE |
| Auto Updater / silent without flag | MUST NOT wipe |

## Evidence sources

- NSIS policy tests: `tests/baseline/test-nsis-cupping-center-wipe.js`
- uninstall-prep: `scripts/verify-uninstall-prep.js`
- Windows lifecycle: `docs/integration-v2/evidence/lifecycle-results.json` fields:
  - `UpdateLicensePreserved`
  - `RepairLicensePreserved`
  - `LicenseAfterAppOnlyUninstall`
  - `LicenseAfterReinstall`

## Test license

Use project License Builder / `npm run license:v6:issue` / commercial licensing test suite — **not** production licenses.
Passwords for UAT accounts only: `admin123` / `1234`.

## Cloud note

License revoke must not delete business database (LIC-008). Cloud Sync remains MISSING until V2-4.
