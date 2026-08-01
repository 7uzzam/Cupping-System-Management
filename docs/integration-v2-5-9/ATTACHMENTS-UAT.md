# Attachments Lifecycle UAT

States: `PENDING` · `UPLOADING` · `SYNCED` · `FAILED` · `MISSING_REMOTE` · `QUARANTINED` · `DELETED`

| Check | Result |
|-------|--------|
| Content-addressed helpers | CODE (`database/attachment-sync.js`) |
| Drive path layout | CODE |
| Included in Backup V2 roots | CODE |
| Record uploaded / blob failed | UNVERIFIED |
| Blob uploaded / record failed | UNVERIFIED |
| Hash mismatch | UNVERIFIED |
| Branch isolation | UNVERIFIED |
| Restore then reconcile attachments | UNVERIFIED |
| Resume / large file | UNVERIFIED |

Ready for main: **NO**
