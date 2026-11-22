"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IconArrowRight, IconPlus, IconTrash } from "@/components/icons";
import { Button, ButtonLink, Card, Notice, PageTitle, Spinner, TopBar } from "@/components/ui";
import { secondsSince, track } from "@/lib/client/analytics";
import { getJournal, getPreferences, getScan, triedCuisines, updateScan, useHydrated, useScan } from "@/lib/client/store";
import type { Menu, MenuItem, RecommendationSet } from "@/lib/types";

const ORIGIN_NOTE: Record<Menu["extractedBy"], { tone: "info" | "warn"; text: string }> = {
  ai: { tone: "warn", text: "Read by AI from your upload. Please check names and prices: photos can be misread." },
  parser: { tone: "info", text: "Read from your pasted text. Fix anything that's split oddly." },
  sample: { tone: "warn", text: "Fictional sample menu for demonstration. The restaurant, dishes and prices are made up." },
};

export default function ReviewPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const [scan] = useScan();
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [restaurant, setRestaurant] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [edited, setEdited] = useState(false);
  const [priceText, setPriceText] = useState<Record<string, string>>({});

  useEffect(() => {
    if (hydrated && scan?.menu && items === null) {
      setItems(scan.menu.items);
      setRestaurant(scan.menu.restaurantName ?? "");
    }
  }, [hydrated, scan, items]);

  if (!hydrated) return null;
  if (!scan?.menu) {
    return (
      <div className="pt-16 text-center">
        <p className="text-muted">No menu yet.</p>
        <ButtonLink href="/scan" className="mt-4">Scan a menu</ButtonLink>
      </div>
    );
  }
  const menu = scan.menu;
  const list = items ?? menu.items;
  const note = ORIGIN_NOTE[menu.extractedBy];

  function patch(id: string, p: Partial<MenuItem>) {
    setEdited(true);
    setItems(list.map((i) => (i.id === id ? { ...i, ...p } : i)));
  }
  function remove(id: string) {
    setEdited(true);
    setItems(list.filter((i) => i.id !== id));
  }
  function add() {
    setEdited(true);
    const n = Math.max(0, ...list.map((i) => Number(i.id.replace(/\D/g, "")) || 0)) + 1;
    setItems([...list, { id: `i${n}`, name: "", price: null }]);
  }

  async function getPicks() {
    const clean = list
      .map((i) => ({ ...i, name: i.name.trim(), description: i.description?.trim() || undefined }))
      .filter((i) => i.name);
    if (clean.length === 0) return setError("Add at least one dish.");
    const finalMenu: Menu = { ...menu, items: clean, restaurantName: restaurant.trim() || undefined };
    updateScan({ menu: finalMenu });
    track("menu_reviewed", { items: clean.length, edited, removed: menu.items.length - clean.length });
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menu: finalMenu, preferences: getPreferences(), triedCuisines: triedCuisines(getJournal()), useAi: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.recs) throw new Error(data?.error?.message ?? "Couldn't get recommendations.");
      const recs = data.recs as RecommendationSet;
      updateScan({ recs });
      track("recommendations_generated", {
        engine: recs.engine,
        picks: recs.picks.length,
        excluded: recs.excluded.length,
        items: clean.length,
        origin: finalMenu.origin,
        secondsSinceScanStart: secondsSince(getScan()?.startedAt),
        aiFallback: Boolean(data.aiError),
      });
      router.push("/scan/picks");
    } catch (e) {
      track("recommendations_failed", { message: e instanceof Error ? e.message.slice(0, 120) : "unknown" });
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  if (busy) {
    return (
      <div className="flex min-h-[70dvh] flex-col items-center justify-center text-center" aria-live="polite">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <span className="breathe absolute inset-0 rounded-full bg-accent-soft" />
          <Spinner className="relative h-8 w-8 text-accent" />
        </div>
        <p className="mt-6 font-display text-xl font-semibold">Finding your three picks…</p>
        <p className="mt-2 max-w-xs text-sm text-muted">Matching {list.length} dishes to your preferences and checking dietary details.</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <TopBar back="/scan" title="Check the menu" />
      <PageTitle title="Does this look right?" sub={`We found ${menu.items.length} ${menu.items.length === 1 ? "dish" : "dishes"}. Correct anything before we recommend.`} />

      <Notice tone={note.tone} className="mb-4">{note.text}</Notice>
      {menu.warnings?.map((w) => (
        <Notice key={w} tone="warn" className="mb-4">{w}</Notice>
      ))}

      <label className="mb-5 block">
        <span className="mb-1.5 block text-sm font-medium">Restaurant</span>
        <input
          value={restaurant}
          onChange={(e) => setRestaurant(e.target.value)}
          maxLength={80}
          placeholder="Optional"
          className="h-12 w-full rounded-2xl border border-line bg-surface px-4 outline-none placeholder:text-faint focus:border-ink"
        />
      </label>

      <ul className="grid gap-2.5">
        {list.map((item, idx) => {
          const showSection = item.section && item.section !== list[idx - 1]?.section;
          return (
            <li key={item.id}>
              {showSection && <div className="mt-4 mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{item.section}</div>}
              <Card className="p-3.5 shadow-none">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <input
                      value={item.name}
                      onChange={(e) => patch(item.id, { name: e.target.value.slice(0, 120) })}
                      aria-label="Dish name"
                      placeholder="Dish name"
                      className="w-full bg-transparent font-medium outline-none placeholder:text-faint"
                    />
                    <input
                      value={item.description ?? ""}
                      onChange={(e) => patch(item.id, { description: e.target.value.slice(0, 400) })}
                      aria-label={`Description for ${item.name || "dish"}`}
                      placeholder="Description (optional)"
                      className="mt-0.5 w-full bg-transparent text-sm text-muted outline-none placeholder:text-faint"
                    />
                    {item.menuTags?.length ? (
                      <div className="mt-1.5 flex gap-1">
                        {item.menuTags.map((t, i) => (
                          <span key={i} className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] font-semibold text-muted">{t}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <label className="flex h-9 items-center rounded-xl border border-line bg-bg px-2 text-sm">
                    <span className="text-muted">£</span>
                    <input
                      inputMode="decimal"
                      value={priceText[item.id] ?? (item.price != null ? String(item.price) : "")}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9.]/g, "").slice(0, 6);
                        setPriceText({ ...priceText, [item.id]: v });
                        const n = Number(v);
                        patch(item.id, { price: v === "" || !Number.isFinite(n) ? null : Math.min(999, n) });
                      }}
                      aria-label={`Price for ${item.name || "dish"}`}
                      placeholder="–"
                      className="w-12 bg-transparent text-right outline-none placeholder:text-faint"
                    />
                  </label>
                  <button onClick={() => remove(item.id)} aria-label={`Remove ${item.name || "dish"}`} className="flex h-9 w-9 items-center justify-center rounded-full text-faint hover:bg-surface-2 hover:text-danger">
                    <IconTrash size={18} />
                  </button>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <Button variant="ghost" className="mt-3" onClick={add}>
        <IconPlus size={18} /> Add a missing dish
      </Button>

      {error && <Notice tone="danger" className="mt-4">{error}</Notice>}

      <div className="pb-safe sticky bottom-20 z-10 -mx-5 mt-6 bg-gradient-to-t from-bg via-bg to-bg/0 px-5 pt-6 pb-4">
        <Button size="lg" block onClick={getPicks}>
          Get my three picks <IconArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
}
