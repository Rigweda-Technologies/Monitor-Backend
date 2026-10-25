# Execution ledger — 2026-10-25-repository-split.md

Task 1 complete: original source retained; existing destination repositories used as isolated migration branches; inventory covers 674 files with no omissions. Real env files copied unchanged.
Task 2 complete: root launchers/configuration/docs added; original app subtrees retained; Git exclusions protect secrets and include lockfiles/specs. Hosted web build and server-template setup corrected after independent review.
Task 3 execution complete with limitations: backend 177 tests, web test/lint/build, agent 3 tests, live agent->API->PG->web read-back passed. Native Windows capture, iOS FirebaseCore build, pre-existing mobile Jest ESM failure, and unavailable browser UI remain explicitly unverified/blocked in docs/VERIFICATION.md.

Ruling: User approved proceeding in existing named destination repositories; no extra worktrees, remote mutations or commits needed. Changes remain reviewable in place.
Ruling: Preserve original subtrees because backend tests and installer scripts rely on those paths; add simple independent launchers instead of flattening apps.
Ruling: Use isolated local databases for integration writes; preserve actual copied environment secrets and supply local overrides.
Ruling: Do not port Windows capture to macOS as part of a repository split. Run cross-platform agent auth/queue code against the real stack and report Windows-only limitations.
Ruling: Existing mobile test failure reproduced in original; do not broaden repository migration into a navigation/native dependency overhaul. Native build attempted and precise blocker recorded.
