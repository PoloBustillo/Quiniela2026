#!/usr/bin/env bash
set -euo pipefail

# External scheduler runner for /api/cron/sync-bsd.
# Usage:
#   APP_URL="https://your-app.vercel.app" CRON_SECRET="..." ./scripts/trigger-bsd-sync-cron.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Optional: load vars from an env file (e.g. ENV_FILE=.env)
if [[ -n "${ENV_FILE:-}" ]]; then
  ENV_PATH="${ENV_FILE}"
  if [[ "${ENV_PATH}" != /* ]]; then
    ENV_PATH="${PROJECT_ROOT}/${ENV_PATH}"
  fi

  if [[ ! -f "${ENV_PATH}" ]]; then
    echo "ENV_FILE not found: ${ENV_PATH}" >&2
    exit 1
  fi

  # shellcheck disable=SC1090
  set -a && source "${ENV_PATH}" && set +a
fi

# Backward-compatible fallback for setups that only define NEXTAUTH_URL.
APP_URL="${APP_URL:-${NEXTAUTH_URL:-}}"

if [[ -z "${APP_URL:-}" ]]; then
  echo "Missing APP_URL env var (and NEXTAUTH_URL fallback is empty)." >&2
  echo "Set APP_URL to your deployed domain, e.g. https://tu-app.vercel.app" >&2
  exit 1
fi

if [[ "${APP_URL}" == "http://localhost:3000" || "${APP_URL}" == "http://127.0.0.1:3000" ]]; then
  echo "APP_URL points to localhost (${APP_URL})." >&2
  echo "For external cron (Droplet), APP_URL must be your public app URL (e.g. https://tu-app.vercel.app)." >&2
  exit 1
fi

if [[ -z "${CRON_SECRET:-}" ]]; then
  echo "Missing CRON_SECRET env var" >&2
  exit 1
fi

endpoint="${APP_URL%/}/api/cron/sync-bsd"
started_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

http_code="$(curl -sS -o /tmp/bsd-sync-response.json -w "%{http_code}" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  "${endpoint}")"

echo "[cron:bsd-sync] ${started_at} HTTP ${http_code}"
cat /tmp/bsd-sync-response.json

if [[ "${http_code}" -lt 200 || "${http_code}" -ge 300 ]]; then
  exit 1
fi
