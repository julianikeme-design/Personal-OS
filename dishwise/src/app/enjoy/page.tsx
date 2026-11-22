"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IconArrowRight, IconMoon, IconRefresh } from "@/components/icons";
import { Button, ButtonLink, Chip, cx } from "@/components/ui";
import { track } from "@/lib/client/analytics";
import { updateScan, useHydrated, useScan } from "@/lib/client/store";
import { OCCASIONS, pickPrompts } from "@/lib/prompts";
import type { Occasion } from "@/lib/types";

type Stage = "occasion" | "calm";

export default function EnjoyPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const [scan] = useScan();
  const [stage, setStage] = useState<Stage>("occasion");
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [seed, setSeed] = useState(1);
  const item = scan?.menu?.items.find((i) => i.id === scan?.chosenItemId);

  useEffect(() => {
    if (item) track("enjoy_reached", { pick: scan?.chosenFromPick ?? "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(item)]);

  if (!hydrated) return null;
  if (!item) {
    return (
      <div className="pt-16 text-center">
        <p className="text-muted">Choose a dish first.</p>
        <ButtonLink href="/scan" className="mt-4">Scan a menu</ButtonLink>
      </div>
    );
  }

  const prompts = occasion ? pickPrompts(occasion, 3, seed) : [];

  if (stage === "calm") {
    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-between bg-ink px-6 py-14 text-bg">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] opacity-60">Enjoy the moment</div>
        <div className="flex flex-col items-center text-center">
          <div className="relative flex h-44 w-44 items-center justify-center">
            <span className="breathe absolute inset-0 rounded-full bg-accent/40" />
            <span className="breathe absolute inset-6 rounded-full bg-accent/50 [animation-delay:600ms]" />
            <IconMoon size={36} className="relative" />
          </div>
          <p className="mt-10 font-display text-3xl leading-snug font-semibold text-balance">
            Your choice is made.
            <br />
            Now enjoy the company, conversation and food.
          </p>
          <p className="mt-4 opacity-70">{item.name}</p>
        </div>
        <div className="grid w-full max-w-sm gap-3">
          <Button
            size="lg"
            block
            onClick={() => {
              track("meal_finished", { occasion: occasion ?? "" });
              router.push("/feedback");
            }}
          >
            I&apos;ve finished, how was it? <IconArrowRight size={18} />
          </Button>
          <Link href="/" className="text-center text-sm opacity-70 hover:opacity-100">
            I&apos;ll review it later
          </Link>
          <p className="text-center text-[11px] opacity-50">Dishwise won&apos;t send notifications during your meal.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in flex min-h-dvh flex-col pt-10">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Great choice</div>
      <h1 className="mt-2 font-display text-[2.2rem] leading-[1.08] font-semibold text-balance">{item.name}</h1>
      <p className="mt-3 text-muted">
        Order with confidence, and remember to mention any allergies to your server. Then let&apos;s put the phone away.
      </p>

      <section className="mt-10">
        <h2 className="font-medium">What&apos;s the occasion? <span className="text-muted">(optional)</span></h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {OCCASIONS.map((o) => (
            <Chip
              key={o.id}
              selected={occasion === o.id}
              onClick={() => {
                const next = occasion === o.id ? null : o.id;
                setOccasion(next);
                updateScan({ occasion: next ?? undefined });
              }}
            >
              <span aria-hidden>{o.emoji}</span> {o.label}
            </Chip>
          ))}
        </div>
      </section>

      {occasion && (
        <section className="fade-in mt-8 rounded-3xl border border-line bg-surface p-5" aria-live="polite">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">A few conversation starters</h2>
            <button onClick={() => setSeed(seed + 1)} className="flex items-center gap-1 text-sm text-muted hover:text-ink" aria-label="Show different prompts">
              <IconRefresh size={15} /> Shuffle
            </button>
          </div>
          <ul className="mt-4 grid gap-4">
            {prompts.map((p) => (
              <li key={p} className={cx("font-display text-lg leading-snug")}>
                “{p}”
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">Read them now. You won&apos;t need your phone for the rest.</p>
        </section>
      )}

      <div className="flex-1" />
      <div className="mt-10 grid gap-3 pb-6">
        <Button size="lg" block onClick={() => setStage("calm")}>
          <IconMoon size={18} /> Put my phone away
        </Button>
        <ButtonLink href="/scan/picks" variant="quiet" size="sm">
          Change my choice
        </ButtonLink>
      </div>
    </div>
  );
}
