import { splitVid, type TypeEntry } from "../api/connections";
import type { ChapterCitations } from "../api/scripture";
import { fatherNames } from "./connectionPatterns";

/*
 * A trail: one type walked passage by passage, Genesis to Revelation, ending at what it points to in Christ.
 * A type always opens as its trail. Stop 0 is the overview (no `stop` in the URL); the passages are stops
 * 1 to n (/types?type=<slug>&stop=<n>); the last stop is the "in Christ" line.
 * A stop shows a Father's line only when the paragraph his quotation comes from cites a verse of that
 * passage (by the same Scripture index the search uses), so no line is joined to a passage by guesswork.
 */

/** The type's passages in canonical order. A verse id orders by book, chapter, verse, so sorting is enough. */
export function trailPassages(t: TypeEntry): [number, number][] {
  return [...t.ranges].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

/** Passages plus the closing "in Christ" stop (the overview, stop 0, is not counted). */
export const trailLength = (t: TypeEntry) => t.ranges.length + 1;

/** The stop asked for in the URL, kept within the trail: none, or anything unreadable, is the overview (0). */
export function stopFromParam(raw: string | null, length: number): number {
  if (raw == null) return 0;
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(n, 0), length);
}

/** The different Fathers who drew a type, from its citations ("Cyril, *Cat.* 13.20 — …"). */
export const typeFathers = (t: TypeEntry) => fatherNames(t.where.map((w) => w.split(" — ")[0]));

/** "Drawn by 1 Father" / "Drawn by 6 Fathers". */
export function drawnBy(t: TypeEntry): string {
  const n = typeFathers(t).length;
  return "Drawn by " + n + (n === 1 ? " Father" : " Fathers");
}

/**
 * A quotation's place in the library, from its reader link: "/fathers/a/w/chapter-3/#ch-12-p4" gives work
 * "w", chapter 12, paragraph 3 (counted from 0, as the Scripture index counts). The reader numbers
 * paragraphs from 1 and skips headings of their own; no quoted chapter has one before its quotation (Nov 2026).
 */
export function quoteAnchor(href: string): { work: string; chapter: number; para: number } | null {
  const m = href.match(/^\/fathers\/[^/]+\/([^/]+)\/chapter-\d+\/#ch-(\d+)-p(\d+)$/);
  return m ? { work: m[1], chapter: Number(m[2]), para: Number(m[3]) - 1 } : null;
}

/** Most chapters of one passage to look through for a Father's line (Genesis 6-9 is four). */
const MAX_CHAPTERS = 8;

/** The Bible chapters a passage covers, within its first book. */
export function passageChapters(r: [number, number]): number[] {
  const a = splitVid(r[0]);
  const b = splitVid(r[1]);
  const last = b.bookNumber === a.bookNumber ? b.chapter : a.chapter;
  const out: number[] = [];
  for (let c = a.chapter; c <= last && out.length < MAX_CHAPTERS; c++) out.push(c);
  return out;
}

/**
 * The type's quotation whose paragraph cites a verse of this passage, and the first verse it cites there.
 * `cites` holds the Scripture index for each chapter of the passage, by chapter number. The shortest such
 * quotation wins, since a stop shows one short line.
 */
export function quoteForPassage(
  t: TypeEntry,
  r: [number, number],
  cites: Map<number, ChapterCitations | null>
): { index: number; vid: number } | null {
  const book = splitVid(r[0]).bookNumber;
  let best: { index: number; vid: number } | null = null;
  const links = t.links ?? [];
  for (let i = 0; i < links.length; i++) {
    const at = links[i] ? quoteAnchor(links[i]!.href) : null;
    if (!at) continue;
    let first = 0;
    for (const [chapter, verses] of cites) {
      for (const [key, list] of Object.entries(verses ?? {})) {
        const vid = book * 1_000_000 + chapter * 1000 + Number(key.split(":")[1]);
        if (vid < r[0] || vid > r[1] || (first && vid >= first)) continue;
        if (list.some((c) => c[6] === at.work && c[7] === at.chapter && c[8]?.includes(at.para))) first = vid;
      }
    }
    if (first && (!best || t.where[i].length < t.where[best.index].length)) best = { index: i, vid: first };
  }
  return best;
}

/** Most verses shown at one stop; the reference opens the rest in the Bible. */
export const MAX_VERSES = 6;

/**
 * The verses to show for a passage: all of a short one; for a long one, a few from the verse the Father
 * cites (when there is one), else from its start. Verse 999 means "to the end of the chapter".
 */
export function verseWindow(r: [number, number], focus?: number): { chapter: number; from: number; to: number; more: boolean } {
  const a = splitVid(r[0]);
  const b = splitVid(r[1]);
  const start = focus && focus >= r[0] && focus <= r[1] ? splitVid(focus) : a;
  const sameChapter = b.bookNumber === start.bookNumber && b.chapter === start.chapter;
  const end = sameChapter ? b.verse : 999;
  const to = Math.min(end, start.verse + MAX_VERSES - 1);
  const more = to < end || !sameChapter || start.verse > a.verse || start.chapter > a.chapter;
  return { chapter: start.chapter, from: start.verse, to, more };
}
