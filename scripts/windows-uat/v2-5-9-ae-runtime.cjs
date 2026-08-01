#!/usr/bin/env node
'use strict';

/**
 * V2-5.9 Windows A–E runtime evidence collector.
 *
 * HARD RULES:
 * - Unit/wiring PASS ≠ Requirement PASS
 * - Installed Setup EXE proof required for Scenario A–E PASS
 * - Wine/NSIS stub (< 50MB) is INVALID installer
 * - Never rewrite REQUIREMENTS-TRACEABILITY to PASS from this script alone
 * - Exit 0 only when HIJAMA_AE_FULL_PROVEN=1 AND all scenario evidence files are PASS
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..', '..');
const evidenceDir = path.join(root, 'docs', 'integration-v2-5-9', 'evidence');
const aeDir = path.join(evidenceDir, 'ae-scenarios');
const MIN_SETUP_BYTES = 50 * 1024 * 1024;

fs.mkdirSync(aeDir, { recursive: true });
fs.mkdirSync(evidenceDir, { recursive: true });

function sha256File(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

function writeJson(rel, data) {
  const p = path.isAbsolute(rel) ? rel : path.join(evidenceDir, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`);
  return p;
}

function run(rel, timeoutMs) {
  const r = spawnSync(process.execPath, [path.join(root, rel)], {
    cwd: root,
    encoding: 'utf8',
    timeout: timeoutMs || 300000,
  });
  return {
    status: r.status,
    signal: r.signal || null,
    stdout: (r.stdout || '').slice(-4000),
    stderr: (r.stderr || '').slice(-2000),
  };
}

function findArtifacts() {
  const distDir = path.join(root, 'dist');
  const productExe = path.join(distDir, 'win-unpacked', 'Hijama Management System.exe');
  let installerPath = process.env.HIJAMA_SETUP_EXE || null;
  if (!installerPath && fs.existsSync(distDir)) {
    const setups = fs
      .readdirSync(distDir)
      .filter((n) => /HijamaManagement-Setup-.*\.exe$/i.test(n))
      .sort();
    if (setups.length) installerPath = path.join(distDir, setups[setups.length - 1]);
  }
  return {
    distDir: fs.existsSync(distDir) ? distDir : null,
    winUnpackedExe: fs.existsSync(productExe) ? productExe : null,
    installerPath: installerPath && fs.existsSync(installerPath) ? installerPath : null,
  };
}

function artifactMeta(p) {
  if (!p || !fs.existsSync(p)) return null;
  const st = fs.statSync(p);
  return {
    path: path.relative(root, p),
    absPath: p,
    size: st.size,
    sha256: sha256File(p),
    mtime: st.mtime.toISOString(),
    validNsisCandidate: st.size >= MIN_SETUP_BYTES,
  };
}

function scenarioStub(id, title, checks) {
  return {
    id,
    title,
    result: 'UNVERIFIED',
    reason: 'REQUIRES_INSTALLED_WINDOWS_SETUP_EXE_LIVE_PROOF',
    checks: checks.map((c) => ({
      name: c,
      result: 'UNVERIFIED',
      evidence: null,
      requiredArtifacts: [
        'windows_runtime_log',
        'artifact_path',
        'sha256',
        'screenshot_or_video',
        'db_counts',
        'hashes',
        'remote_ids_if_any',
        'restart_evidence',
        'failure_recovery_evidence',
      ],
    })),
  };
}

function detectInstalled() {
  if (process.env.HIJAMA_INSTALLED_EXE && fs.existsSync(process.env.HIJAMA_INSTALLED_EXE)) {
    return {
      ...artifactMeta(process.env.HIJAMA_INSTALLED_EXE),
      proof: 'ENV_HIJAMA_INSTALLED_EXE',
    };
  }
  if (process.platform !== 'win32') return null;
  const candidates = [
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Hijama Management System', 'Hijama Management System.exe'),
    path.join(process.env.ProgramFiles || '', 'Hijama Management System', 'Hijama Management System.exe'),
    path.join(process.env['ProgramFiles(x86)'] || '', 'Hijama Management System', 'Hijama Management System.exe'),
  ].filter(Boolean);
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return { ...artifactMeta(c), proof: 'PATH_HEURISTIC' };
    }
  }
  return null;
}

function loadJsonIf(p) {
  try {
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (_) { /* ignore */ }
  return null;
}

function allScenariosProven(scenarios) {
  return Object.values(scenarios).every((s) => s.result === 'PASS');
}

function main() {
  const startedAt = new Date().toISOString();
  const commit = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
  const commitShort = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' });
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

  const residual = run('tests/baseline/test-v2-5-9-residual-closure.js');
  const unit = run('tests/baseline/test-v2-5-9-final-activation.js');
  const arts = findArtifacts();
  const installerMeta = artifactMeta(arts.installerPath);

  const host = {
    at: startedAt,
    platform: process.platform,
    arch: process.arch,
    osRelease: os.release(),
    osType: os.type(),
    node: process.version,
    electronPackage: (pkg.devDependencies && pkg.devDependencies.electron) || (pkg.dependencies && pkg.dependencies.electron) || null,
    appVersion: pkg.version,
    commit: (commit.stdout || '').trim(),
    commitShort: (commitShort.stdout || '').trim(),
    cwd: root,
  };

  const installed = detectInstalled();
  const installedJson = loadJsonIf(path.join(evidenceDir, 'windows-installed.json'));
  const smoke = loadJsonIf(path.join(aeDir, 'smoke-launch.json'));

  let installedProof = 'MISSING';
  if (installed || (installedJson && installedJson.proof === 'INSTALLED_SETUP_EXE')) {
    installedProof = 'INSTALLED_EXE_FOUND';
  }
  if (process.env.HIJAMA_WINDOWS_INSTALLED === '1' && installedProof === 'INSTALLED_EXE_FOUND') {
    installedProof = 'INSTALLED_SETUP_EXE_ENV';
  }

  const installerValid =
    !!(installerMeta && installerMeta.validNsisCandidate) ||
    !!(process.env.HIJAMA_SETUP_SHA256 && installedProof.startsWith('INSTALLED'));

  const build = {
    at: new Date().toISOString(),
    host,
    installer: installerMeta,
    winUnpacked: artifactMeta(arts.winUnpackedExe),
    distPresent: !!(arts.installerPath || arts.winUnpackedExe),
    installerValidNsis: installerValid,
    minSetupBytes: MIN_SETUP_BYTES,
    installedSetupExeProof: installedProof,
    installed: installed || installedJson || null,
    smoke: smoke || null,
    envSha256: process.env.HIJAMA_SETUP_SHA256 || null,
    note:
      process.platform === 'win32'
        ? 'Windows host — Installed Setup EXE found or missing; A–E live proof still required for Requirement PASS'
        : 'Non-Windows host cannot INSTALL Setup EXE; Wine stubs (<50MB) are INVALID; use GHA windows-2022',
  };

  const scenarios = {
    A_sqlite_commit_cache: scenarioStub('A', 'SQLite commit then cache + failure injection', [
      'create_client_sqlite_commit',
      'outbox_event_created',
      'restart_persists',
      'sqlite_fail_no_success_ui',
      'restoreLastCommit',
      'no_outbox_on_fail',
      'visit_invoice_booking_expense_attendance_user_settings_delete',
    ]),
    B_legacy_migration: scenarioStub('B', 'Legacy branch migration explicit', [
      'single_branch_report_backup_map_marker',
      'no_silent_br_main',
      'multi_branch_push_blocked',
      'mapping_required',
      'no_id_rewrite',
      'restart_no_repeat',
      'push_unblock_after_migration',
    ]),
    C_attachments: scenarioStub('C', 'Attachment lifecycle A/B', [
      'pending_uploading_synced',
      'device_b_hash',
      'failure_retry_resume',
      'restart_during_upload',
      'missing_local_remote',
      'hash_mismatch_quarantine',
      'delete_propagation',
      'branch_center_isolation',
      'states_PENDING_UPLOADING_SYNCED_FAILED_MISSING_REMOTE_QUARANTINED_DELETED',
    ]),
    D_sheets_live: scenarioStub('D', 'Google Sheets live runtime', [
      'oauth',
      'refresh_token',
      'read_append_update_batch',
      'http_401_403_404_429_timeout',
      'offline_reconnect',
      'account_change',
      'vault_never_overwrites_sqlite_or_drive_license',
      'role_license_registry_integration_not_sot',
    ]),
    E_device_branch_dr_owner: scenarioStub('E', 'Device A/B + branch + DR + Owner', [
      'device_ab_crud_offline_conflict',
      'atomic_new_branch',
      'disaster_recovery_reconcile_before_push',
      'owner_multi_branch_no_leakage',
    ]),
  };

  // Allow operator/CI to drop proven scenario JSON that already has result PASS
  for (const [key, file] of [
    ['A_sqlite_commit_cache', 'A-sqlite-commit-cache.json'],
    ['B_legacy_migration', 'B-legacy-migration.json'],
    ['C_attachments', 'C-attachments.json'],
    ['D_sheets_live', 'D-sheets-live.json'],
    ['E_device_branch_dr_owner', 'E-device-branch-dr-owner.json'],
  ]) {
    const prior = loadJsonIf(path.join(aeDir, file));
    if (prior && prior.result === 'PASS' && prior.installedSetupExeProof && prior.evidenceComplete === true) {
      scenarios[key] = prior;
    }
  }

  const wiring = {
    residualUnit: residual.status === 0 ? 'PASS' : 'FAIL',
    finalActivationUnit: unit.status === 0 ? 'PASS' : 'FAIL',
    codePathsPresent: {
      noOptimisticOperational: fs.readFileSync(path.join(root, 'cupping-sqlite-bridge.js'), 'utf8').includes('__noOptimisticOperational'),
      legacyMigration: fs.existsSync(path.join(root, 'cloud/legacy-branch-migration.js')),
      attachmentLifecycle: fs.existsSync(path.join(root, 'cloud/attachment-lifecycle.js')),
      sheetsRoleNotSot: fs.readFileSync(path.join(root, 'cloud/google-sheets-ops.js'), 'utf8').includes('isSourceOfTruth: false'),
      restoreReconciliation: fs.existsSync(path.join(root, 'cloud/restore-reconciliation.js')),
    },
    note: 'WIRING_ONLY — does not flip Requirement rows',
  };

  const runtimeErrors = {
    electronMain: 'UNVERIFIED',
    renderer: 'UNVERIFIED',
    ipc: 'UNVERIFIED',
    sqlite: 'UNVERIFIED',
    outbox: 'UNVERIFIED',
    attachments: 'UNVERIFIED',
    oauth: 'UNVERIFIED',
    sheets: 'UNVERIFIED',
    drive: 'UNVERIFIED',
    license: 'UNVERIFIED',
    restore: 'UNVERIFIED',
    sync: 'UNVERIFIED',
    branchContext: 'UNVERIFIED',
    rbac: 'UNVERIFIED',
    note: 'Fill only from Installed Setup EXE session logs; any unhandled error = Release Blocker',
  };

  const scenariosPass = allScenariosProven(scenarios);
  const fullProven =
    process.env.HIJAMA_AE_FULL_PROVEN === '1' &&
    installedProof.startsWith('INSTALLED') &&
    installerValid &&
    scenariosPass &&
    wiring.residualUnit === 'PASS' &&
    wiring.finalActivationUnit === 'PASS';

  const summary = {
    suite: 'v2-5.9-ae-windows-runtime',
    at: startedAt,
    finishedAt: new Date().toISOString(),
    host,
    build,
    wiring,
    scenarios,
    runtimeErrors,
    requirementsPolicy: 'UNVERIFIED until Installed Setup EXE A–E evidence attached per requirement row',
    readyForRelease: fullProven ? 'YES_IF_TRACEABILITY_ALSO_PASS' : 'NO',
    readyForMain: 'NO',
    v259Complete: fullProven ? 'CANDIDATE' : 'NO',
    exitPolicy: {
      '0': 'Installed Setup EXE + all A–E checks PASS with evidence + HIJAMA_AE_FULL_PROVEN=1',
      '1': 'Unit/wiring failure or invalid installer on Windows CI path',
      '2': 'Missing installed Setup EXE proof / scenarios remain UNVERIFIED',
    },
  };

  writeJson('windows-build.json', {
    ok: wiring.residualUnit === 'PASS' && wiring.finalActivationUnit === 'PASS',
    build,
    host,
    unitStatus: unit.status,
    residualStatus: residual.status,
    installerValidNsis: installerValid,
  });
  writeJson('ae-scenarios/summary.json', summary);
  writeJson('ae-scenarios/A-sqlite-commit-cache.json', scenarios.A_sqlite_commit_cache);
  writeJson('ae-scenarios/B-legacy-migration.json', scenarios.B_legacy_migration);
  writeJson('ae-scenarios/C-attachments.json', scenarios.C_attachments);
  writeJson('ae-scenarios/D-sheets-live.json', scenarios.D_sheets_live);
  writeJson('ae-scenarios/E-device-branch-dr-owner.json', scenarios.E_device_branch_dr_owner);
  writeJson('device-a-uat.json', {
    device: 'A',
    result: 'UNVERIFIED',
    reason: 'REQUIRES_INSTALLED_WINDOWS_SETUP_EXE',
    at: new Date().toISOString(),
    distPresent: build.distPresent,
    installed: installedProof,
  });
  writeJson('device-b-uat.json', {
    device: 'B',
    result: 'UNVERIFIED',
    reason: 'REQUIRES_INSTALLED_WINDOWS_SETUP_EXE',
    at: new Date().toISOString(),
  });
  writeJson('failure-recovery.json', {
    at: new Date().toISOString(),
    result: 'UNVERIFIED',
    cases: [
      'sqlite_commit_fail',
      'legacy_mapping_required',
      'attachment_upload_fail',
      'sheets_429_timeout',
      'restore_reconcile_before_push',
      'branch_creation_pending',
    ],
  });

  const markPath = path.join(root, 'docs/integration-v2-5-9/WINDOWS-AE-RUNTIME.md');
  fs.writeFileSync(
    markPath,
    `# V2-5.9 Windows A–E Runtime Status

Generated: ${summary.finishedAt}

| Field | Value |
|-------|-------|
| Platform | ${host.platform} |
| Commit | ${host.commitShort} |
| Dist present | ${build.distPresent} |
| Installer size | ${build.installer?.size ?? 'MISSING'} |
| Installer valid NSIS (≥50MB) | ${installerValid ? 'YES' : 'NO'} |
| Installer SHA-256 | ${build.installer?.sha256 || build.envSha256 || 'MISSING'} |
| win-unpacked SHA-256 | ${build.winUnpacked?.sha256 || 'MISSING'} |
| Installed Setup EXE proof | ${build.installedSetupExeProof} |
| Scenario A | ${scenarios.A_sqlite_commit_cache.result} |
| Scenario B | ${scenarios.B_legacy_migration.result} |
| Scenario C | ${scenarios.C_attachments.result} |
| Scenario D | ${scenarios.D_sheets_live.result} |
| Scenario E | ${scenarios.E_device_branch_dr_owner.result} |
| Ready for release | **NO** |
| Ready for main | **NO** |
| V2-5.9 complete | **NO** |

## Policy

Requirement PASS only after Installed Setup EXE evidence for that row.
Unit/wiring PASS does not flip traceability.
Wine/NSIS stubs under 50MB are **INVALID**.

Evidence dir: \`docs/integration-v2-5-9/evidence/ae-scenarios/\`

## Execution order

1. Windows build + install (\`Install-And-Prove-V259-AE.ps1\`)
2. Scenario A SQLite commit/cache
3. Scenario B Legacy migration
4. Scenario C Attachments A/B
5. Scenario D Sheets live
6. Scenario E Device/branch/DR/Owner
7. Runtime error sweep
8. Flip REQUIREMENTS rows only from evidence
9. Release gate exit 0
`
  );

  if (residual.status !== 0 || unit.status !== 0) {
    console.error('FAIL: v2-5.9 A–E runtime (unit/wiring)');
    process.exit(1);
  }

  if (fullProven) {
    console.log('V2-5.9 A–E RUNTIME: FULL PROVEN (candidate)');
    process.exit(0);
  }

  console.error('V2-5.9 A–E RUNTIME: UNVERIFIED — Installed Windows Setup EXE A–E live proof required');
  console.log(JSON.stringify({
    platform: host.platform,
    distPresent: build.distPresent,
    installerValidNsis: installerValid,
    installedProof: build.installedSetupExeProof,
    installerSha256: build.installer?.sha256 || build.envSha256 || null,
    installerSize: build.installer?.size || null,
    scenarios: 'UNVERIFIED',
    readyForRelease: 'NO',
  }, null, 2));
  process.exit(2);
}

main();
