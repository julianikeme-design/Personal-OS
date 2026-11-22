"use client";
import type { PickKind } from "../types";
import { secondsSince, track } from "./analytics";
import { getScan, updateScan } from "./store";

export function chooseDish(itemId: string, pick: PickKind | null) {
  const scan = getScan();
  if (!scan?.menu) return;
  updateScan({ chosenItemId: itemId, chosenFromPick: pick, chosenAt: new Date().toISOString(), feedbackDone: false });
  const insight = scan.recs?.insights[itemId];
  track("dish_selected", {
    pick: pick ?? "",
    engine: scan.recs?.engine ?? "none",
    novelty: insight?.novelty ?? null,
    origin: scan.menu.origin,
    secondsSinceScanStart: secondsSince(scan.startedAt),
  });
}
