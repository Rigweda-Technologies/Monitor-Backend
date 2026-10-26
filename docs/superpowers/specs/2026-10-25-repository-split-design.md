# Repository split

Approved: move all code, docs and environment files into three repositories and run connected checks.

Monitor-Backend owns hrms/back-end and desktop/backend, API collections and the SQL dump. Monitor-Frontend owns hrms/front-end and hrms/cli. Monitor-Agent owns desktop/frontend and Windows installation scripts. Preserve subtree paths to retain existing tests and installer resolution. Copy shared historical documentation to every repository. Keep original checkout unchanged as rollback. Actual secrets and data stay local and ignored; include safe env templates.

Approaches: retain subtrees (selected: minimal runtime changes); flatten all apps (rejected: unnecessary path churn); preserve filtered Git history (deferred: destination repositories already exist). Preserve destination Git histories and remotes. Local Monitor-Agent retains the existing Moniter-Agent remote. No push or remote rename is part of this operation.

Independent startup per repository; local modes connect via ports 8000 (HRMS), 3001 (monitor), 3000 (web). Validate file coverage, installs, automated checks, live startup, authentication and connected data flow. Report Windows/native mobile and provider limitations separately.
