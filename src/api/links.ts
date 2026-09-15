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

export function clearLinksCache(): void {
  linksCache.clear();
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (res.ok) return (await res.json()) as T;
  throw new Error(`${path} failed: ${res.status}`);
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
  const q = new URLSearchParams({
    book: cleanBook,
    chapter: String(chapter),
    verse: String(verse)
  });
  const promise = getJson<VerseLinksResponse>(`/api/links/verse?${q.toString()}`);
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

  const q = new URLSearchParams({ sectionId });
  const promise = getJson<SectionLinksResponse>(`/api/links/section?${q.toString()}`);
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

  const promise = getJson<Link>(`/api/links/excerpt/${encodeURIComponent(id)}`);
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
