# 14 — Electron Upgrade Compatibility

**Generated:** research + local package.json inspection (runtime upgrade evidence completed by Windows GHA).

## Matrix (as of 2026-07-29)

| Line | Version | Chromium | Node (embedded) | Support status |
|------|---------|----------|-----------------|----------------|
| Current Hybrid | Electron ^33.2.0 | (EOL line) | ~20.x era | Outside Electron supported latest-3 |
| Codex extract (historical) | Electron 39 (per prior audit notes) | — | — | Historical reference |
| Supported latest-3 | 41.10.3 / 42.8.0 / **43.2.0** | M146 / M148 / M150 | Node 24 | Officially supported |
| Latest stable | **43.2.0** | M150 | 24 | Target candidate |
| Prerelease | 44.0.0-alpha.* | — | — | **Forbidden** |

Sources: https://endoflife.date/electron , https://github.com/electron/electron/releases

## Companion deps (current → target)

| Package | Current | Target candidate | Notes |
|---------|---------|------------------|-------|
| electron | ^33.2.0 | 43.2.0 | Major jump; requires native rebuild |
| better-sqlite3 | ^11.10.0 | latest 11.x/12.x supporting ABI | Must rebuild for Electron headers |
| electron-builder | ^25.1.8 | keep ≥25.x compatible | Validate after Electron bump |
| @electron/rebuild | via electron-builder | use for CI rebuild | Required on Windows UAT |
| resedit | ^2.0.3 | keep | Icon Method B |

## Decision process (mandatory)

1. Attempt `electron@43.2.0` + compatible `better-sqlite3` on clean `npm ci`.
2. `npx electron-rebuild -f -w better-sqlite3`.
3. `npm test`.
4. `npm run build:win` on windows-latest.
5. Run install lifecycle UAT.
6. If any hard failure (ABI, print, OAuth, CSP, SQLite), pin to newest fully green major and document failure logs under `docs/integration-v2/evidence/electron-upgrade/`.

## Status

| Item | Result |
|------|--------|
| Research matrix written | YES |
| Runtime upgrade executed | **YES** — Electron `^43.2.0`, better-sqlite3 `^13.0.2` |
| `npm test` after upgrade | **65/65 PASS** (local Linux CI agent) |
| Forbidden prerelease used | NO |
| --force / permanent --legacy-peer-deps | NO |
| Windows build + install lifecycle | pending GHA `windows-uat.yml` evidence |

## Before → After

| Package | Before | After |
|---------|--------|-------|
| electron | ^33.2.0 | ^43.2.0 |
| better-sqlite3 | ^11.10.0 | ^13.0.2 |
| electron-builder | ^25.1.8 | ^25.1.8 (unchanged; compatible) |

Cloud Sync not part of this decision.
