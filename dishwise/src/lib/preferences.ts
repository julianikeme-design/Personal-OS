import type { Adventure, Budget, DietaryPref, FitnessGoal, Preferences, SpiceLevel } from "./types";

export const DEFAULT_PREFERENCES: Preferences = {
  dietary: [],
  likes: [],
  dislikes: [],
  spice: 1,
  budget: null,
  adventure: "balanced",
  fitness: "none",
  onboarded: false,
};

export const DIETARY_OPTIONS: { id: DietaryPref; label: string; allergy?: boolean }[] = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "pescatarian", label: "Pescatarian" },
  { id: "halal", label: "Halal" },
  { id: "no-pork", label: "No pork" },
  { id: "no-alcohol", label: "No alcohol" },
  { id: "gluten-free", label: "Gluten-free", allergy: true },
  { id: "dairy-free", label: "Dairy-free", allergy: true },
  { id: "nut-allergy", label: "Nut allergy", allergy: true },
  { id: "shellfish-allergy", label: "Shellfish allergy", allergy: true },
];

export const dietaryLabel = (id: string) => DIETARY_OPTIONS.find((d) => d.id === id)?.label ?? id;

/** Taste options → keywords used by the rules engine to match menu text. */
export const TASTE_OPTIONS: { id: string; label: string; keywords: string[] }[] = [
  { id: "chicken", label: "Chicken", keywords: ["chicken", "poussin", "wings", "suya chicken", "yakitori"] },
  { id: "beef", label: "Beef", keywords: ["beef", "steak", "brisket", "short rib", "wagyu", "sirloin", "ribeye", "suya", "bulgogi", "burger"] },
  { id: "lamb", label: "Lamb", keywords: ["lamb", "mutton", "kofte", "kleftiko"] },
  { id: "seafood", label: "Seafood", keywords: ["prawn", "shrimp", "crab", "lobster", "squid", "calamari", "scallop", "mussel", "octopus", "clam", "oyster"] },
  { id: "fish", label: "Fish", keywords: ["fish", "salmon", "cod", "sea bass", "seabass", "tuna", "mackerel", "hake", "bream", "haddock", "tilapia", "black cod"] },
  { id: "rice", label: "Rice dishes", keywords: ["rice", "jollof", "biryani", "risotto", "paella", "fried rice", "bibimbap", "pilau"] },
  { id: "noodles", label: "Noodles & pasta", keywords: ["noodle", "ramen", "udon", "pasta", "linguine", "spaghetti", "chow mein", "ho fun", "pad thai", "rigatoni", "gnocchi"] },
  { id: "vegetables", label: "Vegetables", keywords: ["vegetable", "aubergine", "greens", "broccoli", "pak choi", "cauliflower", "squash", "salad", "spinach"] },
  { id: "mushrooms", label: "Mushrooms", keywords: ["mushroom", "shiitake", "truffle", "porcini", "enoki", "oyster mushroom"] },
  { id: "tofu", label: "Tofu & plant protein", keywords: ["tofu", "tempeh", "seitan", "chickpea", "lentil", "bean", "falafel"] },
  { id: "cheese", label: "Cheese", keywords: ["cheese", "halloumi", "feta", "burrata", "mozzarella", "parmesan", "paneer", "gruyère", "gruyere"] },
  { id: "grilled", label: "Grilled & smoky", keywords: ["grill", "grilled", "chargrill", "charred", "smoked", "bbq", "barbecue", "flame", "tandoor", "robata", "suya", "skewer", "kebab"] },
  { id: "crispy", label: "Crispy & fried", keywords: ["crispy", "fried", "tempura", "katsu", "karaage", "crunchy", "battered", "fritter"] },
  { id: "creamy", label: "Rich & creamy", keywords: ["creamy", "cream", "butter", "korma", "makhani", "carbonara", "velouté", "rich"] },
  { id: "fresh", label: "Fresh & zesty", keywords: ["lime", "lemon", "citrus", "herb", "fresh", "ceviche", "zesty", "salad", "yuzu", "sumac"] },
  { id: "sweet-savoury", label: "Sweet & savoury", keywords: ["honey", "glazed", "sweet", "teriyaki", "char siu", "caramelised", "maple", "hoisin", "plantain"] },
];

/** Dislikes → keywords. */
export const DISLIKE_OPTIONS: { id: string; label: string; keywords: string[] }[] = [
  { id: "mushrooms", label: "Mushrooms", keywords: ["mushroom", "shiitake", "porcini", "enoki", "truffle"] },
  { id: "coriander", label: "Coriander", keywords: ["coriander", "cilantro"] },
  { id: "seafood", label: "Seafood", keywords: ["prawn", "shrimp", "crab", "lobster", "squid", "calamari", "scallop", "mussel", "octopus", "clam", "oyster"] },
  { id: "raw-fish", label: "Raw fish", keywords: ["sashimi", "ceviche", "tartare", "crudo", "poke", "raw", "carpaccio", "nigiri"] },
  { id: "offal", label: "Offal", keywords: ["liver", "kidney", "tripe", "offal", "heart", "sweetbread", "pâté", "pate", "gizzard", "bone marrow"] },
  { id: "olives", label: "Olives", keywords: ["olive", "tapenade", "kalamata"] },
  { id: "aubergine", label: "Aubergine", keywords: ["aubergine", "eggplant", "baba ganoush", "moussaka"] },
  { id: "blue-cheese", label: "Blue cheese", keywords: ["blue cheese", "stilton", "gorgonzola", "roquefort", "dolcelatte"] },
  { id: "egg", label: "Egg", keywords: ["egg", "omelette", "frittata", "shakshuka"] },
  { id: "very-sweet", label: "Very sweet savoury food", keywords: ["honey", "glazed", "candied", "caramelised", "maple"] },
];

export const SPICE_LABELS: Record<SpiceLevel, { label: string; hint: string }> = {
  0: { label: "No heat", hint: "I avoid chilli" },
  1: { label: "Mild", hint: "A gentle warmth is fine" },
  2: { label: "Medium", hint: "I like a kick" },
  3: { label: "Bring it on", hint: "The hotter the better" },
};

/** Budget bands are for a main dish, per person. */
export const BUDGET_OPTIONS: { id: Budget; label: string; hint: string; maxMain: number | null }[] = [
  { id: "easy", label: "Keep it easy", hint: "Mains around £15 or less", maxMain: 15 },
  { id: "mid", label: "Mid-range", hint: "Mains up to about £25", maxMain: 25 },
  { id: "treat", label: "It's a treat", hint: "Price isn't the priority tonight", maxMain: null },
];

export const ADVENTURE_OPTIONS: { id: Adventure; label: string; hint: string }[] = [
  { id: "familiar", label: "Keep it familiar", hint: "I'd rather know what I'm getting" },
  { id: "balanced", label: "A bit of both", hint: "Safe, with the odd surprise" },
  { id: "adventurous", label: "Surprise me", hint: "I want to try something new" },
];

export const FITNESS_OPTIONS: { id: FitnessGoal; label: string; hint: string }[] = [
  { id: "none", label: "Not tonight", hint: "Just good food" },
  { id: "protein", label: "Higher protein", hint: "Muscle gain or recovery" },
  { id: "lighter", label: "Lighter options", hint: "Fat loss or feeling light" },
  { id: "balanced", label: "Balanced", hint: "General healthy eating" },
];

export function maxMainFor(budget: Budget | null): number | null {
  return BUDGET_OPTIONS.find((b) => b.id === budget)?.maxMain ?? null;
}
