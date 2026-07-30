# V2-5.3 — Target Design

## Owner claim

redeemSetupToken → verify signature + TTL + not consumed → atomic claim → OwnerProfile once → mark consumed → audit.

Race: second device gets bootstrap_already_consumed / claim conflict.

## Recovery / transfer

Authorized recovery recreates OwnerProfile without Google auto-owner. Transfer promotes new owner, demotes old, invalidates sessions, audits.

## Identity / License

IDs stable in userData. Revoke blocks sync without DB wipe. Center switch needs explicit confirm. Offline grace enforced. maxUsers at user-create. Upgrade/downgrade features only.
