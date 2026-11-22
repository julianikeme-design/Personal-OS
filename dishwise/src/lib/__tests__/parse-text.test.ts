import { describe, expect, it } from "vitest";
import { parseMenuText } from "../menu/parse-text";
import { SAMPLE_MENUS } from "../samples";

describe("parseMenuText", () => {
  it("parses names, descriptions, prices, sections and tags", () => {
    const { items } = parseMenuText(`STARTERS
Kelewele (VG) — ginger-spiced fried plantain £6
Suya skewers - beef, yaji 🌶 9.50

MAINS
Jollof rice
smoky party jollof, grilled chicken
£17`);
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({ name: "Kelewele", description: "ginger-spiced fried plantain", price: 6, section: "Starters", menuTags: ["VG"] });
    expect(items[1]).toMatchObject({ name: "Suya skewers", price: 9.5, menuTags: ["🌶"] });
    expect(items[2]).toMatchObject({ name: "Jollof rice", description: "smoky party jollof, grilled chicken", price: 17, section: "Mains" });
  });

  it("never invents prices", () => {
    const { items, warnings } = parseMenuText("Mystery dish\nAnother dish — something");
    expect(items.every((i) => i.price == null)).toBe(true);
    expect(warnings.join(" ")).toMatch(/No prices/);
  });

  it("parses every sample menu completely", () => {
    for (const s of SAMPLE_MENUS) {
      const { items } = parseMenuText(s.text);
      const dishLines = s.text.split("\n").filter((l) => /£/.test(l));
      expect(items.length).toBe(dishLines.length);
      expect(items.every((i) => typeof i.price === "number")).toBe(true);
    }
  });

  it("caps very long input", () => {
    const { warnings } = parseMenuText("Dish £5\n".repeat(5000));
    expect(warnings.length).toBeGreaterThan(0);
  });
});
