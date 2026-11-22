import { describe, expect, it } from "vitest";
import { analyseDietary, detectSpice, matchKeywords } from "../menu/dietary";

const item = (name: string, description?: string, menuTags?: string[]) => ({ id: "i1", name, description, menuTags });

describe("analyseDietary", () => {
  it("excludes clear conflicts stated on the menu", () => {
    expect(analyseDietary(item("Char siu bao", "honey-roast pork"), ["halal"]).excluded).toBeTruthy();
    expect(analyseDietary(item("Chicken katsu"), ["vegetarian"]).excluded).toBeTruthy();
    expect(analyseDietary(item("Kung pao prawns", "peanuts"), ["nut-allergy"]).excluded).toBeTruthy();
  });

  it("never confirms halal from a dish name", () => {
    const r = analyseDietary(item("Grilled lamb chops"), ["halal"]);
    expect(r.excluded).toBeNull();
    expect(r.notes[0].status).toBe("caution");
    expect(r.notes[0].text).toMatch(/doesn't say whether it's halal/);
  });

  it("flags traditional hidden ingredients as cautions (general knowledge)", () => {
    const r = analyseDietary(item("Agedashi tofu", "fried tofu in dashi broth"), ["vegetarian"], undefined);
    expect(r.excluded).toBeNull();
    expect(r.notes[0].status).toBe("caution");
    expect(r.notes[0].text).toMatch(/fish/i);
  });

  it("never claims an item is allergen-free, even when marked GF", () => {
    const plain = analyseDietary(item("Plain rice"), ["gluten-free"]);
    expect(plain.notes[0].status).toBe("caution");
    const marked = analyseDietary(item("Rice bowl", undefined, ["GF"]), ["gluten-free"]);
    expect(marked.notes[0].status).toBe("listed");
    expect(marked.notes[0].text).toMatch(/confirm/i);
  });

  it("avoids false friends", () => {
    expect(matchKeywords("coconut milk curry", ["milk"])).toEqual([]);
    expect(matchKeywords("oyster mushrooms", ["oyster"])).toEqual([]);
    expect(matchKeywords("butternut squash", ["nut"])).toEqual([]);
    expect(matchKeywords("hamachi", ["ham"])).toEqual([]);
  });
});

describe("detectSpice", () => {
  it("reads chilli icons and words, and returns null when unknown", () => {
    expect(detectSpice({ id: "a", name: "x", menuTags: ["🌶", "🌶"] })).toBe(2);
    expect(detectSpice({ id: "a", name: "Scotch bonnet chicken" })).toBe(3);
    expect(detectSpice({ id: "a", name: "Plain rice" })).toBeNull();
  });
});
