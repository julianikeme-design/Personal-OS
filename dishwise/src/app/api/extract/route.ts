/**
 * POST /api/extract — turn an uploaded menu (photo / PDF / pasted text) into menu items.
 *
 * - Pasted text: deterministic parser first (instant, no AI). If it finds too few
 *   dishes and AI is configured, AI tidies it up.
 * - Photos & PDFs: require AI. Without a key we say so honestly.
 */
import { NextResponse } from "next/server";
import { AiError, extractMenuWithAI, isAiConfigured, type ExtractedMenu } from "@/lib/ai/claude";
import { MAX_TEXT_CHARS, parseMenuText } from "@/lib/menu/parse-text";
import { clientKey, rateLimit } from "@/lib/ratelimit";
import type { Menu, MenuItem } from "@/lib/types";
import { MAX_IMAGE_BYTES, MAX_PDF_BYTES, sniffFileType } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 120;

function fail(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(req: Request) {
  if (!rateLimit(`extract:${clientKey(req)}`, 12, 60_000)) {
    return fail(429, "rate_limited", "Too many menus in a short time. Please wait a minute.");
  }
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_PDF_BYTES + 200_000) return fail(413, "too_large", "That file is too large. Please use one under 10 MB.");

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail(400, "bad_request", "We couldn't read that upload.");
  }

  const text = form.get("text");
  const file = form.get("file");
  const restaurantName = cleanName(form.get("restaurantName"));
  const base = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), restaurantName };

  // ——— Pasted text ———
  if (typeof text === "string" && text.trim()) {
    if (text.length > MAX_TEXT_CHARS) return fail(413, "too_large", "That menu text is too long (20,000 characters max).");
    const parsed = parseMenuText(text);
    if (parsed.items.length >= 3 || !isAiConfigured()) {
      if (parsed.items.length === 0) {
        return fail(422, "no_items", "We couldn't find any dishes in that text. Try one dish per line, e.g. “Jollof rice — smoky tomato rice £12”.");
      }
      const menu: Menu = { ...base, items: parsed.items, origin: "text", extractedBy: "parser", warnings: parsed.warnings };
      return NextResponse.json({ menu });
    }
    return runAi({ kind: "text", text }, "text", base);
  }

  // ——— File upload ———
  if (!(file instanceof File)) return fail(400, "bad_request", "Please upload a menu photo or PDF, or paste the menu text.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffFileType(bytes);
  if (!type) return fail(415, "unsupported", "That file type isn't supported. Please use a JPG, PNG, WebP or PDF.");
  if (type === "application/pdf" ? bytes.length > MAX_PDF_BYTES : bytes.length > MAX_IMAGE_BYTES) {
    return fail(413, "too_large", "That file is too large. Please use a smaller photo or PDF.");
  }
  if (!isAiConfigured()) {
    return fail(503, "ai_not_configured", "Reading photos and PDFs needs the AI service, which isn't set up on this preview. Paste the menu text instead, or try a sample menu.");
  }
  const b64 = Buffer.from(bytes).toString("base64");
  return type === "application/pdf"
    ? runAi({ kind: "pdf", base64: b64 }, "pdf", base)
    : runAi({ kind: "image", mediaType: type, base64: b64 }, "photo", base);
}

async function runAi(
  input: Parameters<typeof extractMenuWithAI>[0],
  origin: Menu["origin"],
  base: Pick<Menu, "id" | "createdAt" | "restaurantName">,
) {
  let out: ExtractedMenu;
  try {
    out = await extractMenuWithAI(input);
  } catch (e) {
    const err = e instanceof AiError ? e : new AiError("upstream", "Something went wrong reading the menu.");
    const status = err.code === "rate_limited" ? 429 : err.code === "refused" ? 422 : 502;
    return fail(status, err.code, err.message);
  }
  if (!out.is_menu) {
    return fail(422, "not_a_menu", `This doesn't look like a food menu${out.not_menu_reason ? `: ${out.not_menu_reason}` : "."} Please try another photo.`);
  }
  const items: MenuItem[] = out.items
    .filter((i) => i.name.trim())
    .slice(0, 150)
    .map((i, idx) => ({
      id: `i${idx + 1}`,
      name: i.name.trim().slice(0, 120),
      description: i.description?.trim().slice(0, 400) || undefined,
      price: typeof i.price_gbp === "number" && i.price_gbp > 0 && i.price_gbp < 1000 ? i.price_gbp : null,
      section: i.section?.trim().slice(0, 60) || undefined,
      menuTags: i.menu_tags.length ? i.menu_tags.map((t) => t.slice(0, 6)).slice(0, 8) : undefined,
    }));
  if (!items.length) return fail(422, "no_items", "We couldn't read any dishes. Try a clearer, closer photo in good light.");
  const menu: Menu = {
    ...base,
    restaurantName: base.restaurantName ?? out.restaurant_name?.slice(0, 80) ?? undefined,
    cuisineHint: out.cuisine?.slice(0, 60) ?? undefined,
    items,
    origin,
    extractedBy: "ai",
    warnings: out.warnings.slice(0, 5).map((w) => w.slice(0, 300)),
  };
  return NextResponse.json({ menu });
}

function cleanName(v: FormDataEntryValue | null): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, 80) : undefined;
}
