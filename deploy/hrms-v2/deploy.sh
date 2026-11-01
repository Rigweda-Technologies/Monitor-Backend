#!/usr/bin/env bash
# Executed as root through the narrow HRMS v2 receiver. Never enable shell tracing.
set -Eeuo pipefail
image=${1:?immutable local image required}
revision=${2:?source commit required}
[[ "$revision" =~ ^[a-f0-9]{40}$ && "$image" == "hrms-api-v2:$revision" ]] || { echo 'Invalid image reference or revision' >&2; exit 2; }
env_file=${HRMS_V2_ENV_FILE:-/etc/hrms-api-v2/runtime.env}
lock_file=${HRMS_V2_LOCK_FILE:-/var/lock/hrms-api-v2-deploy.lock}
attempts=${HRMS_V2_HEALTH_ATTEMPTS:-30}
[[ "$attempts" =~ ^[1-9][0-9]?$ ]] || exit 2
[[ -f "$env_file" ]] || { echo 'Missing instance-local HRMS v2 runtime.env' >&2; exit 2; }
for tool in docker curl flock; do command -v "$tool" >/dev/null; done
exec 9>"$lock_file"
flock -n 9 || { echo 'Another HRMS v2 deployment is running' >&2; exit 1; }
current=hrms-api-v2
previous=hrms-api-v2-previous
old_exists=0
renamed=0
candidate_attempted=0
stopped=0

ready() {
  local i
  for ((i=0; i<attempts; i++)); do
    if curl --fail --silent --max-time 3 http://127.0.0.1:8002/api/v2/ready >/dev/null; then return 0; fi
    sleep 2
  done
  return 1
}

cleanup() {
  local result=$?
  trap - EXIT
  if (( result != 0 && (stopped || candidate_attempted) )); then
    echo 'HRMS v2 deployment failed; restoring the previous container if available.' >&2
    if (( candidate_attempted )); then docker rm -f "$current" >/dev/null 2>&1 || true; fi
    if (( old_exists )); then
      if (( renamed )); then docker rename "$previous" "$current" || true; fi
      if docker start "$current" >/dev/null && ready; then
        echo 'Previous HRMS v2 container restored.' >&2
      else
        echo 'CRITICAL: HRMS v2 recovery needs operator attention.' >&2
      fi
    fi
  fi
  exit "$result"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

image_revision=$(docker image inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$image")
[[ "$image_revision" == "$revision" ]] || { echo 'Image revision label mismatch' >&2; exit 1; }
if docker inspect "$current" >/dev/null 2>&1; then old_exists=1; fi
if docker inspect "$previous" >/dev/null 2>&1; then docker rm -f "$previous" >/dev/null; fi
if (( old_exists )); then
  stopped=1
  docker stop --time 30 "$current" >/dev/null
  docker rename "$current" "$previous"
  renamed=1
fi
candidate_attempted=1
docker run -d --name "$current" --restart unless-stopped --init \
  --env-file "$env_file" --env NODE_ENV=production --env PORT=8002 --env HOST=0.0.0.0 \
  --publish 127.0.0.1:8002:8002 \
  --log-driver json-file --log-opt max-size=10m --log-opt max-file=3 \
  --label "org.opencontainers.image.revision=$revision" \
  "$image" >/dev/null
ready || { echo 'New HRMS v2 container failed readiness' >&2; exit 1; }
echo "Deployed HRMS v2 $revision ($image); readiness passed."
