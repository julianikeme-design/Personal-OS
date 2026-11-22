"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { IconArrowRight, IconLock, IconShield } from "@/components/icons";
import { AdventureEditor, BudgetEditor, DietaryEditor, SpiceEditor, TastesEditor } from "@/components/PreferenceEditors";
import { Button, Card, cx, PageTitle } from "@/components/ui";
import { clearAllLocalData, KEYS, useHydrated, useJournal, usePreferences, write } from "@/lib/client/store";
import { BUDGET_OPTIONS, dietaryLabel, SPICE_LABELS } from "@/lib/preferences";
import type { Preferences } from "@/lib/types";

type Section = "dietary" | "tastes" | "spice" | "budget" | "adventure" | null;

export default function ProfilePage() {
  const hydrated = useHydrated();
  const [prefs] = usePreferences();
  const [journal] = useJournal();
  const [open, setOpen] = useState<Section>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const router = useRouter();
  const [status, setStatus] = useState<{ ai: boolean; model: string | null } | null>(null);

  useEffect(() => {
    fetch("/api/status").then((r) => r.json()).then(setStatus).catch(() => setStatus(null));
  }, []);

  if (!hydrated) return null;
  const save = (p: Preferences) => write(KEYS.prefs, { ...p, onboarded: true });

  const rows: { id: Exclude<Section, null>; label: string; value: string; editor: ReactNode }[] = [
    { id: "dietary", label: "Dietary requirements", value: prefs.dietary.map(dietaryLabel).join(", ") || "None set", editor: <DietaryEditor prefs={prefs} onChange={save} /> },
    { id: "tastes", label: "Likes & dislikes", value: `${prefs.likes.length} likes · ${prefs.dislikes.length} dislikes`, editor: <TastesEditor prefs={prefs} onChange={save} /> },
    { id: "spice", label: "Spice tolerance", value: SPICE_LABELS[prefs.spice].label, editor: <SpiceEditor prefs={prefs} onChange={save} /> },
    { id: "budget", label: "Budget", value: BUDGET_OPTIONS.find((b) => b.id === prefs.budget)?.label ?? "Not set", editor: <BudgetEditor prefs={prefs} onChange={save} /> },
    { id: "adventure", label: "Adventure & fitness", value: `${prefs.adventure === "familiar" ? "Familiar" : prefs.adventure === "adventurous" ? "Adventurous" : "Balanced"}${prefs.fitness !== "none" ? ` · ${prefs.fitness}` : ""}`, editor: <AdventureEditor prefs={prefs} onChange={save} /> },
  ];

  return (
    <div className="fade-in pt-8">
      <PageTitle eyebrow="Profile" title="Your tastes" sub="Changes save instantly and shape your next picks." />

      <Card className="divide-y divide-line overflow-hidden shadow-none">
        {rows.map((r) => (
          <div key={r.id}>
            <button
              onClick={() => setOpen(open === r.id ? null : r.id)}
              aria-expanded={open === r.id}
              className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left hover:bg-surface-2"
            >
              <span className="min-w-0">
                <span className="block font-medium">{r.label}</span>
                <span className="block truncate text-sm text-muted">{r.value}</span>
              </span>
              <IconArrowRight size={16} className={cx("shrink-0 text-muted transition", open === r.id && "rotate-90")} />
            </button>
            {open === r.id && <div className="fade-in px-4 pt-1 pb-5">{r.editor}</div>}
          </div>
        ))}
      </Card>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
          <IconShield className="text-safe" /> Privacy
        </h2>
        <Card className="mt-3 grid gap-3 p-5 text-sm leading-relaxed shadow-none">
          <p>No account needed. Your preferences and your {journal.length}-meal journal (including notes and photos) are stored only in this browser.</p>
          <p>
            Menus you upload are sent to our server to be read{status?.ai ? " by an AI service (Anthropic's Claude)" : ""}, and are not
            stored there. We record anonymous usage events (e.g. &ldquo;recommendations generated&rdquo;) and feedback answers to learn
            whether Dishwise is useful. These never include your name, notes or photos.
          </p>
          {confirmClear ? (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="w-full text-sm font-medium">Delete your preferences, current menu and journal? This can&apos;t be undone.</span>
              <Button
                variant="primary"
                onClick={() => {
                  clearAllLocalData();
                  router.push("/");
                }}
              >
                Yes, delete everything
              </Button>
              <Button variant="ghost" onClick={() => setConfirmClear(false)}>Cancel</Button>
            </div>
          ) : (
            <Button variant="secondary" className="mt-1 justify-self-start" onClick={() => setConfirmClear(true)}>
              Delete my data from this device
            </Button>
          )}
        </Card>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">About this prototype</h2>
        <Card className="mt-3 grid gap-2 p-5 text-sm shadow-none">
          <Line label="Menu reading & picks" value={status ? (status.ai ? `AI enabled (${status.model})` : "Built-in rules only (AI not configured)") : "Checking…"} />
          <Line label="Accounts" value="Not required in this version" />
          <Line label="Partner offers" value="Demonstration only" />
        </Card>
      </section>

      <Link href="/founder" className="mt-10 flex items-center justify-center gap-1.5 text-xs text-faint hover:text-muted">
        <IconLock size={13} /> Founder dashboard
      </Link>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
