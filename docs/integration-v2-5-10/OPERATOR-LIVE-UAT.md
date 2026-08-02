# Operator Live UAT — Installed Setup EXE (Stage-1 close)

Cloud agents / unit tests **cannot** complete this. Run on real Windows with Google clinic account.

## Preconditions

1. (Optional) Delete leftover Actions `setup-exe` artifacts — CI also auto-deletes them at job start. See `MOBILE-QUOTA-AND-EXE-DELIVERY.md`.  
2. Re-run / wait for workflow `V2-5.10 Quality Consolidation — Stage-1 Release Safety Gate` (push to the V2-5.10 branch).  
3. Download Setup EXE from **GitHub Releases** prerelease tag `uat-v2-5-10-<run_id>` (not Actions Artifacts) → verify SHA256 from the release notes.  
4. Clean install via `Install-And-Prove-V259-AE.ps1 -CleanProfile`.  
5. Use **Installed** EXE only (not `npm start`).  
6. Job may still fail overall while A–E are UNVERIFIED — that is expected if the Release publish step succeeded.

## Order (blocking)

1. **A** Device A/B (Google login, license, sync, CRUD, attachment, conflict, restart)  
2. **B** New Branch  
3. **C** Backup V2 DR  
4. **D** Owner Hub  
5. **E** Google OAuth / Drive / Sheets  
6. Responsive matrix + console/runtime sweep = 0  
7. Confirm Backup V1 controls invisible/inoperable  

## Evidence

Fill `docs/integration-v2-5-9/evidence/ae-scenarios/{A..E}-*.json` with:

- `result: PASS`
- `installedSetupExeProof` starting with `INSTALLED`
- `evidenceComplete: true`
- `setupSha256`
- per-check evidence pointers (logs/screenshots)
- `zeroRuntimeErrors: true`

Validate:

```bash
node scripts/windows-uat/validate-ae-evidence-pack.cjs
```

Only after validator PASS: update `REQUIREMENTS-TRACEABILITY.md` rows from evidence, then:

```bash
npm run verify:v2-5-9-release-gate
```

Must exit 0 before Stage 2 begins.
