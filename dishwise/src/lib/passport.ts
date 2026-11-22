/**
 * Food Passport, Wrapped and Dining Personality, derived ONLY from meals the
 * user has actually recorded in their journal. No recorded meal → no stamp.
 */
import type { JournalEntry } from "./types";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  unlocked: boolean;
}

export interface PassportSummary {
  meals: number;
  cuisines: { name: string; count: number; first: string }[];
  newDishes: number; // novelty >= 2
  adventurePicks: number;
  restaurants: number;
  achievements: Achievement[];
  personality: { name: string; description: string } | null;
  wrapped: {
    topCuisine: string | null;
    favouriteRestaurant: string | null;
    mostRepeatedDish: string | null;
    mostAdventurousMonth: string | null;
    avgRating: number | null;
    fiveStars: number;
  } | null;
}

const norm = (s: string) => s.trim().replace(/\s+/g, " ");

export function summarisePassport(journal: JournalEntry[]): PassportSummary {
  const sorted = [...journal].sort((a, b) => a.date.localeCompare(b.date));
  const cuisineMap = new Map<string, { name: string; count: number; first: string }>();
  for (const j of sorted) {
    if (!j.cuisine) continue;
    const key = norm(j.cuisine).toLowerCase();
    const cur = cuisineMap.get(key);
    if (cur) cur.count++;
    else cuisineMap.set(key, { name: norm(j.cuisine), count: 1, first: j.date });
  }
  const cuisines = [...cuisineMap.values()].sort((a, b) => a.first.localeCompare(b.first));
  const newDishes = journal.filter((j) => (j.novelty ?? 1) >= 2).length;
  const adventurePicks = journal.filter((j) => j.pickKind === "adventure").length;
  const restaurants = new Set(journal.map((j) => j.restaurant.toLowerCase())).size;
  const fiveStars = journal.filter((j) => j.rating === 5).length;

  const ach = (id: string, title: string, description: string, progress: number, target: number): Achievement => ({
    id, title, description, progress: Math.min(progress, target), target, unlocked: progress >= target,
  });
  const achievements = [
    ach("first-meal", "First memory", "Log your first meal", journal.length, 1),
    ach("three-cuisines", "Curious palate", "Explore 3 different cuisines", cuisines.length, 3),
    ach("five-cuisines", "Globetrotter", "Explore 5 different cuisines", cuisines.length, 5),
    ach("ten-new", "Dish discoverer", "Try 10 dishes that were new territory", newDishes, 10),
    ach("first-adventure", "Took the leap", "Choose an Adventure Pick", adventurePicks, 1),
    ach("five-star", "Perfect plate", "Rate a dish 5 stars", fiveStars, 1),
  ];

  let personality: PassportSummary["personality"] = null;
  if (journal.length >= 3) {
    const advShare = journal.filter((j) => (j.novelty ?? 1) >= 2 || j.pickKind === "adventure").length / journal.length;
    if (cuisines.length >= 4 || advShare >= 0.6) personality = { name: "The Explorer", description: "You seek out new cuisines and unfamiliar dishes." };
    else if (advShare <= 0.2) personality = { name: "The Traditionalist", description: "You know what you love and you order it well." };
    else personality = { name: "The Curious Diner", description: "Mostly familiar favourites, with regular detours into the new." };
  }

  let wrapped: PassportSummary["wrapped"] = null;
  if (journal.length) {
    const top = (vals: string[]) => {
      const m = new Map<string, number>();
      vals.forEach((v) => m.set(v, (m.get(v) ?? 0) + 1));
      const best = [...m.entries()].sort((a, b) => b[1] - a[1])[0];
      return best && best[1] >= 1 ? best : null;
    };
    const topCuisine = [...cuisineMap.values()].sort((a, b) => b.count - a.count)[0]?.name ?? null;
    const fav = top(journal.filter((j) => j.restaurant !== "Unnamed restaurant").map((j) => j.restaurant));
    const dish = top(journal.map((j) => j.dishName));
    const months = top(journal.filter((j) => (j.novelty ?? 1) >= 2).map((j) => j.date.slice(0, 7)));
    wrapped = {
      topCuisine,
      favouriteRestaurant: fav?.[0] ?? null,
      mostRepeatedDish: dish && dish[1] >= 2 ? dish[0] : null,
      mostAdventurousMonth: months ? new Date(`${months[0]}-01T12:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : null,
      avgRating: Math.round((journal.reduce((a, j) => a + j.rating, 0) / journal.length) * 10) / 10,
      fiveStars,
    };
  }

  return { meals: journal.length, cuisines, newDishes, adventurePicks, restaurants, achievements, personality, wrapped };
}
