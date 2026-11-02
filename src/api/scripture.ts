/**
 * The Scripture-aware search: find the verses behind a query, then the chapters of the Fathers that
 * cite them. Data from server/scriptureIndex.ts at /api/scripture/.
 */
import { findScriptureRefs } from "../lib/scriptureRefs";

/**
 * A chapter citing a verse: [url, title, Father, paragraphs citing it, an excerpt, focus on the passage,
 * work id, chapter number, the paragraphs (from 0) that cite it, the other Fathers those paragraphs name].
 * The last four are missing from data built before they were added.
 */
export type VerseCite = [string, string, string, number, string, number, string?, number?, number[]?, string[]?];
/** "chapter:verse" -> every chapter of the Fathers citing it, best first. */
export type ChapterCitations = Record<string, VerseCite[]>;
type KjvText = { books: { id: string; name: string; c: string[][] }[] };

export type VerseMatch = {
  book: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  /** How the query matched: a reference, the exact words, or all its words (by their stems). */
  how: "ref" | "phrase" | "words";
  /** Chapters of the Fathers citing the verse. */
  cited: number;
  /** Words of the verse text to mark. */
  marks: string[];
};

const BASE = "/api/scripture/";
const files = new Map<string, Promise<unknown>>();
function getJson<T>(name: string): Promise<T | null> {
  let p = files.get(name);
  if (!p) {
    p = fetch(BASE + name + ".json")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
    files.set(name, p);
  }
  return p as Promise<T | null>;
}
/** Every passage of the Fathers citing each verse of one Bible chapter. */
export const fetchChapterCitations = (book: string, chapter: number) => getJson<ChapterCitations>(book + "/" + chapter);

/** Citations of the verse, plus a share of the chapter's focus on the passage around it. */
export const citeRank = (c: VerseCite) => c[3] + Math.min(c[5] ?? 1, 12) / 2;

const STOP = new Set(
  "a an and are as at be but by for from he her him his i in is it its of on or our shall that the their them they this thou thy to unto us was we were which who will with ye you".split(" ")
);
const norm = (s: string) => s.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const SUFFIXES = ["ations", "ation", "ions", "ion", "ings", "ing", "eth", "est", "ers", "ors", "er", "or", "ed", "es", "s"];
/** A rough stem: "creation", "created", "creator" all become "creat". The first ending that leaves 4 letters. */
function stem(w: string): string {
  const suf = SUFFIXES.find((s) => w.endsWith(s) && w.length - s.length >= 4);
  return suf ? w.slice(0, -suf.length) : w;
}

/**
 * The verses behind a query, best first: a reference ("Genesis 1:1", "Gen. i. 1"), then verses with the
 * exact words, then verses with all the query's words. Within each, the verses the Fathers cite most.
 */
export async function findVerses(q: string, limit = 8): Promise<VerseMatch[]> {
  const text = q.replace(/["“”]/g, "").trim();
  if (text.length < 3) return [];
  const [kjv, counts] = await Promise.all([getJson<KjvText>("kjv"), getJson<Record<string, number>>("counts")]);
  if (!kjv) return [];
  const books = new Map(kjv.books.map((b) => [b.id, b]));
  const cited = (book: string, c: number, v: number) => counts?.[book + " " + c + ":" + v] ?? 0;
  const out: VerseMatch[] = [];
  const seen = new Set<string>();
  const push = (m: Omit<VerseMatch, "bookName" | "text" | "cited">) => {
    const b = books.get(m.book);
    const t = b?.c[m.chapter - 1]?.[m.verse - 1];
    const key = m.book + m.chapter + ":" + m.verse;
    if (!b || !t || seen.has(key)) return;
    seen.add(key);
    out.push({ ...m, bookName: b.name, text: t, cited: cited(m.book, m.chapter, m.verse) });
  };

  for (const r of findScriptureRefs(text.replace(/\b(\d+)\s*:\s*(\d+)/g, "$1:$2")))
    for (let v = r.verse; v <= (r.endVerse ?? r.verse) && v < r.verse + 10; v++) push({ book: r.book, chapter: r.chapter, verse: v, how: "ref", marks: [] });
  if (out.length) return out;

  const phrase = norm(text);
  const words = phrase.split(" ").filter((w) => w && !STOP.has(w));
  const stems = words.map(stem);
  if (!stems.length) return [];
  const phraseHits: VerseMatch[] = [];
  const wordHits: VerseMatch[] = [];
  for (const b of kjv.books)
    b.c.forEach((verses, ci) =>
      verses.forEach((t, vi) => {
        // Leave out the translators' margin notes ("...: Heb. ...") that follow some verses.
        const body = norm(t.replace(/\s\S+\.\.\.:.*$/, ""));
        const padded = " " + body + " ";
        const tokens = body.split(" ");
        const m = { book: b.id, bookName: b.name, chapter: ci + 1, verse: vi + 1, text: t, cited: cited(b.id, ci + 1, vi + 1) };
        if (phrase.includes(" ") && padded.includes(" " + phrase + " ")) phraseHits.push({ ...m, how: "phrase", marks: [phrase] });
        else if (stems.every((s) => tokens.some((tk) => tk.startsWith(s))))
          wordHits.push({ ...m, how: "words", marks: tokens.filter((tk) => stems.some((s) => tk.startsWith(s))) });
      })
    );
  const byCited = (a: VerseMatch, b: VerseMatch) => b.cited - a.cited || a.book.localeCompare(b.book);
  return [...phraseHits.sort(byCited), ...wordHits.sort(byCited)].slice(0, limit);
}

export type FatherChapter = { url: string; title: string; father: string; excerpt: string; score: number; verses: string[] };

/** The chapters of the Fathers that cite these verses, best first. */
export async function fathersOn(verses: VerseMatch[], limit = 10): Promise<FatherChapter[]> {
  const byUrl = new Map<string, FatherChapter>();
  for (const v of verses) {
    const cites = (await fetchChapterCitations(v.book, v.chapter))?.[v.chapter + ":" + v.verse] ?? [];
    for (const c of cites) {
      const f = byUrl.get(c[0]) ?? { url: c[0], title: c[1], father: c[2], excerpt: c[4], score: 0, verses: [] };
      f.score += citeRank(c);
      f.verses.push(v.bookName + " " + v.chapter + ":" + v.verse);
      byUrl.set(c[0], f);
    }
  }
  return [...byUrl.values()].sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, limit);
}
