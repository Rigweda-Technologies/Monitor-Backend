# Repository Split Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Independently runnable repositories with all original files accounted for and connected runtime verification.
**Architecture:** Preserve app subtrees, separate root launchers, local URL overlays; original checkout is rollback.
**Tech Stack:** Node/Express/Fastify, React/Vite, React Native, Python.
**Spec:** ../specs/2026-10-25-repository-split-design.md

## Global Constraints
Preserve source checkout and all environment values. Never publish secrets. No remote changes or push.

## Review Focus
- Missing ignored files: compare source manifest against destinations.
- Hidden sibling imports: run backend suites from new checkout.
- Hosted URL leakage: verify local resolved URL graph.
- Launch failures and orphan processes: verify root runner startup and shutdown.
- Native dependencies: distinguish real device execution from HTTP/module checks.

### Task 1: Copy all applications and docs
- [x] Copy mapped subtrees, secrets, assets, docs and data; retain Git metadata.
- [x] Write source/destination manifest and verify content hashes.

### Task 2: Independent launch/configuration
- [x] Add root package.json and scripts/run.mjs in all repositories; preserve mode scripts.
- [x] Add local environment overlays and safe templates; remove obsolete runtime sibling dependencies.
- [x] Update README and ENVIRONMENTS with exact install/start commands and service map.
- [x] Verify runner parsing, environment loading and Git exclusions.

### Task 3: Connected validation
- [x] Install dependencies in all apps; run existing backend, agent, web and mobile checks.
- [x] Start APIs, web and agent; exercise login, frontend API access, agent ingestion and HRMS read-back.
- [x] Attempt browser and native mobile execution; document actual blockers.
- [x] Review migration changes, record executed evidence and preserve logs locally.
