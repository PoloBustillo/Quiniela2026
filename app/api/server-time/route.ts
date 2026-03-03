import { NextResponse } from "next/server";

/**
 * GET /api/server-time
 * Returns the current server UTC time as ISO string.
 * Used by the client to detect clock skew and show correct match countdown.
 * Anti-cheat: predictions are validated against server time, not client time.
 */
export async function GET() {
  return NextResponse.json(
    {
      serverTime: new Date().toISOString(),
      timezone: "UTC",
      note: "Use this time to display countdowns. Predictions are validated against server time.",
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
