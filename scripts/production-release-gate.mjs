#!/usr/bin/env node
/**
 * Phase 20 — Production Release Gate
 * Structural release readiness checks (installer/build/signing policy).
 * Does not require a Windows host or code-signing certificate to run.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REPORT_DIR = path.join(ROOT, 'pat-reports');

const REQUIRED_BUILD_ASSETS = [
  'build/Program-Icon.ico',
  'build/Installer-Sidebar.bmp',
  'build/Installer-Header.bmp',
  'build/Uninstaller-Sidebar.bmp',
  'build/installer.nsh',
  'build/installer-branding.nsh',
];

const REQUIRED_SCRIPTS = [
  'scripts/fpv-final-production-validation.mjs',
  'scripts/rc-validation.mjs',
  'scripts/code-freeze-gate.mjs',
  'scripts/release-evidence-bundle.mjs',
  'scripts/validate-production-deps.mjs',
];

function readJson(rel) {
  const abs = path.join(ROOT, rel);
  return JSON.parse(fs.readFileSync(abs, 'utf8'));
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function runSourceDepsValidation() {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts/validate-production-deps.mjs'), '--source-only'], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 120000,
  });
  return {
    ok: (r.status ?? 1) === 0,
    detail: ((r.stdout || '') + (r.stderr || '')).trim().split('\n').slice(-4).join(' | '),
  };
}

function validateInstallerNsh() {
  const nsh = fs.readFileSync(path.join(ROOT, 'build/installer.nsh'), 'utf8');
  const issues = [];
  nsh.split('\n').forEach((line, i) => {
    if (!/MessageBox/i.test(line)) return;
    const ids = line.match(/\bID[A-Z]+\b/g) || [];
    if (ids.length > 2) {
      issues.push(`installer.nsh:${i + 1} MessageBox has ${ids.length} jump labels (NSIS max 2)`);
    }
  });
  if (!nsh.includes('Cupping Center')) {
    issues.push('installer.nsh missing NT_USER_DATA_NAME compatibility marker');
  }
  if (!nsh.includes('Hijama Management System.exe')) {
    issues.push('installer.nsh missing executable name');
  }
  return issues;
}

function evaluate() {
  const pkg = readJson('package.json');
  const branding = readJson('branding.config.json');
  const blocking = [];
  const warnings = [];
  const checks = [];

  const mark = (id, ok, detail, level = 'blocking') => {
    checks.push({ id, ok, detail, level });
    if (!ok) {
      if (level === 'warning') warnings.push(`${id}: ${detail}`);
      else blocking.push(`${id}: ${detail}`);
    }
  };

  mark('REL-01', pkg.version === '2.0.0', `version=${pkg.version}`);
  mark('REL-02', pkg.build?.productName === branding.product?.name, 'productName must match branding');
  mark('REL-03', !!pkg.build?.nsis, 'nsis config present');
  mark('REL-04', pkg.build?.win?.artifactName?.includes('${version}'), 'artifactName includes version');
  mark('REL-05', Array.isArray(pkg.build?.files) && pkg.build.files.includes('cloud/**/*'), 'cloud files packaged');
  mark('REL-06', Array.isArray(pkg.build?.asarUnpack) && pkg.build.asarUnpack.includes('node_modules/better-sqlite3/**'), 'better-sqlite3 unpacked');

  for (const asset of REQUIRED_BUILD_ASSETS) {
    mark(`ASSET:${path.basename(asset)}`, exists(asset), asset);
  }
  for (const script of REQUIRED_SCRIPTS) {
    mark(`SCRIPT:${path.basename(script)}`, exists(script), script);
  }

  const nshIssues = validateInstallerNsh();
  mark('REL-07', nshIssues.length === 0, nshIssues.join('; ') || 'installer.nsh policy ok');

  const unsigned = pkg.build?.win?.signAndEditExecutable === false;
  mark(
    'REL-08',
    true,
    unsigned
      ? 'signAndEditExecutable=false (unsigned builds allowed; Windows cert still required for public signed release)'
      : 'signing enabled in config',
    'warning'
  );
  if (unsigned) {
    warnings.push('REL-08: unsigned Windows builds — signed validation still requires Windows host + certificate (K-32)');
  }

  const deps = runSourceDepsValidation();
  mark('REL-09', deps.ok, deps.detail || 'source production deps ok');

  const decision = blocking.length === 0
    ? (unsigned ? 'READY_UNSIGNED_INTERNAL' : 'READY_FOR_SIGNED_RELEASE')
    : 'BLOCKED';

  return {
    generatedAt: new Date().toISOString(),
    version: pkg.version,
    productName: pkg.build?.productName || null,
    decision,
    blocking,
    warnings,
    checks,
    manualWindowsChecklist: [
      'Build NSIS installer on Windows host',
      'Validate installer branding (icon/sidebar/header)',
      'Optional: Authenticode sign with NajjarTech certificate',
      'Smoke-test First Run + print + backup on Windows',
      'Confirm zero console errors on installed build',
    ],
  };
}

function writeReports(result) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(path.join(REPORT_DIR, 'production-release-results.json'), JSON.stringify(result, null, 2));

  const md = [
    '# Production Release Gate Report',
    '',
    `**Date:** ${new Date().toISOString().slice(0, 10)}`,
    `**Version:** ${result.version}`,
    `**Product:** ${result.productName}`,
    `**Decision:** ${result.decision}`,
    '',
    '## Blocking',
    '',
    result.blocking.length ? result.blocking.map((b) => `- ${b}`).join('\n') : '- none',
    '',
    '## Warnings',
    '',
    result.warnings.length ? result.warnings.map((w) => `- ${w}`).join('\n') : '- none',
    '',
    '## Checks',
    '',
    '| ID | OK | Level | Detail |',
    '|----|----|-------|--------|',
    ...result.checks.map((c) => `| ${c.id} | ${c.ok ? 'YES' : 'NO'} | ${c.level} | ${String(c.detail).replace(/\|/g, '/')} |`),
    '',
    '## Manual Windows checklist',
    '',
    ...result.manualWindowsChecklist.map((item) => `- [ ] ${item}`),
    '',
  ].join('\n');

  fs.writeFileSync(path.join(REPORT_DIR, 'PRODUCTION-RELEASE-REPORT.md'), md);
}

function main() {
  const result = evaluate();
  writeReports(result);

  console.log('Production Release Gate complete');
  console.log(`  Version: ${result.version}`);
  console.log(`  Decision: ${result.decision}`);
  console.log(`  Blocking: ${result.blocking.length}`);
  console.log(`  Warnings: ${result.warnings.length}`);
  console.log(`  Report: ${path.join(REPORT_DIR, 'PRODUCTION-RELEASE-REPORT.md')}`);

  process.exit(result.blocking.length > 0 ? 1 : 0);
}

main();
