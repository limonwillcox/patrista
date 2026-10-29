import { parseQuery, searchKeyword } from "../../server/query";
import type { Catalog, Passage, SearchHit, Query, WorkOutline, WorkPayload } from "../../server/types";
import { fetchRemoteBibleVerses } from "./bibleApi";

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

export function fetchWork(id: string): Promise<WorkOutline> {
  return getJson<WorkOutline>(staticApiPath("/api/works/" + encodeURIComponent(id)));
}

/** Full passages for the static-site search fallback. The reader does not call this. */
export function fetchWorkText(id: string): Promise<WorkPayload> {
  return getJson<WorkPayload>("/api/works/" + encodeURIComponent(id) + "/text");
}

/** Extensionless in dev (Vite API). The built file on a static host. */
export function chapterFetchPath(workId: string, chapter: number, dev = import.meta.env.DEV): string {
  return staticApiPath("/api/works/" + encodeURIComponent(workId) + "/chapters/" + chapter, dev);
}

export function fetchChapter(workId: string, chapter: number): Promise<Passage> {
  return getJson<Passage>(chapterFetchPath(workId, chapter));
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
  sections?: { id: string; label: string; verses: { start: number; end: number } }[];
  comments: BibleCommentaryHit[];
};

export function fetchBibleManifest(): Promise<BibleManifestBook[]> {
  return getJson<BibleManifestBook[]>("/api/bible/manifest");
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

  const basePayload = await getJson<BibleChapterPayload>(
    "/api/bible/" + encodeURIComponent(book) + "/" + chapter + (qs ? "?" + qs : "")
  );

  const translation = opts?.translation || "kjv";
  if (translation === "kjv") {
    return basePayload;
  }

  try {
    const remoteVerses = await fetchRemoteBibleVerses(translation, book, chapter);
    return {
      ...basePayload,
      verses: remoteVerses
    };
  } catch (err) {
    console.error("Failed to load translation:", err);
    throw err;
  }
}

export async function fetchSearch(q: string): Promise<{ query: Query; hits: SearchHit[] }> {
  const res = await fetch("/api/search?q=" + encodeURIComponent(q));
  if (res.ok) return res.json() as Promise<{ query: Query; hits: SearchHit[] }>;
  const catalog = await fetchCatalog();
  const query = parseQuery(q, catalog);
  if (query.type !== "keyword") return { query, hits: [] as SearchHit[] };
  const passages: Passage[] = [];
  for (const w of catalog.works) {
    try {
      const payload = await fetchWorkText(w.id);
      passages.push(...payload.chapters);
      continue;
    } catch {
      /* outline-only deploy: read each chapter file */
    }
    try {
      const outline = await fetchWork(w.id);
      for (const ch of outline.chapters) {
        try {
          passages.push(await fetchChapter(w.id, ch.chapter));
        } catch {
          /* skip a missing chapter */
        }
      }
    } catch {
      /* skip missing work JSON */
    }
  }
  return { query, hits: searchKeyword(query.q, catalog, passages) };
}
