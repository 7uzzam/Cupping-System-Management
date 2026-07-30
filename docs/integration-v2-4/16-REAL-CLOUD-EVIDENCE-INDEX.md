# 16 — Real Cloud Evidence Index

| Artifact | Path / URL | Status |
|----------|------------|--------|
| Requirements traceability | `docs/integration-v2-4/REQUIREMENTS-TRACEABILITY.md` | Registered; mostly NOT_STARTED |
| Cloud test workflow | `.github/workflows/v2-4-cloud-test.yml` | Added |
| Real-cloud workflow | `.github/workflows/v2-4-real-cloud-uat.yml` | Added; needs Environment secrets |
| Release gate workflow | `.github/workflows/v2-4-release-gate.yml` | Added; will fail until all PASS |
| Real Drive harness | `scripts/v2-4-real-drive-uat.cjs` | Added |
| FileRemote dual-device | `tests/baseline/test-v2-4-outbox-dual-device.js` | Automated |
| Conflict peer test | `tests/baseline/test-v2-4-conflict-resolution.js` | Automated |
| Installer SHA-256 | `evidence/cloud-test-build.json` | After GHA cloud-test |
| real-cloud-uat.json | `evidence/real-cloud-uat.json` | After secrets run |
| Screenshots A/B | `evidence/screenshots/` | NOT_STARTED |
| Drive file IDs (masked) | in real-cloud-uat.json | Pending |

**Secrets:** never commit. Integration token cannot list Actions secrets (403).
