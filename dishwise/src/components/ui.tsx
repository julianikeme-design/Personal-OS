import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { PickKind, Source } from "@/lib/types";
import { IconAlert, IconArrowLeft, IconCompass, IconInfo, IconLeaf, IconTag } from "./icons";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "quiet";
const btn: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink hover:brightness-105 active:brightness-95 shadow-card",
  secondary: "bg-surface text-ink border border-line hover:bg-surface-2",
  ghost: "text-ink hover:bg-surface-2",
  quiet: "text-muted hover:text-ink underline-offset-4 hover:underline",
};
const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition disabled:opacity-50 disabled:pointer-events-none select-none";
const sizes = { md: "h-12 px-6 text-[15px]", sm: "h-9 px-4 text-sm", lg: "h-14 px-7 text-base" };

export function Button({
  variant = "primary",
  size = "md",
  block,
  className,
  ...rest
}: ComponentProps<"button"> & { variant?: Variant; size?: keyof typeof sizes; block?: boolean }) {
  return <button className={cx(btnBase, btn[variant], sizes[size], block && "w-full", className)} {...rest} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  block,
  className,
  ...rest
}: ComponentProps<typeof Link> & { variant?: Variant; size?: keyof typeof sizes; block?: boolean }) {
  return <Link className={cx(btnBase, btn[variant], sizes[size], block && "w-full", className)} {...rest} />;
}

export function Card({ className, ...rest }: ComponentProps<"div">) {
  return <div className={cx("rounded-3xl bg-surface border border-line shadow-card", className)} {...rest} />;
}

export function Chip({
  selected,
  className,
  children,
  ...rest
}: ComponentProps<"button"> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cx(
        "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition",
        selected ? "border-ink bg-ink text-bg" : "border-line bg-surface text-ink hover:border-faint",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function OptionCard({
  selected,
  title,
  hint,
  className,
  ...rest
}: ComponentProps<"button"> & { selected?: boolean; title: string; hint?: string }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cx(
        "w-full rounded-2xl border px-4 py-3.5 text-left transition",
        selected ? "border-ink bg-surface ring-1 ring-ink" : "border-line bg-surface hover:border-faint",
        className,
      )}
      {...rest}
    >
      <div className="font-medium">{title}</div>
      {hint && <div className="mt-0.5 text-sm text-muted">{hint}</div>}
    </button>
  );
}

const SOURCE_META: Record<Source, { label: string; title: string; cls: string }> = {
  menu: { label: "Menu", title: "Stated on the restaurant's menu", cls: "bg-safe-soft text-safe" },
  general: { label: "General", title: "General culinary knowledge. This restaurant's version may differ", cls: "bg-surface-2 text-muted" },
  ai: { label: "AI", title: "AI interpretation. Helpful but not verified", cls: "bg-value-soft text-value" },
  unknown: { label: "Unknown", title: "Not known. Please check with the restaurant", cls: "bg-warn-soft text-warn" },
};

export function SourceBadge({ source }: { source: Source }) {
  const m = SOURCE_META[source];
  return (
    <span title={m.title} className={cx("inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", m.cls)}>
      {m.label}
    </span>
  );
}

export function SourceLegend() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted">
      {(Object.keys(SOURCE_META) as Source[]).map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <SourceBadge source={s} /> {SOURCE_META[s].title.split(".")[0]}
        </span>
      ))}
    </div>
  );
}

export function Notice({
  tone = "info",
  children,
  className,
}: {
  tone?: "info" | "warn" | "danger";
  children: ReactNode;
  className?: string;
}) {
  const cls = { info: "bg-surface-2 text-ink", warn: "bg-warn-soft text-ink", danger: "bg-danger-soft text-ink" }[tone];
  const Icon = tone === "info" ? IconInfo : IconAlert;
  const iconCls = { info: "text-muted", warn: "text-warn", danger: "text-danger" }[tone];
  return (
    <div role={tone === "danger" ? "alert" : undefined} className={cx("flex gap-3 rounded-2xl px-4 py-3 text-sm leading-relaxed", cls, className)}>
      <Icon size={18} className={cx("mt-0.5 shrink-0", iconCls)} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function TopBar({ back, title, right }: { back?: string; title?: string; right?: ReactNode }) {
  return (
    <div className="sticky top-0 z-20 -mx-5 mb-2 flex h-14 items-center gap-2 bg-bg/90 px-3 backdrop-blur">
      {back ? (
        <Link href={back} aria-label="Back" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-2">
          <IconArrowLeft />
        </Link>
      ) : (
        <span className="w-2" />
      )}
      {title && <div className="flex-1 truncate text-[15px] font-medium">{title}</div>}
      {!title && <div className="flex-1" />}
      {right}
    </div>
  );
}

export function PageTitle({ eyebrow, title, sub }: { eyebrow?: string; title: ReactNode; sub?: ReactNode }) {
  return (
    <header className="mb-6">
      {eyebrow && <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">{eyebrow}</div>}
      <h1 className="font-display text-[2rem] leading-[1.1] font-semibold text-balance">{title}</h1>
      {sub && <p className="mt-3 text-[15px] leading-relaxed text-muted text-pretty">{sub}</p>}
    </header>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cx("inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-r-transparent", className)}
    />
  );
}

export const PICK_META: Record<PickKind, { label: string; tagline: string; text: string; soft: string; border: string; Icon: typeof IconLeaf }> = {
  safe: { label: "Safe Pick", tagline: "Likely to suit you", text: "text-safe", soft: "bg-safe-soft", border: "border-safe", Icon: IconLeaf },
  adventure: { label: "Adventure Pick", tagline: "Something new to discover", text: "text-adventure", soft: "bg-adventure-soft", border: "border-adventure", Icon: IconCompass },
  value: { label: "Value Pick", tagline: "Kind to your budget", text: "text-value", soft: "bg-value-soft", border: "border-value", Icon: IconTag },
};

export function formatPrice(p?: number | null) {
  if (p == null) return null;
  return `£${p % 1 === 0 ? p.toFixed(0) : p.toFixed(2)}`;
}
