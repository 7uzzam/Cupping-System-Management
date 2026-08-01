# V2-5.9 Windows A–E Runtime Status

Generated: 2026-08-01T14:32:27.890Z

| Field | Value |
|-------|-------|
| Platform | linux |
| Commit | 012aa2f |
| Dist present | true |
| Installer size | 554321 |
| Installer valid NSIS (≥50MB) | NO |
| Installer SHA-256 | 66c0b21f5fd829cfda2acd6baab3ef6895971ec640c4abf026a26ffba4dda43d |
| win-unpacked SHA-256 | ea8ca53c9c9d4c08bfc81c31c5db43d0c1cbc301abbb8fcff4822d5d9af7a958 |
| Installed Setup EXE proof | MISSING |
| Scenario A | UNVERIFIED |
| Scenario B | UNVERIFIED |
| Scenario C | UNVERIFIED |
| Scenario D | UNVERIFIED |
| Scenario E | UNVERIFIED |
| Ready for release | **NO** |
| Ready for main | **NO** |
| V2-5.9 complete | **NO** |

## Policy

Requirement PASS only after Installed Setup EXE evidence for that row.
Unit/wiring PASS does not flip traceability.
Wine/NSIS stubs under 50MB are **INVALID**.

Evidence dir: `docs/integration-v2-5-9/evidence/ae-scenarios/`

## Execution order

1. Windows build + install (`Install-And-Prove-V259-AE.ps1`)
2. Scenario A SQLite commit/cache
3. Scenario B Legacy migration
4. Scenario C Attachments A/B
5. Scenario D Sheets live
6. Scenario E Device/branch/DR/Owner
7. Runtime error sweep
8. Flip REQUIREMENTS rows only from evidence
9. Release gate exit 0
