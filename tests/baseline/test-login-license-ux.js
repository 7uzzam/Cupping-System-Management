#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const boot = fs.readFileSync(path.join(root, 'cloud', 'boot-flow-ui.js'), 'utf8');
const errors = [];

function check(ok, msg) {
  if (!ok) errors.push(msg);
}

check(html.includes('Hard ceiling so the login UI never stays stuck'), 'licCheck hard timeout missing');
check(html.includes('Always restore a usable pre-auth screen'), 'closeLicenseScreen must restore login for guests');
check(html.includes("function withTimeout(promise, ms, label)"), 'startup withTimeout missing');
check(html.includes("await withTimeout(licCheck(), 5000, 'licCheck')"), 'startup must timeout licCheck');
check(boot.includes('const forceLogin = !!(opts?.showLogin || !global.currentUser)'), 'BootFlow close must force login when unauthenticated');

if (errors.length) {
  console.error('FAIL: login license UX');
  for (const e of errors) console.error(' -', e);
  process.exit(1);
}

console.log('OK: login license UX checks');
