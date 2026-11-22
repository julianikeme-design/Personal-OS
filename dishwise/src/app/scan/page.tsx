"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IconArrowRight, IconCamera, IconFile, IconText } from "@/components/icons";
import { Button, Card, cx, Notice, PageTitle, Spinner } from "@/components/ui";
import { secondsSince, track } from "@/lib/client/analytics";
import { downscaleImage } from "@/lib/client/image";
import { getPreferences, getScan, startNewScan, updateScan, useHydrated, usePreferences, useScan } from "@/lib/client/store";
import { MAX_TEXT_CHARS, parseMenuText } from "@/lib/menu/parse-text";
import { SAMPLE_MENUS } from "@/lib/samples";
import type { Menu } from "@/lib/types";

type Mode = "choose" | "text";
type Status = { ai: boolean } | null;

const ACCEPT_IMAGES = "image/jpeg,image/png,image/webp,image/heic,image/heif";

export default function ScanPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const [scan] = useScan();
  const [prefs] = usePreferences();
  const [mode, setMode] = useState<Mode>("choose");
  const [text, setText] = useState("");
  const [restaurant, setRestaurant] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((s) => setStatus({ ai: Boolean(s.ai) }))
      .catch(() => setStatus({ ai: false }));
  }, []);

  // Start a fresh scan session unless one is already in progress without a menu.
  useEffect(() => {
    const cur = getScan();
    if (!cur || cur.chosenItemId || cur.feedbackDone) {
      startNewScan();
      track("scan_started", { onboarded: getPreferences().onboarded });
    }
  }, []);

  const inProgress = hydrated && scan?.menu && !scan.chosenItemId;

  function ensureSession() {
    if (!getScan() || getScan()?.menu) {
      startNewScan();
      track("scan_started", { onboarded: prefs.onboarded, restarted: true });
    }
  }

  function accept(menu: Menu, method: string) {
    if (restaurant.trim() && !menu.restaurantName) menu.restaurantName = restaurant.trim().slice(0, 80);
    updateScan({ menu, recs: undefined, chosenItemId: undefined });
    track("menu_interpreted", {
      origin: menu.origin,
      method,
      extractedBy: menu.extractedBy,
      items: menu.items.length,
      seconds: secondsSince(getScan()?.startedAt),
    });
    router.push("/scan/review");
  }

  async function submit(form: FormData, method: string, label: string) {
    ensureSession();
    setError(null);
    setBusy(label);
    track("menu_submitted", { method });
    if (restaurant.trim()) form.set("restaurantName", restaurant.trim());
    try {
      const res = await fetch("/api/extract", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.menu) {
        const message = data?.error?.message ?? "Something went wrong reading that menu. Please try again.";
        track("menu_interpret_failed", { method, code: data?.error?.code ?? `http_${res.status}` });
        setError(message);
        setBusy(null);
        return;
      }
      accept(data.menu as Menu, method);
    } catch {
      track("menu_interpret_failed", { method, code: "network" });
      setError("We couldn't reach Dishwise. Check your connection and try again.");
      setBusy(null);
    }
  }

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose a photo (JPG, PNG or WebP).");
    setBusy("Preparing photo…");
    const blob = await downscaleImage(file);
    const form = new FormData();
    form.set("file", new File([blob], "menu.jpg", { type: blob.type || "image/jpeg" }));
    await submit(form, "photo", "Reading your menu…");
  }

  async function onPdf(file: File | undefined) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return setError("That PDF is over 10 MB. Try a smaller file or a photo of the menu.");
    const form = new FormData();
    form.set("file", file);
    await submit(form, "pdf", "Reading your PDF…");
  }

  async function onText() {
    if (text.trim().length < 3) return setError("Paste at least one dish.");
    const form = new FormData();
    form.set("text", text);
    await submit(form, "text", "Reading your menu…");
  }

  function onSample(id: string) {
    ensureSession();
    const s = SAMPLE_MENUS.find((m) => m.id === id)!;
    const { items } = parseMenuText(s.text);
    track("menu_submitted", { method: "sample", sample: s.id });
    accept(
      {
        id: `sample-${s.id}-${Date.now()}`,
        restaurantName: s.restaurantName,
        cuisineHint: s.cuisine,
        items,
        origin: "sample",
        extractedBy: "sample",
        createdAt: new Date().toISOString(),
      },
      "sample",
    );
  }

  if (busy) {
    return (
      <div className="flex min-h-[70dvh] flex-col items-center justify-center text-center" aria-live="polite">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <span className="breathe absolute inset-0 rounded-full bg-accent-soft" />
          <Spinner className="relative h-8 w-8 text-accent" />
        </div>
        <p className="mt-6 font-display text-xl font-semibold">{busy}</p>
        <p className="mt-2 max-w-xs text-sm text-muted">Reading every dish exactly as written. Photos usually take 10–30 seconds.</p>
      </div>
    );
  }

  return (
    <div className="fade-in pt-8">
      <PageTitle eyebrow="Scan a menu" title="What's on the menu?" sub="Share it however is easiest. You'll check what we read before getting picks." />

      {inProgress && scan?.menu && (
        <Link href="/scan/review" className="mb-5 flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3 text-sm">
          <span>
            Continue with <strong>{scan.menu.restaurantName ?? "your last menu"}</strong> ({scan.menu.items.length} dishes)
          </span>
          <IconArrowRight size={16} />
        </Link>
      )}

      {error && (
        <Notice tone="danger" className="mb-5">
          {error}
        </Notice>
      )}

      <label className="mb-5 block">
        <span className="mb-1.5 block text-sm font-medium">Restaurant <span className="font-normal text-muted">(optional)</span></span>
        <input
          value={restaurant}
          onChange={(e) => setRestaurant(e.target.value)}
          maxLength={80}
          placeholder="e.g. the place on the corner"
          className="h-12 w-full rounded-2xl border border-line bg-surface px-4 outline-none placeholder:text-faint focus:border-ink"
        />
      </label>

      {mode === "choose" && (
        <div className="grid gap-3">
          <button
            onClick={() => photoRef.current?.click()}
            className="group flex items-center gap-4 rounded-3xl bg-ink p-5 text-left text-bg shadow-card"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-ink">
              <IconCamera size={24} />
            </span>
            <span className="flex-1">
              <span className="block font-medium">Take or upload a photo</span>
              <span className="block text-sm opacity-70">{status && !status.ai ? "Needs AI, not set up on this preview" : "Best for printed menus"}</span>
            </span>
            <IconArrowRight className="opacity-60" />
          </button>
          <input ref={photoRef} type="file" accept={ACCEPT_IMAGES} capture="environment" className="sr-only" aria-label="Menu photo" onChange={(e) => onPhoto(e.target.files?.[0])} />

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setMode("text")} className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4 text-left hover:bg-surface-2">
              <IconText className="text-accent" />
              <span>
                <span className="block font-medium">Paste text</span>
                <span className="block text-sm text-muted">From a website or app</span>
              </span>
            </button>
            <button onClick={() => pdfRef.current?.click()} className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4 text-left hover:bg-surface-2">
              <IconFile className="text-accent" />
              <span>
                <span className="block font-medium">Upload PDF</span>
                <span className="block text-sm text-muted">{status && !status.ai ? "Needs AI" : "Up to 10 MB"}</span>
              </span>
            </button>
            <input ref={pdfRef} type="file" accept="application/pdf" className="sr-only" aria-label="Menu PDF" onChange={(e) => onPdf(e.target.files?.[0])} />
          </div>

          {status && !status.ai && (
            <Notice>
              AI menu reading isn&apos;t switched on in this preview, so photos and PDFs can&apos;t be read yet. Pasted
              text and sample menus work fully, using Dishwise&apos;s built-in matching.
            </Notice>
          )}
        </div>
      )}

      {mode === "text" && (
        <Card className="p-4">
          <label htmlFor="menu-text" className="mb-2 block text-sm font-medium">
            Paste the menu
          </label>
          <textarea
            id="menu-text"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT_CHARS))}
            rows={10}
            placeholder={"STARTERS\nSuya skewers — beef, yaji spice £9\nKelewele (VG) — spiced plantain £6\n\nMAINS\nJollof rice & chicken £17"}
            className="w-full resize-y rounded-2xl border border-line bg-bg p-3 font-mono text-sm leading-relaxed outline-none placeholder:text-faint focus:border-ink"
          />
          <div className="mt-1 text-right text-xs text-faint">{text.length.toLocaleString()} / {MAX_TEXT_CHARS.toLocaleString()}</div>
          <p className="mt-1 text-xs text-muted">Tip: one dish per line, with the price, works best.</p>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" onClick={() => setMode("choose")}>Back</Button>
            <Button className="flex-1" onClick={onText} disabled={!text.trim()}>
              Read this menu
            </Button>
          </div>
        </Card>
      )}

      <section className="mt-10" aria-labelledby="samples">
        <h2 id="samples" className="font-display text-xl font-semibold">No menu handy?</h2>
        <p className="mt-1 text-sm text-muted">Try a sample. These restaurants are fictional, made up for demonstration.</p>
        <div className="mt-4 grid gap-2.5">
          {SAMPLE_MENUS.map((s) => (
            <button
              key={s.id}
              onClick={() => onSample(s.id)}
              className={cx("flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3.5 text-left hover:bg-surface-2")}
            >
              <span>
                <span className="block font-medium">
                  {s.restaurantName} <span className="ml-1 rounded bg-warn-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warn">Sample</span>
                </span>
                <span className="block text-sm text-muted">
                  {s.cuisine} · {s.blurb}
                </span>
              </span>
              <IconArrowRight size={16} className="shrink-0 text-muted" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
