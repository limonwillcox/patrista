import { readPath, resolveWorkId } from "./workSlugs";

/** localStorage key for the work (and chapter) the reader last had open. */
export const LAST_READ_KEY = "patrista-last-read";

/** First-time visitors land on the Confessions. */
export const DEFAULT_READ_HREF = "/augustines-confessions";

export type LastRead = { work: string; chapter?: number };

export function saveLastRead(work: string, chapter?: number): void {
  try {
    const entry: LastRead = chapter != null && chapter > 0 ? { work, chapter } : { work };
    localStorage.setItem(LAST_READ_KEY, JSON.stringify(entry));
  } catch {
    /* storage unavailable */
  }
}

export function loadLastRead(): LastRead | null {
  try {
    const raw = JSON.parse(localStorage.getItem(LAST_READ_KEY) || "null") as Partial<LastRead> | null;
    if (!raw || typeof raw.work !== "string" || !raw.work) return null;
    const chapter = typeof raw.chapter === "number" && raw.chapter > 0 ? Math.floor(raw.chapter) : undefined;
    return { work: resolveWorkId(raw.work), chapter };
  } catch {
    return null;
  }
}

/**
 * Where the Read tab goes: the last work viewed (at its last chapter) when it still exists,
 * else the Confessions. `workIds` is the live catalog; while it is loading the stored work is trusted.
 */
export function readTabHref(last: LastRead | null = loadLastRead(), workIds?: Set<string> | null): string {
  if (!last || (workIds && !workIds.has(last.work))) return DEFAULT_READ_HREF;
  const base = readPath(last.work);
  if (last.chapter == null || last.chapter === 1) return base;
  return base + (base.includes("?") ? "&" : "?") + "chapter=" + last.chapter;
}

/** localStorage key for the Bible chapter last open, as its query string (book, chapter, version). */
export const LAST_BIBLE_KEY = "patrista-last-bible";

export function saveLastBible(params: URLSearchParams): void {
  try {
    const keep = new URLSearchParams();
    for (const k of ["book", "chapter", "section", "version"]) {
      const v = params.get(k);
      if (v) keep.set(k, v);
    }
    localStorage.setItem(LAST_BIBLE_KEY, keep.toString());
  } catch {
    /* storage unavailable */
  }
}

/** Where the Bible tab opens: the chapter last read, else the Bible's own default. */
export function bibleHref(): string {
  try {
    const q = localStorage.getItem(LAST_BIBLE_KEY);
    return q ? "/bible?" + q : "/bible";
  } catch {
    return "/bible";
  }
}

