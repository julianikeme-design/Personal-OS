"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { DishPlaceholder } from "@/components/DishPlaceholder";
import { IconCamera, IconStar, IconTrash } from "@/components/icons";
import { Button, ButtonLink, Card, Chip, cx, Notice, PageTitle, TopBar } from "@/components/ui";
import { track } from "@/lib/client/analytics";
import { toThumbnailDataUrl } from "@/lib/client/image";
import { getJournal, KEYS, randomId, updateScan, useHydrated, useScan, write } from "@/lib/client/store";
import type { JournalEntry, YesNoUnsure } from "@/lib/types";

const WITHOUT_OPTIONS = [
  { id: "familiar", label: "Ordered something I already know" },
  { id: "asked_staff", label: "Asked the staff" },
  { id: "searched", label: "Searched online" },
  { id: "guessed", label: "Guessed" },
  { id: "others", label: "Asked the people I was with" },
  { id: "other", label: "Something else" },
];

const WTP_OPTIONS = [
  { id: "no", label: "No, only if it's free" },
  { id: "maybe", label: "Maybe" },
  { id: "yes_small", label: "Yes, around £2–3 a month" },
  { id: "yes_more", label: "Yes, more than that" },
];

function YesNo({ value, onChange, labels = ["Yes", "Not sure", "No"], name }: { value?: string; onChange: (v: YesNoUnsure) => void; labels?: string[]; name: string }) {
  const ids: YesNoUnsure[] = ["yes", "unsure", "no"];
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={name}>
      {ids.map((id, i) => (
        <Chip key={id} role="radio" aria-checked={value === id} selected={value === id} onClick={() => onChange(id)}>
          {labels[i]}
        </Chip>
      ))}
    </div>
  );
}

function Q({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-3 font-medium">
        {title}
        {hint && <span className="mt-0.5 block text-sm font-normal text-muted">{hint}</span>}
      </legend>
      {children}
    </fieldset>
  );
}

export default function FeedbackWrapper() {
  return (
    <Suspense fallback={null}>
      <FeedbackPage />
    </Suspense>
  );
}

function FeedbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const hydrated = useHydrated();
  const [scan] = useScan();
  const manual = params.get("manual") === "1";
  const item = !manual ? scan?.menu?.items.find((i) => i.id === scan?.chosenItemId) : undefined;
  const insight = item ? scan?.recs?.insights[item.id] : undefined;
  const fromPick = !manual ? scan?.chosenFromPick ?? null : null;

  const [restaurant, setRestaurant] = useState("");
  const [dish, setDish] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [rating, setRating] = useState(0);
  const [orderAgain, setOrderAgain] = useState<YesNoUnsure>();
  const [met, setMet] = useState<YesNoUnsure>();
  const [recHelpful, setRecHelpful] = useState<YesNoUnsure>();
  const [confident, setConfident] = useState<string>();
  const [without, setWithout] = useState<string>();
  const [withoutOther, setWithoutOther] = useState("");
  const [useAgain, setUseAgain] = useState<string>();
  const [wtp, setWtp] = useState<string>();
  const [notes, setNotes] = useState("");
  const [comment, setComment] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!hydrated) return null;
  if (!manual && !item) {
    return (
      <div className="pt-16 text-center">
        <p className="text-muted">There&apos;s no recent meal to review.</p>
        <div className="mt-4 flex justify-center gap-2">
          <ButtonLink href="/scan">Scan a menu</ButtonLink>
          <ButtonLink href="/feedback?manual=1" variant="secondary">Log a meal</ButtonLink>
        </div>
      </div>
    );
  }

  const restaurantName = manual ? restaurant.trim() : scan?.menu?.restaurantName ?? "";
  const dishName = manual ? dish.trim() : item!.name;

  async function onPhoto(f?: File) {
    if (!f) return;
    const url = await toThumbnailDataUrl(f);
    if (url && url.length < 400_000) setPhoto(url);
    else setError("That photo couldn't be added. Try another.");
  }

  function save() {
    if (!dishName) return setError("Add the dish name.");
    if (!rating) return setError("Give the dish a rating. A quick tap is fine.");
    const entry: JournalEntry = {
      id: randomId(),
      date: new Date().toISOString(),
      restaurant: restaurantName || "Unnamed restaurant",
      dishName,
      dishDescription: item?.description,
      price: item?.price ?? null,
      cuisine: (manual ? cuisine.trim() : insight?.cuisine?.text ?? scan?.menu?.cuisineHint) || undefined,
      rating,
      notes: notes.trim() || undefined,
      photo: photo ?? undefined,
      orderAgain: orderAgain ?? "unsure",
      metExpectations: met,
      recommendationHelpful: fromPick ? recHelpful : undefined,
      pickKind: fromPick,
      novelty: insight?.novelty,
      occasion: scan?.occasion,
      scanId: manual ? undefined : scan?.id,
    };
    const next = [entry, ...getJournal()];
    let ok = write(KEYS.journal, next);
    if (!ok && entry.photo) {
      // Storage full: keep the memory, drop the photo.
      ok = write(KEYS.journal, [{ ...entry, photo: undefined }, ...getJournal()]);
    }
    if (!ok) return setError("Your device storage is full, so we couldn't save this meal.");

    track("journal_saved", { manual, hasPhoto: Boolean(entry.photo), rating });
    if (!manual) {
      track("feedback_submitted", {
        rating,
        orderAgain: orderAgain ?? "",
        metExpectations: met ?? "",
        recHelpful: recHelpful ?? "",
        pick: fromPick ?? "",
        confident: confident ?? "",
        without: without ?? "",
        withoutOther: without === "other" ? withoutOther.trim().slice(0, 300) : "",
        useAgain: useAgain ?? "",
        wtp: wtp ?? "",
        comment: comment.trim().slice(0, 500),
        origin: scan?.menu?.origin ?? "",
      });
      updateScan({ feedbackDone: true });
    }
    router.push(`/journal?saved=${entry.id}`);
  }

  return (
    <div className="fade-in">
      <TopBar back="/" title={manual ? "Log a meal" : "How was it?"} />
      <PageTitle
        title={manual ? "Remember a meal" : "How was your meal?"}
        sub={manual ? "Add any meal to your journal and Food Passport." : "Takes about 30 seconds. It helps your future picks and helps us improve Dishwise."}
      />

      {!manual && item && (
        <Card className="mb-8 flex items-center gap-4 p-4 shadow-none">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="Your photo of the dish" className="h-16 w-16 rounded-2xl object-cover" />
          ) : (
            <DishPlaceholder name={item.name} compact className="h-16 w-16 shrink-0 rounded-2xl" />
          )}
          <div className="min-w-0">
            <div className="truncate font-medium">{item.name}</div>
            <div className="truncate text-sm text-muted">{restaurantName || "Restaurant not named"}</div>
          </div>
        </Card>
      )}

      <div className="grid gap-9">
        {manual && (
          <div className="grid gap-3">
            {[
              ["Dish", dish, setDish, "e.g. Jollof rice & chicken"],
              ["Restaurant", restaurant, setRestaurant, "Optional"],
              ["Cuisine", cuisine, setCuisine, "e.g. Nigerian, Japanese (for your Passport)"],
            ].map(([label, value, set, ph]) => (
              <label key={label as string} className="block">
                <span className="mb-1.5 block text-sm font-medium">{label as string}</span>
                <input
                  value={value as string}
                  onChange={(e) => (set as (v: string) => void)(e.target.value.slice(0, 80))}
                  placeholder={ph as string}
                  className="h-12 w-full rounded-2xl border border-line bg-surface px-4 outline-none placeholder:text-faint focus:border-ink"
                />
              </label>
            ))}
          </div>
        )}

        <Q title="Your rating">
          <div className="flex gap-1" role="radiogroup" aria-label="Rating out of 5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                onClick={() => setRating(n)}
                className={cx("flex h-12 w-12 items-center justify-center rounded-full transition", n <= rating ? "text-accent" : "text-line hover:text-faint")}
              >
                <IconStar size={32} filled={n <= rating} />
              </button>
            ))}
          </div>
        </Q>

        <Q title="Would you order it again?">
          <YesNo name="Would you order it again" value={orderAgain} onChange={setOrderAgain} />
        </Q>

        {!manual && (
          <Q title="Did it meet your expectations?">
            <YesNo name="Met expectations" value={met} onChange={setMet} labels={["Yes", "Partly", "No"]} />
          </Q>
        )}

        {!manual && fromPick && (
          <Q title="Was the recommendation useful?">
            <YesNo name="Recommendation useful" value={recHelpful} onChange={setRecHelpful} />
          </Q>
        )}

        <Q title="Your notes" hint="Private, saved on this device only.">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 1000))}
            rows={3}
            placeholder="What stood out? Anything to remember next time?"
            className="w-full rounded-2xl border border-line bg-surface p-3 outline-none placeholder:text-faint focus:border-ink"
          />
        </Q>

        <Q title="Add a photo" hint="Optional. Stays on your device.">
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <IconCamera size={18} /> {photo ? "Change photo" : "Add your photo"}
            </Button>
            {photo && (
              <Button variant="ghost" aria-label="Remove photo" onClick={() => setPhoto(null)}>
                <IconTrash size={18} />
              </Button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" aria-label="Dish photo" onChange={(e) => onPhoto(e.target.files?.[0])} />
          </div>
        </Q>

        {!manual && (
          <section className="grid gap-9 rounded-3xl bg-surface-2 p-5">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-accent">Help shape Dishwise</div>
              <p className="mt-1 text-sm text-muted">Anonymous answers. We never see your name, notes or photos.</p>
            </div>

            <Q title="Did Dishwise help you choose more confidently?">
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Confidence">
                {[["yes", "Yes"], ["somewhat", "Somewhat"], ["no", "No"]].map(([id, l]) => (
                  <Chip key={id} role="radio" aria-checked={confident === id} selected={confident === id} onClick={() => setConfident(id)}>{l}</Chip>
                ))}
              </div>
            </Q>

            <Q title="What would you have done without Dishwise?">
              <div className="grid gap-2" role="radiogroup" aria-label="Without Dishwise">
                {WITHOUT_OPTIONS.map((o) => (
                  <Chip key={o.id} role="radio" aria-checked={without === o.id} selected={without === o.id} onClick={() => setWithout(o.id)} className="justify-start rounded-2xl">
                    {o.label}
                  </Chip>
                ))}
              </div>
              {without === "other" && (
                <input
                  value={withoutOther}
                  onChange={(e) => setWithoutOther(e.target.value.slice(0, 300))}
                  placeholder="Tell us more"
                  aria-label="What else would you have done"
                  className="h-12 w-full rounded-2xl border border-line bg-surface px-4 outline-none focus:border-ink"
                />
              )}
            </Q>

            <Q title="Would you use Dishwise again at another restaurant?">
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Use again">
                {[["yes", "Yes"], ["maybe", "Maybe"], ["no", "No"]].map(([id, l]) => (
                  <Chip key={id} role="radio" aria-checked={useAgain === id} selected={useAgain === id} onClick={() => setUseAgain(id)}>{l}</Chip>
                ))}
              </div>
            </Q>

            <Q title="Would you pay for extras?" hint="e.g. unlimited scans, deeper Passport insights, fitness mode. No paywall exists today.">
              <div className="grid gap-2" role="radiogroup" aria-label="Willingness to pay">
                {WTP_OPTIONS.map((o) => (
                  <Chip key={o.id} role="radio" aria-checked={wtp === o.id} selected={wtp === o.id} onClick={() => setWtp(o.id)} className="justify-start rounded-2xl">
                    {o.label}
                  </Chip>
                ))}
              </div>
            </Q>

            <Q title="Anything else?" hint="Optional and anonymous. Please don't include personal details.">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="What would make Dishwise more useful?"
                className="w-full rounded-2xl border border-line bg-surface p-3 outline-none placeholder:text-faint focus:border-ink"
              />
            </Q>
          </section>
        )}
      </div>

      {error && <Notice tone="danger" className="mt-6">{error}</Notice>}

      <div className="mt-8 pb-4">
        <Button size="lg" block onClick={save}>
          Save to my journal
        </Button>
      </div>
    </div>
  );
}
