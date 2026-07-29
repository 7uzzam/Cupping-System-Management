# V2-3.5 Requirements Traceability

**Phase:** V2-3.5 — Windows Build, Install Lifecycle and Runtime Verification  
**Branch:** `integration/hybrid-cloud-owner-v2`  
**Rule:** No PASS without runtime evidence. Empty cells forbidden. Do not remove rows.  
**Cloud Sync exception:** `CLOUD-001` may remain `MISSING — expected until V2-4`. All other V2-3.5 rows must be PASS before phase close.

**Status legend:** `NOT_STARTED` | `IN_PROGRESS` | `FAIL` | `UNVERIFIED` | `PASS` | `MISSING — expected until V2-4`

---

## Protocol / process gates

| ID | المطلوب | الملفات المعدلة | الاختبار | Runtime evidence | النتيجة |
|----|---------|-----------------|----------|------------------|---------|
| PROTO-001 | Traceability file created with all IDs before code changes | `docs/integration-v2/REQUIREMENTS-TRACEABILITY.md` | `scripts/verify-v2-3-5-completion.cjs` | File committed before implementation commits | NOT_STARTED |
| PROTO-002 | Completion verifier script fails if any V2-3.5 row not PASS (except CLOUD-001) | `scripts/verify-v2-3-5-completion.cjs`, `package.json` | `npm run verify:release-gate` | Exit code + log | NOT_STARTED |
| PROTO-003 | PR Release Gate workflow runs npm ci/test/build:win/verify:release-gate | `.github/workflows/v2-3-5-release-gate.yml` | GHA workflow | GHA run URL | NOT_STARTED |
| PROTO-004 | Windows UAT workflow builds real installer + uploads artifacts | `.github/workflows/windows-uat.yml` | GHA workflow | GHA run URL + artifact names | NOT_STARTED |
| PROTO-005 | Final report sections A/B/C with Unimplemented = NONE | `docs/integration-v2/17-RELEASE-READINESS.md` | human+gate | Final report file | NOT_STARTED |
| PROTO-006 | Delivery pack: PR link, GHA runs, artifacts, SHA-256, logs, screenshots, clean git | `docs/integration-v2/evidence/` | gate | Evidence index | NOT_STARTED |

---

## A — Install / Update / Uninstall policy

| ID | المطلوب | الملفات المعدلة | الاختبار | Runtime evidence | النتيجة |
|----|---------|-----------------|----------|------------------|---------|
| UPD-001 | Update preserves DB/clients/visits/invoices/staff/appointments/settings/attachments/backups | `build/installer.nsh` | lifecycle UAT | Install lifecycle report + checksums | NOT_STARTED |
| UPD-002 | Update preserves license | `build/installer.nsh`, `electron/uninstall-prep.js` | lifecycle UAT | License checksum before/after | NOT_STARTED |
| UPD-003 | Update preserves Device ID | same | lifecycle UAT | Device ID before/after | NOT_STARTED |
| UPD-004 | Update preserves Branch binding | same | lifecycle UAT | Branch ID before/after | NOT_STARTED |
| UPD-005 | Update preserves OAuth state allowed to persist + owner/branch local metadata | same | lifecycle UAT | Path existence after update | NOT_STARTED |
| UPD-006 | No AppData wipe during Upgrade (`isUpdated`) | `build/installer.nsh` | `test-nsis-cupping-center-wipe.js` + Windows silent update | Installer log | NOT_STARTED |
| REP-001 | Repair/reinstall same version preserves all data+license+device+branch | installer + UAT scripts | lifecycle UAT | Lifecycle matrix row | NOT_STARTED |
| UNS-001 | Default uninstall is App-only (program files only) | `build/installer.nsh` | nsis tests + Windows uninstall | userData still present | NOT_STARTED |
| UNS-002 | App-only uninstall preserves business data (DB, attachments, settings, backups) | same | lifecycle UAT | Checksums | NOT_STARTED |
| UNS-003 | App-only uninstall preserves license (must NOT wipe license by default) | `build/installer.nsh`, `electron/uninstall-prep.js` | nsis+prep tests + UAT | License still valid after reinstall | NOT_STARTED |
| UNS-004 | App-only uninstall preserves Device identity | same | UAT | Device ID same | NOT_STARTED |
| UNS-005 | App-only uninstall preserves Branch binding | same | UAT | Branch ID same | NOT_STARTED |
| UNS-006 | Silent uninstall default = App-only; never full wipe without explicit flag | `build/installer.nsh` | silent uninstall script | Uninstall log | NOT_STARTED |
| UNS-007 | Full wipe never from Auto Updater / Repair / Update / silent without flag | same | code+UAT | Logs prove no wipe | NOT_STARTED |
| WIPE-001 | Full wipe is separate explicit option with clear warning | `build/installer.nsh` | nsis policy test | MessageBox text | NOT_STARTED |
| WIPE-002 | Full wipe requires second confirmation | same | nsis policy test | MessageBox sequence | NOT_STARTED |
| WIPE-003 | Full wipe not default-selected | same | nsis policy test | Default mode=0 | NOT_STARTED |
| WIPE-004 | Full wipe deletes only app-scoped paths | same | UAT full wipe | Path list after wipe | NOT_STARTED |
| DATA-001 | Canonical userData path fixed: `%APPDATA%\Cupping Center` before BrowserWindow/DB | `electron/main.js` | unit+runtime | Path log | NOT_STARTED |
| DATA-002 | Discover legacy userData paths (productName/appId/Cursor/Codex/AR/EN names) | migration module | migration tests | Discovery log | NOT_STARTED |
| DATA-003 | Backup before migration | migration module | migration tests | Backup path + checksum | NOT_STARTED |
| DATA-004 | Copy to canonical path; verify SQLite integrity/checksum | migration module | migration tests | integrity_check OK | NOT_STARTED |
| DATA-005 | Do not delete source until apply success; migration marker prevents repeats | migration module | migration tests | Marker file | NOT_STARTED |
| DATA-006 | Migration logged | migration module | migration tests | Log lines | NOT_STARTED |
| DATA-007 | Failed DB open/migration must STOP, preserve files, diagnostic copy, recoverable error, rollback — never silent empty DB | DB open path | tests | Error path evidence | NOT_STARTED |

---

## B — Install performance

| ID | المطلوب | الملفات المعدلة | الاختبار | Runtime evidence | النتيجة |
|----|---------|-----------------|----------|------------------|---------|
| PERF-001 | Instrument Start/End timings for all install/update/uninstall stages | installer timing scripts | Windows UAT | `12-INSTALL-PERFORMANCE-PROFILE.md` | NOT_STARTED |
| PERF-002 | Installer startup median ≤5s | same | 3 runs | Timing table | NOT_STARTED |
| PERF-003 | Clean install median ≤30s | same | 3 runs | Timing table | NOT_STARTED |
| PERF-004 | Update apply median ≤30s | same | 3 runs | Timing table | NOT_STARTED |
| PERF-005 | Repair median ≤30s | same | 3 runs | Timing table | NOT_STARTED |
| PERF-006 | App-only uninstall median ≤15s | same | 3 runs | Timing table | NOT_STARTED |
| PERF-007 | Root-cause of slowness identified and fixed (not delay hacks) | quit/kill/asar/files | timings before/after | Root cause write-up | NOT_STARTED |
| PERF-008 | Graceful quit: close SQLite, stop OAuth server, workers, tray, hidden windows | `electron/main.js` etc. | unit+UAT | Quit log | NOT_STARTED |
| PERF-009 | Size breakdown; exclude user data/tests/docs/git/artifacts from installer | `package.json` files filter | build size report | Size report | NOT_STARTED |
| PERF-010 | Native modules built at CI/build time, not end-user install | build config | Windows build log | No compile-at-install | NOT_STARTED |
| PERF-011 | afterPack/resedit runs once on main EXE only | afterPack script | build log | Single edit log | NOT_STARTED |
| PERF-012 | Update must not run huge attachment zip backup every time without progress/timeout | update/backup policy | UAT | Timing of backup stage | NOT_STARTED |
| PERF-013 | App-only uninstall must not scan/delete AppData DB/license/backups | installer.nsh | UAT | Paths remain | NOT_STARTED |

---

## C — Build & icons

| ID | المطلوب | الملفات المعدلة | الاختبار | Runtime evidence | النتيجة |
|----|---------|-----------------|----------|------------------|---------|
| BUILD-001 | `npm ci` succeeds on clean Windows runner | lockfile/.npmrc | GHA | GHA log | NOT_STARTED |
| BUILD-002 | `npm test` all PASS, 0 skipped, count ≥61 and increased for new tests | tests | `npm test` | Test summary | NOT_STARTED |
| BUILD-003 | Real Windows installer produced (`build:win`) | build scripts | GHA build | Artifact path | NOT_STARTED |
| BUILD-004 | `win-unpacked` produced | same | GHA | Artifact path | NOT_STARTED |
| BUILD-005 | SHA-256 for installer + EXE + ZIPs | checksum script | GHA | `.sha256` files | NOT_STARTED |
| ICON-001 | Method A (`signAndEditExecutable:true`/rcedit) build attempt compared | build matrix | GHA jobs | Build logs | NOT_STARTED |
| ICON-002 | Method B (`afterPack`/resedit) build attempt compared | same | GHA | Build logs | NOT_STARTED |
| ICON-003 | Chosen icon method documented with rationale | `13-ICON-ARTIFACT-VERIFICATION.md` | gate | Doc | NOT_STARTED |
| ICON-004 | win-unpacked EXE icon resources contain Program-Icon | icon inspect script | GHA inspect | Resource dump | NOT_STARTED |
| ICON-005 | Installer EXE icon correct | same | GHA+screenshot | Evidence | NOT_STARTED |
| ICON-006 | Installed EXE icon correct | same | screenshot | Evidence | NOT_STARTED |
| ICON-007 | Desktop shortcut icon correct | same | screenshot | Evidence | NOT_STARTED |
| ICON-008 | Start Menu shortcut icon correct | same | screenshot | Evidence | NOT_STARTED |
| ICON-009 | Taskbar / Alt+Tab / BrowserWindow icon correct | same | screenshot | Evidence | NOT_STARTED |
| ICON-010 | Add/Remove Programs + Uninstaller icons correct | same | screenshot/registry | Evidence | NOT_STARTED |
| ICON-011 | NSIS installerIcon/uninstallerIcon/installerHeaderIcon/uninstallDisplayIcon resolved | package.json/nsis | config+build | Build config dump | NOT_STARTED |
| ICON-012 | Icon verified on clean VM/Sandbox without icon cache pollution | UAT | screenshot | Evidence | NOT_STARTED |

---

## D — Electron & dependencies

| ID | المطلوب | الملفات المعدلة | الاختبار | Runtime evidence | النتيجة |
|----|---------|-----------------|----------|------------------|---------|
| ELEC-001 | Compatibility matrix: current vs Codex vs latest supported vs latest stable | `14-ELECTRON-UPGRADE-COMPATIBILITY.md` | research+build | Matrix doc + sources | NOT_STARTED |
| ELEC-002 | Upgrade decision executed (latest compatible stable) or documented blocker | package.json/lock | build+tests | Versions before/after | NOT_STARTED |
| ELEC-003 | better-sqlite3 ABI rebuild succeeds after Electron choice | native rebuild | runtime open DB | Log | NOT_STARTED |
| ELEC-004 | electron-builder + @electron/rebuild compatible versions | package.json | build | Versions | NOT_STARTED |
| ELEC-005 | No alpha/beta/nightly; no --force; no permanent --legacy-peer-deps | package files | gate | npm ci clean | NOT_STARTED |
| ELEC-006 | Post-upgrade runtime: start/login/preload/contextBridge/SQLite/backup/print/PDF/QR/fonts/CSP/OAuth/OwnerHub/installer | UAT suite | Windows | Runtime report | NOT_STARTED |

---

## E — npm ci / registry

| ID | المطلوب | الملفات المعدلة | الاختبار | Runtime evidence | النتيجة |
|----|---------|-----------------|----------|------------------|---------|
| NPM-001 | Fix zod/lock 404 or registry issues so clean `npm ci` works | package-lock/.npmrc | GHA clean | Exit 0 | NOT_STARTED |
| NPM-002 | `npm cache clean --force` + remove node_modules + npm ci + test + build:win on Windows | GHA | GHA | Logs | NOT_STARTED |

---

## F — App runtime UAT (UAT-V2-3-5 dataset)

| ID | المطلوب | الملفات المعدلة | الاختبار | Runtime evidence | النتيجة |
|----|---------|-----------------|----------|------------------|---------|
| RT-001 | App starts (installed release preferred) | UAT scripts | runtime | Log | NOT_STARTED |
| RT-002 | Login with test credentials (admin123 / 1234) only in test env | same | runtime | Log | NOT_STARTED |
| RT-003 | Dashboard opens | same | runtime | Log | NOT_STARTED |
| RT-004 | Create/edit client; create visit; invoice; appointment; staff; settings | same | runtime | IDs + row counts | NOT_STARTED |
| RT-005 | Close/reopen preserves data | same | runtime | Checksums | NOT_STARTED |
| RT-006 | Print receipt / PDF / local QR | same | runtime | Output paths | NOT_STARTED |
| RT-007 | Backup + Restore | same | runtime | Backup file + restore counts | NOT_STARTED |
| RT-008 | Dataset `UAT-V2-3-5` with 3 clients, 4 visits, 3 invoices, 2 appointments, 2 staff, modified settings, test license, device+branch | dataset script | runtime | Dataset manifest | NOT_STARTED |

---

## G — Install lifecycle matrix

| ID | المطلوب | الملفات المعدلة | الاختبار | Runtime evidence | النتيجة |
|----|---------|-----------------|----------|------------------|---------|
| LIFE-001 | Clean install PASS with dataset+license+device+branch recorded | UAT scripts | Windows | `11-INSTALL-LIFECYCLE-RESULTS.md` | NOT_STARTED |
| LIFE-002 | Update over existing preserves row counts/IDs/license/device/branch/settings/attachments | same | Windows | Matrix row | NOT_STARTED |
| LIFE-003 | Silent/Auto update does not wipe data/license; no hang; resumes | same | Windows | Matrix row | NOT_STARTED |
| LIFE-004 | Repair/reinstall same version preserves all | same | Windows | Matrix row | NOT_STARTED |
| LIFE-005 | App-only uninstall then reinstall restores same data/license/device/branch | same | Windows | Matrix row | NOT_STARTED |
| LIFE-006 | Explicit full wipe deletes only scoped paths after double confirm | same | Windows | Matrix row | NOT_STARTED |
| LIFE-007 | Interrupted update: DB not corrupt; backup valid; recoverable | same | Windows | Matrix row | NOT_STARTED |

---

## H — Owner / Branch runtime

| ID | المطلوب | الملفات المعدلة | الاختبار | Runtime evidence | النتيجة |
|----|---------|-----------------|----------|------------------|---------|
| OWN-001 | Valid bootstrap token creates first Owner once | owner-bootstrap + UAT | runtime | Log + profile exists | NOT_STARTED |
| OWN-002 | Token cannot be reused | same | runtime | Second attempt rejected | NOT_STARTED |
| OWN-003 | Expired/invalid token rejected | same | runtime | Error codes | NOT_STARTED |
| OWN-004 | Allowlisted email can claim Owner per policy | same | runtime | Claim result | NOT_STARTED |
| OWN-005 | Non-allowlisted email rejected; case-insensitive match | same | runtime | Results | NOT_STARTED |
| OWN-006 | No secret allowlist in Renderer; role not editable via DevTools alone for authz | security review + tests | runtime | Evidence | NOT_STARTED |
| OWN-007 | Google auth ≠ Owner authorization; unauthorized Google cannot become Owner/org/branch/hub-owner | same | runtime | Rejection | NOT_STARTED |
| OWN-008 | Owner creates branch from Owner Hub; persists across restart | Owner Hub runtime | runtime | Branch list after restart | NOT_STARTED |
| RBAC-001 | Device activation shows authorized branches only; no New Branch; no auto-enroll | BranchLock UI | runtime+unit | UI + enroll errors | NOT_STARTED |
| RBAC-002 | enrollBranch without `source:'owner_hub'` fails | branch-enrollment | tests | Error `owner_hub_required` | NOT_STARTED |
| RBAC-003 | Branch Admin cannot create branch via UI / IPC / service | gates | runtime | Rejections at trusted layer | NOT_STARTED |
| RBAC-004 | Employee cannot create branch / open Owner Hub as owner | same | runtime | Rejections | NOT_STARTED |
| OWN-009 | Owner Hub feature classification REAL/LOCAL ONLY/UI ONLY/MOCK/MISSING | `15-OWNER-RUNTIME-UAT.md` | audit | Classification table | NOT_STARTED |

---

## I — License lifecycle

| ID | المطلوب | الملفات المعدلة | الاختبار | Runtime evidence | النتيجة |
|----|---------|-----------------|----------|------------------|---------|
| LIC-001 | Generate real Test License via project License Builder (not production) | license tools | generate script | License file path | NOT_STARTED |
| LIC-002 | Validate + Activate test license | same | runtime | Activation state | NOT_STARTED |
| LIC-003 | License survives Restart | same | runtime | Still active | NOT_STARTED |
| LIC-004 | License survives Update | same | lifecycle | Checksum | NOT_STARTED |
| LIC-005 | License survives Repair | same | lifecycle | Checksum | NOT_STARTED |
| LIC-006 | License survives App-only uninstall + reinstall | same | lifecycle | Still active | NOT_STARTED |
| LIC-007 | Expired / invalid / device mismatch / branch mismatch handled | same | tests+runtime | Error cases | NOT_STARTED |
| LIC-008 | License deleted only on explicit full wipe / owner revoke / authorized reset — not on revoke of cloud sync alone, and revoke must not delete business DB | policy+UAT | wipe vs revoke | Evidence | NOT_STARTED |

---

## J — Cloud status (reporting only)

| ID | المطلوب | الملفات المعدلة | الاختبار | Runtime evidence | النتيجة |
|----|---------|-----------------|----------|------------------|---------|
| CLOUD-001 | Cloud Sync reported as MISSING — expected until V2-4 | reports | gate exception | Explicit MISSING text | MISSING — expected until V2-4 |
| CLOUD-002 | Backup status PASS only if Backup/Restore tests pass, else FAIL | backup tests | `npm test` + UAT | Test results | NOT_STARTED |
| CLOUD-003 | Drive License Push/Pull explicitly not Event Sync | reports | doc | Statement | NOT_STARTED |
| CLOUD-004 | Automatic latest branch restore = MISSING | reports | doc | Statement | NOT_STARTED |
| CLOUD-005 | Incremental sync = MISSING | reports | doc | Statement | NOT_STARTED |
| CLOUD-006 | Cross-device real-time sync = MISSING | reports | doc | Statement | NOT_STARTED |

---

## K — Required reports

| ID | المطلوب | الملفات المعدلة | الاختبار | Runtime evidence | النتيجة |
|----|---------|-----------------|----------|------------------|---------|
| RPT-001 | `docs/integration-v2/10-WINDOWS-UAT-RESULTS.md` from real runs | report | gate | File non-placeholder | NOT_STARTED |
| RPT-002 | `docs/integration-v2/11-INSTALL-LIFECYCLE-RESULTS.md` | report | gate | File | NOT_STARTED |
| RPT-003 | `docs/integration-v2/12-INSTALL-PERFORMANCE-PROFILE.md` | report | gate | File with 3-run medians | NOT_STARTED |
| RPT-004 | `docs/integration-v2/13-ICON-ARTIFACT-VERIFICATION.md` | report | gate | File | NOT_STARTED |
| RPT-005 | `docs/integration-v2/14-ELECTRON-UPGRADE-COMPATIBILITY.md` | report | gate | File | NOT_STARTED |
| RPT-006 | `docs/integration-v2/15-OWNER-RUNTIME-UAT.md` | report | gate | File | NOT_STARTED |
| RPT-007 | `docs/integration-v2/16-LICENSE-PERSISTENCE-UAT.md` | report | gate | File | NOT_STARTED |
| RPT-008 | `docs/integration-v2/17-RELEASE-READINESS.md` | report | gate | File | NOT_STARTED |

---

## L — GitHub Actions Windows UAT

| ID | المطلوب | الملفات المعدلة | الاختبار | Runtime evidence | النتيجة |
|----|---------|-----------------|----------|------------------|---------|
| GHA-001 | `windows-uat.yml` on windows-latest: ci, test, rebuild, build, inspect, upload | workflow | GHA | Run URL | NOT_STARTED |
| GHA-002 | Artifacts uploaded: installer, win-unpacked, logs, timings, checksums | same | GHA | Artifact names | NOT_STARTED |
| GHA-003 | No secrets printed in logs | same | GHA log review | Redaction check | NOT_STARTED |

---

## M — Prohibitions / security regression

| ID | المطلوب | الملفات المعدلة | الاختبار | Runtime evidence | النتيجة |
|----|---------|-----------------|----------|------------------|---------|
| SEC-001 | No CSP relaxation | window-policy/CSP | `test-font-csp-baseline` | CSP still strict | NOT_STARTED |
| SEC-002 | No Google Fonts / external QR regression | same + QR tests | hybrid baselines | PASS | NOT_STARTED |
| SEC-003 | appId unchanged | package.json | gate | Same appId | NOT_STARTED |
| SEC-004 | No V2-4 Cloud Sync fake implementation | code review | gate | CLOUD-001 MISSING | NOT_STARTED |
| SEC-005 | No production passwords/licenses in tests | UAT scripts | review | Test-only secrets | NOT_STARTED |

---

## N — Phase closure checklist (must all PASS)

| ID | المطلوب | الملفات المعدلة | الاختبار | Runtime evidence | النتيجة |
|----|---------|-----------------|----------|------------------|---------|
| CLOSE-001 | npm ci on clean Windows | GHA | GHA | Exit 0 | NOT_STARTED |
| CLOSE-002 | All tests PASS | npm test | npm test | Summary | NOT_STARTED |
| CLOSE-003 | Windows installer produced | build | GHA | Artifact | NOT_STARTED |
| CLOSE-004 | EXE/Installer/Shortcut icons proven | icon UAT | evidence | Screenshots/resource dump | NOT_STARTED |
| CLOSE-005 | Update preserves data+license | lifecycle | UAT | Matrix | NOT_STARTED |
| CLOSE-006 | Repair preserves data+license | lifecycle | UAT | Matrix | NOT_STARTED |
| CLOSE-007 | App-only uninstall preserves data+license | lifecycle | UAT | Matrix | NOT_STARTED |
| CLOSE-008 | Full wipe separate+explicit | installer | UAT | Matrix | NOT_STARTED |
| CLOSE-009 | Device ID + Branch binding stable | lifecycle | UAT | IDs | NOT_STARTED |
| CLOSE-010 | Owner bootstrap + Branch Admin denial runtime proven | owner UAT | UAT | Logs | NOT_STARTED |
| CLOSE-011 | Timings documented; slowness root cause fixed or FAIL with proof | perf report | UAT | Report | NOT_STARTED |
| CLOSE-012 | Electron decision documented | elec report | doc+build | Report | NOT_STARTED |
| CLOSE-013 | No security regression | SEC-* | tests | PASS | NOT_STARTED |

---

## Counts (maintained by verify script)

| Metric | Value |
|--------|-------|
| Requirements total (excluding CLOUD-001 exception row still tracked) | see verifier |
| Initial result for all non-CLOUD rows | NOT_STARTED / UNVERIFIED |
| CLOUD-001 | MISSING — expected until V2-4 |

**Ready for V2-4:** NO until failed=0 and unverified=0 (CLOUD-001 exception only).  
**Ready for develop:** NO until release gate exit 0.  
**Ready for main:** NO.
