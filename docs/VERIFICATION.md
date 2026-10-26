# Repository split verification — 2026-10-25

## Result

All 674 non-generated source/configuration/document files are accounted for in the migration manifest. Actual `.env` files were compared byte-for-byte and remain unchanged. Secrets, SQL export, runtime data, and verification logs are local and ignored. Dependency lockfiles and PyInstaller specs are included in Git. The original Rigweda-Monitor Git working tree is clean and retained as rollback. No remote push, repository rename on GitHub, or history rewrite was performed.

Each destination is on `migration/split-repositories`; changes are uncommitted for review. The agent folder is now Monitor-Agent, with the pre-existing Moniter-Agent remote retained.

## Executed checks

| Check | Command/evidence | Result |
|---|---|---|
| Backend install | `npm ci --prefix hrms/back-end`, `npm ci --prefix desktop/backend` in Monitor-Backend | Passed |
| Backend suites with real PostgreSQL ownership checks | `MONITOR_OWNERSHIP_TEST_URL=<local PostgreSQL URL> npm test` in Monitor-Backend | 177 passed, 0 failed, 0 skipped (158 HRMS including subtests, 19 monitor) |
| Web install | `npm ci --prefix hrms/front-end` in Monitor-Frontend | Passed |
| Web checks | `npm test`, `npm run lint`, `npm run build` in Monitor-Frontend | 1 test passed, lint passed, production build passed; bundle-size warnings |
| Hosted web build | `npm run build:server` in Monitor-Frontend | Passed; built JavaScript checked for both hosted API URLs and absence of local API URLs |
| Python install | `.venv/bin/python -m pip install -r requirements.txt` in agent app | Passed |
| Agent queue tests | `.venv/bin/python -m unittest discover -s tests -v` in agent app | 3 passed |
| Backend live startup | `npm run local` in Monitor-Backend | Both services started, HRMS readiness returned 200, monitor health returned 200 |
| Web live startup | `npm run local` in Monitor-Frontend | Port 3000 served the login route; authenticated API proxy checks passed |
| Launcher shutdown | SIGTERM sent to the known backend launcher started by this task | Both ports 8000 and 3001 closed; launcher restarted successfully |
| Connected agent/API/web check | `MONITOR_TEST_EMAIL=... MONITOR_TEST_PASSWORD=... desktop/frontend/.venv/bin/python scripts/check-connections.py` in Monitor-Agent | Real agent login, SQLite queue upload, HRMS token validation, PostgreSQL persistence, HRMS read-back through web proxy, CORS and unauthenticated rejection passed |
| Mobile install | `npm install --prefix hrms/cli`, then `npm ci --prefix hrms/cli` in Monitor-Frontend | Passed after repairing pre-existing out-of-sync Firebase lock entries |
| Mobile local URL tests | `npm test --prefix hrms/cli -- --runInBand __tests__/api-local.test.ts` | 2 passed; observed failing against the old hosted-only configuration before changing it |
| Mobile API client integration | Actual api.ts transpiled and invoked against running HRMS, with Node fetch and an iOS Platform adapter | Login and authenticated profile passed; this is not native UI evidence |
| Mobile Metro | `npm start --prefix hrms/cli -- --no-interactive`, HTTP `/status` and iOS bundle request | Metro running and iOS JavaScript bundle returned 200 |
| CocoaPods | `pod install` in hrms/cli/ios | Passed after declaring GoogleUtilities modular headers |
| Migration checks | SHA-256 inventory, Git-ignore checks, JS/shell syntax and `git diff --check` | Passed |

## Unresolved / unavailable checks

- **Windows agent UI/capture:** `npm run local` was attempted on macOS and exits with `ModuleNotFoundError: No module named 'win32gui'`. The application uses Windows-only APIs. Authentication, queue transport and queue tests passed independently; Windows UI, capture, USB enforcement, installers and EXE builds still need Windows.
- **Native iOS:** `npm run ios --prefix hrms/cli -- --udid <iPhone simulator ID> --no-packager` reached Xcode build but failed with `Module 'FirebaseCore' not found` in FirebaseMessaging (exit 65). No native application launch/login is claimed. Android has no attached emulator/device and was not built.
- **Existing mobile Jest App render test:** `npm test --prefix hrms/cli -- --runInBand` has 1 failed suite and 1 passed suite (the two new API URL tests pass). App.test.tsx fails parsing the ESM export in @react-navigation/native. The same failure was reproduced in the unchanged original checkout. No passing full mobile suite is claimed.
- **Browser UI:** Browser runtime discovery returned no available browsers. HTTP login-route/proxy/CORS checks are verified; rendered UI interactions are not.
- **External providers:** Cloudinary uploads, Firebase notifications, email, hosted endpoints and payroll were not exercised against real providers. Tests used the isolated local monitor_split_local databases, with local Redis/payroll/jobs disabled.

## Local state and reproduction

The web app and both API services are left running at ports 3000, 8000 and 3001; Metro is at 8081. Stop their launchers before starting another copy on these ports. The iOS simulator was booted by the native build attempt. Local test data is confined to monitor_split_local databases, including a synthetic test employee and seven-second activity events. Test credentials/logs are in ignored `.verification` files; the reusable agent connection script expects credentials via environment variables.

Detailed logs are in each repository's ignored `.verification/` directory. These logs may contain runtime diagnostics and should not be committed. Runtime process state can change after this report; use the documented startup commands to reproduce.

## Changes found during verification

- Added portable repository launchers that use application working directories, mode selection, virtual-environment Python, child failure propagation, and shutdown handling.
- Added local and hosted environment overlays/templates without changing copied secret `.env` files.
- Added explicit hosted web build selection and documented copying `.env.server.example`; hosted artifacts were verified not to contain localhost API endpoints.
- Updated the mobile API client to use emulator-local HRMS in development while preserving its production URL.
- Repaired mobile dependency lock consistency and a CocoaPods module-header prerequisite; native FirebaseCore build failure remains documented above.
- Independent review found no missing source files or wrongly ignored source/spec/lockfiles; its hosted-build and server-template findings were addressed.
