#!/usr/bin/env bash
# Root-owned receiver invoked through a narrowly scoped sudo rule on the EC2 runner.
set -Eeuo pipefail
[[ $# == 1 ]] || exit 2
read -r verb image revision extra <<< "$1"
[[ "$verb" == deploy-monitor && "$revision" =~ ^[a-f0-9]{40}$ && "$image" == "monitor-v2:$revision" && -z "$extra" ]] || exit 2

receive_lock=${MONITOR_V2_RECEIVE_LOCK_FILE:-/var/lock/monitor-v2-receive.lock}
deploy_command=${MONITOR_V2_DEPLOY_COMMAND:-/usr/local/sbin/monitor-v2-deploy}
[[ -x "$deploy_command" ]] || { echo 'Monitor V2 deploy helper is unavailable' >&2; exit 1; }
exec 8>"$receive_lock"
flock -n 8 || { echo 'Another Monitor V2 image transfer is active' >&2; exit 1; }
gzip -dc | docker load >/dev/null
docker image inspect "$image" >/dev/null
"$deploy_command" "$image" "$revision"
