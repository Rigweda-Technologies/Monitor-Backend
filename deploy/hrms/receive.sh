#!/usr/bin/env bash
# Root-owned receiver invoked only through the restricted SSH account's sudo rule.
set -Eeuo pipefail
[[ $# == 1 ]] || exit 2
read -r verb image revision extra <<< "$1"
[[ "$revision" =~ ^[a-f0-9]{40}$ && ( "$image" == "hrms-backend:$revision" || "$image" =~ ^sha256:[a-f0-9]{64}$ ) && "$verb" == deploy && -z "$extra" ]] || exit 2
runtime_env=${HRMS_RUNTIME_ENV:-/etc/hrms-backend/runtime.env}
receive_lock=${HRMS_RECEIVE_LOCK_FILE:-/var/lock/hrms-backend-receive.lock}
deploy_command=${HRMS_DEPLOY_COMMAND:-/usr/local/sbin/hrms-deploy}
[[ -f "$runtime_env" ]] || { echo 'Runtime configuration missing' >&2; exit 1; }
exec 8>"$receive_lock"
flock -n 8 || { echo 'Another image transfer is active' >&2; exit 1; }
# docker load consumes the streamed archive; the restricted account cannot choose shell commands or paths.
gzip -dc | docker load >/dev/null
docker image inspect "$image" >/dev/null
"$deploy_command" "$image" ap-south-2 "$revision"
