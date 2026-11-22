/**
 * Combines AI output with the deterministic rules engine.
 *
 * The AI adds richer explanations, but the rules engine stays in charge of safety:
 *  - AI picks referencing unknown item ids are discarded (no invented dishes)
 *  - AI picks the rules engine excluded for dietary conflicts are discarded
 *  - deterministic dietary cautions are always shown alongside AI cautions
 *  - missing/invalid picks are filled from the rules engine
 */
import type { AiRecommendation } from "../ai/claude";
import type { DishInsight, DishPick, Menu, PickKind, RecommendationSet } from "../types";

const KINDS: PickKind[] = ["safe", "adventure", "value"];

export function mergeAiWithRules(menu: Menu, ai: AiRecommendation, rules: RecommendationSet): RecommendationSet {
  const ids = new Set(menu.items.map((i) => i.id));
  const excluded = new Set(rules.excluded.map((e) => e.itemId));
  const insights: Record<string, DishInsight> = {};
  let rejected = 0;

  for (const item of menu.items) {
    const base = rules.insights[item.id];
    const d = ai.dishes.find((x) => x.item_id === item.id);
    if (!d) {
      insights[item.id] = base;
      continue;
    }
    const menuSummary = base.summary.filter((f) => f.source === "menu");
    const ingredientSet = new Set(base.ingredients.map((f) => f.text.toLowerCase()));
    insights[item.id] = {
      ...base,
      summary: [{ text: d.plain_english.trim(), source: "ai" }, ...menuSummary],
      ingredients: [
        ...base.ingredients,
        ...d.likely_ingredients
          .filter((x) => !ingredientSet.has(x.toLowerCase()))
          .slice(0, 6)
          .map((text) => ({ text, source: "ai" as const })),
      ],
      flavour: d.flavour.length ? d.flavour.slice(0, 4).map((text) => ({ text, source: "ai" as const })) : base.flavour,
      cuisine: d.cuisine ? { text: d.cuisine, source: "ai" } : base.cuisine,
      novelty: clampNovelty(d.novelty, base.novelty),
    };
  }

  const picks: DishPick[] = [];
  const used = new Set<string>();
  for (const kind of KINDS) {
    const p = ai.picks.find((x) => x.kind === kind);
    if (p && ids.has(p.item_id) && !excluded.has(p.item_id) && !used.has(p.item_id)) {
      const ruleCautions = insights[p.item_id].dietary.filter((n) => n.status === "caution").map((n) => n.text);
      picks.push({
        kind,
        itemId: p.item_id,
        reasons: p.reasons.slice(0, 3).map((text) => ({ text, source: "ai" as const })),
        cautions: dedupe([...p.cautions, ...ruleCautions]).slice(0, 5),
      });
      used.add(p.item_id);
    } else if (p) {
      rejected++;
    }
  }

  // Fill any gaps from the rules engine.
  for (const kind of KINDS) {
    if (picks.some((p) => p.kind === kind)) continue;
    const fallback =
      rules.picks.find((p) => p.kind === kind && !used.has(p.itemId)) ?? rules.picks.find((p) => !used.has(p.itemId));
    if (fallback) {
      picks.push({ ...fallback, kind });
      used.add(fallback.itemId);
    }
  }
  picks.sort((a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind));

  const notes = [...rules.notes];
  if (rejected) notes.push(`${rejected} AI suggestion(s) failed our safety checks and were replaced by rules-based picks.`);

  return { picks, insights, engine: "ai", generatedAt: new Date().toISOString(), excluded: rules.excluded, notes };
}

function clampNovelty(n: number, fallback: 1 | 2 | 3): 1 | 2 | 3 {
  const r = Math.round(n);
  return r === 1 || r === 2 || r === 3 ? r : fallback;
}

function dedupe(arr: string[]) {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))];
}
