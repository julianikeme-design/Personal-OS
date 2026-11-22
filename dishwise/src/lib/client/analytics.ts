"use client";
import type { EventName, EventProps } from "../analytics/events";
import { getMeta, getScan } from "./store";

/** Send a privacy-conscious product event. Never throws, never blocks the UI. */
export function track(name: EventName, props: EventProps = {}) {
  try {
    const meta = getMeta();
    const body = JSON.stringify({ name, props, anonId: meta.anonId, scanId: getScan()?.id ?? null, invite: meta.invite });
    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
      if (ok) return;
    }
    void fetch("/api/events", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
  } catch {
    /* analytics must never break the product */
  }
}

export function secondsSince(iso?: string): number | null {
  if (!iso) return null;
  return Math.round((Date.now() - new Date(iso).getTime()) / 1000);
}
