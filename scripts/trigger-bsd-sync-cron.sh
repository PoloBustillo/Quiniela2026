#!/usr/bin/env bash
set -euo pipefail

# External scheduler runner for /api/cron/sync-bsd.
# Usage:
#   APP_URL="https://your-app.vercel.app" CRON_SECRET="..." ./scripts/trigger-bsd-sync-cron.sh

if [[ -z "${APP_URL:-}" ]]; then
  echo "Missing APP_URL env var" >&2
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
