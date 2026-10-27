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
