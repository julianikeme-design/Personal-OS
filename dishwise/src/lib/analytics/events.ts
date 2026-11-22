/**
 * Product events for validation. Privacy-conscious by design:
 *  - an anonymous random id per device (no name, email or IP stored)
 *  - no menu photos, notes or free-text preferences are sent
 *  - free text is only sent from the explicit feedback form, capped in length
 */
export const EVENT_NAMES = [
  "visit",
  "onboarding_completed",
  "onboarding_skipped",
  "scan_started",
  "menu_submitted",
  "menu_interpreted",
  "menu_interpret_failed",
  "menu_reviewed",
  "recommendations_generated",
  "recommendations_failed",
  "dish_viewed",
  "dish_selected",
  "enjoy_reached",
  "meal_finished",
  "feedback_submitted",
  "journal_saved",
  "share_card_created",
] as const;

export type EventName = (typeof EVENT_NAMES)[number];
export type EventProps = Record<string, string | number | boolean | null>;

export interface StoredEvent {
  id: string;
  anon_id: string;
  scan_id: string | null;
  name: EventName;
  props: EventProps;
  invite: string | null;
  ts: string; // ISO
}

const ID_RE = /^[a-zA-Z0-9_-]{6,64}$/;

/** Validate & sanitise an incoming event. Returns null if invalid. */
export function sanitiseEvent(input: unknown): Omit<StoredEvent, "id" | "ts"> | null {
  if (!input || typeof input !== "object") return null;
  const e = input as Record<string, unknown>;
  if (typeof e.name !== "string" || !(EVENT_NAMES as readonly string[]).includes(e.name)) return null;
  if (typeof e.anonId !== "string" || !ID_RE.test(e.anonId)) return null;
  const scanId = typeof e.scanId === "string" && ID_RE.test(e.scanId) ? e.scanId : null;
  const invite = typeof e.invite === "string" ? e.invite.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || null : null;
  const props: EventProps = {};
  if (e.props && typeof e.props === "object") {
    for (const [k, v] of Object.entries(e.props as Record<string, unknown>).slice(0, 20)) {
      if (!/^[a-zA-Z0-9_]{1,40}$/.test(k)) continue;
      if (typeof v === "string") props[k] = v.slice(0, 500);
      else if (typeof v === "number" && Number.isFinite(v)) props[k] = v;
      else if (typeof v === "boolean" || v === null) props[k] = v;
    }
  }
  return { anon_id: e.anonId, scan_id: scanId, name: e.name as EventName, props, invite };
}
