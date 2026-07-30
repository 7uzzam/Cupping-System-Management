# 03 — OAuth Real UAT (V2-4)

**Status:** IN_PROGRESS / blocked on protected secrets for full PASS  
**Provider:** Google Drive OAuth (Authorization Code + loopback; refresh via main-process token-store)

## Environment requirements

| Item | Location | In Git? |
|------|----------|---------|
| Client ID/Secret | `electron/cloud-oauth.config.json` generated at build; prod via GitHub Environment `v2-4-real-cloud` | **No** (gitignored) |
| Refresh token | OS-protected `safeStorage` / CloudVault; CI secret `GOOGLE_OAUTH_REFRESH_TOKEN` | **No** |
| Test Google account | Dedicated UAT account only | N/A |

## Scopes (minimal)

Documented in OAuth consent for Drive file create/read/update under app-created hierarchy. Do not request full Drive unrestricted if narrower scope works.

## Checklist

| Case | Result |
|------|--------|
| Installed release connect (Device A) | NOT_STARTED — needs Windows + real secrets |
| Refresh token never in Renderer | Code path: `electron/cloud-providers/token-store.js` uses safeStorage — automated inspect pending Windows |
| Access token expiry → refresh | Harness `scripts/v2-4-real-drive-uat.cjs` when secrets present |
| Revoke/disconnect preserves local DB/outbox | NOT_STARTED (runtime) |
| Unauthorized Google cannot join existing center | NOT_STARTED (runtime) |
| Loopback bind 127.0.0.1 only | Covered by existing oauth-loopback module — re-verify on Windows |
| Secrets in logs/artifacts | Forbidden; harness masks IDs |

## Evidence index

- Workflow: `.github/workflows/v2-4-real-cloud-uat.yml`
- Harness output: `docs/integration-v2-4/evidence/real-cloud-uat.json` (after successful run)
- Until Environment secrets are configured: **cannot mark OAUTH-* PASS**
