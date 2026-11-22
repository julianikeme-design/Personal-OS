/**
 * Deterministic dietary & allergen analysis.
 *
 * Principles (from the product brief):
 *  - Unknown is unknown. We never say a dish is "free from" anything.
 *  - We never confirm halal status from a dish name.
 *  - Words printed on the menu that clearly conflict → "conflict" (excluded from picks).
 *  - Ingredients a dish *traditionally* contains (glossary) → "caution".
 *  - Dietary markers printed on the menu (V, VG, GF…) → "listed", still to be confirmed.
 *
 * This layer runs even when AI is used, so AI can never override a clear conflict.
 */
import { dietaryLabel } from "../preferences";
import type { DietaryNote, DietaryPref, MenuItem, SpiceLevel } from "../types";
import { findGlossaryTerms, type Concern, type GlossaryEntry } from "./glossary";

const KEYWORDS: Record<Concern, string[]> = {
  meat: [
    "chicken", "beef", "lamb", "pork", "duck", "goat", "mutton", "veal", "venison", "turkey", "steak", "brisket",
    "mince", "minced beef", "minced pork", "sausage", "bacon", "ham", "chorizo", "pancetta", "prosciutto", "salami",
    "pepperoni", "guanciale", "lardons", "oxtail", "short rib", "ribs", "rib-eye", "ribeye", "sirloin", "wagyu",
    "liver", "kidney", "tripe", "gizzard", "chashu", "char siu", "nduja", "'nduja", "burger", "meatball", "kofte",
    "poussin", "quail", "pigeon", "rabbit", "pheasant", "partridge", "grouse", "bone broth", "asun", "suya beef",
    "pork belly", "porchetta", "black pudding", "chicken thigh",
  ],
  pork: [
    "pork", "bacon", "ham", "chorizo", "pancetta", "prosciutto", "salami", "pepperoni", "guanciale", "lardons",
    "char siu", "chashu", "nduja", "'nduja", "pork belly", "pulled pork", "tonkotsu", "black pudding", "porchetta",
    "crackling",
  ],
  fish: [
    "fish", "salmon", "tuna", "cod", "haddock", "hake", "bream", "sea bass", "seabass", "mackerel", "sardine",
    "anchovy", "anchovies", "trout", "halibut", "tilapia", "sole", "plaice", "monkfish", "eel", "unagi", "stockfish",
    "bonito", "fish sauce", "ikura", "roe", "caviar", "black cod", "hamachi", "yellowtail", "swordfish", "snapper",
    "sashimi",
  ],
  shellfish: [
    "prawn", "shrimp", "crab", "lobster", "langoustine", "crayfish", "squid", "calamari", "octopus", "mussel",
    "clam", "scallop", "oyster", "cockle", "oyster sauce", "shrimp paste", "xo sauce", "seafood",
  ],
  dairy: [
    "cheese", "cream", "butter", "milk", "yoghurt", "yogurt", "paneer", "halloumi", "feta", "mozzarella", "burrata",
    "parmesan", "ricotta", "mascarpone", "ghee", "labneh", "crème fraîche", "creme fraiche", "buttermilk", "custard",
    "ice cream", "cheesecake", "gruyère", "gruyere", "cheddar", "brie", "raita", "tzatziki", "béchamel", "bechamel",
    "makhani", "korma",
  ],
  gluten: [
    "wheat", "flour", "bread", "breaded", "breadcrumb", "breadcrumbs", "panko", "pasta", "spaghetti", "linguine",
    "rigatoni", "tagliatelle", "penne", "lasagne", "udon", "ramen", "egg noodle", "bun", "bao", "brioche", "sourdough",
    "toast", "croutons", "batter", "battered", "tempura", "pastry", "pie", "pizza", "naan", "pitta", "pita",
    "flatbread", "couscous", "bulgur", "barley", "seitan", "gyoza", "cake", "biscuit", "crumble", "katsu", "puff puff",
    "chin chin",
  ],
  nuts: [
    "peanut", "peanuts", "almond", "almonds", "cashew", "cashews", "walnut", "walnuts", "pecan", "pecans",
    "pistachio", "pistachios", "hazelnut", "hazelnuts", "macadamia", "pine nut", "pine nuts", "brazil nut", "praline",
    "satay", "marzipan", "frangipane", "nut", "nuts", "yaji", "groundnut", "dukkah", "pesto",
  ],
  alcohol: [
    "wine", "beer", "sake", "mirin", "rum", "brandy", "cognac", "vodka", "whisky", "whiskey", "bourbon", "gin",
    "tequila", "prosecco", "champagne", "cider", "sherry", "marsala", "shaoxing", "rice wine", "beer-battered",
    "flambé", "flambe", "liqueur", "amaretto", "stout", "ale", "tiramisu",
  ],
  egg: [
    "egg", "eggs", "omelette", "frittata", "mayo", "mayonnaise", "aioli", "meringue", "custard", "hollandaise",
    "ajitama", "tamago", "shakshuka", "kewpie",
  ],
};

/** Phrases that contain a keyword but don't mean it (stripped before matching). */
const FALSE_FRIENDS = [
  "coconut milk", "coconut cream", "oat milk", "soy milk", "almond milk", "peanut butter", "cocoa butter",
  "nut butter", "oyster mushroom", "oyster mushrooms", "butternut", "nutmeg", "coconut", "eggplant", "egg-free",
  "dairy-free", "gluten-free", "vegan butter", "vegan cheese", "vegan mayo", "plant-based", "cream of",
  "ginger beer", "root beer", "buffalo cauliflower", "jackfruit", "mock duck", "tofu chicken", "no pork",
  "pork-free", "alcohol-free", "nut-free", "wine vinegar", "rice vinegar", "black vinegar", "malt vinegar",
  "cider vinegar",
];

/** Which concerns each dietary preference cares about, and how strictly. */
const PREF_RULES: Record<DietaryPref, { conflicts: Concern[]; isAllergy?: boolean }> = {
  vegetarian: { conflicts: ["meat", "pork", "fish", "shellfish"] },
  vegan: { conflicts: ["meat", "pork", "fish", "shellfish", "dairy", "egg"] },
  pescatarian: { conflicts: ["meat", "pork"] },
  halal: { conflicts: ["pork", "alcohol"] },
  "no-pork": { conflicts: ["pork"] },
  "no-alcohol": { conflicts: ["alcohol"] },
  "gluten-free": { conflicts: ["gluten"], isAllergy: true },
  "dairy-free": { conflicts: ["dairy"], isAllergy: true },
  "nut-allergy": { conflicts: ["nuts"], isAllergy: true },
  "shellfish-allergy": { conflicts: ["shellfish"], isAllergy: true },
};

const CONCERN_WORD: Record<Concern, string> = {
  meat: "meat", pork: "pork", fish: "fish", shellfish: "shellfish", dairy: "dairy", gluten: "gluten",
  nuts: "nuts", alcohol: "alcohol", egg: "egg",
};

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function itemText(item: MenuItem): string {
  return `${item.name} ${item.description ?? ""}`;
}

function cleanText(text: string): string {
  let t = ` ${text.toLowerCase().replace(/[’]/g, "'")} `;
  for (const ff of FALSE_FRIENDS) t = t.split(ff).join(" ");
  return t;
}

/** Whole-word (or phrase) matches of a keyword list in text; allows simple plurals. */
export function matchKeywords(text: string, keywords: string[]): string[] {
  const t = cleanText(text);
  const hits = new Set<string>();
  for (const k of keywords) {
    const re = new RegExp(`(^|[^a-z])${escapeRe(k.toLowerCase())}(e?s)?([^a-z]|$)`);
    if (re.test(t)) hits.add(k);
  }
  // Drop hits that are substrings of longer hits ("pork" inside "pork belly").
  return [...hits].filter((h) => ![...hits].some((o) => o !== h && o.includes(h)));
}

export function concernHits(text: string): Record<Concern, string[]> {
  const out = {} as Record<Concern, string[]>;
  (Object.keys(KEYWORDS) as Concern[]).forEach((c) => (out[c] = matchKeywords(text, KEYWORDS[c])));
  return out;
}

const tagSet = (item: MenuItem) => new Set((item.menuTags ?? []).map((t) => t.toUpperCase()));

function describesItselfAsPlantBased(item: MenuItem) {
  const t = itemText(item).toLowerCase();
  const tags = tagSet(item);
  return tags.has("VG") || tags.has("VE") || tags.has("PB") || /\b(vegan|plant[- ]based|meat[- ]free|vegetarian)\b/.test(t);
}

/**
 * Analyse one menu item against the user's dietary requirements.
 * Returns notes, plus whether the item should be excluded from recommendations.
 */
export function analyseDietary(
  item: MenuItem,
  prefs: DietaryPref[],
  glossary: GlossaryEntry[] = findGlossaryTerms(itemText(item)),
): { notes: DietaryNote[]; excluded: string | null } {
  const notes: DietaryNote[] = [];
  let excluded: string | null = null;
  const hits = concernHits(itemText(item));
  const tags = tagSet(item);
  const plantBased = describesItselfAsPlantBased(item);

  for (const pref of prefs) {
    const rule = PREF_RULES[pref];
    if (!rule) continue;
    const label = dietaryLabel(pref);
    let worst: DietaryNote | null = null;

    for (const concern of rule.conflicts) {
      const menuHits = hits[concern];
      // A menu that calls the dish vegan/vegetarian downgrades meat words (e.g. "vegan chicken") to a caution.
      const softened = plantBased && (concern === "meat" || concern === "pork" || concern === "fish" || concern === "shellfish");
      if (menuHits.length && !softened) {
        worst = {
          preference: pref,
          status: "conflict",
          text: `Menu mentions ${menuHits.slice(0, 3).join(", ")}, so it doesn't suit ${label.toLowerCase()}.`,
        };
        break;
      }
      const gl = glossary.find((g) => g.mayContain?.[concern]);
      if (gl && !worst) {
        worst = {
          preference: pref,
          status: "caution",
          text: `${gl.mayContain![concern]} Check this version contains no ${CONCERN_WORD[concern]}. (General knowledge about ${gl.name}.)`,
        };
      } else if (menuHits.length && softened && !worst) {
        worst = {
          preference: pref,
          status: "caution",
          text: `Described as plant-based but mentions "${menuHits[0]}". Confirm with the restaurant.`,
        };
      }
    }

    if (worst?.status === "conflict") {
      excluded ??= worst.text;
      notes.push(worst);
      continue;
    }

    // Halal: meat present → status unknown unless the menu itself says halal.
    if (pref === "halal") {
      const hasMeat = hits.meat.length > 0 || glossary.some((g) => g.mayContain?.meat);
      const menuSaysHalal = tags.has("H") || /\bhalal\b/i.test(itemText(item));
      if (menuSaysHalal) {
        notes.push({ preference: pref, status: "listed", text: "The menu marks this as halal. Ask the restaurant about certification if that matters to you." });
      } else if (hasMeat) {
        notes.push({ preference: pref, status: "caution", text: "Contains meat and the menu doesn't say whether it's halal. Ask the restaurant." });
      }
      if (worst) notes.push(worst);
      continue;
    }

    const listedTag = listedTagFor(pref, tags);
    if (worst) {
      notes.push(worst);
    } else if (listedTag) {
      notes.push({
        preference: pref,
        status: "listed",
        text: rule.isAllergy
          ? `The menu marks this "${listedTag}". Still confirm with staff, as kitchens can cross-contaminate.`
          : `The menu marks this "${listedTag}".`,
      });
    } else if (rule.isAllergy) {
      notes.push({
        preference: pref,
        status: "caution",
        text: `The menu doesn't confirm this is ${label.toLowerCase().replace(" allergy", "-free")}. Tell your server about your ${label.toLowerCase()}.`,
      });
    } else if (pref === "vegetarian" || pref === "vegan" || pref === "pescatarian") {
      notes.push({
        preference: pref,
        status: "caution",
        text: `No ${pref === "pescatarian" ? "meat" : "animal products"} mentioned, but the menu doesn't confirm it's ${label.toLowerCase()} (stocks and sauces can hide them).`,
      });
    }
  }

  return { notes, excluded };
}

function listedTagFor(pref: DietaryPref, tags: Set<string>): string | null {
  const map: Partial<Record<DietaryPref, string[]>> = {
    vegetarian: ["V", "VG", "VE", "PB"],
    vegan: ["VG", "VE", "PB"],
    pescatarian: ["V", "VG", "VE"],
    "gluten-free": ["GF"],
    "dairy-free": ["DF", "VG", "VE"],
  };
  return (map[pref] ?? []).find((t) => tags.has(t)) ?? null;
}

const SPICE_WORDS: [string, SpiceLevel][] = [
  ["extra hot", 3], ["very hot", 3], ["fiery", 3], ["scotch bonnet", 3], ["vindaloo", 3], ["phaal", 3], ["habanero", 3],
  ["spicy", 2], ["hot sauce", 2], ["sichuan", 2], ["szechuan", 2], ["peri peri", 2], ["piri piri", 2], ["peri-peri", 2],
  ["mala", 2], ["jerk", 2], ["harissa", 2], ["gochujang", 2], ["nduja", 2], ["pepper sauce", 2], ["kimchi", 1],
  ["chilli", 1], ["chili", 1], ["chillies", 1], ["jalapeño", 1], ["jalapeno", 1], ["sriracha", 1], ["yaji", 2],
];

/** Estimate heat from menu words, chilli icons and glossary. null = no signal at all. */
export function detectSpice(item: MenuItem, glossary: GlossaryEntry[] = findGlossaryTerms(itemText(item))): SpiceLevel | null {
  const text = itemText(item);
  const icons = (text.match(/🌶/g) ?? []).length + (item.menuTags ?? []).filter((t) => t === "🌶").length;
  if (icons > 0) return Math.min(3, icons) as SpiceLevel;
  let level: number | null = null;
  for (const [w, l] of SPICE_WORDS) if (matchKeywords(text, [w]).length) level = Math.max(level ?? 0, l);
  for (const g of glossary) if (g.spice !== undefined) level = Math.max(level ?? 0, g.spice);
  if (level === null && /\bmild\b/i.test(text)) return 0;
  return level as SpiceLevel | null;
}
