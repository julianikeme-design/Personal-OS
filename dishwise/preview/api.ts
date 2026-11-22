/**
 * Browser-only stand-in for the server API routes, used by the preview build.
 * Same logic as the real routes (parser, rules engine, metrics) minus AI and
 * shared storage: events stay in this browser.
 */
import { sanitiseEvent, type StoredEvent } from "@/lib/analytics/events";
import { computeMetrics } from "@/lib/analytics/metrics";
import { parseMenuText } from "@/lib/menu/parse-text";
import { recommendWithRules } from "@/lib/recommend/rules";
import type { Menu } from "@/lib/types";

const EVENTS_KEY = "dw.preview.events";
const json = (status: number, body: unknown) =>
  new Response(body === null ? null : JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function loadEvents(): StoredEvent[] {
  try {
    return JSON.parse(localStorage.getItem(EVENTS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

async function handle(path: string, init?: RequestInit): Promise<Response> {
  await new Promise((r) => setTimeout(r, 250));
  if (path === "/api/status") return json(200, { ai: false, model: null, store: "device", storeEphemeral: false });

  if (path === "/api/extract") {
    const form = init?.body as FormData;
    const text = form?.get("text");
    const restaurantName = (form?.get("restaurantName") as string | null) || undefined;
    if (typeof text === "string" && text.trim()) {
      const { items, warnings } = parseMenuText(text);
      if (!items.length) return json(422, { error: { code: "no_items", message: "We couldn't find any dishes in that text. Try one dish per line, e.g. “Jollof rice — smoky tomato rice £12”." } });
      const menu: Menu = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), restaurantName, items, origin: "text", extractedBy: "parser", warnings };
      return json(200, { menu });
    }
    return json(503, { error: { code: "ai_not_configured", message: "Reading photos and PDFs needs the AI service, which this preview doesn't include. Paste the menu text instead, or try a sample menu." } });
  }

  if (path === "/api/recommend") {
    const body = JSON.parse(String(init?.body ?? "{}"));
    const recs = recommendWithRules(body.menu, body.preferences, { triedCuisines: body.triedCuisines ?? [] });
    return json(200, { recs });
  }

  if (path === "/api/events") {
    const ev = sanitiseEvent(JSON.parse(String(init?.body ?? "{}")));
    if (!ev) return json(400, null);
    try {
      const all = [...loadEvents(), { ...ev, id: crypto.randomUUID(), ts: new Date().toISOString() }].slice(-2000);
      localStorage.setItem(EVENTS_KEY, JSON.stringify(all));
    } catch {}
    return new Response(null, { status: 204 });
  }

  if (path === "/api/founder") {
    return json(200, { metrics: computeMetrics(loadEvents()), store: "device", storeEphemeral: false, generatedAt: new Date().toISOString() });
  }
  return json(404, { error: "Not found" });
}

export function installPreviewApi() {
  const realFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const path = url.startsWith("/api/") ? url.split("?")[0] : null;
    return path ? handle(path, init) : realFetch(input, init);
  };
}
