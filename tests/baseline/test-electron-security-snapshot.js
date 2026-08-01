#!/usr/bin/env node
'use strict';

/**
 * Baseline snapshot of Electron security-related settings (read-only).
 * Phase 2 will harden these; this test locks the Phase-1 observed values.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const mainSrc = fs.readFileSync(path.join(root, 'electron', 'main.js'), 'utf8');
const preloadSrc = fs.readFileSync(path.join(root, 'electron', 'preload.js'), 'utf8');
const errors = [];

function mustInclude(src, needle, label) {
  if (!src.includes(needle)) errors.push(`missing ${label}: ${needle}`);
}

mustInclude(mainSrc, 'contextIsolation: true', 'contextIsolation');
mustInclude(mainSrc, 'nodeIntegration: false', 'nodeIntegration');
mustInclude(mainSrc, 'sandbox: false', 'sandbox_false_baseline');
mustInclude(mainSrc, "preload: path.join(__dirname, 'preload.js')", 'preload');
mustInclude(preloadSrc, 'contextBridge.exposeInMainWorld', 'contextBridge');
mustInclude(preloadSrc, "exposeInMainWorld('cuppingElectron'", 'cuppingElectron_api');

// Ensure no accidental nodeIntegration:true
if (/nodeIntegration:\s*true/.test(mainSrc)) errors.push('nodeIntegration_true_found');

// Typed API surface (no generic invoke exporter)
if (/exposeInMainWorld\(['"]ipcRenderer/.test(preloadSrc)) {
  errors.push('raw_ipcRenderer_exposed');
}
if (preloadSrc.includes('invoke: (channel') || preloadSrc.includes('invoke:(channel')) {
  errors.push('generic_invoke_api');
}

if (errors.length) {
  console.error('FAIL: electron security baseline');
  for (const e of errors) console.error(' -', e);
  process.exit(1);
}

console.log('OK: electron security baseline snapshot');
console.log('  contextIsolation=true nodeIntegration=false sandbox=false (Phase 2 will raise sandbox)');
