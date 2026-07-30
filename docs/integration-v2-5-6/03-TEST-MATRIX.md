# V2-5.6 — Test Matrix (registered at Gate A)

| Suite | Planned command | Covers |
|-------|-----------------|--------|
| Unit | `tests/baseline/test-v2-5-6-ux-hardening.js` | UX/VIS/ops modules |
| Scenarios | `npm run v2-5-6:scenarios` | U01+ flows |
| Windows UAT | `scripts/windows-uat/v2-5-6-ux-runtime.cjs` | Device A/B |
| Visual | evidence/screenshots + VIS rows | critical flows |
| Release gate | `npm run verify:v2-5-6-release-gate` | REL-256-001 |
| Regression | prior verify:* in workflow | REG-256-001 |

Automated suites land in Gate C; rows remain NOT_STARTED until evidence exists.
