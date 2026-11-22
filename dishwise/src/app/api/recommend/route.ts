/**
 * POST /api/recommend — Safe / Adventure / Value picks for a menu.
 * Rules engine always runs (fast, offline, safety layer). AI enriches when configured.
 */
import { NextResponse } from "next/server";
import { AiError, isAiConfigured, recommendWithAI } from "@/lib/ai/claude";
import { clientKey, rateLimit } from "@/lib/ratelimit";
import { mergeAiWithRules } from "@/lib/recommend/merge";
import { recommendWithRules } from "@/lib/recommend/rules";
import { RecommendRequest } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  if (!rateLimit(`rec:${clientKey(req)}`, 20, 60_000)) {
    return NextResponse.json({ error: { code: "rate_limited", message: "Too many requests. Please wait a minute." } }, { status: 429 });
  }
  let body;
  try {
    body = RecommendRequest.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "bad_request", message: "That menu couldn't be processed." } }, { status: 400 });
  }
  const { menu, preferences, triedCuisines, useAi } = body;
  const rules = recommendWithRules(menu, preferences, { triedCuisines });

  if (!useAi || !isAiConfigured() || rules.picks.length === 0) {
    return NextResponse.json({ recs: rules });
  }
  try {
    const ai = await recommendWithAI({
      items: menu.items,
      restaurantName: menu.restaurantName,
      cuisineHint: menu.cuisineHint,
      preferences,
      excludedIds: rules.excluded.map((e) => e.itemId),
      triedCuisines,
    });
    return NextResponse.json({ recs: mergeAiWithRules(menu, ai, rules) });
  } catch (e) {
    const msg = e instanceof AiError ? e.message : "AI unavailable.";
    rules.notes.unshift(`AI recommendations weren't available (${msg}), so these picks use Dishwise's built-in matching.`);
    return NextResponse.json({ recs: rules, aiError: msg });
  }
}
