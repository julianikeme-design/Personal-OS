import type { DietaryNote, DishInsight, Fact } from "@/lib/types";
import { IconAlert, IconCheck, IconFlame, IconInfo } from "./icons";
import { cx, SourceBadge } from "./ui";

export function FactLine({ fact, className }: { fact: Fact; className?: string }) {
  return (
    <p className={cx("flex items-start gap-2 text-[15px] leading-relaxed", className)}>
      <span className="mt-[3px]">
        <SourceBadge source={fact.source} />
      </span>
      <span className="min-w-0">{fact.text}</span>
    </p>
  );
}

export function FactChips({ facts }: { facts: Fact[] }) {
  if (!facts.length) return <p className="text-sm text-muted">Not stated.</p>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {facts.map((f, i) => (
        <li
          key={`${f.text}-${i}`}
          title={f.source === "menu" ? "On the menu" : f.source === "ai" ? "AI interpretation" : "General knowledge"}
          className={cx(
            "rounded-full px-3 py-1 text-sm",
            f.source === "menu" ? "bg-safe-soft text-ink" : f.source === "ai" ? "border border-dashed border-value/50 text-ink" : "bg-surface-2 text-ink",
          )}
        >
          {f.text}
          {f.source === "ai" && <span className="ml-1 text-[10px] font-semibold text-value">AI</span>}
        </li>
      ))}
    </ul>
  );
}

export function DietaryList({ notes }: { notes: DietaryNote[] }) {
  if (!notes.length) return null;
  return (
    <ul className="grid gap-2">
      {notes.map((n, i) => {
        const Icon = n.status === "listed" ? IconCheck : n.status === "conflict" ? IconAlert : IconInfo;
        return (
          <li
            key={i}
            className={cx(
              "flex gap-2.5 rounded-xl px-3 py-2.5 text-sm leading-relaxed",
              n.status === "conflict" ? "bg-danger-soft" : n.status === "caution" ? "bg-warn-soft" : "bg-safe-soft",
            )}
          >
            <Icon size={16} className={cx("mt-0.5 shrink-0", n.status === "conflict" ? "text-danger" : n.status === "caution" ? "text-warn" : "text-safe")} />
            <span>{n.text}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function SpiceMeter({ insight }: { insight: DishInsight }) {
  if (insight.spice === null) return <span className="text-sm text-muted">Heat not stated</span>;
  const label = ["No chilli signals", "Mild", "Medium", "Hot"][insight.spice];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm" aria-label={`Heat: ${label}`}>
      <span className="flex text-accent" aria-hidden>
        {[1, 2, 3].map((i) => (
          <IconFlame key={i} size={15} className={i <= (insight.spice ?? 0) ? "" : "opacity-20"} fill={i <= (insight.spice ?? 0) ? "currentColor" : "none"} />
        ))}
      </span>
      {label}
    </span>
  );
}

export function NoveltyLabel({ n }: { n: 1 | 2 | 3 }) {
  return <span className="text-sm">{["", "Familiar", "A little different", "New territory"][n]}</span>;
}
