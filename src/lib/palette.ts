import type { Child } from "./dossier";

/**
 * The six crayons a child can belong to; new children get them in this order. Apricot
 * (`--action`) is reserved for controls and AI, so it is never a child's colour.
 * Keep these values identical to the matching tokens in `src/styles.css`.
 */
export const CRAYONS = ["sky", "lilac", "aqua", "bubblegum", "sage", "tomato"] as const;
export type Crayon = (typeof CRAYONS)[number];

export const CRAYON_HEX: Record<Crayon | "sun", { body: string; soft: string; ink: string }> = {
  sky: { body: "#4f9df7", soft: "#ddebfe", ink: "#1d5aa6" },
  lilac: { body: "#e0a2cf", soft: "#f8e6f1", ink: "#8a3a72" },
  tomato: { body: "#f2643a", soft: "#fde4db", ink: "#9c3214" },
  aqua: { body: "#4fc2b9", soft: "#daf2ef", ink: "#1d6660" },
  sage: { body: "#5fa98a", soft: "#dcefe6", ink: "#2c6a51" },
  sun: { body: "#f2c94c", soft: "#fdf3d3", ink: "#7a5a06" },
  bubblegum: { body: "#f59ac6", soft: "#fde5f0", ink: "#9e2f67" },
};

/** Every child also gets a buddy shape so colour is never the only way to tell them apart. */
export const SHAPES = ["flower", "star", "cloud", "blob", "burst", "bean"] as const;
export type BuddyShape = (typeof SHAPES)[number];

/**
 * Colours stored before this design system (and any hex a parent picked) map onto the
 * nearest crayon, so existing rows keep their meaning: blue stays blue, purple stays purple.
 */
const LEGACY: Record<string, Crayon> = {
  "#3267d4": "sky",
  "#b368ec": "lilac",
  "#b4a2f2": "lilac",
  "#c2703d": "tomato",
  "#2e7d74": "sage",
  "#f0ab3c": "tomato",
  "#8db44b": "sage",
};

function nearestCrayon(hex: string): Crayon | null {
  const clean = hex.trim().toLowerCase();
  if (clean in LEGACY) return LEGACY[clean]!;
  const match = CRAYONS.find((name) => CRAYON_HEX[name].body === clean);
  if (match) return match;
  const value = Number.parseInt(clean.replace("#", ""), 16);
  if (Number.isNaN(value) || clean.length !== 7) return null;
  const rgb = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  let best: Crayon = "sky";
  let bestDistance = Infinity;
  for (const name of CRAYONS) {
    const v = Number.parseInt(CRAYON_HEX[name].body.slice(1), 16);
    const c = [(v >> 16) & 255, (v >> 8) & 255, v & 255];
    const distance = c.reduce((sum, channel, i) => sum + (channel - rgb[i]!) ** 2, 0);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = name;
    }
  }
  return best;
}

export type ChildLook = {
  crayon: Crayon;
  shape: BuddyShape;
  body: string;
  soft: string;
  ink: string;
};

/** The look of a child: crayon from their stored colour, shape from their place in the family. */
export function lookFor(
  child: Pick<Child, "theme_color"> | null | undefined,
  index = 0,
): ChildLook {
  const crayon = (child && nearestCrayon(child.theme_color)) ?? CRAYONS[index % CRAYONS.length]!;
  const shape = SHAPES[index % SHAPES.length]!;
  return { crayon, shape, ...CRAYON_HEX[crayon] };
}

/**
 * Memory cards are tinted by what kind of moment they hold; each kind has its own tint.
 * Interest and friendship share a tint with the Interests and Friends cards in the file.
 */
export const CATEGORY_TINT: Record<string, string> = {
  courage: "bg-sage-soft",
  dream: "bg-lilac-soft",
  fear: "bg-sky-soft",
  friendship: "bg-coral-soft",
  "first-time": "bg-peach-soft",
  interest: "bg-sun-soft",
  other: "bg-cloud",
};

/** Selected filter pills use the vivid version of each category's tint. */
export const CATEGORY_ACTIVE: Record<string, string> = {
  courage: "bg-sage text-ink hover:bg-sage",
  dream: "bg-lilac text-lilac-ink hover:bg-lilac",
  fear: "bg-sky text-paper hover:bg-sky",
  friendship: "bg-coral text-coral-ink hover:bg-coral",
  "first-time": "bg-peach text-peach-ink hover:bg-peach",
  interest: "bg-sun text-sun-ink hover:bg-sun",
  other: "bg-line text-ink hover:bg-line",
};
