/**
 * Turn an eBible.org "VPL" download (one verse per line: "JHN 1:1 In the beginning was the Word…")
 * into Bibles/<CODE>/<bookId>.json, in the KJV's format and book ids, verse-aligned to the KJV.
 *
 *   node --experimental-strip-types scripts/import-bibles.ts <code> <path/to/xxx_vpl.txt> [--by-wording] [--dry]
 *
 * e.g. node --experimental-strip-types scripts/import-bibles.ts bsb C:/…/engbsb/engbsb_vpl.txt
 *      node --experimental-strip-types scripts/import-bibles.ts dra C:/…/engDRA/engDRA_vpl.txt --by-wording
 *
 * Sources used (all public domain, eBible.org): engbsb (BSB), eng-web (WEB), eng-asv (ASV), engDRA
 * (Douay-Rheims), from https://ebible.org/Scriptures/<name>_vpl.zip.
 *
 * Every chapter has at least the KJV's verses, placed by number, so a verse number means the same verse
 * in every translation and the Fathers' citations line up:
 * - a verse the translation leaves out (Matthew 17:21 in the BSB) is an empty string in its place;
 * - a verse past the KJV's count keeps its own number. Bibles/KJV drops six verses (Matthew 2:16, 22:1,
 *   26:38, Mark 4:8, 7:11, 8:8) and renumbers the rest of the chapter, so there the other translations
 *   hold the standard numbering and the KJV is the odd one out.
 * Only the 66 books of the KJV manifest are kept. A text numbered after the Vulgate or the Septuagint
 * (Greek Psalm numbers, Psalm titles counted as verses, verses divided differently) is laid onto the
 * KJV's verses by its wording instead: "--by-wording", see alignBookByWording(). Every chapter whose
 * verse count differs from the KJV is printed, so it can be checked by hand.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

/** eBible.org VPL book codes -> the KJV's book ids (Bibles/KJV/manifest.json). */
export const VPL_BOOKS: Record<string, string> = {
  GEN: "gn", EXO: "ex", LEV: "lv", NUM: "nm", DEU: "dt", JOS: "js", JDG: "jud", RUT: "rt",
  "1SA": "1sm", "2SA": "2sm", "1KI": "1kgs", "2KI": "2kgs", "1CH": "1ch", "2CH": "2ch", EZR: "ezr",
  NEH: "ne", EST: "et", JOB: "job", PSA: "ps", PRO: "prv", ECC: "ec", SOL: "so", ISA: "is", JER: "jr",
  LAM: "lm", EZE: "ez", DAN: "dn", HOS: "ho", JOE: "jl", AMO: "am", OBA: "ob", JON: "jn", MIC: "mi",
  NAH: "na", HAB: "hk", ZEP: "zp", HAG: "hg", ZEC: "zc", MAL: "ml",
  MAT: "mt", MAR: "mk", LUK: "lk", JOH: "jo", ACT: "act", ROM: "rm", "1CO": "1co", "2CO": "2co",
  GAL: "gl", EPH: "eph", PHI: "ph", COL: "cl", "1TH": "1ts", "2TH": "2ts", "1TI": "1tm", "2TI": "2tm",
  TIT: "tt", PHM: "phm", HEB: "hb", JAM: "jm", "1PE": "1pe", "2PE": "2pe", "1JO": "1jo", "2JO": "2jo",
  "3JO": "3jo", JUD: "jd", REV: "re"
};

/** One verse as the source numbers it. */
export type SourceVerse = { ch: number; v: number; text: string };

/** book id -> chapter -> verse -> text, as the source numbers them. */
export type SourceBible = Map<string, Map<number, Map<number, string>>>;

/**
 * One translation's verse text, cleaned: no supplied-word brackets ("[is]" -> "is"), no cross
 * references ("[2 Kings 16]"), no pilcrows, footnote markers, Strong's numbers or markup.
 */
export function cleanVerse(text: string): string {
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s*\[(?:[1-4] )?[A-Z][a-z]+\.? \d+(?:[:,.]\s?\d+)*\]/g, "")
    .replace(/[[\]¶†‡*]/g, "")
    .replace(/\{[^}]*\}/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

/** Parse a VPL text: "BOOK chapter:verse text", one verse per line. Books outside the KJV are dropped. */
export function parseVpl(text: string, bookCodes: Record<string, string> = VPL_BOOKS): SourceBible {
  const out: SourceBible = new Map();
  for (const line of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const m = line.match(/^(\S+) (\d+):(\d+)(?: (.*))?$/);
    if (!m) continue;
    const book = bookCodes[m[1]];
    if (!book) continue;
    const ch = Number(m[2]);
    const v = Number(m[3]);
    let chapters = out.get(book);
    if (!chapters) out.set(book, (chapters = new Map()));
    let verses = chapters.get(ch);
    if (!verses) chapters.set(ch, (verses = new Map()));
    const t = cleanVerse(m[4] ?? "");
    verses.set(v, verses.has(v) ? (verses.get(v) + " " + t).trim() : t);
  }
  return out;
}

export type AlignReport = { chapter: number; kjv: number; source: number; note: string };

/**
 * One chapter's verses on the KJV's verse numbers: a verse the source lacks is "", a verse past the
 * KJV's last keeps its number.
 */
export function alignVerses(
  kjvCount: number,
  source: Map<number, string> | undefined
): { verses: string[]; report?: Omit<AlignReport, "chapter"> } {
  const src = source ?? new Map<number, string>();
  const max = src.size ? Math.max(...src.keys()) : 0;
  const verses: string[] = [];
  for (let v = 1; v <= Math.max(kjvCount, max); v++) verses.push(src.get(v) ?? "");
  if (max === kjvCount) return { verses };
  const note = max > kjvCount
      ? "verses " + (kjvCount + 1) + "–" + max + " past the KJV's count, kept"
      : max === 0
        ? "chapter missing"
        : "verses " + (max + 1) + "–" + kjvCount + " empty";
  return { verses, report: { kjv: kjvCount, source: max, note } };
}

const STOP_WORDS = new Set(
  ("the and that his him unto for shall they them with not thou thee thy you your was which said were their from " +
    "but have are this will then upon when there who what had into all hath also she her our out let one may did " +
    "say saith come came over before because even now these those thine any made make should would every")
    .split(" ")
);

/** A verse's content words, cut to five letters so "saith"/"said" or "commanded"/"commandeth" still meet. */
export function verseWords(text: string): Set<string> {
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  return new Set(words.filter((w) => w.length > 2 && !STOP_WORDS.has(w)).map((w) => w.slice(0, 5)));
}

function dice(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  return (2 * shared) / (a.size + b.size);
}

function union(a: Set<string>, b: Set<string>): Set<string> {
  return new Set([...a, ...b]);
}

/**
 * Lay one book whose verses are numbered differently (the Vulgate's Douay-Rheims) onto the KJV's verses, by wording: a monotone alignment of the two verse sequences that
 * scores shared content words, allowing a source verse to cover two KJV verses (the second left empty)
 * or two source verses to fill one KJV verse. A source verse with no KJV counterpart (the Song of the
 * Three Children in Daniel 3) is joined onto the KJV verse before it; any after the KJV's last verse of
 * the book (the Greek additions at the end of Esther, Daniel 13–14) are dropped.
 */
export function alignBookByWording(
  kjvChapters: string[][],
  source: SourceVerse[]
): { chapters: string[][]; moved: number; dropped: number } {
  const kjv = kjvChapters.flat();
  const kjvRefs = kjvChapters.flatMap((verses, c) => verses.map((_, v) => c + 1 + ":" + (v + 1)));
  const n = kjv.length;
  const m = source.length;
  const K = kjv.map(verseWords);
  const S = source.map((s) => verseWords(s.text));
  const GAP = 0.15;
  const MERGE = 0.05;
  const W = m + 1;
  const score = new Float64Array((n + 1) * W).fill(-Infinity);
  const move = new Uint8Array((n + 1) * W);
  const band = 150 + Math.abs(m - n);
  score[0] = 0;
  for (let i = 0; i <= n; i++) {
    const centre = n ? Math.round((i * m) / n) : 0;
    const lo = Math.max(0, centre - band);
    const hi = Math.min(m, centre + band);
    for (let j = lo; j <= hi; j++) {
      if (!i && !j) continue;
      let best = -Infinity;
      let how = 0;
      const at = (ii: number, jj: number) => score[ii * W + jj];
      if (i && j) {
        const s = at(i - 1, j - 1) + dice(K[i - 1], S[j - 1]);
        if (s > best) (best = s), (how = 1);
      }
      if (i) {
        const s = at(i - 1, j) - GAP;
        if (s > best) (best = s), (how = 2);
      }
      if (j) {
        const s = at(i, j - 1) - GAP;
        if (s > best) (best = s), (how = 3);
      }
      // Two source verses fill one KJV verse only within one source chapter, so a Psalm title is never
      // joined onto the end of the psalm before it.
      if (i && j >= 2 && source[j - 2].ch === source[j - 1].ch) {
        const s = at(i - 1, j - 2) + dice(K[i - 1], union(S[j - 2], S[j - 1])) - MERGE;
        if (s > best) (best = s), (how = 4);
      }
      if (i >= 2 && j) {
        const s = at(i - 2, j - 1) + dice(union(K[i - 2], K[i - 1]), S[j - 1]) - MERGE;
        if (s > best) (best = s), (how = 5);
      }
      score[i * W + j] = best;
      move[i * W + j] = how;
    }
  }
  // Walk back: which KJV verse each source verse goes to (-1: an extra verse, placed after the fact).
  const target = new Int32Array(m).fill(-1);
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const how = move[i * W + j];
    if (how === 1) target[--j] = --i;
    else if (how === 2) i--;
    else if (how === 3) j--;
    else if (how === 4) {
      target[j - 1] = target[j - 2] = i - 1;
      j -= 2;
      i--;
    } else if (how === 5) {
      target[--j] = i - 2;
      i -= 2;
    } else break;
  }
  // An extra verse joins the verse before it, unless it opens a source chapter (a Psalm title):
  // then it joins the verse after it. Extras before the first or after the last matched verse are dropped.
  const prev = new Int32Array(m).fill(-1);
  const next = new Int32Array(m).fill(-1);
  for (let s = 0, p = -1; s < m; s++) (prev[s] = p), target[s] >= 0 && (p = s);
  for (let s = m - 1, q = -1; s >= 0; s--) (next[s] = q), target[s] >= 0 && (q = s);
  const texts: string[][] = kjv.map(() => []);
  let dropped = 0;
  for (let s = 0; s < m; s++) {
    let t = target[s];
    if (t < 0) {
      const p = prev[s];
      const q = next[s];
      const opensChapter = q >= 0 && source[q].ch === source[s].ch && (p < 0 || source[p].ch !== source[s].ch);
      t = opensChapter ? target[q] : p >= 0 && q >= 0 ? target[p] : -1;
    }
    if (t < 0) {
      if (source[s].text) dropped++;
      continue;
    }
    texts[t].push(source[s].text);
  }
  const flat = texts.map((t) => t.filter(Boolean).join(" "));
  const chapters: string[][] = [];
  let at = 0;
  let moved = 0;
  for (const ch of kjvChapters) {
    chapters.push(flat.slice(at, at + ch.length));
    at += ch.length;
  }
  for (let s = 0; s < m; s++) if (target[s] >= 0 && kjvRefs[target[s]] !== source[s].ch + ":" + source[s].v) moved++;
  return { chapters, moved, dropped };
}

type KjvBook = { id: string; name: string; chapters: string[][] };
type ManifestBook = { id: string; name: string; chapters: number };

export type ConvertedBook = { id: string; name: string; chapters: string[][] };

/** A source Bible on the KJV's books, chapters and verses, with every place they differ. */
export function convertToKjvShape(
  source: SourceBible,
  kjv: KjvBook[],
  opts: { byWording?: boolean } = {}
): { books: ConvertedBook[]; reports: (AlignReport & { book: string })[]; emptyVerses: string[] } {
  const books: ConvertedBook[] = [];
  const reports: (AlignReport & { book: string })[] = [];
  const emptyVerses: string[] = [];
  for (const k of kjv) {
    const chapters = source.get(k.id);
    if (!chapters) continue;
    if (opts.byWording) {
      const verses: SourceVerse[] = [];
      for (const [ch, vs] of chapters) for (const [v, text] of vs) verses.push({ ch, v, text });
      const { chapters: out, moved, dropped } = alignBookByWording(k.chapters, verses);
      if (moved || dropped)
        reports.push({ book: k.id, chapter: 0, kjv: k.chapters.flat().length, source: verses.length, note: "whole book: " + moved + " verses renumbered, " + dropped + " dropped" });
      out.forEach((vs, c) => vs.forEach((t, v) => !t && emptyVerses.push(k.id + " " + (c + 1) + ":" + (v + 1))));
      books.push({ id: k.id, name: k.name, chapters: out });
      continue;
    }
    const out: string[][] = [];
    k.chapters.forEach((kjvVerses, i) => {
      const ch = i + 1;
      const { verses, report } = alignVerses(kjvVerses.length, chapters.get(ch));
      if (report) reports.push({ book: k.id, chapter: ch, ...report });
      verses.forEach((t, j) => {
        if (!t) emptyVerses.push(k.id + " " + ch + ":" + (j + 1));
      });
      out.push(verses);
    });
    for (const ch of chapters.keys()) {
      if (ch > k.chapters.length)
        reports.push({ book: k.id, chapter: ch, kjv: 0, source: chapters.get(ch)!.size, note: "chapter not in the KJV, dropped" });
    }
    books.push({ id: k.id, name: k.name, chapters: out });
  }
  return { books, reports, emptyVerses };
}

function main(argv: string[]) {
  const [code, vplPath] = argv.filter((a) => !a.startsWith("--"));
  if (!code || !vplPath) {
    console.error("usage: import-bibles.ts <code> <xxx_vpl.txt> [--by-wording] [--dry]");
    process.exit(2);
  }
  const root = join(import.meta.dirname, "..");
  const kjvDir = join(root, "Bibles", "KJV");
  const manifest = JSON.parse(readFileSync(join(kjvDir, "manifest.json"), "utf8")) as ManifestBook[];
  const kjv = manifest.map((b) => JSON.parse(readFileSync(join(kjvDir, b.id + ".json"), "utf8")) as KjvBook);
  const bookCodes = { ...VPL_BOOKS };
  const text = readFileSync(vplPath, "utf8");
  // A Septuagint (Brenton) has only the Greek Esther and Daniel, with their additions.
  if (!/^EST /m.test(text)) bookCodes.ESG = "et";
  if (!/^DAN /m.test(text)) bookCodes.DNG = "dn";
  const source = parseVpl(text, bookCodes);
  const { books, reports, emptyVerses } = convertToKjvShape(source, kjv, { byWording: argv.includes("--by-wording") });

  const missingBooks = manifest.filter((b) => !books.some((x) => x.id === b.id)).map((b) => b.id);
  console.log(code.toUpperCase() + ": " + books.length + " books" + (missingBooks.length ? ", missing " + missingBooks.join(" ") : ""));
  console.log(reports.length + " chapters (or books) whose verses differ from the KJV:");
  for (const r of reports)
    console.log("  " + r.book + (r.chapter ? " " + r.chapter : "") + ": KJV " + r.kjv + ", source " + r.source + " (" + r.note + ")");
  console.log(emptyVerses.length + " empty verses: " + emptyVerses.join(", "));
  if (argv.includes("--dry")) return;

  const outDir = join(root, "Bibles", code.toUpperCase());
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  for (const b of books) writeFileSync(join(outDir, b.id + ".json"), JSON.stringify(b));
  writeFileSync(
    join(outDir, "manifest.json"),
    JSON.stringify(books.map((b) => ({ id: b.id, name: b.name, chapters: b.chapters.length })), null, 2)
  );
  console.log("wrote " + books.length + " books to " + outDir);
}

if (process.argv[1] && import.meta.filename === resolve(process.argv[1])) {
  main(process.argv.slice(2));
}
