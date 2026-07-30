# V2-5.7 — Module Wiring Matrix (Gate A)

| Module | Pre-B | Role |
|--------|-------|------|
| package.json build | REAL | electron-builder NSIS |
| scripts/verify-uninstall-prep.js | REAL | preserve data/license |
| database/connection.js + migrations | REAL | schema |
| electron/backup-v2-core.js | REAL | pre-migration backup path |
| scripts/v2-5-7-release-artifacts.cjs | MISSING | artifact index + SHA |
| scripts/v2-5-7-lifecycle-matrix.cjs | MISSING | LIFE rows |
| scripts/v2-5-7-migration-harness.cjs | MISSING | MIG rows |
| verify-v2-5-7-completion.cjs | MISSING | gate |
