"use client";
import { IconCheck, IconPassport, IconSpark } from "@/components/icons";
import { ButtonLink, Card, cx, PageTitle } from "@/components/ui";
import { useHydrated, useJournal } from "@/lib/client/store";
import { summarisePassport } from "@/lib/passport";

const STAMP_COLOURS = ["bg-accent-soft text-accent", "bg-safe-soft text-safe", "bg-adventure-soft text-adventure", "bg-value-soft text-value", "bg-warn-soft text-warn"];

export default function PassportPage() {
  const hydrated = useHydrated();
  const [journal] = useJournal();
  if (!hydrated) return null;
  const p = summarisePassport(journal);

  return (
    <div className="fade-in pt-8">
      <PageTitle eyebrow="Food Passport" title="Where your taste has travelled" sub="Stamps come only from meals you've recorded in your journal." />

      <div className="grid grid-cols-3 gap-3">
        {[
          [p.meals, p.meals === 1 ? "meal" : "meals"],
          [p.cuisines.length, p.cuisines.length === 1 ? "cuisine" : "cuisines"],
          [p.newDishes, "new dishes"],
        ].map(([n, l]) => (
          <Card key={l as string} className="p-4 text-center shadow-none">
            <div className="font-display text-3xl font-semibold">{n}</div>
            <div className="text-xs text-muted">{l}</div>
          </Card>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">Cuisine stamps</h2>
        {p.cuisines.length === 0 ? (
          <Card className="mt-3 flex flex-col items-center p-8 text-center shadow-none">
            <IconPassport size={36} className="text-faint" />
            <p className="mt-3 text-sm text-muted">Your first stamp appears after you log a meal.</p>
            <ButtonLink href="/scan" size="sm" className="mt-4">Explore a menu</ButtonLink>
          </Card>
        ) : (
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {p.cuisines.map((c, i) => (
              <li key={c.name} className={cx("flex aspect-square flex-col items-center justify-center rounded-full border-2 border-dashed p-4 text-center", STAMP_COLOURS[i % STAMP_COLOURS.length])}>
                <span className="font-display text-base leading-tight font-semibold">{c.name}</span>
                <span className="mt-1 text-[11px] opacity-80">
                  {new Date(c.first).toLocaleDateString("en-GB", { month: "short", year: "numeric" })} · {c.count}×
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Milestones</h2>
        <ul className="mt-3 grid gap-2.5">
          {p.achievements.map((a) => (
            <li key={a.id} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4">
              <span className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", a.unlocked ? "bg-accent text-accent-ink" : "bg-surface-2 text-faint")}>
                {a.unlocked ? <IconCheck size={20} /> : <IconSpark size={18} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{a.title}</div>
                <div className="text-sm text-muted">{a.description}</div>
                {!a.unlocked && a.target > 1 && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={a.progress} aria-valuemin={0} aria-valuemax={a.target} aria-label={a.title}>
                    <div className="h-full rounded-full bg-accent" style={{ width: `${(a.progress / a.target) * 100}%` }} />
                  </div>
                )}
              </div>
              <span className="text-sm text-muted">{a.progress}/{a.target}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Dining personality</h2>
        <Card className="mt-3 p-5 shadow-none">
          {p.personality ? (
            <>
              <div className="font-display text-2xl font-semibold text-adventure">{p.personality.name}</div>
              <p className="mt-1 text-sm text-muted">{p.personality.description}</p>
              <p className="mt-3 text-xs text-faint">Just for fun, based on the {p.meals} meals you&apos;ve logged.</p>
            </>
          ) : (
            <p className="text-sm text-muted">Log {3 - p.meals} more {3 - p.meals === 1 ? "meal" : "meals"} to reveal your playful dining personality.</p>
          )}
        </Card>
      </section>

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl font-semibold">Food Wrapped</h2>
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-muted">Preview</span>
        </div>
        {p.wrapped ? (
          <div className="mt-3 overflow-hidden rounded-[28px] bg-ink p-6 text-bg">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] opacity-60">Your story so far</div>
            <dl className="mt-5 grid grid-cols-2 gap-5">
              <Stat label="Meals remembered" value={String(p.meals)} />
              <Stat label="Average rating" value={p.wrapped.avgRating ? `${p.wrapped.avgRating}★` : "–"} />
              {p.wrapped.topCuisine && <Stat label="Top cuisine" value={p.wrapped.topCuisine} />}
              {p.wrapped.favouriteRestaurant && <Stat label="Most visited" value={p.wrapped.favouriteRestaurant} />}
              {p.wrapped.mostRepeatedDish && <Stat label="Your go-to dish" value={p.wrapped.mostRepeatedDish} />}
              {p.wrapped.mostAdventurousMonth && <Stat label="Most adventurous month" value={p.wrapped.mostAdventurousMonth} />}
            </dl>
            <p className="mt-6 text-xs opacity-60">Only shows what you&apos;ve actually recorded. A full yearly recap is coming.</p>
          </div>
        ) : (
          <Card className="mt-3 p-5 text-sm text-muted shadow-none">Your recap builds as you log meals.</Card>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs opacity-60">{label}</dt>
      <dd className="mt-0.5 font-display text-xl leading-tight font-semibold">{value}</dd>
    </div>
  );
}
