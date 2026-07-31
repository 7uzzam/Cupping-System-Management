# V2-5.8 Release Readiness

Ready for independent review: YES (when gate PASS + GHA green) — **automated/code path only**
Ready for main: NO
**V2-5.8 complete / production close: NO** until `docs/integration-v2-5-8/LIVE-PRODUCTION-SMOKE.md` is fully PASS on an installed Windows Setup EXE with real Google/license data.

Automated CI / unit tests / Windows **build** alone do **not** close this phase.

## Live smoke
- Checklist: `docs/integration-v2-5-8/LIVE-PRODUCTION-SMOKE.md`
- Owner Method 2: **automatic** Owner Bootstrap Wizard when org has no Owner (`BootFlow.ensureOwnerBootstrapWizard`) — Developer Tools are **emergency recovery only**
- Owner Method 3: Developer Tools → Owner Emergency Recovery (`license/ui/developer-panel.js`)
- Day-to-day Owner CRUD: **Owner Hub** via `cloud/owner-management.js` (`createOwner`)
- After manual FAIL: Root Cause → fix → tests → rebuild Setup EXE → full re-test from Clean Install

## GHA
- Push (tests + Windows build + UAT success; artifact upload may warn on quota): https://github.com/7uzzam/Cupping-System-Management/actions/runs/30613813966

## Notes
Artifact storage quota can fail the upload step without failing npm test / build:win / UAT. Workflow upload is `continue-on-error: true`.
