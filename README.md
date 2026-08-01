# Tadawi Al-Madinah / Hijama Management System

Electron desktop application for cupping center operations (clients, visits,
bookings, payroll, licensing, backup).

**Version:** 2.0.0  
**Publisher:** NajjarTech

## Requirements

- Node.js 20+ (22 LTS recommended)
- npm 10+
- Windows 10/11 for running the packaged app and full installer validation

## Quick start (from a clean clone)

```bash
npm ci
npm test
npm run verify
npm start
```

Windows installer build:

```bash
npm run build
# or
npm run build:win
```

> Building a Windows NSIS installer from non-Windows hosts may require Wine /
> electron-builder platform tooling. Prefer a Windows CI or build machine for
> release artifacts.

## Useful scripts

| Script | Purpose |
|--------|---------|
| `npm start` | Launch Electron app |
| `npm test` | Baseline + existing verification suite |
| `npm run lint` | ESLint (Phase-1 scoped) |
| `npm run verify` | lint + test |
| `npm run verify:sensitive` | Critical finance/license/backup checks |
| `npm run build` / `build:win` | Package Windows installer |

## Documentation

- `docs/ARCHITECTURE-CURRENT.md` — current architecture baseline
- `docs/FEATURE-INVENTORY.md` — feature inventory
- `docs/KNOWN-ISSUES.md` — known issues
- `docs/BASELINE-RESULTS.md` — Phase 1 test baseline
- `CHANGELOG.md` / `MIGRATIONS.md`

## Phase roadmap

Stabilization → Electron security → Licensing V6 → SQLite → … → Enterprise release.
See the executive roadmap (20 phases). Do not merge breaking work without baseline comparison.
