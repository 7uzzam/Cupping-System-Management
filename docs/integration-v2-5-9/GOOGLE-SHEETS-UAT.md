# Google Sheets / License Vault UAT

| Topic | Definition |
|-------|------------|
| Role | Apps Script **license vault** (key consume / bundle fetch) — NOT operational SoT |
| Production files | `cloud/google-sheets-ops.js`, `cloud/license-vault-client.js`, `license/vault-config.js` |
| Priority vs Drive | Runtime branches/devices: signed Drive `license.json`. Vault: activation keys / registry consume |
| Manual spreadsheet edit | Unsupported — treat as integration risk; re-pull vault + verify signature |

| Check | Result |
|-------|--------|
| OAuth / vault URL configured | CODE |
| Activate + fetch bundle | prior CODE |
| Token refresh | UNVERIFIED |
| 401/403/404 paths | UNVERIFIED |
| Timeout / retry / rate limit | UNVERIFIED |
| Account change mid-session | UNVERIFIED |
| Offline recovery | UNVERIFIED |
| Drive vs Sheets conflict | UNVERIFIED |

Windows scenario E: **UNVERIFIED**
