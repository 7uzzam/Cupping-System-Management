# Tadawi Al-Madinah / Hijama Management System

Electron desktop application for cupping center operations (clients, visits,
bookings, payroll, licensing, backup).

**Version:** 2.0.0  
**Publisher:** NajjarTech

## Requirements

- Node.js **20 or 22 LTS only** (do **not** use Node 24 — no `better-sqlite3` prebuilds; needs Python/build tools)
- npm 10+
- Windows 10/11 for running the packaged app and full installer validation

## Daily Windows workflow (normal)

Inside the project folder:

```bat
npm ci
npm run build:prod
```

That is enough for normal packaging **after one-time OAuth setup**.
You do **not** need to edit OAuth files on every build.

Optional local run:

```bat
npm start
```

Optional tests:

```bat
npm test
```

## One-time machine setup (only once)

1. Install **Node.js 22 LTS** from https://nodejs.org (replace Node 24 if installed)
2. Open a **new** cmd window and verify:

```bat
node -v
```

Expected: `v22.x.x`

3. Save Google OAuth secret once on this PC (stored in AppData, not in git):

```bat
npm run oauth:save -- --secret=YOUR_GOOGLE_CLIENT_SECRET
```

4. Then forever:

```bat
npm ci
npm run build:prod
```

If you already created `electron\\cloud-oauth.config.local.json` manually, just run:

```bat
npm run oauth:save
```

This promotes it to the machine store so every future branch/build auto-loads it.

## Why phase4 failed on your PC

- Node `v24.18.0` → no prebuilt `better-sqlite3` binary
- npm tried to compile from source → needs Python + Visual Studio Build Tools
- Fix = switch to Node 22 (preferred), not install Python for every clone

## Useful scripts

| Script | Purpose |
|--------|---------|
| `npm ci` | Clean install from lockfile (preferred) |
| `npm start` | Launch Electron app |
| `npm test` | Baseline + existing verification suite |
| `npm run lint` | ESLint (Phase-1 scoped) |
| `npm run verify` | lint + test |
| `npm run verify:sensitive` | Critical finance/license/backup checks |
| `npm run generate:brand` | Generate installer BMP/NSIS branding assets |
| `npm run release:gate` | Production release structural gate |
| `npm run build:prod` | Strict OAuth config + Windows installer build |
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
