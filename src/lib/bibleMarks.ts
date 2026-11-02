import { useEffect, useState } from "react";

/**
 * A reader's own marks in the Bible: highlighted verses (like a pen) and a note per verse. Kept in this
 * browser's storage. Verses are keyed "book.chapter.verse" (KJV numbering, the only text we have).
 */

export const HIGHLIGHT_COLORS = ["gold", "green", "blue", "rose"] as const;
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number];

const KEY = "patrista-bible-highlights-v1";
let cache: Record<string, HighlightColor> | null = null;
const listeners = new Set<() => void>();

export const verseKey = (book: string, chapter: number, verse: number) => book + "." + chapter + "." + verse;

/** The notes key for one verse or a passage; the Connections tab uses the same keys. */
export function verseNoteId(book: string, chapter: number, from: number, to = from): string {
  return "bible-v-" + book + "." + chapter + "." + from + (to !== from ? "-" + to : "");
}

function load(): Record<string, HighlightColor> {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, HighlightColor>;
  } catch {
    cache = {};
  }
  return cache;
}

/** Highlight verses from..to of a chapter in a colour, or clear them with null. */
export function setHighlight(book: string, chapter: number, from: number, to: number, color: HighlightColor | null): void {
  const next = { ...load() };
  for (let v = from; v <= to; v++) {
    if (color) next[verseKey(book, chapter, v)] = color;
    else delete next[verseKey(book, chapter, v)];
  }
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private window: kept for this visit only */
  }
  listeners.forEach((f) => f());
}

/** All highlights, updating when any change. */
export function useHighlights(): Record<string, HighlightColor> {
  const [, rerender] = useState(0);
  useEffect(() => {
    const f = () => rerender((x) => x + 1);
    listeners.add(f);
    return () => {
      listeners.delete(f);
    };
  }, []);
  return load();
}
