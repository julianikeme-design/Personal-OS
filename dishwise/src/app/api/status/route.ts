import { NextResponse } from "next/server";
import { AI_MODEL, isAiConfigured } from "@/lib/ai/claude";
import { storeIsEphemeral, storeKind } from "@/lib/analytics/store";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    ai: isAiConfigured(),
    model: isAiConfigured() ? AI_MODEL : null,
    store: storeKind(),
    storeEphemeral: storeIsEphemeral(),
  });
}
