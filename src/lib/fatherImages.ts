import manifest from "../generated/fatherImageManifest.json";

export type FatherImageCredit = {
  artist: string;
  license: string;
  licenseUrl: string;
  source: string;
  attributionRequired: boolean;
};

export type FatherImageVariant = {
  src: string;
  srcset: string;
  width: number;
  height: number;
};

export type FatherImage = {
  alt: string;
  tile: FatherImageVariant;
  hero: FatherImageVariant;
  credit: FatherImageCredit | null;
};

export type FatherImageMap = Record<string, FatherImage>;

export const FATHER_IMAGES = manifest as FatherImageMap;

/** Fathers without a portrait show Christ Pantocrator (Sinai) instead. */
export function fatherImage(id: string): FatherImage | null {
  return fatherImageFrom(FATHER_IMAGES, id);
}

export function fatherImageFrom(images: Record<string, FatherImage>, id: string): FatherImage | null {
  const own = images[id];
  if (own) return own;
  const fallback = images.pantocrator;
  return fallback ? { ...fallback, alt: "Christ Pantocrator" } : null;
}

export const TILE_SIZES = "120px";
export const HERO_SIZES = "(max-width: 735px) 92vw, (max-width: 1100px) 360px, 489px";

/** Heroes are cropped 489×336 (landscape). Link cards crop toward 1.91:1; below this width the site image is used. */
const SHARE_ASPECT = 336 / 489;
const MIN_SHARE_WIDTH = 240;

function heroPixelSize(hero: FatherImageVariant): { width: number; height: number } {
  const widths = [...hero.srcset.matchAll(/\s(\d+)w/g)].map((m) => Number(m[1]));
  const width = widths.length ? Math.max(...widths) : hero.width;
  return { width, height: Math.max(1, Math.round(width * SHARE_ASPECT)) };
}

/** The Father's own portrait for a link preview. No portrait, or a tiny one, means the site image. */
export function authorShareImage(
  origin: string,
  authorId: string
): { url: string; width: number; height: number } | null {
  const hero = FATHER_IMAGES[authorId]?.hero;
  if (!hero?.src) return null;
  const size = heroPixelSize(hero);
  if (size.width < MIN_SHARE_WIDTH) return null;
  return { url: origin.replace(/\/$/, "") + hero.src, width: size.width, height: size.height };
}
