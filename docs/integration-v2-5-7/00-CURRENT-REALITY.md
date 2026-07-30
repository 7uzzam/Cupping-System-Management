# V2-5.7 — Current Reality

**Branch:** `cursor/v2-5-7-production-release-c2ea`
**Baseline:** V2-5.6 tip `b5a2f2a` (GHA green)

## Summary
Windows NSIS build, uninstall-prep preserve, SQLite migrations, Backup V2, and prior phase gates are largely **REAL**. Final release packaging evidence (SHA-256 index, portable policy, lifecycle matrix V2-4→V2-5.x, migration rollback proof, independent-review gate wording) needs consolidation under this phase.

## Classification (Gate A)
| Area | Status |
|------|--------|
| npm ci / npm test / build:win | REAL (prior GHA) |
| Installer + win-unpacked | REAL |
| Portable target | WIRED BUT UNPROVEN / policy |
| Icons (exe/installer/desktop) | REAL / WIRED BUT UNPROVEN across shells |
| App-only uninstall preserve | REAL (nsis + tests) |
| Full wipe explicit | REAL |
| Schema migrations 001/002 | REAL |
| Migration pre-backup + rollback UX | PARTIAL / MISSING harness |
| Final checksum + source archive | MISSING consolidated evidence |
| Independent review before main | POLICY (must remain NO for main) |

## Gaps before Gate B
1. Release artifact indexer (installer/unpacked/portable/SHA-256/source archive)
2. Lifecycle matrix harness (clean/update/repair/uninstall/wipe/updater)
3. Migration V2-4→V2-5 preserve + failure rollback proof
4. Compat Windows 10/11 + scale/locale evidence
5. Final REL pack (PR/SHA/GHA/checksums/readiness/independent review)
