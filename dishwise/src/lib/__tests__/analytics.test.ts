import { describe, expect, it } from "vitest";
import { sanitiseEvent, type StoredEvent } from "../analytics/events";
import { computeMetrics } from "../analytics/metrics";
import { summarisePassport } from "../passport";

describe("sanitiseEvent", () => {
  it("rejects unknown events and bad ids, strips unsafe props", () => {
    expect(sanitiseEvent({ name: "hack", anonId: "abcdef12" })).toBeNull();
    expect(sanitiseEvent({ name: "visit", anonId: "x" })).toBeNull();
    const e = sanitiseEvent({ name: "visit", anonId: "abcdef12", props: { ok: 1, "bad key": 2, obj: { a: 1 }, long: "x".repeat(900) } })!;
    expect(e.props).toEqual({ ok: 1, long: "x".repeat(500) });
  });
});

describe("computeMetrics", () => {
  const ev = (anon: string, name: StoredEvent["name"], props = {}, ts = "2026-11-01T10:00:00Z"): StoredEvent => ({ id: Math.random().toString(), anon_id: anon, scan_id: null, name, props, invite: anon === "aaaaaa" ? "alex" : null, ts });
  it("computes funnel, timing, stated vs actual return", () => {
    const m = computeMetrics([
      ev("aaaaaa", "visit"), ev("bbbbbb", "visit"),
      ev("aaaaaa", "scan_started"), ev("aaaaaa", "menu_interpreted", { origin: "photo" }),
      ev("aaaaaa", "recommendations_generated", { secondsSinceScanStart: 40, engine: "ai" }),
      ev("aaaaaa", "recommendations_generated", { secondsSinceScanStart: 80, engine: "ai" }, "2026-11-05T10:00:00Z"),
      ev("aaaaaa", "dish_selected", { pick: "safe" }),
      ev("aaaaaa", "feedback_submitted", { confident: "yes", useAgain: "yes", wtp: "maybe", rating: 4, comment: "Great" }),
      ev("bbbbbb", "menu_interpreted", { origin: "sample" }),
    ]);
    expect(m.uniqueUsers).toBe(2);
    expect(m.funnel.find((f) => f.key === "recs")!.users).toBe(1);
    expect(m.funnel.find((f) => f.key === "real_menu")!.users).toBe(1);
    expect(m.timeToRecs).toMatchObject({ under60: 1, total: 2 });
    expect(m.repeat).toEqual({ statedYes: 1, actualReturners: 1, eligible: 1 });
    expect(m.sampleOnlyUsers).toBe(1);
    expect(m.invites[0]).toMatchObject({ code: "alex", users: 1, recs: 1 });
    expect(m.comments[0].text).toBe("Great");
  });
});

describe("summarisePassport", () => {
  it("awards nothing without recorded meals", () => {
    const p = summarisePassport([]);
    expect(p.achievements.every((a) => !a.unlocked)).toBe(true);
    expect(p.wrapped).toBeNull();
    expect(p.personality).toBeNull();
  });
  it("derives stamps from journal entries only", () => {
    const base = { restaurant: "R", rating: 5, orderAgain: "yes" as const };
    const p = summarisePassport([
      { ...base, id: "1", date: "2026-10-01", dishName: "Suya", cuisine: "Nigerian", novelty: 2, pickKind: "adventure" },
      { ...base, id: "2", date: "2026-10-02", dishName: "Ramen", cuisine: "Japanese", novelty: 1 },
      { ...base, id: "3", date: "2026-10-03", dishName: "Ramen", cuisine: "japanese", novelty: 1 },
    ]);
    expect(p.cuisines.map((c) => c.name)).toEqual(["Nigerian", "Japanese"]);
    expect(p.achievements.find((a) => a.id === "first-adventure")!.unlocked).toBe(true);
    expect(p.wrapped!.mostRepeatedDish).toBe("Ramen");
    expect(p.personality).not.toBeNull();
  });
});
