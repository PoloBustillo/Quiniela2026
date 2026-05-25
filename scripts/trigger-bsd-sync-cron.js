#!/usr/bin/env node

async function main() {
  const appUrl = process.env.APP_URL;
  const cronSecret = process.env.CRON_SECRET;

  if (!appUrl) {
    console.error("Missing APP_URL env var");
    process.exit(1);
  }

  if (!cronSecret) {
    console.error("Missing CRON_SECRET env var");
    process.exit(1);
  }

  const endpoint = new URL("/api/cron/sync-bsd", appUrl).toString();
  const startedAt = new Date();

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${cronSecret}`,
    },
    cache: "no-store",
  });

  const bodyText = await response.text();

  if (!response.ok) {
    console.error(
      `[cron:bsd-sync] ${response.status} ${response.statusText} @ ${startedAt.toISOString()}`,
    );
    console.error(bodyText);
    process.exit(1);
  }

  console.log(`[cron:bsd-sync] OK @ ${startedAt.toISOString()}`);
  console.log(bodyText);
}

main().catch((err) => {
  console.error("[cron:bsd-sync] Fatal error:", err);
  process.exit(1);
});
