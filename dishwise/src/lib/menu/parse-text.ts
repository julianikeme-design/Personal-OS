/**
 * Deterministic menu-text parser. Works with no AI at all.
 *
 * Handles common pasted formats, e.g.
 *   STARTERS
 *   Suya skewers — beef, yaji spice, red onion £9
 *   Kelewele (VG) - spiced fried plantain  6.00
 *   Jollof rice
 *   smoky party jollof with grilled chicken
 *   £17
 *
 * It never invents anything: every item comes from a line the user supplied.
 */
import type { MenuItem } from "../types";

export const MAX_ITEMS = 150;
export const MAX_TEXT_CHARS = 20_000;

const PRICE_RE = /£\s?(\d{1,3}(?:[.,]\d{1,2})?)/g;
const TRAILING_NUMBER_RE = /(?:^|\s)(\d{1,3}(?:\.\d{1,2})?)\s*$/;
const PRICE_ONLY_RE = /^\s*£?\s?(\d{1,3}(?:[.,]\d{1,2})?)\s*$/;
const TAG_RE = /[([]\s*(v|vg|ve|gf|df|h|n|pb|veg|vegan)\s*[)\]]/gi;
const BARE_TAG_RE = /\s(V|VG|VE|GF|DF|H|PB)(?=\s|,|$)/g;
const SEPARATORS = [" — ", " – ", " - ", ": ", " | ", " ~ "];

export interface ParseResult {
  items: MenuItem[];
  warnings: string[];
}

function normaliseTag(t: string): string {
  const u = t.toUpperCase();
  if (u === "VEG") return "V";
  if (u === "VEGAN") return "VG";
  return u;
}

function parsePrice(raw: string): number | null {
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) && n > 0 && n < 1000 ? n : null;
}

function isLikelyHeader(line: string): boolean {
  const words = line.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 4) return false;
  if (/[£\d]/.test(line)) return false;
  const letters = line.replace(/[^A-Za-z]/g, "");
  const isUpper = letters.length > 2 && letters === letters.toUpperCase();
  const known = /^(starters?|small plates?|snacks|mains?|main courses?|large plates?|sides?|desserts?|puddings?|drinks|sharing|grill|from the grill|rice|noodles|rice (&|and) noodles|dim sum|soups?|salads?|sweets?|specials?|to start|to share|extras|vegetables|seafood|meat|kids)$/i;
  return isUpper || known.test(line.trim().replace(/[:\-–—]+$/, ""));
}

export function parseMenuText(input: string): ParseResult {
  const warnings: string[] = [];
  let text = input;
  if (text.length > MAX_TEXT_CHARS) {
    text = text.slice(0, MAX_TEXT_CHARS);
    warnings.push("The menu text was very long, so only the first part was read.");
  }
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").replace(/^[•*·\-–—\s]+/, "").trim())
    .filter((l) => l.length > 0);

  const items: MenuItem[] = [];
  let section: string | undefined;
  let last: MenuItem | null = null;

  for (const raw of lines) {
    // A line that is only a price belongs to the previous item.
    const priceOnly = raw.match(PRICE_ONLY_RE);
    if (priceOnly) {
      if (last && last.price == null) last.price = parsePrice(priceOnly[1]);
      continue;
    }

    let line = raw;
    const tags = new Set<string>();
    if (line.includes("🌶")) {
      const n = (line.match(/🌶/g) ?? []).length;
      for (let i = 0; i < n; i++) tags.add("🌶");
    }
    line = line.replace(/🌶️?/g, " ").replace(TAG_RE, (_, t) => {
      tags.add(normaliseTag(t));
      return " ";
    });

    // Price: prefer explicit £ amounts; otherwise a trailing number.
    let price: number | null = null;
    const pounds = [...line.matchAll(PRICE_RE)];
    if (pounds.length) {
      price = parsePrice(pounds[pounds.length - 1][1]);
      line = line.replace(PRICE_RE, " ");
    } else {
      const trailing = line.match(TRAILING_NUMBER_RE);
      if (trailing && line.trim().split(/\s+/).length > 1) {
        price = parsePrice(trailing[1]);
        line = line.replace(TRAILING_NUMBER_RE, " ");
      }
    }
    line = line.replace(BARE_TAG_RE, (_, t) => {
      tags.add(normaliseTag(t));
      return " ";
    });
    line = line.replace(/\s+/g, " ").replace(/[\s,.;:|~\-–—]+$/, "").trim();
    if (!line) continue;

    let name = line;
    let description: string | undefined;
    for (const sep of SEPARATORS) {
      const idx = line.indexOf(sep);
      if (idx > 0) {
        name = line.slice(0, idx).trim();
        description = line.slice(idx + sep.length).trim() || undefined;
        break;
      }
    }

    const hasSignal = price !== null || description !== undefined || tags.size > 0;
    if (!hasSignal && isLikelyHeader(line)) {
      section = toTitle(line.replace(/[:\-–—]+$/, ""));
      last = null;
      continue;
    }

    // A plain sentence after an item with no description → it's that item's description.
    const looksLikeDescription =
      !hasSignal && last && (/^[a-z]/.test(line) || line.split(" ").length > 5 || line.includes(","));
    if (looksLikeDescription && last) {
      last.description = last.description ? `${last.description} ${line}` : line;
      continue;
    }

    if (items.length >= MAX_ITEMS) {
      warnings.push(`Only the first ${MAX_ITEMS} dishes were read.`);
      break;
    }

    const item: MenuItem = {
      id: `i${items.length + 1}`,
      name: name.slice(0, 120),
      description: description?.slice(0, 400),
      price,
      section,
      menuTags: tags.size ? [...tags] : undefined,
    };
    items.push(item);
    last = item;
  }

  if (items.length && items.every((i) => i.price == null)) {
    warnings.push("No prices were found. You can add them on the next screen.");
  }
  return { items, warnings };
}

function toTitle(s: string) {
  return s
    .toLowerCase()
    .replace(/(^|\s|&)([a-z])/g, (_, a, b) => a + b.toUpperCase())
    .trim();
}
