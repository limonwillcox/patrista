import type {
  BibleRef,
  Canon,
  CenturyNode,
  FatherNode,
  Link,
  LinkStatus,
  Provenance,
  TestamentNode,
  WorkNode,
  BookNode
} from "../links/types";
import { verseResponseFromPack, type ChapterLinksPack } from "../links/pack";

export type {
  BibleRef,
  Canon,
  CenturyNode,
  FatherNode,
  Link,
  LinkStatus,
  Provenance,
  TestamentNode,
  WorkNode,
  BookNode
};

export type VerseCounts = {
  links: number;
  total: number;
  centuries: number;
  fathers: number;
  works: number;
};

export type VerseLinksResponse = {
  ref: BibleRef;
  tree: CenturyNode[];
  counts: VerseCounts;
};

export type SectionCounts = {
  links: number;
  total: number;
  fathers: number;
  books: number;
  refs: number;
  canons?: number;
};

export type SectionLinksResponse = {
  sectionId: string;
  tree: TestamentNode[];
  counts: SectionCounts;
};

export const linksCache = new Map<string, Promise<unknown>>();
const packCache = new Map<string, Promise<ChapterLinksPack | null>>();

export function clearLinksCache(): void {
  linksCache.clear();
  packCache.clear();
}

function apiBase(): string {
  return String(import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");
}

function apiUrl(path: string): string {
  return apiBase() + path;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (res.ok) return (await res.json()) as T;
  throw new Error(`${path} failed: ${res.status}`);
}

async function tryJson<T>(path: string): Promise<T | null> {
  const res = await fetch(path);
  if (!res.ok) return null;
  return (await res.json()) as T;
}

function loadChapterPack(book: string, chapter: number): Promise<ChapterLinksPack | null> {
  const clean = book.trim().toLowerCase();
  const key = clean + ":" + chapter;
  const cached = packCache.get(key);
  if (cached) return cached;

  const promise = (async () => {
    const path = apiUrl(`/api/links/chapter/${encodeURIComponent(clean)}/${chapter}.json`);
    const pack = await tryJson<ChapterLinksPack>(path);
    if (!pack) packCache.delete(key);
    return pack;
  })();

  packCache.set(key, promise);
  return promise;
}

export function verseCacheKey(book: string, chapter: number, verse: number): string {
  return `verse:${book.trim().toLowerCase()}.${chapter}.${verse}`;
}

export function sectionCacheKey(sectionId: string): string {
  return `section:${sectionId.trim()}`;
}

export function excerptCacheKey(id: string): string {
  return `excerpt:${id.trim()}`;
}

export function fetchVerseLinks(
  book: string,
  chapter: number,
  verse: number
): Promise<VerseLinksResponse>;
export function fetchVerseLinks(params: {
  book: string;
  chapter: number;
  verse: number;
}): Promise<VerseLinksResponse>;
export function fetchVerseLinks(
  bookOrParams: string | { book: string; chapter: number; verse: number },
  maybeChapter?: number,
  maybeVerse?: number
): Promise<VerseLinksResponse> {
  const { book, chapter, verse } =
    typeof bookOrParams === "string"
      ? { book: bookOrParams, chapter: maybeChapter!, verse: maybeVerse! }
      : bookOrParams;

  const key = verseCacheKey(book, chapter, verse);
  const cached = linksCache.get(key);
  if (cached) return cached as Promise<VerseLinksResponse>;

  const cleanBook = book.trim().toLowerCase();
  const promise = (async () => {
    const pack = await loadChapterPack(cleanBook, chapter);
    if (pack) return verseResponseFromPack(pack, verse);
    const q = new URLSearchParams({
      book: cleanBook,
      chapter: String(chapter),
      verse: String(verse)
    });
    return getJson<VerseLinksResponse>(apiUrl(`/api/links/verse?${q.toString()}`));
  })();

  promise.catch(() => {
    linksCache.delete(key);
  });
  linksCache.set(key, promise);
  return promise;
}

export function fetchSectionLinks(sectionId: string): Promise<SectionLinksResponse>;
export function fetchSectionLinks(params: { sectionId: string }): Promise<SectionLinksResponse>;
export function fetchSectionLinks(
  sectionIdOrParams: string | { sectionId: string }
): Promise<SectionLinksResponse> {
  const sectionId =
    typeof sectionIdOrParams === "string"
      ? sectionIdOrParams
      : sectionIdOrParams.sectionId;

  const key = sectionCacheKey(sectionId);
  const cached = linksCache.get(key);
  if (cached) return cached as Promise<SectionLinksResponse>;

  const promise = (async () => {
    const staticPath = apiUrl(
      `/api/links/section/${encodeURIComponent(sectionId.trim())}.json`
    );
    const fromPack = await tryJson<SectionLinksResponse>(staticPath);
    if (fromPack) return fromPack;
    const q = new URLSearchParams({ sectionId });
    return getJson<SectionLinksResponse>(apiUrl(`/api/links/section?${q.toString()}`));
  })();

  promise.catch(() => {
    linksCache.delete(key);
  });
  linksCache.set(key, promise);
  return promise;
}

export function fetchExcerpt(id: string): Promise<Link>;
export function fetchExcerpt(params: { id: string }): Promise<Link>;
export function fetchExcerpt(idOrParams: string | { id: string }): Promise<Link> {
  const id = typeof idOrParams === "string" ? idOrParams : idOrParams.id;

  const key = excerptCacheKey(id);
  const cached = linksCache.get(key);
  if (cached) return cached as Promise<Link>;

  const promise = (async () => {
    const encoded = encodeURIComponent(id.trim());
    const fromStatic = await tryJson<Link>(apiUrl(`/api/links/excerpt/${encoded}.json`));
    if (fromStatic) return fromStatic;
    return getJson<Link>(apiUrl(`/api/links/excerpt/${encoded}`));
  })();

  promise.catch(() => {
    linksCache.delete(key);
  });
  linksCache.set(key, promise);
  return promise;
}

export const fetchLinkExcerpt = fetchExcerpt;
export const fetchLinkById = fetchExcerpt;
export const fetchLinksForVerse = fetchVerseLinks;
export const fetchLinksForSection = fetchSectionLinks;
