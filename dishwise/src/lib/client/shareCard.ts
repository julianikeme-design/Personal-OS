"use client";
/**
 * Renders a shareable image card on a canvas. Nothing is uploaded or posted:
 * the user downloads it or shares it through their phone's own share sheet.
 */
import type { JournalEntry } from "../types";

export type CardFormat = "story" | "square";
export interface CardOptions {
  format: CardFormat;
  showRestaurant: boolean;
  showRating: boolean;
  showPhoto: boolean;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

export async function renderShareCard(entry: JournalEntry, opts: CardOptions): Promise<Blob | null> {
  const W = 1080;
  const H = opts.format === "story" ? 1920 : 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  await document.fonts?.ready;
  const display = getComputedStyle(document.body).getPropertyValue("--font-fraunces") ? "Fraunces, Georgia, serif" : "Georgia, serif";

  ctx.fillStyle = "#faf6f0";
  ctx.fillRect(0, 0, W, H);

  const pad = 90;
  let y = pad;
  const photoH = opts.format === "story" ? 900 : 430;

  if (opts.showPhoto && entry.photo) {
    const img = await loadImage(entry.photo);
    if (img) {
      const scale = Math.max((W - pad * 2) / img.width, photoH / img.height);
      const sw = (W - pad * 2) / scale;
      const sh = photoH / scale;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(pad, y, W - pad * 2, photoH, 48);
      ctx.clip();
      ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, pad, y, W - pad * 2, photoH);
      ctx.restore();
      y += photoH + 70;
    }
  } else {
    ctx.fillStyle = "#b9532f";
    ctx.beginPath();
    ctx.arc(W / 2, y + (opts.format === "story" ? 260 : 110), opts.format === "story" ? 200 : 90, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#faf6f0";
    ctx.font = `600 ${opts.format === "story" ? 180 : 90}px ${display}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(entry.dishName.charAt(0).toUpperCase(), W / 2, y + (opts.format === "story" ? 270 : 115));
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    y += opts.format === "story" ? 620 : 280;
  }

  ctx.fillStyle = "#b9532f";
  ctx.font = "600 34px Inter, system-ui, sans-serif";
  if ("letterSpacing" in ctx) ctx.letterSpacing = "6px";
  ctx.fillText(entry.pickKind === "adventure" ? "TRIED SOMETHING NEW" : "DINING MEMORY", pad, y);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  y += 90;

  ctx.fillStyle = "#1f1a16";
  ctx.font = `600 ${opts.format === "story" ? 92 : 76}px ${display}`;
  for (const l of wrap(ctx, entry.dishName, W - pad * 2)) {
    ctx.fillText(l, pad, y);
    y += opts.format === "story" ? 104 : 86;
  }

  ctx.fillStyle = "#6d635a";
  ctx.font = "400 40px Inter, system-ui, sans-serif";
  const meta = [opts.showRestaurant ? entry.restaurant : null, entry.cuisine ?? null].filter(Boolean).join(" · ");
  if (meta) {
    y += 10;
    ctx.fillText(meta, pad, y);
    y += 70;
  }

  if (opts.showRating) {
    ctx.fillStyle = "#b9532f";
    ctx.font = "400 64px system-ui, sans-serif";
    ctx.fillText("★".repeat(entry.rating) + "☆".repeat(5 - entry.rating), pad, y + 20);
  }

  ctx.fillStyle = "#1f1a16";
  ctx.font = `600 44px ${display}`;
  ctx.fillText("Dishwise", pad, H - pad);
  ctx.fillStyle = "#6d635a";
  ctx.font = "400 32px Inter, system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("Know what to order.", W - pad, H - pad);

  return await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}
