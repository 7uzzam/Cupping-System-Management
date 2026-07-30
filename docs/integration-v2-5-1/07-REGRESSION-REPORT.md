# V2-5.1 — Regression Report

**Status:** NOT_STARTED  
**Baseline:** V2-4 tip `427f1a4` — release gate 6/6 green.

## Must remain green

- `npm test`
- `npm run verify:v2-4-release-gate` (or documented V2-4 regression subset)
- CSP / local fonts / local QR — no Google Fonts / external QR regression
- Installer preserve userData / license / device identity / branch binding (no wipe without explicit full wipe)
- Cloud sync scenarios 1–25 still PASS when re-run or cited as unchanged baseline with proof of no conflicting edits

## V2-5.1 risk areas

- Dual-stack LevelDB vs SQLite restore confusion
- Scheduler introducing unexpected disk IO
- Identity gate false-reject of legitimate backups missing metadata (migration: allow empty source only when live binding also empty / explicit bootstrap mode)

Results will be filled after Gate C/D/G evidence — no PASS claimed here.
