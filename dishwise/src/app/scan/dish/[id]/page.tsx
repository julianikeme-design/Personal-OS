"use client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { DishPlaceholder } from "@/components/DishPlaceholder";
import { DietaryList, FactChips, FactLine, NoveltyLabel, SpiceMeter } from "@/components/DishBits";
import { IconAlert, IconArrowRight } from "@/components/icons";
import { Button, ButtonLink, Card, cx, formatPrice, Notice, PICK_META, SourceLegend, TopBar } from "@/components/ui";
import { track } from "@/lib/client/analytics";
import { chooseDish } from "@/lib/client/choose";
import { useHydrated, useScan } from "@/lib/client/store";
import type { PickKind } from "@/lib/types";

export default function DishPageWrapper() {
  return (
    <Suspense fallback={null}>
      <DishPage />
    </Suspense>
  );
}

function DishPage() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const hydrated = useHydrated();
  const [scan] = useScan();
  const item = scan?.menu?.items.find((i) => i.id === id);
  const insight = scan?.recs?.insights[id];
  const pick = scan?.recs?.picks.find((p) => p.itemId === id);
  const pickKind = (pick?.kind ?? (search.get("pick") as PickKind | null)) || null;
  const excluded = scan?.recs?.excluded.find((e) => e.itemId === id);

  useEffect(() => {
    if (item) track("dish_viewed", { pick: pick?.kind ?? "", excluded: Boolean(excluded) });
  }, [item, pick?.kind, excluded]);

  if (!hydrated) return null;
  if (!item || !insight || !scan?.menu) {
    return (
      <div className="pt-16 text-center">
        <p className="text-muted">We couldn&apos;t find that dish.</p>
        <ButtonLink href="/scan/picks" className="mt-4">Back to your picks</ButtonLink>
      </div>
    );
  }
  const meta = pickKind ? PICK_META[pickKind] : null;

  return (
    <div className="fade-in">
      <TopBar back="/scan/picks" title={scan.menu.restaurantName ?? "Dish details"} />

      <DishPlaceholder name={item.name} className="-mx-5 h-48 sm:mx-0 sm:rounded-3xl" />
      <p className="mt-2 text-xs text-faint">
        No photo from the restaurant is available. We don&apos;t use AI or stock images to show what a dish looks like.
      </p>

      <header className="mt-5">
        {meta && (
          <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", meta.soft, meta.text)}>
            <meta.Icon size={14} /> {meta.label}
          </span>
        )}
        <h1 className="mt-2 font-display text-[2rem] leading-tight font-semibold">{item.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted">
          <span className="text-lg font-medium text-ink">{formatPrice(item.price) ?? "Price not listed"}</span>
          {item.section && <span className="text-sm">{item.section}</span>}
          {item.menuTags?.length ? <span className="text-sm">Menu marks: {item.menuTags.join(" · ")}</span> : null}
        </div>
      </header>

      {excluded && (
        <Notice tone="danger" className="mt-5">
          <strong>Doesn&apos;t fit your dietary requirements.</strong> {excluded.reason}
        </Notice>
      )}

      <section className="mt-6 grid gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">What it is</h2>
        {insight.summary.map((f, i) => (
          <FactLine key={i} fact={f} />
        ))}
      </section>

      <Card className="mt-6 grid gap-5 p-5 shadow-none">
        <Row label="Ingredients we can see">
          <FactChips facts={insight.ingredients} />
        </Row>
        <Row label="Flavour">
          <FactChips facts={insight.flavour} />
        </Row>
        <div className="grid grid-cols-2 gap-4">
          <Row label="Heat">
            <SpiceMeter insight={insight} />
          </Row>
          <Row label="Familiarity">
            <NoveltyLabel n={insight.novelty} />
          </Row>
        </div>
        {insight.cuisine && (
          <Row label="Cuisine">
            <FactLine fact={insight.cuisine} />
          </Row>
        )}
      </Card>

      {pick && (
        <section className="mt-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Why we picked it</h2>
          <div className="grid gap-1.5">
            {pick.reasons.map((r, i) => (
              <FactLine key={i} fact={r} />
            ))}
          </div>
        </section>
      )}

      {insight.dietary.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Your dietary requirements</h2>
          <DietaryList notes={insight.dietary} />
        </section>
      )}

      <section className="mt-6">
        <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-warn">
          <IconAlert size={14} /> Worth asking your server
        </h2>
        <ul className="grid gap-1.5 text-sm leading-relaxed text-muted">
          {[...(pick?.cautions ?? []).filter((c) => !insight.dietary.some((d) => d.text === c)), ...insight.verify].map((v, i) => (
            <li key={i} className="flex gap-2"><span aria-hidden>·</span>{v}</li>
          ))}
        </ul>
      </section>

      <div className="mt-6 border-t border-line pt-4">
        <SourceLegend />
      </div>

      <div className="pb-safe sticky bottom-20 z-10 -mx-5 mt-6 bg-gradient-to-t from-bg via-bg to-bg/0 px-5 pt-6 pb-4">
        <Button
          size="lg"
          block
          variant={excluded ? "secondary" : "primary"}
          onClick={() => {
            chooseDish(item.id, pick?.kind ?? null);
            router.push("/enjoy");
          }}
        >
          {excluded ? "Choose anyway" : "Choose this dish"} <IconArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">{label}</div>
      {children}
    </div>
  );
}
