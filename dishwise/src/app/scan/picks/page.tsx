"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DishPlaceholder } from "@/components/DishPlaceholder";
import { FactLine, SpiceMeter } from "@/components/DishBits";
import { IconAlert, IconArrowRight, IconRefresh } from "@/components/icons";
import { Button, ButtonLink, cx, formatPrice, Notice, PICK_META, SourceLegend, TopBar } from "@/components/ui";
import { chooseDish } from "@/lib/client/choose";
import { useHydrated, useScan } from "@/lib/client/store";
import type { DishPick, Menu, RecommendationSet } from "@/lib/types";

export default function PicksPage() {
  const hydrated = useHydrated();
  const [scan] = useScan();
  const [showAll, setShowAll] = useState(false);

  if (!hydrated) return null;
  if (!scan?.menu || !scan.recs) {
    return (
      <div className="pt-16 text-center">
        <p className="text-muted">No recommendations yet.</p>
        <ButtonLink href="/scan" className="mt-4">Scan a menu</ButtonLink>
      </div>
    );
  }
  const { menu, recs } = scan;

  return (
    <div className="fade-in">
      <TopBar back="/scan/review" title={menu.restaurantName ?? "Your picks"} />
      <header className="mb-6">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">Your three picks</div>
        <h1 className="font-display text-[2rem] leading-[1.1] font-semibold">Here&apos;s what we&apos;d order.</h1>
        <p className="mt-2 text-sm text-muted">
          {recs.engine === "ai" ? "Explained by AI, checked by Dishwise's dietary rules." : "Matched by Dishwise's built-in rules (no AI)."}{" "}
          {menu.origin === "sample" && <strong className="text-warn">Sample menu, fictional restaurant.</strong>}
        </p>
      </header>

      {recs.notes.map((n) => (
        <Notice key={n} tone="warn" className="mb-4">{n}</Notice>
      ))}

      <div className="grid gap-5">
        {recs.picks.map((p) => (
          <PickCard key={p.kind} pick={p} menu={menu} recs={recs} />
        ))}
      </div>

      {recs.picks.length === 0 && (
        <Notice tone="danger">We couldn&apos;t find a dish that fits your dietary requirements. Please speak to the restaurant about what they can prepare for you.</Notice>
      )}

      <section className="mt-10">
        <button onClick={() => setShowAll(!showAll)} className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3.5 text-left">
          <span>
            <span className="block font-medium">Prefer something else?</span>
            <span className="block text-sm text-muted">Browse all {menu.items.length} dishes, explained</span>
          </span>
          <IconArrowRight size={16} className={cx("transition", showAll && "rotate-90")} />
        </button>
        {showAll && <AllDishes menu={menu} recs={recs} />}
      </section>

      <div className="mt-8 grid gap-3 border-t border-line pt-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted">What the labels mean</div>
        <SourceLegend />
        <p className="text-xs leading-relaxed text-muted">
          Always confirm allergens and dietary requirements with restaurant staff. Prices are as listed on the menu you
          provided; portion sizes are never stated by Dishwise.
        </p>
        <ButtonLink href="/scan" variant="quiet" size="sm" className="justify-self-start px-0">
          <IconRefresh size={16} /> Scan a different menu
        </ButtonLink>
      </div>
    </div>
  );
}

function PickCard({ pick, menu, recs }: { pick: DishPick; menu: Menu; recs: RecommendationSet }) {
  const router = useRouter();
  const item = menu.items.find((i) => i.id === pick.itemId);
  const insight = recs.insights[pick.itemId];
  if (!item || !insight) return null;
  const meta = PICK_META[pick.kind];
  const summary = insight.summary.find((f) => f.source === "ai" || f.source === "general") ?? insight.summary[0];

  return (
    <article className={cx("overflow-hidden rounded-[28px] border bg-surface shadow-card", "border-line")} aria-labelledby={`pick-${pick.kind}`}>
      <div className={cx("flex items-center justify-between px-5 py-3", meta.soft)}>
        <span className={cx("flex items-center gap-2 text-sm font-semibold", meta.text)}>
          <meta.Icon size={18} /> {meta.label}
        </span>
        <span className={cx("text-xs font-medium", meta.text)}>{meta.tagline}</span>
      </div>
      <div className="flex gap-4 p-5 pb-3">
        <DishPlaceholder name={item.name} compact className="h-20 w-20 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <h2 id={`pick-${pick.kind}`} className="font-display text-xl leading-tight font-semibold">{item.name}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="font-medium text-ink">{formatPrice(item.price) ?? "Price not listed"}</span>
            <SpiceMeter insight={insight} />
          </div>
          <p className="mt-1 text-[11px] text-faint">No restaurant photo available</p>
        </div>
      </div>
      <div className="grid gap-3 px-5 pb-4">
        {summary && <FactLine fact={summary} className="text-muted" />}
        <div>
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">Why it could suit you</h3>
          <ul className="grid gap-1.5">
            {pick.reasons.map((r, i) => (
              <li key={i}>
                <FactLine fact={r} />
              </li>
            ))}
          </ul>
        </div>
        {pick.cautions.length > 0 && (
          <div>
            <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-warn">
              <IconAlert size={14} /> Check before ordering
            </h3>
            <ul className="grid gap-1 text-sm leading-relaxed text-muted">
              {pick.cautions.map((c, i) => (
                <li key={i} className="flex gap-2"><span aria-hidden>·</span>{c}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="flex gap-2 border-t border-line p-3">
        <ButtonLink href={`/scan/dish/${item.id}?pick=${pick.kind}`} variant="secondary" className="flex-1">
          Details
        </ButtonLink>
        <Button
          className="flex-[1.4]"
          onClick={() => {
            chooseDish(item.id, pick.kind);
            router.push("/enjoy");
          }}
        >
          Choose this
        </Button>
      </div>
    </article>
  );
}

function AllDishes({ menu, recs }: { menu: Menu; recs: RecommendationSet }) {
  const excluded = new Map(recs.excluded.map((e) => [e.itemId, e.reason]));
  const pickOf = new Map(recs.picks.map((p) => [p.itemId, p.kind]));
  return (
    <ul className="mt-3 grid gap-2">
      {menu.items.map((item) => {
        const insight = recs.insights[item.id];
        const ex = excluded.get(item.id);
        const pk = pickOf.get(item.id);
        const blurb = insight?.summary.find((f) => f.source !== "menu") ?? insight?.summary[0];
        return (
          <li key={item.id}>
            <Link href={`/scan/dish/${item.id}`} className={cx("block rounded-2xl border border-line bg-surface p-3.5 hover:bg-surface-2", ex && "opacity-70")}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{item.name}</span>
                <span className="shrink-0 text-sm text-muted">{formatPrice(item.price) ?? "–"}</span>
              </div>
              {blurb && <p className="mt-0.5 line-clamp-2 text-sm text-muted">{blurb.text.replace(/^On the menu: /, "")}</p>}
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {pk && <span className={cx("rounded-full px-2 py-0.5 text-[11px] font-semibold", PICK_META[pk].soft, PICK_META[pk].text)}>{PICK_META[pk].label}</span>}
                {ex && <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-semibold text-danger">Doesn&apos;t fit your diet</span>}
              </div>
              {ex && <div className="sr-only">{ex}</div>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

