import { cx } from "./ui";

/**
 * Shown instead of a food photo. We never use AI-generated or stock photos to
 * represent a specific restaurant's dish. A real photo can only come from the
 * restaurant (future feature) or the diner's own journal.
 */
const PALETTES = [
  ["#f1dccd", "#b9532f"],
  ["#dfe9dc", "#4c7656"],
  ["#ecdde6", "#9a3f6b"],
  ["#d9e8ec", "#2c6577"],
  ["#efe4c9", "#8a5a00"],
];

export function DishPlaceholder({ name, className, compact }: { name: string; className?: string; compact?: boolean }) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const [bg, fg] = PALETTES[h % PALETTES.length];
  const initial = name.trim().charAt(0).toUpperCase() || "•";
  return (
    <div
      className={cx("relative overflow-hidden", className)}
      style={{ background: bg }}
      role="img"
      aria-label={`No restaurant photo available for ${name}`}
    >
      <svg className="absolute inset-0 h-full w-full opacity-[0.18]" aria-hidden>
        <defs>
          <pattern id={`p${h}`} width="22" height="22" patternUnits="userSpaceOnUse" patternTransform={`rotate(${h % 60})`}>
            <circle cx="3" cy="3" r="1.6" fill={fg} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#p${h})`} />
      </svg>
      <div className="relative flex h-full w-full flex-col items-center justify-center">
        <span className="font-display text-4xl font-semibold" style={{ color: fg }}>
          {initial}
        </span>
        {!compact && (
          <span className="mt-1 text-[10px] font-medium uppercase tracking-wider" style={{ color: fg, opacity: 0.8 }}>
            No restaurant photo yet
          </span>
        )}
      </div>
    </div>
  );
}
