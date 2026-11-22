/**
 * Where validation events are stored.
 *
 *  - Supabase (recommended for deployed tests): set SUPABASE_URL and
 *    SUPABASE_SERVICE_ROLE_KEY. Uses the REST API, so no extra dependency.
 *  - Local file (default for local development): .data/events.ndjson
 *    On serverless hosts (e.g. Vercel) the file system is temporary, so the
 *    dashboard warns that data will not persist.
 */
import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { StoredEvent } from "./events";

export type StoreKind = "supabase" | "file";

export function storeKind(): StoreKind {
  return process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? "supabase" : "file";
}

export function storeIsEphemeral(): boolean {
  return storeKind() === "file" && Boolean(process.env.VERCEL);
}

function filePath() {
  const dir = process.env.VERCEL ? "/tmp/dishwise" : path.join(process.cwd(), ".data");
  return { dir, file: path.join(dir, "events.ndjson") };
}

function supabase(pathname: string) {
  const base = process.env.SUPABASE_URL!.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return {
    url: `${base}/rest/v1/${pathname}`,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  };
}

export async function saveEvent(event: StoredEvent): Promise<void> {
  if (storeKind() === "supabase") {
    const { url, headers } = supabase("dishwise_events");
    const res = await fetch(url, { method: "POST", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify(event) });
    if (!res.ok) throw new Error(`Supabase insert failed (${res.status})`);
    return;
  }
  const { dir, file } = filePath();
  await fs.mkdir(dir, { recursive: true });
  await fs.appendFile(file, JSON.stringify(event) + "\n", "utf8");
}

export async function loadEvents(limit = 50_000): Promise<StoredEvent[]> {
  if (storeKind() === "supabase") {
    const out: StoredEvent[] = [];
    const page = 1000;
    for (let offset = 0; offset < limit; offset += page) {
      const { url, headers } = supabase(`dishwise_events?select=*&order=ts.asc&limit=${page}&offset=${offset}`);
      const res = await fetch(url, { headers, cache: "no-store" });
      if (!res.ok) throw new Error(`Supabase read failed (${res.status})`);
      const rows = (await res.json()) as StoredEvent[];
      out.push(...rows);
      if (rows.length < page) break;
    }
    return out;
  }
  const { file } = filePath();
  try {
    const raw = await fs.readFile(file, "utf8");
    return raw
      .split("\n")
      .filter(Boolean)
      .slice(-limit)
      .flatMap((l) => {
        try {
          return [JSON.parse(l) as StoredEvent];
        } catch {
          return [];
        }
      });
  } catch {
    return [];
  }
}
