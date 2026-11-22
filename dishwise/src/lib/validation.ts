import { z } from "zod";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_PDF_BYTES = 10 * 1024 * 1024;

export type SniffedType = "image/jpeg" | "image/png" | "image/webp" | "image/gif" | "application/pdf";

/** Identify a file by its first bytes rather than trusting the browser's label. */
export function sniffFileType(bytes: Uint8Array): SniffedType | null {
  const b = bytes;
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return "image/gif";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "application/pdf";
  return null;
}

const str = (max: number) => z.string().trim().max(max);

export const MenuItemInput = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,20}$/),
  name: str(120).min(1),
  description: str(400).optional(),
  price: z.number().min(0).max(1000).nullable().optional(),
  section: str(60).optional(),
  menuTags: z.array(str(6)).max(8).optional(),
});

export const MenuInput = z.object({
  id: z.string().max(64),
  restaurantName: str(80).optional(),
  cuisineHint: str(60).optional(),
  items: z.array(MenuItemInput).min(1).max(150),
  origin: z.enum(["sample", "text", "photo", "pdf"]),
  extractedBy: z.enum(["ai", "parser", "sample"]),
  warnings: z.array(z.string().max(300)).max(10).optional(),
  createdAt: z.string().max(40),
});

export const PreferencesInput = z.object({
  dietary: z.array(z.enum(["vegetarian", "vegan", "pescatarian", "halal", "no-pork", "no-alcohol", "gluten-free", "dairy-free", "nut-allergy", "shellfish-allergy"])).max(10),
  likes: z.array(str(30)).max(20),
  dislikes: z.array(str(30)).max(20),
  spice: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  budget: z.enum(["easy", "mid", "treat"]).nullable(),
  adventure: z.enum(["familiar", "balanced", "adventurous"]),
  fitness: z.enum(["none", "protein", "lighter", "balanced"]),
  onboarded: z.boolean(),
});

export const RecommendRequest = z.object({
  menu: MenuInput,
  preferences: PreferencesInput,
  triedCuisines: z.array(str(60)).max(50).default([]),
  useAi: z.boolean().default(true),
});
