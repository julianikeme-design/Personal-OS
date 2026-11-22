"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { DishPlaceholder } from "@/components/DishPlaceholder";
import { IconPlus, IconShare, IconStar, IconTrash } from "@/components/icons";
import { Button, ButtonLink, Card, Chip, cx, Notice, PageTitle, PICK_META } from "@/components/ui";
import { isPreview, track } from "@/lib/client/analytics";
import { renderShareCard, type CardOptions } from "@/lib/client/shareCard";
import { KEYS, useHydrated, useJournal, write } from "@/lib/client/store";
import type { JournalEntry } from "@/lib/types";

export default function JournalWrapper() {
  return (
    <Suspense fallback={null}>
      <JournalPage />
    </Suspense>
  );
}

function JournalPage() {
  const hydrated = useHydrated();
  const [journal] = useJournal();
  const params = useSearchParams();
  const saved = params.get("saved");
  const [sharing, setSharing] = useState<JournalEntry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (!hydrated) return null;

  return (
    <div className="fade-in pt-8">
      <PageTitle eyebrow="Food Journal" title="Your dining memories" sub="Saved privately on this device." />

      {saved && <Notice className="mb-5">Saved. Thanks, that helps your future picks. 🍽️</Notice>}

      <ButtonLink href="/feedback?manual=1" variant="secondary" block className="mb-6">
        <IconPlus size={18} /> Log a meal
      </ButtonLink>

      {journal.length === 0 ? (
        <Card className="p-8 text-center shadow-none">
          <p className="font-display text-xl font-semibold">Nothing here yet</p>
          <p className="mt-2 text-sm text-muted">After your next meal, rate it in seconds and it will appear here.</p>
          <ButtonLink href="/scan" className="mt-5">Explore a menu</ButtonLink>
        </Card>
      ) : (
        <ol className="grid gap-3">
          {journal.map((j) => (
            <li key={j.id}>
              <Card className={cx("overflow-hidden shadow-none", saved === j.id && "ring-2 ring-accent")}>
                <div className="flex gap-4 p-4">
                  {j.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={j.photo} alt={`Your photo of ${j.dishName}`} className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
                  ) : (
                    <DishPlaceholder name={j.dishName} compact className="h-20 w-20 shrink-0 rounded-2xl" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted">{new Date(j.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
                    <div className="truncate font-medium">{j.dishName}</div>
                    <div className="truncate text-sm text-muted">
                      {j.restaurant}
                      {j.cuisine ? ` · ${j.cuisine}` : ""}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="flex text-accent" aria-label={`${j.rating} out of 5`}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <IconStar key={n} size={14} filled={n <= j.rating} className={n <= j.rating ? "" : "text-line"} />
                        ))}
                      </span>
                      {j.pickKind && (
                        <span className={cx("rounded-full px-2 py-0.5 text-[10px] font-semibold", PICK_META[j.pickKind].soft, PICK_META[j.pickKind].text)}>
                          {PICK_META[j.pickKind].label}
                        </span>
                      )}
                      {j.orderAgain === "yes" && <span className="text-[11px] text-safe">Would order again</span>}
                    </div>
                  </div>
                </div>
                {j.notes && <p className="border-t border-line px-4 py-3 text-sm text-muted">{j.notes}</p>}
                <div className="flex border-t border-line">
                  <button onClick={() => setSharing(j)} className="flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium hover:bg-surface-2">
                    <IconShare size={16} /> Share card
                  </button>
                  {confirmDelete === j.id ? (
                    <button
                      onClick={() => {
                        write(KEYS.journal, journal.filter((x) => x.id !== j.id));
                        setConfirmDelete(null);
                      }}
                      onBlur={() => setConfirmDelete(null)}
                      className="flex items-center justify-center gap-1.5 px-4 text-sm font-medium text-danger"
                    >
                      <IconTrash size={16} /> Tap to delete
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(j.id)}
                      className="flex items-center justify-center px-4 text-faint hover:text-danger"
                      aria-label={`Delete ${j.dishName}`}
                    >
                      <IconTrash size={16} />
                    </button>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ol>
      )}

      {sharing && <ShareSheet entry={sharing} onClose={() => setSharing(null)} />}
    </div>
  );
}

function ShareSheet({ entry, onClose }: { entry: JournalEntry; onClose: () => void }) {
  const [opts, setOpts] = useState<CardOptions>({ format: "story", showRestaurant: true, showRating: true, showPhoto: Boolean(entry.photo) });
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saveHint, setSaveHint] = useState(false);

  async function make(action: "preview" | "share") {
    setBusy(true);
    const blob = await renderShareCard(entry, opts);
    setBusy(false);
    if (!blob) return;
    if (action === "preview") {
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(blob));
      return;
    }
    track("share_card_created", { format: opts.format, photo: opts.showPhoto });
    if (isPreview()) {
      // The preview frame blocks downloads and the share sheet: show the image to long-press instead.
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(blob));
      setSaveHint(true);
      return;
    }
    const file = new File([blob], `dishwise-${entry.dishName.replace(/\W+/g, "-").toLowerCase()}.png`, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: entry.dishName });
        return;
      } catch {
        /* user cancelled */
        return;
      }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = file.name;
    a.click();
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Create a share card" className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div className="pb-safe max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-t-[28px] bg-bg p-5 sm:rounded-[28px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Share card</h2>
          <button onClick={onClose} className="text-sm text-muted hover:text-ink">Close</button>
        </div>
        <p className="mt-1 text-sm text-muted">You choose what&apos;s included. Nothing is posted automatically.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip selected={opts.format === "story"} onClick={() => setOpts({ ...opts, format: "story" })}>Story</Chip>
          <Chip selected={opts.format === "square"} onClick={() => setOpts({ ...opts, format: "square" })}>Square post</Chip>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip selected={opts.showRestaurant} onClick={() => setOpts({ ...opts, showRestaurant: !opts.showRestaurant })}>Restaurant name</Chip>
          <Chip selected={opts.showRating} onClick={() => setOpts({ ...opts, showRating: !opts.showRating })}>Rating</Chip>
          {entry.photo && <Chip selected={opts.showPhoto} onClick={() => setOpts({ ...opts, showPhoto: !opts.showPhoto })}>My photo</Chip>}
        </div>
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Share card preview" className={cx("mx-auto mt-4 rounded-2xl border border-line", opts.format === "story" ? "max-h-[45dvh]" : "max-h-[40dvh]")} />
        )}
        {saveHint && <p className="mt-3 text-center text-sm text-muted">Press and hold the image to save or share it.</p>}
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => make("preview")} disabled={busy}>Preview</Button>
          <Button className="flex-1" onClick={() => make("share")} disabled={busy}>
            <IconShare size={18} /> Share / save
          </Button>
        </div>
      </div>
    </div>
  );
}
