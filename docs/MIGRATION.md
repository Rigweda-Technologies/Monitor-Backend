# Migration inventory — 2026-10-25

Source: `Rigweda-Monitor`, retained unchanged as rollback. Destination repositories retain their own Git histories/remotes and use branch `migration/split-repositories`. No pushes were performed; old monorepo commit history was not imported.

| Source subtree | Destination repository | Destination path |
|---|---|---|
| hrms/back-end | Monitor-Backend | hrms/back-end |
| desktop/backend | Monitor-Backend | desktop/backend |
| hrms/front-end | Monitor-Frontend | hrms/front-end |
| hrms/cli | Monitor-Frontend | hrms/cli |
| desktop/frontend | Monitor-Agent | desktop/frontend |
| scripts and stop | Monitor-Agent | same paths (launcher adapted) |
| postman, .postman, SQL dump | Monitor-Backend | same paths |
| hrms/TODO.md, hrms/deploy.sh | Monitor-Frontend | same paths (deploy adapted) |
| hrms/logs, logs | Monitor-Backend | same paths |
| docs | all three | docs |
| README.md, ENVIRONMENTS.md | all three | docs/MONOREPO-*.md |
| package.json, scripts/run-suite.mjs | Monitor-Backend | docs/monorepo-* |
| .gitignore | all three | merged into .gitignore |

Original `.env` files are copied byte-for-byte. Environment templates and mode overlays, root launchers and READMEs are adapted for independent repositories. Historical audit documents may refer to the old layout; their original text is retained. Source OS metadata and Git internals are not migration artifacts. Dependencies/build outputs were copied locally where present and remain ignored; npm dependencies are reinstalled for portable symlinks. See `migration-manifest.json` for source file coverage and SHA-256 hashes (secret values are never included).
