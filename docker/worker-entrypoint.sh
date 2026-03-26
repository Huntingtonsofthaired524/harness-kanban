#!/bin/sh
set -eu

docker_max_attempts="${WORKER_DOCKER_READY_MAX_ATTEMPTS:-30}"
docker_retry_delay="${WORKER_DOCKER_READY_RETRY_DELAY_SECONDS:-2}"
docker_attempt=1

devpod_home="${DEVPOD_HOME:-/var/lib/harness-kanban/devpod}"
docker_config_dir="${DEVPOD_DOCKER_CONFIG_DIR:-/var/lib/harness-kanban/docker-config}"

mkdir -p "$devpod_home" "$docker_config_dir"

if [ ! -f "$docker_config_dir/config.json" ]; then
  printf '{}\n' > "$docker_config_dir/config.json"
fi

until docker info >/dev/null 2>&1; do
  if [ "$docker_attempt" -ge "$docker_max_attempts" ]; then
    echo "Docker daemon is not reachable after ${docker_attempt} attempts." >&2
    exit 1
  fi

  echo "Waiting for host Docker to become reachable (attempt ${docker_attempt}/${docker_max_attempts})..." >&2
  docker_attempt=$((docker_attempt + 1))
  sleep "$docker_retry_delay"
done

configure_provider() {
  if [ -n "${DOCKER_HOST:-}" ]; then
    devpod provider use docker -o DOCKER_PATH=docker -o "DOCKER_HOST=${DOCKER_HOST}"
  else
    devpod provider use docker -o DOCKER_PATH=docker
  fi
}

add_provider() {
  if [ -n "${DOCKER_HOST:-}" ]; then
    devpod provider add docker -o DOCKER_PATH=docker -o "DOCKER_HOST=${DOCKER_HOST}"
  else
    devpod provider add docker -o DOCKER_PATH=docker
  fi
}

if ! configure_provider >/dev/null 2>&1; then
  add_provider >/dev/null
else
  configure_provider >/dev/null
fi

exec node /workspace/dist/worker-main.js
