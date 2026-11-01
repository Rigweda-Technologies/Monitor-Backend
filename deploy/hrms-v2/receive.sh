#!/usr/bin/env bash
# Root-owned receiver invoked by the restricted EC2 Actions runner sudo rule.
set -Eeuo pipefail
[[ $# == 1 ]] || exit 2
read -r verb image revision extra <<< "$1"
[[ "$verb" == deploy && "$revision" =~ ^[a-f0-9]{40}$ && "$image" == "hrms-api-v2:$revision" && -z "$extra" ]] || exit 2
runtime_env=${HRMS_V2_RUNTIME_ENV:-/etc/hrms-api-v2/runtime.env}
receive_lock=${HRMS_V2_RECEIVE_LOCK_FILE:-/var/lock/hrms-api-v2-receive.lock}
deploy_command=${HRMS_V2_DEPLOY_COMMAND:-/usr/local/sbin/hrms-api-v2-deploy}
[[ -f "$runtime_env" ]] || { echo 'HRMS v2 runtime configuration missing' >&2; exit 1; }
exec 8>"$receive_lock"
flock -n 8 || { echo 'Another HRMS v2 image transfer is active' >&2; exit 1; }
gzip -dc | docker load >/dev/null
docker image inspect "$image" >/dev/null
"$deploy_command" "$image" "$revision"
