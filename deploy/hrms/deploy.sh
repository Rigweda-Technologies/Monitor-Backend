#!/usr/bin/env bash
# Executed on Ubuntu by SSM as root. Never enable shell tracing: runtime credentials stay local.
set -Eeuo pipefail
image=${1:?immutable ECR image required}
region=${2:?AWS region required}
revision=${3:?source commit required}
[[ "$image" =~ ^sha256:[a-f0-9]{64}$ || "$image" =~ ^hrms-backend:[a-f0-9]{40}$ || "$image" =~ ^[0-9]{12}\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com/[a-z0-9/_-]+@sha256:[a-f0-9]{64}$ ]] || { echo 'Invalid immutable image reference' >&2; exit 2; }
[[ "$region" =~ ^[a-z]{2}-[a-z]+-[0-9]+$ && "$revision" =~ ^[a-f0-9]{40}$ ]] || { echo 'Invalid region or revision' >&2; exit 2; }
[[ "$image" == sha256:* || "$image" == "hrms-backend:$revision" || "$image" == *".ecr.$region.amazonaws.com/"* ]] || { echo 'Image reference does not match its source commit' >&2; exit 2; }
env_file=${HRMS_ENV_FILE:-/etc/hrms-backend/runtime.env}
lock_file=${HRMS_LOCK_FILE:-/var/lock/hrms-backend-deploy.lock}
attempts=${HRMS_HEALTH_ATTEMPTS:-30}
[[ "$attempts" =~ ^[1-9][0-9]?$ ]] || exit 2
[[ -f "$env_file" ]] || { echo 'Missing instance-local runtime.env' >&2; exit 2; }
for tool in docker curl flock; do command -v "$tool" >/dev/null; done
exec 9>"$lock_file"
flock -n 9 || { echo 'Another deployment is running' >&2; exit 1; }
export DOCKER_CONFIG
DOCKER_CONFIG=$(mktemp -d)
current=hrms-backend
previous=hrms-backend-previous
old_exists=0
renamed=0
candidate_attempted=0
stopped=0

ready() {
  local i
  for ((i=0; i<attempts; i++)); do
    if curl --fail --silent --max-time 3 http://127.0.0.1:8000/ready >/dev/null; then return 0; fi
    sleep 2
  done
  return 1
}

cleanup() {
  local result=$?
  trap - EXIT
  if (( result != 0 && (stopped || candidate_attempted) )); then
    echo 'Deployment failed; restoring previous container if available.' >&2
    if (( candidate_attempted )); then docker rm -f "$current" >/dev/null 2>&1 || true; fi
    if (( old_exists )); then
      if (( renamed )); then docker rename "$previous" "$current" || true; fi
      if docker start "$current" >/dev/null && ready; then
        echo 'Previous container restored.' >&2
      else
        echo 'CRITICAL: previous container recovery needs operator attention.' >&2
      fi
    fi
  fi
  rm -rf "$DOCKER_CONFIG"
  exit "$result"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

registry=${image%%/*}
if [[ "$image" == sha256:* ]]; then
  docker image inspect "$image" >/dev/null
elif [[ "$image" == "hrms-backend:$revision" ]]; then
  image_revision=$(docker image inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$image")
  [[ "$image_revision" == "$revision" ]] || { echo 'Image revision label mismatch' >&2; exit 1; }
else
  aws ecr get-login-password --region "$region" | docker login --username AWS --password-stdin "$registry" >/dev/null
  docker pull "$image" >/dev/null
fi
if docker inspect "$current" >/dev/null 2>&1; then old_exists=1; fi
# Remove only the older rollback container after the new image has downloaded.
if docker inspect "$previous" >/dev/null 2>&1; then docker rm -f "$previous" >/dev/null; fi
if (( old_exists )); then
  stopped=1
  docker stop --time 30 "$current" >/dev/null
  docker rename "$current" "$previous"
  renamed=1
fi
candidate_attempted=1
docker run -d --name "$current" --restart unless-stopped --init \
  --env-file "$env_file" --env NODE_ENV=production --env PORT=8000 \
  --publish 127.0.0.1:8000:8000 \
  --log-driver json-file --log-opt max-size=10m --log-opt max-file=3 \
  --label "org.opencontainers.image.revision=$revision" \
  "$image" >/dev/null
ready || { echo 'New container failed readiness' >&2; exit 1; }
echo "Deployed $revision ($image); readiness passed."
