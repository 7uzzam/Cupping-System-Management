# Tadawi Al-Madinah / Hijama Management System

Electron desktop application for cupping center operations (clients, visits,
bookings, payroll, licensing, backup).

**Version:** 2.0.0  
**Publisher:** NajjarTech

## Requirements

- Node.js **20 or 22 LTS** (recommended). Node 24 may break Electron / `better-sqlite3` installs.
- npm 10+
- Windows 10/11 for running the packaged app and full installer validation
- On Windows: Visual C++ Build Tools if native modules need rebuild

## Quick start (from a clean clone)

```bash
npm ci
npm run generate:brand
npm test
npm run verify
npm start
```

Windows installer build:

```bash
npm run generate:brand
npm run build
# or
npm run build:win
```

> Building a Windows NSIS installer from non-Windows hosts may require Wine /
> electron-builder platform tooling. Prefer a Windows CI or build machine for
> release artifacts.

### Windows troubleshooting

If `npm test` fails on `phase4:sqlite`:

```bat
npm rebuild better-sqlite3
```

If `npm start` fails with `Electron failed to install correctly`:

```bat
rmdir /s /q node_modules\electron
npm install electron --save-dev
```

If `phase20:production-release` reports missing BMP / branding files:

```bat
npm run generate:brand
```

(These installer assets are generated and gitignored; the release gate now auto-generates them when missing.)

## Useful scripts

| Script | Purpose |
|--------|---------|
| `npm start` | Launch Electron app |
| `npm test` | Baseline + existing verification suite |
| `npm run lint` | ESLint (Phase-1 scoped) |
| `npm run verify` | lint + test |
| `npm run verify:sensitive` | Critical finance/license/backup checks |
| `npm run generate:brand` | Generate installer BMP/NSIS branding assets |
| `npm run release:gate` | Production release structural gate |
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
