"use client";
import Link from "next/link";
import { DishPlaceholder } from "@/components/DishPlaceholder";
import { IconArrowRight, IconBook, IconPassport, IconScan, IconShield, IconTag } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { ButtonLink, Card, cx } from "@/components/ui";
import { useHydrated, useJournal, usePreferences, useScan } from "@/lib/client/store";

export default function Home() {
  const hydrated = useHydrated();
  const [prefs] = usePreferences();
  if (!hydrated) return <div className="min-h-dvh" />;
  return prefs.onboarded ? <Discover /> : <Welcome />;
}

function Welcome() {
  return (
    <div className="fade-in flex min-h-[calc(100dvh-8rem)] flex-col pt-10">
      <div className="flex items-center gap-2">
        <Logo />
        <span className="font-display text-xl font-semibold">Dishwise</span>
      </div>

      <div className="mt-14 flex-1">
        <h1 className="font-display text-[2.75rem] leading-[1.02] font-semibold tracking-tight text-balance">
          Know what to order.
          <br />
          <span className="text-accent">Discover what you love.</span>
        </h1>
        <p className="mt-5 max-w-md text-[17px] leading-relaxed text-muted text-pretty">
          Snap or paste a restaurant menu. Dishwise explains the dishes in plain English and suggests three picks
          that suit you, so you can order with confidence.
        </p>

        <ol className="mt-10 grid gap-3">
          {[
            ["Before", "Help me choose", "Unfamiliar dishes explained, three personal picks."],
            ["During", "Help me enjoy", "Choice made. Phone down, enjoy the table."],
            ["After", "Help me remember", "Rate it, keep it, build your food story."],
          ].map(([k, t, d]) => (
            <li key={k} className="flex items-start gap-4 rounded-2xl bg-surface px-4 py-3.5 border border-line">
              <span className="mt-0.5 w-14 shrink-0 text-xs font-semibold uppercase tracking-wider text-accent">{k}</span>
              <span>
                <span className="block font-medium">{t}</span>
                <span className="block text-sm text-muted">{d}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-10 grid gap-3">
        <ButtonLink href="/onboarding" size="lg" block>
          Explore a menu <IconArrowRight size={18} />
        </ButtonLink>
        <ButtonLink href="/how-it-works" variant="secondary" size="lg" block>
          See how it works
        </ButtonLink>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
          <IconShield size={14} /> No account needed. Your preferences stay on this device.
        </p>
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Discover() {
  const [scan] = useScan();
  const [journal] = useJournal();
  const chosen = scan?.chosenItemId ? scan.menu?.items.find((i) => i.id === scan.chosenItemId) : undefined;
  const awaitingFeedback = chosen && !scan?.feedbackDone;
  const inProgress = scan?.menu && !scan.chosenItemId;
  const cuisines = new Set(journal.map((j) => j.cuisine).filter(Boolean));

  return (
    <div className="fade-in pt-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo size={24} />
          <span className="font-display text-lg font-semibold">Dishwise</span>
        </div>
      </div>

      <h1 className="mt-8 font-display text-[2rem] leading-tight font-semibold">{greeting()}.</h1>
      <p className="mt-1 text-muted">What are we eating?</p>

      {awaitingFeedback && chosen && (
        <Card className="mt-6 overflow-hidden">
          <div className="flex items-center gap-4 p-4">
            <DishPlaceholder name={chosen.name} compact className="h-16 w-16 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-accent">How was it?</div>
              <div className="truncate font-medium">{chosen.name}</div>
              <div className="truncate text-sm text-muted">{scan?.menu?.restaurantName ?? "Your last meal"}</div>
            </div>
          </div>
          <Link href="/feedback" className="flex items-center justify-between border-t border-line px-4 py-3 text-sm font-medium hover:bg-surface-2">
            Leave a 30-second review <IconArrowRight size={16} />
          </Link>
        </Card>
      )}

      <Link
        href={inProgress ? "/scan/picks" : "/scan"}
        className="group mt-6 block overflow-hidden rounded-[28px] bg-ink p-6 text-bg shadow-card"
      >
        <div className="flex items-start justify-between">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-ink">
            <IconScan size={24} />
          </span>
          <IconArrowRight className="opacity-60 transition group-hover:translate-x-1" />
        </div>
        <div className="mt-8 font-display text-2xl font-semibold">{inProgress ? "Continue your menu" : "Explore a menu"}</div>
        <p className="mt-1.5 text-sm opacity-75">
          {inProgress
            ? `${scan?.menu?.restaurantName ?? "Your menu"}: pick up where you left off.`
            : "Photo, PDF or pasted text. Three picks in about a minute."}
        </p>
      </Link>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link href="/passport" className="rounded-3xl border border-line bg-surface p-4 hover:bg-surface-2">
          <IconPassport className="text-adventure" />
          <div className="mt-6 font-display text-2xl font-semibold">{cuisines.size}</div>
          <div className="text-sm text-muted">{cuisines.size === 1 ? "cuisine" : "cuisines"} in your Passport</div>
        </Link>
        <Link href="/journal" className="rounded-3xl border border-line bg-surface p-4 hover:bg-surface-2">
          <IconBook className="text-safe" />
          <div className="mt-6 font-display text-2xl font-semibold">{journal.length}</div>
          <div className="text-sm text-muted">{journal.length === 1 ? "meal" : "meals"} remembered</div>
        </Link>
      </div>

      <section className="mt-10" aria-labelledby="offers-title">
        <div className="flex items-baseline justify-between">
          <h2 id="offers-title" className="font-display text-xl font-semibold">Partner offers</h2>
          <span className="rounded-full bg-warn-soft px-2 py-0.5 text-[11px] font-semibold text-warn">Demo only</span>
        </div>
        <p className="mt-1 text-sm text-muted">
          A preview of how partner restaurants could reward discovery. These are illustrations, not real offers.
        </p>
        <div className="-mx-5 mt-4 flex snap-x gap-3 overflow-x-auto px-5 pb-2">
          {[
            ["Try something new", "A free side when you order a dish you've never tried.", "bg-adventure-soft text-adventure"],
            ["Passport challenge", "Explore 3 cuisines this month for a partner reward.", "bg-safe-soft text-safe"],
            ["Bring a friend", "Referral credit when a friend logs their first meal.", "bg-value-soft text-value"],
          ].map(([t, d, c]) => (
            <div key={t} className="w-64 shrink-0 snap-start rounded-3xl border border-dashed border-line bg-surface p-4">
              <span className={cx("inline-flex h-9 w-9 items-center justify-center rounded-xl", c)}>
                <IconTag size={18} />
              </span>
              <div className="mt-3 font-medium">{t}</div>
              <p className="mt-1 text-sm text-muted">{d}</p>
              <p className="mt-3 text-[11px] font-medium uppercase tracking-wider text-faint">Illustrative · no partner yet</p>
            </div>
          ))}
        </div>
      </section>

      <Link href="/how-it-works" className="mt-8 flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3.5 text-sm">
        <span className="flex items-center gap-2">
          <IconShield size={18} className="text-muted" /> How Dishwise stays honest about food
        </span>
        <IconArrowRight size={16} className="text-muted" />
      </Link>
    </div>
  );
}
