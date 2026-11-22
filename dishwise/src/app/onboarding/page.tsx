"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconArrowLeft, IconArrowRight } from "@/components/icons";
import { AdventureEditor, BudgetEditor, DietaryEditor, SpiceEditor, TastesEditor } from "@/components/PreferenceEditors";
import { Button, cx } from "@/components/ui";
import { track } from "@/lib/client/analytics";
import { getPreferences, KEYS, write } from "@/lib/client/store";
import type { Preferences } from "@/lib/types";

const STEPS = [
  { title: "Any dietary needs?", sub: "Choose all that apply, or skip if none.", Editor: DietaryEditor },
  { title: "What do you enjoy?", sub: "A few favourites and dislikes help us match dishes to you.", Editor: TastesEditor },
  { title: "How spicy is too spicy?", sub: "We'll steer you away from anything too hot.", Editor: SpiceEditor },
  { title: "What's tonight's budget?", sub: "For a main dish, per person. We only ever use the menu's listed prices.", Editor: BudgetEditor },
  { title: "Familiar or adventurous?", sub: "You'll always get a Safe Pick. This shapes the rest.", Editor: AdventureEditor },
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState<Preferences>(() => getPreferences());
  const { title, sub, Editor } = STEPS[step];
  const last = step === STEPS.length - 1;

  function finish(skipped: boolean) {
    write(KEYS.prefs, { ...prefs, onboarded: true });
    track(skipped ? "onboarding_skipped" : "onboarding_completed", {
      dietaryCount: prefs.dietary.length,
      likesCount: prefs.likes.length,
      spice: prefs.spice,
      budget: prefs.budget ?? "none",
      adventure: prefs.adventure,
      fitness: prefs.fitness,
      atStep: step + 1,
    });
    router.push("/scan");
  }

  return (
    <div className="flex min-h-dvh flex-col pt-4">
      <div className="flex h-12 items-center justify-between">
        {step > 0 ? (
          <button onClick={() => setStep(step - 1)} aria-label="Previous question" className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-2">
            <IconArrowLeft />
          </button>
        ) : (
          <span />
        )}
        <button onClick={() => finish(true)} className="text-sm font-medium text-muted hover:text-ink">
          Skip for now
        </button>
      </div>

      <div className="mt-2 flex gap-1.5" aria-label={`Question ${step + 1} of ${STEPS.length}`}>
        {STEPS.map((_, i) => (
          <span key={i} className={cx("h-1 flex-1 rounded-full transition", i <= step ? "bg-accent" : "bg-line")} />
        ))}
      </div>

      <div key={step} className="fade-in mt-8 flex-1">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          {step + 1} of {STEPS.length}
        </div>
        <h1 className="mt-2 font-display text-[1.9rem] leading-tight font-semibold">{title}</h1>
        <p className="mt-2 text-muted">{sub}</p>
        <div className="mt-7">
          <Editor prefs={prefs} onChange={setPrefs} />
        </div>
      </div>

      <div className="pb-safe sticky bottom-0 -mx-5 mt-8 bg-gradient-to-t from-bg via-bg to-bg/0 px-5 pt-6 pb-6">
        <Button size="lg" block onClick={() => (last ? finish(false) : setStep(step + 1))}>
          {last ? "Done. Show me a menu" : "Continue"} <IconArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
}
