#!/usr/bin/env node
'use strict';

/**
 * V2-5.10 Category B (safe without live Windows) wiring checks.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '../..');
const errors = [];
const check = (cond, msg) => { if (!cond) errors.push(msg); };

const bridge = fs.readFileSync(path.join(root, 'cupping-sqlite-bridge.js'), 'utf8');
check(/__tdw_conflict_queue__/.test(bridge) && /__tdw_attachment_manifest__/.test(bridge),
  'KV_MIRROR includes conflict queue + attachment manifest');
check(/function isPrimary/.test(bridge), 'SqliteBridge.isPrimary helper');

const cq = fs.readFileSync(path.join(root, 'cloud/conflict-queue.js'), 'utf8');
check(/mirrorOpenToSqlite/.test(cq) && /openConflict/.test(cq), 'ConflictQueue dual-writes sync_conflicts');
check(/mirrorResolveToSqlite/.test(cq) && /resolveConflict/.test(cq), 'ConflictQueue resolves SQLite conflict');

const outbox = fs.readFileSync(path.join(root, 'database/sync-outbox.js'), 'utf8');
check(/listOpenConflicts/.test(outbox), 'listOpenConflicts API');
check(/ON CONFLICT\(conflict_id\)/.test(outbox), 'openConflict idempotent upsert');

const svc = fs.readFileSync(path.join(root, 'electron/database/service.js'), 'utf8');
check(/listOpenConflicts/.test(svc), 'syncOp exposes listOpenConflicts');

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
check(/BootFlow is the only customer activation path/.test(index)
  || /never show it/.test(index),
  'login drive bootstrap panel forced hidden');
check(/modal-shell--sm/.test(index) && /100dvh/.test(index), 'modal-shell responsive sizing');

const hub = fs.readFileSync(path.join(root, 'cloud/owner-hub.js'), 'utf8');
check(/showSection/.test(hub) && /العمليات اليومية/.test(hub) && /الدعم المتقدم/.test(hub),
  'Owner Hub Daily vs Advanced sections');

const cat = fs.readFileSync(path.join(root, 'docs/integration-v2-5-10/CATEGORY-A-B.md'), 'utf8');
check(/Category A/.test(cat) && /Category B/.test(cat), 'Category A/B doc present');
check(/Production Candidate/.test(cat), 'PC still gated by Category A');

const status = fs.readFileSync(path.join(root, 'docs/integration-v2-5-10/CURRENT-STATUS.md'), 'utf8');
check(/Ready for production[\s\S]{0,40}\*\*NO\*\*/i.test(status), 'production still NO');
check(!/Overall\s*[≥>=]\s*90/.test(status), 'no score inflation');

// Runtime: listOpenConflicts on temp DB
const os = require('os');
const { openDatabase } = require(path.join(root, 'database/connection'));
const { createSyncPlatform } = require(path.join(root, 'database/sync-outbox'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'v2510-catb-'));
const dbPath = path.join(tmp, 't.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = openDatabase(dbPath);
const sp = createSyncPlatform(db);
const opened = sp.openConflict({
  conflict_id: 'cf-test-1',
  center_id: 'CTR',
  branch_id: 'BR-MAIN',
  table_name: 'cases',
  record_id: 'c1',
  local_json: { id: 'c1', v: 1 },
  remote_json: { id: 'c1', v: 2 },
});
check(opened.ok === true, 'openConflict ok');
const again = sp.openConflict({
  conflict_id: 'cf-test-1',
  center_id: 'CTR',
  branch_id: 'BR-MAIN',
  table_name: 'cases',
  record_id: 'c1',
  local_json: { id: 'c1', v: 3 },
  remote_json: { id: 'c1', v: 2 },
});
check(again.ok === true, 'openConflict upsert ok');
const rows = sp.listOpenConflicts({ branchId: 'BR-MAIN' });
check(Array.isArray(rows) && rows.length >= 1, 'listOpenConflicts returns rows');
check(sp.resolveConflictById('cf-test-1', 'local', null, 'tester').ok === true, 'resolveConflict ok');
try { db.close(); } catch { /* empty */ }

if (errors.length) {
  console.error('FAIL v2-5.10 category-b:\n- ' + errors.join('\n- '));
  process.exit(1);
}
console.log('PASS v2-5.10 category-b (SQLite conflict dual-write, Owner Hub split, BootFlow-only login, modal shell)');
assert.strictEqual(errors.length, 0);
