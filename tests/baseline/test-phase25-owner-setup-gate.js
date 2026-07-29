#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const src = fs.readFileSync(path.join(root, 'cloud', 'boot-flow-ui.js'), 'utf8');
const errors = [];

function check(ok, msg) {
  if (!ok) errors.push(msg);
}

check(src.includes('function ownerSetupRequirementMet()'), 'ownerSetupRequirementMet helper missing');
check(
  src.includes("case 'manager': return hasOwnerAccount() && ownerSetupRequirementMet();"),
  'manager step must enforce owner setup requirement'
);
check(
  src.includes("case 'syscheck': return hasValidLicense() && hasGoogle() && hasCenterData() && hasBranch() && hasOwnerAccount() && ownerSetupRequirementMet();"),
  'syscheck must enforce owner setup requirement'
);
check(src.includes('🔐 إنشاء Owner Profile'), 'owner setup button missing in manager step');
check(src.includes('global.OwnerSetupState?.clearRequired?.();'), 'owner setup flag should clear after profile create');

if (errors.length) {
  console.error('FAIL: phase25 owner setup gate');
  for (const err of errors) console.error(' -', err);
  process.exit(1);
}

console.log('OK: phase25 owner setup gate checks');
