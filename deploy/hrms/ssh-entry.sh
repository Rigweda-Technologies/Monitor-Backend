#!/usr/bin/env bash
set -Eeuo pipefail
exec sudo -n /usr/local/sbin/hrms-ci-receive "${SSH_ORIGINAL_COMMAND:-}"
