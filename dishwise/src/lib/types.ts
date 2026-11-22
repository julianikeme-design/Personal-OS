/**
 * Core data model for Dishwise.
 *
 * Every fact we show about a dish carries a `source`, so the UI can always tell
 * the user where a statement came from:
 *  - "menu"    → printed on the restaurant's own menu (as provided by the user)
 *  - "general" → general culinary knowledge about a dish type (may differ here)
 *  - "ai"      → an AI interpretation (helpful, but not verified)
 *  - "unknown" → we don't know; the user should check
 */
export type Source = "menu" | "general" | "ai" | "unknown";

export interface Fact {
  text: string;
  source: Source;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  /** Price exactly as listed on the menu, in GBP. null/undefined = not listed. */
  price?: number | null;
  section?: string;
  /** Dietary markers printed on the menu, e.g. "V", "VG", "GF", "H". */
  menuTags?: string[];
}

export type MenuOrigin = "sample" | "text" | "photo" | "pdf";
export type ExtractedBy = "ai" | "parser" | "sample";

export interface Menu {
  id: string;
  restaurantName?: string;
  cuisineHint?: string;
  items: MenuItem[];
  origin: MenuOrigin;
  extractedBy: ExtractedBy;
  /** Non-blocking notes from extraction, e.g. "Some prices were unreadable". */
  warnings?: string[];
  createdAt: string;
}

export type SpiceLevel = 0 | 1 | 2 | 3;

export interface DishInsight {
  itemId: string;
  /** Plain-English one-paragraph explanation. */
  summary: Fact[];
  ingredients: Fact[];
  flavour: Fact[];
  cuisine?: Fact;
  /** Dietary/allergen notes — never claims anything is "free from". */
  dietary: DietaryNote[];
  /** Things the user should confirm with the restaurant. */
  verify: string[];
  spice: SpiceLevel | null;
  /** 1 = familiar, 3 = very unfamiliar to most UK diners. */
  novelty: 1 | 2 | 3;
  /** We never show AI-generated food photos. Only real restaurant photos (none yet). */
  photoUrl: null;
}

export type DietaryStatus = "conflict" | "caution" | "listed";

export interface DietaryNote {
  preference: string;
  status: DietaryStatus;
  text: string;
}

export type PickKind = "safe" | "adventure" | "value";

export interface DishPick {
  kind: PickKind;
  itemId: string;
  reasons: Fact[];
  cautions: string[];
}

export type Engine = "ai" | "rules";

export interface RecommendationSet {
  picks: DishPick[];
  insights: Record<string, DishInsight>;
  engine: Engine;
  generatedAt: string;
  /** Items excluded because they clearly conflict with a dietary requirement. */
  excluded: { itemId: string; reason: string }[];
  notes: string[];
}

export type DietaryPref =
  | "vegetarian"
  | "vegan"
  | "pescatarian"
  | "halal"
  | "no-pork"
  | "no-alcohol"
  | "gluten-free"
  | "dairy-free"
  | "nut-allergy"
  | "shellfish-allergy";

export type Budget = "easy" | "mid" | "treat";
export type Adventure = "familiar" | "balanced" | "adventurous";
export type FitnessGoal = "none" | "protein" | "lighter" | "balanced";

export interface Preferences {
  dietary: DietaryPref[];
  likes: string[];
  dislikes: string[];
  spice: SpiceLevel;
  budget: Budget | null;
  adventure: Adventure;
  fitness: FitnessGoal;
  onboarded: boolean;
}

export type Occasion =
  | "date"
  | "family"
  | "friends"
  | "solo"
  | "business"
  | "celebration";

/** The in-progress "scan" — one menu, one decision. */
export interface ScanSession {
  id: string;
  startedAt: string;
  menu?: Menu;
  recs?: RecommendationSet;
  chosenItemId?: string;
  chosenFromPick?: PickKind | null;
  occasion?: Occasion;
  chosenAt?: string;
  feedbackDone?: boolean;
}

export type YesNoUnsure = "yes" | "no" | "unsure";

export interface JournalEntry {
  id: string;
  date: string;
  restaurant: string;
  dishName: string;
  dishDescription?: string;
  price?: number | null;
  cuisine?: string;
  rating: number; // 1–5
  notes?: string;
  photo?: string; // small data URL, stays on device
  orderAgain: YesNoUnsure;
  metExpectations?: YesNoUnsure;
  recommendationHelpful?: YesNoUnsure;
  pickKind?: PickKind | null;
  novelty?: 1 | 2 | 3;
  occasion?: Occasion;
  scanId?: string;
}
