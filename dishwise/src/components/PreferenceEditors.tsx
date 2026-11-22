"use client";
import {
  ADVENTURE_OPTIONS,
  BUDGET_OPTIONS,
  DIETARY_OPTIONS,
  DISLIKE_OPTIONS,
  FITNESS_OPTIONS,
  SPICE_LABELS,
  TASTE_OPTIONS,
} from "@/lib/preferences";
import type { Preferences, SpiceLevel } from "@/lib/types";
import { IconFlame } from "./icons";
import { Chip, cx, Notice, OptionCard } from "./ui";

type Edit = { prefs: Preferences; onChange: (p: Preferences) => void };

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

export function DietaryEditor({ prefs, onChange }: Edit) {
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Dietary requirements">
        {DIETARY_OPTIONS.map((o) => (
          <Chip key={o.id} selected={prefs.dietary.includes(o.id)} onClick={() => onChange({ ...prefs, dietary: toggle(prefs.dietary, o.id) })}>
            {o.label}
          </Chip>
        ))}
      </div>
      {prefs.dietary.length > 0 && (
        <Notice className="mt-5">
          We&apos;ll flag dishes that clearly don&apos;t fit and highlight anything uncertain. We can&apos;t verify
          allergens or halal status, so <strong>always confirm with restaurant staff</strong>.
        </Notice>
      )}
    </div>
  );
}

export function TastesEditor({ prefs, onChange }: Edit) {
  return (
    <div className="grid gap-7">
      <div>
        <h3 className="mb-3 text-sm font-semibold">I enjoy…</h3>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Foods you enjoy">
          {TASTE_OPTIONS.map((o) => (
            <Chip key={o.id} selected={prefs.likes.includes(o.id)} onClick={() => onChange({ ...prefs, likes: toggle(prefs.likes, o.id) })}>
              {o.label}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-3 text-sm font-semibold">I&apos;d rather avoid…</h3>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Foods you'd rather avoid">
          {DISLIKE_OPTIONS.map((o) => (
            <Chip key={o.id} selected={prefs.dislikes.includes(o.id)} onClick={() => onChange({ ...prefs, dislikes: toggle(prefs.dislikes, o.id) })}>
              {o.label}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SpiceEditor({ prefs, onChange }: Edit) {
  return (
    <div className="grid gap-2.5" role="radiogroup" aria-label="Spice tolerance">
      {([0, 1, 2, 3] as SpiceLevel[]).map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={prefs.spice === l}
          onClick={() => onChange({ ...prefs, spice: l })}
          className={cx(
            "flex items-center justify-between rounded-2xl border bg-surface px-4 py-3.5 text-left transition",
            prefs.spice === l ? "border-ink ring-1 ring-ink" : "border-line hover:border-faint",
          )}
        >
          <span>
            <span className="block font-medium">{SPICE_LABELS[l].label}</span>
            <span className="block text-sm text-muted">{SPICE_LABELS[l].hint}</span>
          </span>
          <span className="flex gap-0.5 text-accent" aria-hidden>
            {[1, 2, 3].map((i) => (
              <IconFlame key={i} size={18} className={i <= l ? "" : "opacity-15"} fill={i <= l ? "currentColor" : "none"} />
            ))}
          </span>
        </button>
      ))}
    </div>
  );
}

export function BudgetEditor({ prefs, onChange }: Edit) {
  return (
    <div className="grid gap-2.5" role="radiogroup" aria-label="Budget">
      {BUDGET_OPTIONS.map((o) => (
        <OptionCard
          key={o.id}
          role="radio"
          aria-checked={prefs.budget === o.id}
          selected={prefs.budget === o.id}
          title={o.label}
          hint={o.hint}
          onClick={() => onChange({ ...prefs, budget: prefs.budget === o.id ? null : o.id })}
        />
      ))}
    </div>
  );
}

export function AdventureEditor({ prefs, onChange }: Edit) {
  return (
    <div className="grid gap-7">
      <div className="grid gap-2.5" role="radiogroup" aria-label="Appetite for adventure">
        {ADVENTURE_OPTIONS.map((o) => (
          <OptionCard
            key={o.id}
            role="radio"
            aria-checked={prefs.adventure === o.id}
            selected={prefs.adventure === o.id}
            title={o.label}
            hint={o.hint}
            onClick={() => onChange({ ...prefs, adventure: o.id })}
          />
        ))}
      </div>
      <div>
        <h3 className="mb-1 text-sm font-semibold">Any fitness focus? <span className="font-normal text-muted">(optional)</span></h3>
        <p className="mb-3 text-sm text-muted">We&apos;ll lean towards matching dishes. Nutrition figures are rarely on menus, so we never invent them.</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Fitness focus">
          {FITNESS_OPTIONS.map((o) => (
            <Chip key={o.id} role="radio" aria-checked={prefs.fitness === o.id} selected={prefs.fitness === o.id} onClick={() => onChange({ ...prefs, fitness: o.id })}>
              {o.label}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}
