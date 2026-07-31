# V2-5.9 Windows Runtime Blocker

**Date:** 2026-07-31  
**Agent environment:** Linux cloud VM (`process.platform=linux`) — not a Windows desktop with interactive Google OAuth.

## What this environment can / cannot do

| Capability | Status |
|------------|--------|
| Implement production code | DONE |
| `npm test` (96/96) | DONE |
| Cross-compile Windows Setup EXE via electron-builder (when deps allow) | ATTEMPTED / opportunistic |
| Interactive Google OAuth on real Google account | **NOT POSSIBLE here** |
| Real Drive/Sheets license pull UAT | **NOT POSSIBLE here** |
| Device A/B physical sync UAT | **NOT POSSIBLE here** |
| Display scaling 100–175% interactive | **NOT POSSIBLE here** |
| Fill 26 requirements as PASS from live Setup EXE | **BLOCKED** |

## Correct phase status

```
Code implementation: DONE (including forced Owner password change)
Automated tests: PASS
Windows Runtime proof: NOT DONE
Requirements passed: 0
Requirements unverified: 26
Release gate: FAIL (by design until UAT evidence)
Ready for release: NO
Ready for main: NO
Phase complete: NO
```

## Owner seed (code-side hardening — still needs Windows UAT)

- Username `owner` with **hash only** (`OWNER_SEED_PASSWORD_HASH`) — plaintext must not appear in UI/logs/evidence
- `mustChangePassword` / `seedDefaultPassword` force change on first login (and on session restore if still seeded)
- Modal cannot be dismissed (close / overlay / Escape)
- After change, seed hash is rejected
- No second Owner if an Owner already exists (restore/migration)
- Google never becomes Owner; no daily Owner Bootstrap for customers
- Support: DevTools / Owner Hub **Reset Owner Password**

## Human / Windows machine next steps

On a real Windows 10/11 machine with Google test accounts:

1. Optional: `powershell -File scripts/collect-v2-5-9-windows-evidence.ps1`
2. `npm ci && npm test && npm run build:win`
3. Record Setup EXE path, win-unpacked, SHA-256, Electron/Node, Windows version, scaling
4. Install Setup EXE (clean) — cycle: BUILD→INSTALL→RUN→TEST→FIX→REBUILD→REINSTALL→RETEST→PROVE
5. Priority: **Old customer auto-discovery (S1)** + **Owner forced password change**
6. Also: New customer custom first branch, data sources, Owner Hub live actions, Sync A/B, Responsive matrix
7. Fill every Requirements Traceability row with PASS + evidence paths
8. Re-run `npm run verify:v2-5-9-release-gate` → must exit 0
9. Push evidence commit + Actions green

Until then, **do not** declare V2-5.9 complete. Artifact from Linux/wine ≠ UAT proof.
