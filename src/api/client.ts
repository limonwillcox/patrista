import type { Catalog, Passage, WorkOutline } from "../../server/types";
import { fetchRemoteBibleVerses } from "./bibleApi";
import { bibleTextPath, isLocalTextTranslation } from "./bibleTranslations";

export function jsonFallbackPath(path: string): string | null {
  const bare = path.split("?")[0];
  if (bare.endsWith(".json")) return null;
  return bare + ".json";
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (res.ok) return res.json() as Promise<T>;
  const fallbackPath = jsonFallbackPath(path);
  if (fallbackPath) {
    const fallback = await fetch(fallbackPath);
    if (fallback.ok) return fallback.json() as Promise<T>;
  }
  throw new Error(path + " failed: " + res.status);
}

/**
 * Extensionless in dev (Vite API). The built .json file on a static host, so GitHub Pages is not asked
 * for /api/works/<id> first (a directory there: 301, then 404) on every cold landing.
 */
export function staticApiPath(path: string, dev = import.meta.env.DEV): string {
  if (dev) return path;
  return jsonFallbackPath(path) ?? path;
}

export function fetchCatalog(): Promise<Catalog> {
  return getJson<Catalog>(staticApiPath("/api/catalog"));
}

/** Works and chapters never change while the page is open, so each is fetched once. */
const memo = new Map<string, Promise<unknown>>();
function once<T>(key: string, load: () => Promise<T>): Promise<T> {
  let p = memo.get(key) as Promise<T> | undefined;
  if (!p) {
    p = load();
    p.catch(() => memo.delete(key));
    memo.set(key, p);
  }
  return p;
}

export function fetchWork(id: string): Promise<WorkOutline> {
  return once("w:" + id, () => getJson<WorkOutline>(staticApiPath("/api/works/" + encodeURIComponent(id))));
}


/** Extensionless in dev (Vite API). The built file on a static host. */
export function chapterFetchPath(workId: string, chapter: number, dev = import.meta.env.DEV): string {
  return staticApiPath("/api/works/" + encodeURIComponent(workId) + "/chapters/" + chapter, dev);
}

export function fetchChapter(workId: string, chapter: number): Promise<Passage> {
  return once("c:" + workId + ":" + chapter, () => getJson<Passage>(chapterFetchPath(workId, chapter)));
}

export type BibleManifestBook = { id: string; name: string; chapters: number };

export type BibleCommentaryHit = {
  authorId: string;
  authorName: string;
  workTitle: string;
  tag: {
    id: string;
    work: string;
    chapter: number;
    snippet: string;
  };
};

export type BibleChapterPayload = {
  book: BibleManifestBook;
  chapter: number;
  verses: string[];
  /** The translators' margin notes on this chapter, by verse (KJV). */
  notes?: Record<number, string>;
  sections?: { id: string; label: string; verses: { start: number; end: number } }[];
  comments: BibleCommentaryHit[];
};

export function fetchBibleManifest(): Promise<BibleManifestBook[]> {
  return getJson<BibleManifestBook[]>(staticApiPath("/api/bible/manifest"));
}

export async function fetchBibleChapter(
  book: string,
  chapter: number,
  opts?: { section?: string; from?: number; to?: number; translation?: string }
): Promise<BibleChapterPayload> {
  const q = new URLSearchParams();
  if (opts?.section) q.set("section", opts.section);
  if (opts?.from != null) q.set("from", String(opts.from));
  if (opts?.to != null) q.set("to", String(opts.to));
  const qs = q.toString();

  const translation = opts?.translation || "kjv";
  // A translation kept in the repo: its chapter file, fetched beside the KJV chapter (no API key, no bibleApi).
  const localText = isLocalTextTranslation(translation)
    ? once("bt:" + translation + ":" + book + ":" + chapter, () =>
        getJson<{ verses: string[] }>(staticApiPath(bibleTextPath(translation, book, chapter)))
      )
    : null;

  // On the static site the chapter file ignores the query either way; ask for it directly.
  const basePayload = await getJson<BibleChapterPayload>(
    staticApiPath("/api/bible/" + encodeURIComponent(book) + "/" + chapter + (qs ? "?" + qs : ""))
  );

  if (translation === "kjv") {
    return basePayload;
  }
  if (localText) {
    // The margin notes belong to the KJV text.
    return { ...basePayload, notes: undefined, verses: (await localText).verses };
  }

  try {
    const remoteVerses = await fetchRemoteBibleVerses(translation, book, chapter);
    return {
      ...basePayload,
      // The margin notes belong to the KJV text.
      notes: undefined,
      verses: remoteVerses
    };
  } catch (err) {
    console.error("Failed to load translation:", err);
    throw err;
  }
}

