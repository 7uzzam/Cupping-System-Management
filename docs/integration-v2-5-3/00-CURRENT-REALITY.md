# V2-5.3 — Current Reality (Owner, Identity & License)

**Branch:** `cursor/v2-5-3-owner-identity-c2ea`
**Baseline:** V2-5.2 tip `ffb5cda` (release gate green)

## Summary

Owner bootstrap APIs exist but UI token redeem is largely UNWIRED. Token TTL/expiry MISSING. Two-device race MISSING. Owner recovery/transfer/emergency MISSING. Google auto-owner correctly REAL (denied). Identity IDs mostly persist via userData; center switch confirm MISSING. License verify/limits partial; offline grace MISSING; maxUsers MISSING enforcement.

## Gaps (pre-implementation)

1. Token TTL + UI redeem + atomic once-only claim
2. Owner recovery when profile missing / after restore + audit
3. Password reset → session invalidation
4. Ownership transfer + revoke old owner
5. Device transfer path; revoke blocks sync (product)
6. Center switch confirmation
7. License grace + maxUsers + upgrade/downgrade evidence
