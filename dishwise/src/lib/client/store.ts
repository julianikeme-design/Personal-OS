"use client";
/**
 * On-device storage (localStorage) with React hooks.
 * Guest-first: preferences, the current scan and the journal stay on this device.
 */
import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_PREFERENCES } from "../preferences";
import type { JournalEntry, Preferences, ScanSession } from "../types";

export const KEYS = {
  prefs: "dw.prefs.v1",
  scan: "dw.scan.v1",
  journal: "dw.journal.v1",
  meta: "dw.meta.v1",
} as const;

export interface Meta {
  anonId: string;
  firstSeen: string;
  invite: string | null;
  lastVisitDay: string | null;
}

const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: unknown }>();

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    raw = null;
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value: T = fallback;
  if (raw) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }
  cache.set(key, { raw, value });
  return value;
}

export function write<T>(key: string, value: T | null): boolean {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
    listeners.forEach((l) => l());
    return true;
  } catch {
    // Quota exceeded or storage blocked (private mode).
    listeners.forEach((l) => l());
    return false;
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = () => cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function useStored<T>(key: string, fallback: T): [T, (v: T | null) => boolean] {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key, fallback),
    () => fallback,
  );
  const set = useCallback((v: T | null) => write(key, v), [key]);
  return [value, set];
}

const noopSubscribe = () => () => {};
/** false during server render & hydration, true afterwards. */
export function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

const EMPTY_JOURNAL: JournalEntry[] = [];

export const usePreferences = () => useStored<Preferences>(KEYS.prefs, DEFAULT_PREFERENCES);
export const useScan = () => useStored<ScanSession | null>(KEYS.scan, null);
export const useJournal = () => useStored<JournalEntry[]>(KEYS.journal, EMPTY_JOURNAL);

export const getPreferences = () => read<Preferences>(KEYS.prefs, DEFAULT_PREFERENCES);
export const getScan = () => read<ScanSession | null>(KEYS.scan, null);
export const getJournal = () => read<JournalEntry[]>(KEYS.journal, EMPTY_JOURNAL);

export function updateScan(patch: Partial<ScanSession>) {
  const cur = getScan();
  if (!cur) return;
  write(KEYS.scan, { ...cur, ...patch });
}

export function startNewScan(): ScanSession {
  const s: ScanSession = { id: randomId(), startedAt: new Date().toISOString() };
  write(KEYS.scan, s);
  return s;
}

export function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID().replace(/-/g, "");
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getMeta(): Meta {
  const existing = read<Meta | null>(KEYS.meta, null);
  if (existing?.anonId) return existing;
  const meta: Meta = { anonId: randomId(), firstSeen: new Date().toISOString(), invite: null, lastVisitDay: null };
  write(KEYS.meta, meta);
  return meta;
}

export function setMeta(patch: Partial<Meta>) {
  write(KEYS.meta, { ...getMeta(), ...patch });
}

/** Cuisines the user has actually recorded in their journal. */
export function triedCuisines(journal: JournalEntry[]): string[] {
  return [...new Set(journal.map((j) => j.cuisine).filter((c): c is string => Boolean(c)))];
}

export function clearAllLocalData() {
  Object.values(KEYS).forEach((k) => {
    try {
      window.localStorage.removeItem(k);
    } catch {}
  });
  cache.clear();
  listeners.forEach((l) => l());
}
