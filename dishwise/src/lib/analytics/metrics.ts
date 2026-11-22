/**
 * Turns raw events into the founder validation metrics.
 * Pure function — easy to test, no I/O.
 */
import type { StoredEvent } from "./events";

export interface FunnelStep {
  key: string;
  label: string;
  users: number;
}

export interface Metrics {
  totalEvents: number;
  uniqueUsers: number;
  sampleOnlyUsers: number;
  funnel: FunnelStep[];
  timeToRecs: { medianSec: number | null; p75Sec: number | null; under60: number; total: number };
  inputMethods: Record<string, number>;
  engines: Record<string, number>;
  interpretFailures: number;
  pickChoice: Record<string, number>;
  feedback: {
    responses: number;
    confident: Record<string, number>;
    useAgain: Record<string, number>;
    without: Record<string, number>;
    wtp: Record<string, number>;
    recHelpful: Record<string, number>;
    avgRating: number | null;
  };
  repeat: { statedYes: number; actualReturners: number; eligible: number };
  invites: { code: string; users: number; recs: number }[];
  comments: { ts: string; text: string; kind: string }[];
  daily: { day: string; users: number; scans: number }[];
}

const day = (ts: string) => ts.slice(0, 10);

function count<T extends string>(values: (T | null | undefined)[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of values) if (v) out[v] = (out[v] ?? 0) + 1;
  return out;
}

function quantile(sorted: number[], q: number): number | null {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))));
  return sorted[idx];
}

export function computeMetrics(events: StoredEvent[]): Metrics {
  const usersWith = (pred: (e: StoredEvent) => boolean) => new Set(events.filter(pred).map((e) => e.anon_id));
  const is = (name: string) => (e: StoredEvent) => e.name === name;

  const allUsers = new Set(events.map((e) => e.anon_id));
  const realMenuUsers = usersWith((e) => e.name === "menu_interpreted" && e.props.origin !== "sample");
  const sampleUsers = usersWith((e) => e.name === "menu_interpreted" && e.props.origin === "sample");

  const funnel: FunnelStep[] = [
    { key: "visit", label: "Opened Dishwise", users: allUsers.size },
    { key: "onboarded", label: "Set preferences (or skipped)", users: usersWith((e) => e.name === "onboarding_completed" || e.name === "onboarding_skipped").size },
    { key: "scan_started", label: "Started a scan", users: usersWith(is("scan_started")).size },
    { key: "menu_interpreted", label: "Menu read successfully", users: usersWith(is("menu_interpreted")).size },
    { key: "real_menu", label: "…using a real menu (not a sample)", users: realMenuUsers.size },
    { key: "recs", label: "Received recommendations", users: usersWith(is("recommendations_generated")).size },
    { key: "selected", label: "Chose a dish", users: usersWith(is("dish_selected")).size },
    { key: "selected_pick", label: "…chose a recommended pick", users: usersWith((e) => e.name === "dish_selected" && Boolean(e.props.pick)).size },
    { key: "enjoy", label: "Reached Enjoy the Moment", users: usersWith(is("enjoy_reached")).size },
    { key: "feedback", label: "Left post-meal feedback", users: usersWith(is("feedback_submitted")).size },
  ];

  const times = events
    .filter((e) => e.name === "recommendations_generated" && typeof e.props.secondsSinceScanStart === "number")
    .map((e) => e.props.secondsSinceScanStart as number)
    .sort((a, b) => a - b);

  const fb = events.filter(is("feedback_submitted"));
  const ratings = fb.map((e) => e.props.rating).filter((r): r is number => typeof r === "number");

  // Actual repeat usage = got recommendations on 2+ different days.
  const recDays = new Map<string, Set<string>>();
  for (const e of events.filter(is("recommendations_generated"))) {
    if (!recDays.has(e.anon_id)) recDays.set(e.anon_id, new Set());
    recDays.get(e.anon_id)!.add(day(e.ts));
  }
  const actualReturners = [...recDays.values()].filter((d) => d.size >= 2).length;
  const statedYes = new Set(fb.filter((e) => e.props.useAgain === "yes").map((e) => e.anon_id)).size;

  const inviteCodes = new Map<string, { users: Set<string>; recs: Set<string> }>();
  for (const e of events) {
    if (!e.invite) continue;
    if (!inviteCodes.has(e.invite)) inviteCodes.set(e.invite, { users: new Set(), recs: new Set() });
    const c = inviteCodes.get(e.invite)!;
    c.users.add(e.anon_id);
    if (e.name === "recommendations_generated") c.recs.add(e.anon_id);
  }

  const comments = fb
    .flatMap((e) => [
      ...(typeof e.props.comment === "string" && e.props.comment.trim() ? [{ ts: e.ts, text: e.props.comment, kind: "Comment" }] : []),
      ...(typeof e.props.withoutOther === "string" && e.props.withoutOther.trim() ? [{ ts: e.ts, text: e.props.withoutOther, kind: "Without Dishwise…" }] : []),
    ])
    .sort((a, b) => b.ts.localeCompare(a.ts))
    .slice(0, 30);

  const dayMap = new Map<string, { users: Set<string>; scans: number }>();
  for (const e of events) {
    const d = day(e.ts);
    if (!dayMap.has(d)) dayMap.set(d, { users: new Set(), scans: 0 });
    const v = dayMap.get(d)!;
    v.users.add(e.anon_id);
    if (e.name === "recommendations_generated") v.scans++;
  }

  return {
    totalEvents: events.length,
    uniqueUsers: allUsers.size,
    sampleOnlyUsers: [...sampleUsers].filter((u) => !realMenuUsers.has(u)).length,
    funnel,
    timeToRecs: {
      medianSec: quantile(times, 0.5),
      p75Sec: quantile(times, 0.75),
      under60: times.filter((t) => t <= 60).length,
      total: times.length,
    },
    inputMethods: count(events.filter(is("menu_interpreted")).map((e) => String(e.props.origin ?? "unknown"))),
    engines: count(events.filter(is("recommendations_generated")).map((e) => String(e.props.engine ?? "unknown"))),
    interpretFailures: events.filter(is("menu_interpret_failed")).length,
    pickChoice: count(events.filter(is("dish_selected")).map((e) => String(e.props.pick || "other menu item"))),
    feedback: {
      responses: fb.length,
      confident: count(fb.map((e) => e.props.confident as string)),
      useAgain: count(fb.map((e) => e.props.useAgain as string)),
      without: count(fb.map((e) => e.props.without as string)),
      wtp: count(fb.map((e) => e.props.wtp as string)),
      recHelpful: count(fb.map((e) => e.props.recHelpful as string)),
      avgRating: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null,
    },
    repeat: { statedYes, actualReturners, eligible: recDays.size },
    invites: [...inviteCodes.entries()]
      .map(([code, v]) => ({ code, users: v.users.size, recs: v.recs.size }))
      .sort((a, b) => b.users - a.users),
    comments,
    daily: [...dayMap.entries()]
      .map(([d, v]) => ({ day: d, users: v.users.size, scans: v.scans }))
      .sort((a, b) => a.day.localeCompare(b.day))
      .slice(-30),
  };
}
