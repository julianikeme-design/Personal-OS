import { NextResponse } from "next/server";
import { sanitiseEvent } from "@/lib/analytics/events";
import { saveEvent } from "@/lib/analytics/store";
import { clientKey, rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!rateLimit(`ev:${clientKey(req)}`, 120, 60_000)) return new NextResponse(null, { status: 429 });
  const raw = await req.text();
  if (raw.length > 8_000) return new NextResponse(null, { status: 413 });
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const ev = sanitiseEvent(parsed);
  if (!ev) return new NextResponse(null, { status: 400 });
  try {
    await saveEvent({ ...ev, id: crypto.randomUUID(), ts: new Date().toISOString() });
  } catch (e) {
    console.error("[events] failed to store event", e);
    return new NextResponse(null, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
