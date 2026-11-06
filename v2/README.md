# Independent v2 APIs

- [Monitor ingestion](monitor-api/README.md): eight desktop business endpoints, default port 3002.
- [HRMS API](hrms-api/README.md): all 250 unique mounted V1 operations are registered under `/api/v2` and documented in generated OpenAPI; default port 8002.

Each service owns its package, lockfile, tests, configuration and startup. Root launch commands continue to start v1. No client redirects, shared migration execution or deployment are performed by creating these services.
