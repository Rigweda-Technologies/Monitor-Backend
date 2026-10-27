#!/usr/bin/env bash
# Root-owned receiver invoked only through the restricted SSH account's sudo rule.
set -Eeuo pipefail
[[ $# == 1 ]] || exit 2
read -r verb image revision extra <<< "$1"
[[ "$verb" == deploy && "$image" =~ ^sha256:[a-f0-9]{64}$ && "$revision" =~ ^[a-f0-9]{40}$ && -z "$extra" ]] || exit 2
[[ -f /etc/hrms-backend/runtime.env ]] || { echo 'Runtime configuration missing' >&2; exit 1; }
exec 8>/var/lock/hrms-backend-receive.lock
flock -n 8 || { echo 'Another image transfer is active' >&2; exit 1; }
# docker load consumes the streamed archive; the restricted account cannot choose shell commands or paths.
gzip -dc | docker load >/dev/null
docker image inspect "$image" >/dev/null
/usr/local/sbin/hrms-deploy "$image" ap-south-2 "$revision"
