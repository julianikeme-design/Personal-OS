import { describe, expect, it } from "vitest";
import type { AiRecommendation } from "../ai/claude";
import { parseMenuText } from "../menu/parse-text";
import { DEFAULT_PREFERENCES } from "../preferences";
import { mergeAiWithRules } from "../recommend/merge";
import { recommendWithRules } from "../recommend/rules";
import { SAMPLE_MENUS } from "../samples";
import type { Menu, Preferences } from "../types";

const menuFor = (i: number): Menu => ({
  id: "m",
  items: parseMenuText(SAMPLE_MENUS[i].text).items,
  origin: "sample",
  extractedBy: "sample",
  createdAt: "",
});

const prefs = (p: Partial<Preferences>): Preferences => ({ ...DEFAULT_PREFERENCES, onboarded: true, ...p });

describe("recommendWithRules", () => {
  it("returns three distinct picks from the actual menu", () => {
    for (let i = 0; i < SAMPLE_MENUS.length; i++) {
      const menu = menuFor(i);
      const r = recommendWithRules(menu, prefs({}));
      expect(r.picks.map((p) => p.kind)).toEqual(["safe", "adventure", "value"]);
      expect(new Set(r.picks.map((p) => p.itemId)).size).toBe(3);
      for (const p of r.picks) expect(menu.items.some((it) => it.id === p.itemId)).toBe(true);
    }
  });

  it("never recommends dishes that conflict with dietary needs", () => {
    for (let i = 0; i < SAMPLE_MENUS.length; i++) {
      const menu = menuFor(i);
      const r = recommendWithRules(menu, prefs({ dietary: ["vegetarian", "nut-allergy"] }));
      const excluded = new Set(r.excluded.map((e) => e.itemId));
      for (const p of r.picks) expect(excluded.has(p.itemId)).toBe(false);
      const names = r.picks.map((p) => menu.items.find((it) => it.id === p.itemId)!.name.toLowerCase()).join(" ");
      expect(names).not.toMatch(/chicken|beef|pork|prawn|lamb|goat|salmon|cod|duck/);
    }
  });

  it("value pick never claims portion size or 'best value'", () => {
    const r = recommendWithRules(menuFor(1), prefs({ budget: "easy" }));
    const v = r.picks.find((p) => p.kind === "value")!;
    const text = v.reasons.map((x) => x.text).join(" ");
    expect(text).not.toMatch(/generous|filling|best value|large portion/i);
    expect(text).toMatch(/Portion size isn't stated/);
  });

  it("respects low spice tolerance", () => {
    const menu = menuFor(1);
    const r = recommendWithRules(menu, prefs({ spice: 0 }));
    const safe = menu.items.find((i) => i.id === r.picks[0].itemId)!;
    expect(safe.menuTags ?? []).not.toContain("🌶");
  });

  it("explains when everything conflicts", () => {
    const menu: Menu = { ...menuFor(0), items: [{ id: "i1", name: "Pork belly", price: 10 }] };
    const r = recommendWithRules(menu, prefs({ dietary: ["no-pork"] }));
    expect(r.picks).toHaveLength(0);
    expect(r.notes[0]).toMatch(/conflicts/);
  });
});

describe("mergeAiWithRules", () => {
  it("drops invented dishes and dietary conflicts, filling from rules", () => {
    const menu = menuFor(0);
    const p = prefs({ dietary: ["halal"] });
    const rules = recommendWithRules(menu, p);
    const porkId = menu.items.find((i) => /char siu bao/i.test(i.name))!.id;
    const ai: AiRecommendation = {
      dishes: [{ item_id: menu.items[0].id, plain_english: "Prawn dumplings.", likely_ingredients: ["prawn"], flavour: ["delicate"], cuisine: "Cantonese", novelty: 2 }],
      picks: [
        { kind: "safe", item_id: "i999", reasons: ["Made up"], cautions: [] },
        { kind: "adventure", item_id: porkId, reasons: ["Pork bun"], cautions: [] },
        { kind: "value", item_id: menu.items[0].id, reasons: ["Cheap"], cautions: [] },
      ],
    };
    const merged = mergeAiWithRules(menu, ai, rules);
    expect(merged.picks).toHaveLength(3);
    expect(merged.picks.map((x) => x.itemId)).not.toContain("i999");
    expect(merged.picks.map((x) => x.itemId)).not.toContain(porkId);
    expect(merged.notes.join(" ")).toMatch(/safety checks/);
    expect(merged.insights[menu.items[0].id].summary[0]).toEqual({ text: "Prawn dumplings.", source: "ai" });
    expect(new Set(merged.picks.map((x) => x.itemId)).size).toBe(3);
  });
});
