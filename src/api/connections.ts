/**
 * The Connections data, precomputed by scripts/connections/*.py into public/connections/.
 * See data/connections/README.md for how each signal is made.
 *
 * A verse id ("vid") is bookNumber * 1_000_000 + chapter * 1000 + verse, with books numbered in the
 * order of Bibles/KJV/manifest.json (Genesis 1 … Revelation 66).
 */

import { PACKED, fetchPacked } from "./packed";
/** c = the other Testament, s = the same Testament (outside the verse's own story). */
export type LinkKind = "c" | "s";
/** [other verse, score, kind, the shared Hebrew/Greek words that carry the link] */
export type WordLink = [number, number, LinkKind, string[]];
/** [other verse, how many Fathers cite both, those Fathers, "Father: Work" list, an excerpt (top ones only)] */
export type WitnessLink = [number, number, string[], string[], string?];
/** A typological link recorded from the Fathers: [entry, label, Fathers, citations, a0, a1, b0, b1] */
export type CuratedLink = [string, string, string[], string[], number, number, number, number];
/** A Father who cites this verse: [Father, paragraphs citing it, a few of the works, an excerpt (top ones only)] */
export type FatherCite = [string, number, string[], string?];
export type VerseConnections = { l?: WordLink[]; w?: WitnessLink[]; f?: FatherCite[] };
export type ChapterConnections = { v: Record<string, VerseConnections>; c: CuratedLink[] };

/** Per Hebrew/Greek word: verses with it, related words ([code, "lxx" | "lxx-of" | "deriv" | "root-of"]). */
export type WordInfo = { n: number; o: number[]; r?: [string, string][] };

export type MetaBook = { id: string; name: string; chapters: number; n: number; group: string };
export type Meta = { books: MetaBook[]; groups: { id: string; label: string }[] };

const BASE = "/connections/";
const cache = new Map<string, Promise<unknown>>();

function getJson<T>(path: string): Promise<T | null> {
  let p = cache.get(path);
  if (!p) {
    p = fetch(BASE + path)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
    cache.set(path, p);
  }
  return p as Promise<T | null>;
}

export const fetchMeta = () => getJson<Meta>("meta.json");
/** Per Hebrew/Greek word: the English word the KJV most often uses for it. */
export const fetchGlosses = () => getJson<Record<string, string>>("glosses.json");
/** A type the Fathers draw: what it means, their words ("Father, *Work* n — “quote”"), and all its passages. */
export type TypeEntry = {
  id: string;
  label: string;
  def: string;
  christ: string;
  where: string[];
  ranges: [number, number][];
  /** The group it is filed under: people, events, things-and-places, the-law-rites-feasts-sacrifices, figures-in-the-prophets-and-psalms or gospel-scenes-read-as-figures. */
  kind?: string;
  /** The reader paragraph of each quotation in `where`, in the same order (null where none was found). */
  links?: ({ label: string; href: string } | null)[];
};
export const fetchTypes = () => getJson<TypeEntry[]>("types.json");
/** Per verse id: how many times the Fathers in the library cite it. */
export const fetchCited = () => getJson<Record<string, number>>("cited.json");
export const fetchChapterConnections = (book: string, chapter: number): Promise<ChapterConnections | null> =>
  PACKED
    ? fetchPacked<ChapterConnections>("/connections/verse", book, chapter).then(
        (hit) => hit ?? getJson<ChapterConnections>("verse/" + encodeURIComponent(book) + "/" + chapter + ".json")
      )
    : getJson<ChapterConnections>("verse/" + encodeURIComponent(book) + "/" + chapter + ".json");

const WORD_BUCKET = 250;
export async function fetchWordInfo(code: string): Promise<WordInfo | null> {
  const m = code.match(/^([GH])(\d+)$/);
  if (!m) return null;
  const all = await getJson<Record<string, WordInfo>>("word/" + m[1] + Math.floor(Number(m[2]) / WORD_BUCKET) + ".json");
  return all?.[code] ?? null;
}

export function vidOf(bookNumber: number, chapter: number, verse: number): number {
  return bookNumber * 1_000_000 + chapter * 1000 + verse;
}

export function splitVid(vid: number): { bookNumber: number; chapter: number; verse: number } {
  return { bookNumber: Math.floor(vid / 1_000_000), chapter: Math.floor(vid / 1000) % 1000, verse: vid % 1000 };
}

export function bookOf(meta: Meta, vid: number): MetaBook | undefined {
  return meta.books[Math.floor(vid / 1_000_000) - 1];
}

export function refLabel(meta: Meta, vid: number): string {
  const { chapter, verse } = splitVid(vid);
  return (bookOf(meta, vid)?.name ?? "?") + " " + chapter + ":" + verse;
}

/** "Genesis 6:1 – 9:17" style label for a verse range. */
export function rangeLabel(meta: Meta, a: number, b: number): string {
  const A = splitVid(a);
  const B = splitVid(b);
  const name = bookOf(meta, a)?.name ?? "?";
  if (a === b) return refLabel(meta, a);
  if (A.bookNumber !== B.bookNumber) return refLabel(meta, a) + " – " + refLabel(meta, b);
  const whole = A.verse === 1 && B.verse >= 999;
  if (whole) return name + " " + A.chapter + (A.chapter !== B.chapter ? "–" + B.chapter : "");
  if (A.chapter === B.chapter) return name + " " + A.chapter + ":" + A.verse + "–" + B.verse;
  return name + " " + A.chapter + ":" + A.verse + " – " + B.chapter + ":" + Math.min(B.verse, 176);
}

export function bibleHrefFor(meta: Meta, vid: number): string {
  const { chapter, verse } = splitVid(vid);
  const book = bookOf(meta, vid)?.id ?? "gn";
  return "/bible?book=" + book + "&chapter=" + chapter + (verse && verse < 999 ? "&verse=" + verse : "");
}

/** 0..1: where a verse sits between Genesis 1:1 and the end of Revelation, by chapters. */
export function canonPosition(meta: Meta, vid: number, chapterOffsets: number[]): number {
  const { bookNumber, chapter, verse } = splitVid(vid);
  const total = chapterOffsets[chapterOffsets.length - 1];
  const start = chapterOffsets[bookNumber - 1] + chapter - 1;
  return (start + Math.min(verse, 60) / 61) / total;
}

/** Running count of chapters before each book; the last item is the total. */
export function chapterOffsets(meta: Meta): number[] {
  const out = [0];
  for (const b of meta.books) out.push(out[out.length - 1] + b.chapters);
  return out;
}

/** Colours for the book groups, light and dark friendly. */
export const GROUP_COLOR: Record<string, string> = {
  law: "#c0563b",
  history: "#c9922e",
  wisdom: "#6f9a3b",
  prophets: "#2f8f86",
  gospels: "#3c6fc4",
  letters: "#7a58c0",
  revelation: "#c04f8f"
};
