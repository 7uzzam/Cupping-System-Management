#!/usr/bin/env node
/**
 * Ensure electron/cloud-oauth.config.json exists before packaging.
 * Priority: existing valid config → env → local override → embedded production → defaults+local secret
 */
import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const target = join(root, 'electron', 'cloud-oauth.config.json');
const localOverride = join(root, 'electron', 'cloud-oauth.config.local.json');
const embedded = join(root, 'electron', 'cloud-oauth.embedded.json');
const example = join(root, 'electron', 'cloud-oauth.config.example.json');
const defaults = join(root, 'electron', 'cloud-oauth.defaults.json');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function hasGoogleCreds(cfg) {
  const g = cfg?.google || cfg;
  return !!(g?.clientId && g?.clientSecret &&
    !String(g.clientId).includes('YOUR_') &&
    !String(g.clientSecret).includes('YOUR_') &&
    !String(g.clientSecret).includes('PASTE_YOUR'));
}

function writeConfig(googleCfg, source) {
  let base = { google: {}, onedrive: {}, dropbox: {} };
  if (existsSync(example)) {
    try { base = readJson(example); } catch { /* keep */ }
  }
  base.google = { ...base.google, ...googleCfg };
  writeFileSync(target, JSON.stringify(base, null, 2) + '\n', 'utf8');
  console.log(`✓ cloud-oauth.config.json generated (${source})`);
}

function tryEmbedded() {
  if (!existsSync(embedded)) return false;
  try {
    const emb = readJson(embedded);
    if (hasGoogleCreds(emb)) {
      writeFileSync(target, JSON.stringify(emb, null, 2) + '\n', 'utf8');
      console.log('✓ cloud-oauth.config.json generated (embedded production defaults)');
      return true;
    }
  } catch { /* fall through */ }
  return false;
}

if (existsSync(target)) {
  try {
    if (hasGoogleCreds(readJson(target))) {
      if (process.argv.includes('--verbose')) console.log('✓ cloud-oauth.config.json already configured');
      process.exit(0);
    }
  } catch { /* regenerate */ }
}

const envId = process.env.GOOGLE_OAUTH_CLIENT_ID || '';
const envSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
if (envId && envSecret) {
  writeConfig({
    clientId: envId,
    clientSecret: envSecret,
    redirectPort: parseInt(process.env.GOOGLE_OAUTH_REDIRECT_PORT || '42813', 10)
  }, 'environment variables');
  process.exit(0);
}

if (existsSync(localOverride)) {
  try {
    const local = readJson(localOverride);
    if (hasGoogleCreds(local)) {
      copyFileSync(localOverride, target);
      console.log('✓ cloud-oauth.config.json copied from cloud-oauth.config.local.json');
      process.exit(0);
    }
    const secret = local?.google?.clientSecret;
    const hasSecret = secret && !String(secret).includes('YOUR_') && !String(secret).includes('PASTE_YOUR');
    const def = existsSync(defaults) ? readJson(defaults) : {};
    const clientId = local?.google?.clientId || def?.google?.clientId || (existsSync(example) ? readJson(example)?.google?.clientId : '');
    if (hasSecret && clientId && !String(clientId).includes('YOUR_')) {
      writeConfig({
        ...(def.google || {}),
        ...(local.google || {}),
        clientId,
        clientSecret: secret
      }, 'local secret + defaults');
      process.exit(0);
    }
  } catch { /* fall through */ }
}

if (tryEmbedded()) process.exit(0);

console.error(`
❌ Google OAuth is NOT configured for this build.

The installed app needs electron/cloud-oauth.config.json inside app.asar.

Fix (choose one):
  A) npm run build:prod  (uses electron/cloud-oauth.embedded.json automatically)
  B) Create electron/cloud-oauth.config.local.json with clientId + clientSecret
  C) Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET env vars
`);

if (process.argv.includes('--strict')) {
  process.exit(1);
}

process.exit(0);
