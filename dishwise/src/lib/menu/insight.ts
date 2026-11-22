/**
 * Builds a plain-English DishInsight for a menu item WITHOUT AI, using only:
 *  - what the menu says (source: "menu")
 *  - the built-in glossary (source: "general")
 *  - explicit unknowns (source: "unknown")
 */
import { DISLIKE_OPTIONS, TASTE_OPTIONS } from "../preferences";
import type { DietaryPref, DishInsight, Fact, MenuItem } from "../types";
import { analyseDietary, detectSpice, itemText, matchKeywords } from "./dietary";
import { findGlossaryTerms, type GlossaryEntry } from "./glossary";

const INGREDIENT_WORDS = [
  ...new Set([
    ...TASTE_OPTIONS.flatMap((t) => t.keywords),
    ...DISLIKE_OPTIONS.flatMap((d) => d.keywords),
    "garlic", "ginger", "onion", "spring onion", "shallot", "pepper", "peppers", "chilli", "tomato", "pineapple",
    "plantain", "spinach", "beansprouts", "pomelo", "pine nuts", "peanuts", "sesame", "coconut", "lime", "lemon",
    "yam", "black-eyed bean", "egg", "pork", "duck", "goat", "octopus", "cabbage", "nori", "ginger", "potato",
    "chips", "rice", "noodles", "tofu", "bean", "beef", "soy",
  ]),
].filter((w) => !["grill", "grilled", "fried", "crispy", "fresh", "rich", "sweet", "raw", "creamy", "herb", "flame", "smoked", "bbq", "barbecue", "skewer", "chargrill", "charred", "crunchy", "battered", "glazed", "candied", "caramelised", "tandoor", "robata", "kebab", "fritter", "zesty", "heart"].includes(w));

export function glossaryFor(item: MenuItem): GlossaryEntry[] {
  // Name matches first: they explain what the dish *is*.
  const inName = findGlossaryTerms(item.name);
  const inDesc = findGlossaryTerms(item.description ?? "").filter((g) => !inName.includes(g));
  return [...inName, ...inDesc];
}

export function noveltyOf(glossary: GlossaryEntry[]): 1 | 2 | 3 {
  return glossary.reduce<1 | 2 | 3>((m, g) => (g.novelty > m ? g.novelty : m), 1);
}

export function buildInsight(item: MenuItem, dietary: DietaryPref[], cuisineHint?: string): DishInsight {
  const glossary = glossaryFor(item);
  const summary: Fact[] = [];

  if (item.description) summary.push({ text: `On the menu: “${item.description}”`, source: "menu" });
  for (const g of glossary.slice(0, 3)) summary.push({ text: `${g.name}: ${g.explain}`, source: "general" });
  const nameIngredients = matchKeywords(item.name, INGREDIENT_WORDS);
  if (!item.description && glossary.length === 0 && nameIngredients.length > 0) {
    summary.push({
      text: `No description on the menu, but the name suggests ${nameIngredients.slice(0, 4).join(", ")}. Ask your server for details.`,
      source: "menu",
    });
  } else if (!item.description && glossary.length === 0) {
    summary.push({
      text: "The menu doesn't describe this dish and it isn't in our glossary yet. Ask your server what's in it.",
      source: "unknown",
    });
  }

  const ingredients: Fact[] = matchKeywords(itemText(item), INGREDIENT_WORDS)
    .slice(0, 8)
    .map((w) => ({ text: w, source: "menu" as const }));

  const flavourSet = new Set<string>();
  glossary.forEach((g) => g.flavour.forEach((f) => flavourSet.add(f)));
  const flavour: Fact[] = [...flavourSet].slice(0, 5).map((f) => ({ text: f, source: "general" as const }));
  const menuStyle = matchKeywords(itemText(item), ["grilled", "chargrilled", "charred", "smoked", "smoky", "crispy", "fried", "steamed", "wok-fried", "braised", "roast", "sweet", "sour", "glazed", "creamy", "fresh"]);
  menuStyle.slice(0, 3).forEach((s) => flavour.unshift({ text: s, source: "menu" }));

  const cuisine: Fact | undefined = glossary[0]
    ? { text: glossary[0].cuisine, source: "general" }
    : cuisineHint
      ? { text: cuisineHint, source: "menu" }
      : undefined;

  const { notes } = analyseDietary(item, dietary, glossary);
  const spice = detectSpice(item, glossary);

  const verify: string[] = [];
  if (item.price == null) verify.push("Price isn't listed. Ask before ordering.");
  verify.push("Portion size isn't stated on the menu.");
  if (spice === null) verify.push("Heat level isn't stated. Ask if you're sensitive to chilli.");
  if (dietary.length) verify.push("Confirm dietary and allergen details with staff before ordering.");
  else verify.push("Allergens aren't listed here. Ask staff if you have any allergies.");

  return {
    itemId: item.id,
    summary,
    ingredients,
    flavour,
    cuisine,
    dietary: notes,
    verify,
    spice,
    novelty: noveltyOf(glossary),
    photoUrl: null,
  };
}
