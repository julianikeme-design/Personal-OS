/**
 * Rules-based recommender: transparent, fast, works offline, no AI.
 *
 * It scores each dish against the user's stated preferences and then picks:
 *  - Safe:      best overall match, favouring familiar dishes
 *  - Adventure: a strong-enough match that is less familiar
 *  - Value:     the lowest listed price among the stronger matches
 *               (never claims portion size or "worth" — only the listed price)
 *
 * Dishes that clearly conflict with a dietary requirement are excluded.
 */
import { analyseDietary, detectSpice, itemText, matchKeywords } from "../menu/dietary";
import { buildInsight, glossaryFor } from "../menu/insight";
import { findGlossaryTerms } from "../menu/glossary";
import { DISLIKE_OPTIONS, TASTE_OPTIONS, maxMainFor, SPICE_LABELS } from "../preferences";
import type { DishInsight, DishPick, Fact, Menu, MenuItem, Preferences, RecommendationSet } from "../types";

const NON_MAIN_SECTION = /drink|beverage|wine|cocktail|beer|juice|tea|coffee|dessert|sweet|pudding|side|extra|sauce|dip|kids/i;
const MAIN_SECTION = /main|large|grill|signature|curr|noodle|rice|entr[eé]e|big plate|ramen|special/i;
const STARTER_SECTION = /starter|small|snack|dim sum|to start|share|sharing|soup|salad/i;

export interface ScoredItem {
  item: MenuItem;
  insight: DishInsight;
  score: number;
  reasons: Fact[];
  cautions: string[];
  excluded: string | null;
  role: "main" | "starter" | "other" | "unknown";
}

function roleOf(item: MenuItem): ScoredItem["role"] {
  const s = item.section ?? "";
  if (!s) return "unknown";
  if (NON_MAIN_SECTION.test(s)) return "other";
  if (STARTER_SECTION.test(s)) return "starter";
  if (MAIN_SECTION.test(s)) return "main";
  return "unknown";
}

const fmt = (n: number) => `£${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`;

export function scoreItem(item: MenuItem, prefs: Preferences, menu: { cuisineHint?: string }): ScoredItem {
  const text = itemText(item);
  const glossary = glossaryFor(item);
  const insight = buildInsight(item, prefs.dietary, menu.cuisineHint);
  const { excluded } = analyseDietary(item, prefs.dietary, glossary);
  const reasons: Fact[] = [];
  const cautions: string[] = [];
  let score = 0;

  // Likes
  let likeHits = 0;
  for (const like of TASTE_OPTIONS.filter((t) => prefs.likes.includes(t.id))) {
    const hits = matchKeywords(text, like.keywords);
    if (hits.length && likeHits < 2) {
      likeHits++;
      score += 3;
      reasons.push({ text: `Mentions ${hits[0]}, and you said you enjoy ${like.label.toLowerCase()}.`, source: "menu" });
    }
  }

  // Dislikes
  for (const dis of DISLIKE_OPTIONS.filter((d) => prefs.dislikes.includes(d.id))) {
    const hits = matchKeywords(text, dis.keywords);
    if (hits.length) {
      score -= 5;
      cautions.push(`Mentions ${hits[0]}, which you said you don't enjoy.`);
    }
  }

  // Spice
  const spice = detectSpice(item, glossary);
  if (spice !== null) {
    if (spice > prefs.spice) {
      score -= 3 * (spice - prefs.spice);
      cautions.push(`Likely hotter (${SPICE_LABELS[spice].label.toLowerCase()}) than your preference.`);
    } else if (prefs.spice >= 2 && spice >= 2) {
      score += 1.5;
      reasons.push({ text: "Has real heat, which suits your spice tolerance.", source: insight.spice !== null ? "menu" : "general" });
    } else if (prefs.spice <= 1 && spice <= prefs.spice) {
      score += 0.5;
      reasons.push({ text: spice === 0 ? "No chilli signals on the menu." : "Gentle heat at most, which fits your preference.", source: "menu" });
    }
  } else if (prefs.spice === 0) {
    cautions.push("Heat level isn't stated. Ask if it contains chilli.");
  }

  // Budget
  const max = maxMainFor(prefs.budget);
  if (item.price != null && max !== null) {
    if (item.price > max * 1.3) {
      score -= 5;
      cautions.push(`At ${fmt(item.price)}, well above your usual budget.`);
    } else if (item.price > max) {
      score -= 2;
      cautions.push(`At ${fmt(item.price)}, a little above your usual budget.`);
    } else {
      score += 1;
      reasons.push({ text: `Listed at ${fmt(item.price)}, within your budget.`, source: "menu" });
    }
  }

  // Dietary cautions lower confidence a little
  for (const n of insight.dietary) if (n.status === "caution") score -= 0.75;

  // Fitness (based on menu wording only; no nutrition data is claimed)
  if (prefs.fitness === "protein") {
    const p = matchKeywords(text, ["chicken", "steak", "beef", "lamb", "fish", "salmon", "sea bass", "tilapia", "cod", "tofu", "prawns", "prawn", "egg", "lentil", "bean", "goat", "turkey", "chops"]);
    if (p.length) { score += 1.5; reasons.push({ text: `Protein-led: menu mentions ${p[0]}. No nutrition figures are available.`, source: "menu" }); }
  } else if (prefs.fitness === "lighter") {
    const light = matchKeywords(text, ["grilled", "steamed", "salad", "broth", "sashimi", "chirashi", "poached", "raw", "edamame"]);
    const heavy = matchKeywords(text, ["fried", "crispy", "creamy", "cream", "battered", "tempura", "cheese", "katsu", "butter", "pastry"]);
    if (light.length) { score += 1.5; reasons.push({ text: `Menu says ${light[0]}, often a lighter choice. This is an estimate, not nutrition data.`, source: "menu" }); }
    if (heavy.length) { score -= 1.5; cautions.push(`Menu says ${heavy[0]}, often a richer choice.`); }
  }

  const role = roleOf(item);
  if (role === "main") score += 2;

  return { item, insight, score, reasons, cautions, excluded, role };
}

export function recommendWithRules(
  menu: Menu,
  prefs: Preferences,
  opts: { triedCuisines?: string[] } = {},
): RecommendationSet {
  const scored = menu.items.map((i) => scoreItem(i, prefs, menu));
  const insights: Record<string, DishInsight> = {};
  scored.forEach((s) => (insights[s.item.id] = s.insight));
  const excluded = scored.filter((s) => s.excluded).map((s) => ({ itemId: s.item.id, reason: s.excluded! }));
  const notes: string[] = [];

  let pool = scored.filter((s) => !s.excluded);
  const mainish = pool.filter((s) => s.role !== "other");
  if (mainish.length >= 3) pool = mainish;
  else if (pool.length > mainish.length) notes.push("Few main dishes suited you, so sides or desserts may appear.");

  if (pool.length === 0) {
    notes.push("Every dish on this menu clearly conflicts with at least one of your dietary requirements. Please ask the restaurant what they can offer.");
    return { picks: [], insights, engine: "rules", generatedAt: new Date().toISOString(), excluded, notes };
  }

  const picks: DishPick[] = [];
  const used = new Set<string>();
  const familiarityPenalty = prefs.adventure === "adventurous" ? 0.5 : prefs.adventure === "familiar" ? 2.5 : 1.5;

  // SAFE
  const safe = [...pool].sort(
    (a, b) => b.score - (b.insight.novelty - 1) * familiarityPenalty - (a.score - (a.insight.novelty - 1) * familiarityPenalty),
  )[0];
  picks.push(toPick("safe", safe, [
    safe.insight.novelty === 1
      ? { text: "A familiar style of dish, so few surprises.", source: "general" }
      : { text: "Your strongest overall match on this menu.", source: "general" },
  ]));
  used.add(safe.item.id);

  // ADVENTURE
  const tried = new Set((opts.triedCuisines ?? []).map((c) => c.toLowerCase()));
  const advPool = pool.filter((s) => !used.has(s.item.id) && s.score > safe.score - 8);
  const advScore = (s: ScoredItem) => {
    const cuisine = s.insight.cuisine?.text.toLowerCase();
    const newCuisine = cuisine && tried.size > 0 && !tried.has(cuisine) ? 2 : 0;
    return s.score + s.insight.novelty * (prefs.adventure === "familiar" ? 2 : 3.5) + newCuisine;
  };
  const adventure = advPool.sort((a, b) => advScore(b) - advScore(a))[0];
  if (adventure) {
    const extra: Fact[] = [];
    const nameTerms = findGlossaryTerms(adventure.item.name);
    const g = [...(nameTerms.length ? nameTerms : glossaryFor(adventure.item))].sort((a, b) => b.novelty - a.novelty)[0];
    if (adventure.insight.novelty >= 2 && g) {
      const text = nameTerms.includes(g)
        ? `A chance to try ${g.name}, a ${g.cuisine} dish most UK diners haven't had.`
        : `Introduces you to ${g.name.toLowerCase()}, a ${g.cuisine} ingredient: ${g.flavour.slice(0, 2).join(" and ") || "a new flavour"}.`;
      extra.push({ text, source: "general" });
    } else {
      extra.push({ text: "This menu is fairly familiar overall. This is the most different good match.", source: "general" });
    }
    const cuisine = adventure.insight.cuisine?.text;
    if (cuisine && tried.size > 0 && !tried.has(cuisine.toLowerCase())) {
      extra.push({ text: `You haven't logged any ${cuisine} dishes yet, so this would be a new Passport stamp.`, source: "general" });
    }
    picks.push(toPick("adventure", adventure, extra));
    used.add(adventure.item.id);
  }

  // VALUE: lowest listed price among the remaining reasonable matches.
  // We only describe the listed price, never portion size or "worth".
  const remaining = pool.filter((s) => !used.has(s.item.id));
  const priced = remaining.filter((s) => s.item.price != null && s.score >= Math.min(safe.score - 4, 0));
  if (priced.length) {
    const value = priced.sort((a, b) => a.item.price! - b.item.price! || b.score - a.score)[0];
    const prices = pool.filter((s) => s.item.price != null).map((s) => s.item.price!).sort((a, b) => a - b);
    const median = prices[Math.floor(prices.length / 2)];
    const text =
      value.item.price! < median
        ? `Listed at ${fmt(value.item.price!)}, below the typical price (${fmt(median)}) of dishes that suit you here. Portion size isn't stated.`
        : `Listed at ${fmt(value.item.price!)}, the lowest-priced of your other good matches. Portion size isn't stated.`;
    picks.push(toPick("value", value, [{ text, source: "menu" }]));
  } else if (remaining.length) {
    const next = [...remaining].sort((a, b) => b.score - a.score)[0];
    picks.push(toPick("value", next, [{ text: "Prices weren't listed, so we can't compare value. This is your next-best match instead.", source: "unknown" }]));
    notes.push("No prices were available, so the Value pick couldn't compare prices.");
  }

  if (picks.length < 3) notes.push("This menu has only a few dishes that suit you, so you have fewer than three picks.");

  return { picks, insights, engine: "rules", generatedAt: new Date().toISOString(), excluded, notes };
}

function toPick(kind: DishPick["kind"], s: ScoredItem, lead: Fact[]): DishPick {
  const dietaryCautions = s.insight.dietary.filter((d) => d.status === "caution").map((d) => d.text);
  return {
    kind,
    itemId: s.item.id,
    // The Value pick's lead already states the price, so drop the duplicate budget line.
    reasons: [...lead, ...s.reasons.filter((r) => !(kind === "value" && r.text.startsWith("Listed at")))].slice(0, 4),
    cautions: [...s.cautions, ...dietaryCautions].slice(0, 4),
  };
}
