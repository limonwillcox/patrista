import type { BibleRef } from "./types";

/** locStart / locEnd = chapter * 1_000_000 + verse. */
export function locOf(chapter: number, verse: number): number {
  return chapter * 1_000_000 + verse;
}

export function locsOverlap(a0: number, a1: number, b0: number, b1: number): boolean {
  return a0 <= b1 && b0 <= a1;
}

export function refOverlapsVerse(
  ref: Pick<BibleRef, "bookId" | "locStart" | "locEnd">,
  bookId: string,
  chapter: number,
  verse: number
): boolean {
  if (ref.bookId !== bookId) return false;
  const loc = locOf(chapter, verse);
  return ref.locStart <= loc && loc <= ref.locEnd;
}

/** Century = ceil(deathYear / 100) clamped to 1–6. */
export function centuryFromDeathYear(deathYear: number): number {
  const c = Math.ceil(deathYear / 100);
  return Math.min(6, Math.max(1, c));
}
