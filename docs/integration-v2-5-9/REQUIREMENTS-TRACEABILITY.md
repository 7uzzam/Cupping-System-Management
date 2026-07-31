# V2-5.9 Requirements Traceability

**Ready for release: NO** · **Ready for main: NO** until independent review after Windows Setup EXE PASS.

Result values allowed in verifier: `PASS` | `FAIL` | `UNVERIFIED` | `PARTIAL`  
Any `FAIL` / `UNVERIFIED` / `PARTIAL` / `PENDING` / `TODO` / `SKIPPED` / `EXPECTED PASS` / blank → release gate **fails**.

| ID | Requirement | Production files | Automated test | Windows evidence | Failure path | Result |
|----|-------------|------------------|----------------|------------------|--------------|--------|
| R01 | Responsive layouts 1024–2560 + scaling 100–175% | `renderer/styles/design-system.css`, `cloud/boot-flow-ui.js` | `test-v2-5-9-final-activation.js` | LIVE-WINDOWS-UAT / RESPONSIVE-UAT | Cropped UI = FAIL | UNVERIFIED |
| R02 | Modals scrollable; sticky header/footer | design-system + BootFlow CSS | same | RESPONSIVE-UAT | Modal taller than viewport | UNVERIFIED |
| R03 | Activation page responsive grid (3/2/1 cols) | design-system `#licenseScreen` grid | same | RESPONSIVE-UAT | Long vertical stack only | UNVERIFIED |
| R04 | Google login production path | BootFlow + BackupBridge OAuth | unit + prior gates | ACTIVATION-FLOW-UAT | OAuth error | UNVERIFIED |
| R05 | Automatic activation discovery after Google | `boot-flow-ui.js` `autoDiscoverActivationAfterGoogle` | `test-v2-5-9-final-activation.js` | ACTIVATION-FLOW-UAT S1 | No scan = FAIL | UNVERIFIED |
| R06 | License pull (single auto / multi select) | `cloud/bootstrap.js` | drive-pull + v2-5-9 tests | ACTIVATION-FLOW-UAT | Silent wrong org | UNVERIFIED |
| R07 | License key activation | BootFlow license step | prior licensing tests | ACTIVATION-FLOW-UAT S2 | Invalid key path | UNVERIFIED |
| R08 | Organization/branches pull | CloudBootstrap / LicenseCloud | v2-5-9 | ACTIVATION-FLOW-UAT | Missing org | UNVERIFIED |
| R09 | First branch custom name (user-entered) | BootFlow `createFirstBranchFromForm` | v2-5-9 | ACTIVATION-FLOW-UAT S2 | Placeholder-as-name | UNVERIFIED |
| R10 | Device naming + binding upload | DeviceConfig / DeviceRegistry | v2-5-9 | ACTIVATION-FLOW-UAT | No Drive push | UNVERIFIED |
| R11 | Restart applies activation | BootFlow ready + restart flag | v2-5-9 | ACTIVATION-FLOW-UAT | Soft-only complete | UNVERIFIED |
| R12 | Data source: cloud/local/file/empty | BootFlow restore step | v2-5-9 | SYNC-RESTORE-UAT | Silent empty DB | UNVERIFIED |
| R13 | Cloud restore atomic + integrity | OpsUxBridge / RestoreWizard | prior restore tests | SYNC-RESTORE-UAT | Partial restore | UNVERIFIED |
| R14 | Initial sync after restart | SyncEngine / runNewDeviceBootstrap | v2-5-9 | SYNC-RESTORE-UAT | Sync off by default | UNVERIFIED |
| R15 | Sync/backup defaults after Google+License+Branch | ActivationSyncDefaults SSOT | v2-5-9 | SYNC-RESTORE-UAT | Conflicting toggles | UNVERIFIED |
| R16 | Device A/B sync | SyncEngine | prior v2-4/v2-5 | SYNC-RESTORE-UAT | Conflict/offline fail | UNVERIFIED |
| R17 | No Owner Bootstrap for Google users | BootFlow steps; startup/login gates | v2-5-9 | ACTIVATION-FLOW-UAT | Auto Owner wizard | UNVERIFIED |
| R18 | Owner seed login/password | `defaultUsers` owner | v2-5-9 | OWNER-HUB-UAT | No owner account | UNVERIFIED |
| R19 | DevTools Reset Owner Password (support) | developer-panel | v2-5-9 | OWNER-HUB-UAT | Create Owner daily | UNVERIFIED |
| R20 | Owner Hub real actions (no UI-only) | `owner-hub.js` | v2-5-9 + phase19 | OWNER-HUB-UAT | prompt errors / stubs | UNVERIFIED |
| R21 | Branch Drawer / selector All Branches | `branch-switcher.js` | v2-5-9 | OWNER-HUB-UAT | Per-page dropdowns | UNVERIFIED |
| R22 | Owner Mode operational read-only | `branch-scope.js` + OwnerBranchMode | v2-5-9 | OWNER-HUB-UAT | Cross-branch writes | UNVERIFIED |
| R23 | Approvals / pending devices in Hub | owner-hub | v2-5-9 | OWNER-HUB-UAT | Missing queue | UNVERIFIED |
| R24 | No duplicate activation panels in journey | inventory + BootFlow | v2-5-9 | ACTIVATION-FLOW-UAT | Duplicate OAuth | UNVERIFIED |
| R25 | Zero console/runtime errors on Setup EXE | — | — | LIVE-WINDOWS-UAT | Any error class | UNVERIFIED |
| R26 | Windows Setup EXE full UAT S1–S6 | — | — | LIVE-WINDOWS-UAT | Any scenario FAIL | UNVERIFIED |

## Totals (update after Windows)

| Metric | Value |
|--------|------:|
| Requirements total | 26 |
| Passed | 0 |
| Failed | 0 |
| Unverified | 26 |
| Unimplemented | NONE (code path present; Windows proof pending) |
