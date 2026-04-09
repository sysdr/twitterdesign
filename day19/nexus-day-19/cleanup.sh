#!/usr/bin/env bash
set -euo pipefail

echo "[cleanup] Stopping running Docker containers..."
if command -v docker >/dev/null 2>&1; then
  if docker info >/dev/null 2>&1; then
    ids="$(docker ps -q 2>/dev/null || true)"
    if [[ -n "${ids}" ]]; then
      # shellcheck disable=SC2086
      docker stop ${ids} || true
    fi
    echo "[cleanup] Removing stopped containers, unused networks, dangling images, build cache..."
    docker container prune -f >/dev/null 2>&1 || true
    docker network prune -f >/dev/null 2>&1 || true
    docker builder prune -af >/dev/null 2>&1 || true
    echo "[cleanup] Pruning unused images (not referenced by any container)..."
    docker image prune -a -f
    echo "[cleanup] Pruning unused anonymous volumes..."
    docker volume prune -f
  else
    echo "[cleanup] Docker daemon not running; skipped Docker steps."
  fi
else
  echo "[cleanup] docker not installed; skipped Docker steps."
fi

echo "[cleanup] Finished."
