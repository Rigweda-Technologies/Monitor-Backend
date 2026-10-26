# Local and hosted environments

The copied `.env` files retain their original contents. They are local secrets and are Git-ignored, as are `env.text`, `env.txt`, runtime queues/logs, and the SQL dump. Safe `.env.example` and `.env.local.example` files are versioned. Transfer real secrets separately when cloning on another machine.

`npm run local` sets `APP_ENV=local`; each backend and the agent loads `.env` then `.env.local`. Vite uses `development-local`. Local overrides connect HRMS on port 8000, monitor API on 3001, and web on 3000. Both APIs use the same monitor PostgreSQL database. The checked local overlays use the isolated `monitor_split_local` MongoDB/PostgreSQL databases; existing hosted databases were not used for integration-test writes. Edit the ignored overlays to use other development databases. Local Redis, payroll and background jobs are disabled for this verification setup.

`npm run server` uses `.env.server` for hosted endpoints. Backends still run locally when started in server mode; only clients select hosted APIs. Configure deployment secrets in the hosting platform and choose the relevant application subdirectory as the deployment root. Do not deploy the local test overlays.

For a fresh clone, copy `.env.example` to `.env` and `.env.local.example` to `.env.local` inside each application, fill the required credentials and database username, and create the local MongoDB/PostgreSQL databases. MongoDB creates its database on first write; PostgreSQL needs `createdb monitor_split_local` (or your chosen name). The examples use the `postgres` role; this workstation's actual ignored overlays use its local PostgreSQL role.

The Windows desktop UI/capture uses Windows APIs. On macOS/Linux, its Python authentication and queue modules can be tested, but full capture and installer verification need Windows.

For hosted mode on a fresh clone, also copy `.env.server.example` to `.env.server` in each application and review the endpoints before `npm run server`. To produce a hosted web bundle use `npm run build:server` in Monitor-Frontend; the ordinary `npm run build` uses Vite production defaults and may include your local overrides.
