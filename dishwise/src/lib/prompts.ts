import type { Occasion } from "./types";

export const OCCASIONS: { id: Occasion; label: string; emoji: string }[] = [
  { id: "date", label: "Date night", emoji: "🕯️" },
  { id: "family", label: "Family meal", emoji: "🏡" },
  { id: "friends", label: "Friends", emoji: "🥂" },
  { id: "solo", label: "Solo dining", emoji: "📖" },
  { id: "business", label: "Business lunch", emoji: "🤝" },
  { id: "celebration", label: "Celebration", emoji: "🎉" },
];

/** Optional conversation starters, read once before the phone goes away. */
export const PROMPTS: Record<Occasion, string[]> = {
  date: [
    "What's a meal you still think about years later?",
    "If we could eat dinner anywhere in the world tomorrow, where would it be?",
    "What's something small that made you happy this week?",
    "What's a food you hated as a kid but love now?",
    "What's one thing you'd like us to try together this year?",
    "What's the best advice you've ever been given?",
  ],
  family: [
    "If you could invent a new pizza topping, what would it be?",
    "What was the best part of everyone's week?",
    "If our family had a restaurant, what would it be called?",
    "Which food would you take to a desert island?",
    "What's something you learned recently that surprised you?",
    "If you could have any superpower just for today, what would it be?",
  ],
  friends: [
    "What's the most memorable meal we've had together?",
    "What's something you've changed your mind about recently?",
    "What's on your list to do before the end of the year?",
    "Best thing you've watched, read or listened to lately?",
    "Which trip would you take tomorrow if money didn't matter?",
  ],
  solo: [
    "Notice three flavours in your first bite.",
    "What's one thing you're looking forward to this month?",
    "Take a moment to watch the room. What's the best detail you can spot?",
    "Is there a dish here you'd come back for?",
  ],
  business: [
    "What's been the most interesting project you've worked on this year?",
    "How did you get started in your field?",
    "What's a trend in your industry you're excited about?",
    "What does a great week look like for you?",
    "Any restaurants you'd recommend for the next time we meet?",
  ],
  celebration: [
    "What's the highlight of the year so far?",
    "What are we toasting to tonight, in one sentence each?",
    "What's one thing you're proud of that nobody asked about?",
    "Where should we celebrate next time?",
  ],
};

export function pickPrompts(occasion: Occasion, n = 3, seed = Date.now()): string[] {
  const list = [...PROMPTS[occasion]];
  let s = seed % 2147483647;
  for (let i = list.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list.slice(0, n);
}
