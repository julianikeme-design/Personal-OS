/**
 * GET /api/founder — aggregated validation metrics.
 * Protected by FOUNDER_PASSCODE (sent as the x-founder-code header).
 * In local development with no passcode set, access is allowed.
 */
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { computeMetrics } from "@/lib/analytics/metrics";
import { loadEvents, storeIsEphemeral, storeKind } from "@/lib/analytics/store";
import { clientKey, rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorised(code: string | null): boolean | "no_passcode" {
  const expected = process.env.FOUNDER_PASSCODE;
  if (!expected) return process.env.NODE_ENV === "production" ? "no_passcode" : true;
  if (!code) return false;
  const a = Buffer.from(code);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  if (!rateLimit(`founder:${clientKey(req)}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Wait a minute." }, { status: 429 });
  }
  const auth = authorised(req.headers.get("x-founder-code"));
  if (auth === "no_passcode") {
    return NextResponse.json({ error: "Set FOUNDER_PASSCODE in your hosting environment to enable this dashboard." }, { status: 403 });
  }
  if (!auth) return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
  try {
    const events = await loadEvents();
    return NextResponse.json({
      metrics: computeMetrics(events),
      store: storeKind(),
      storeEphemeral: storeIsEphemeral(),
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[founder] load failed", e);
    return NextResponse.json({ error: "Couldn't load analytics data." }, { status: 500 });
  }
}
