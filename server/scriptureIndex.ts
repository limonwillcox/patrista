import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { getWork } from "./api";
import { repoRoot } from "./corpus";
import type { Catalog } from "./types";
import { assignChapterSlugs, chapterPublicPath, englishParagraphs } from "../src/lib/fatherPaths";
import { findScriptureRefs } from "../src/lib/scriptureRefs";
import { readPath } from "../src/lib/workSlugs";

/**
 * Which chapters of the Fathers cite which verses, for the Scripture-aware search.
 *
 * A chapter cites a verse when a paragraph names it ("Gen. i. 1") or one of the paragraph's footnotes
 * does. Each paragraph counts once per verse. Served per Bible chapter at /api/scripture/<book>/<ch>.json
 * (made on request by the dev server, written as files by the static build), with the KJV text at
 * /api/scripture/kjv.json so the browser can find the verse behind a phrase. The search and the
 * Connections tab both read them; every citing chapter is kept, none cut.
 */

/**
 * A chapter citing a verse: [url, title, Father, paragraphs citing it, an excerpt, focus, work id,
 * chapter number, the paragraphs (from 0) that cite it]. Focus is how many different verses of the same
 * Bible chapter it cites: a homily that works through Genesis 1 verse by verse has a high focus; a
 * treatise that cites Genesis 1:1 once in passing has a focus of 1. The work, chapter and paragraphs let
 * the Connections tab load the paragraphs themselves and show them whole.
 */
export type VerseCite = [string, string, string, number, string, number, string, number, number[], string[]];

/**
 * The other Fathers a paragraph names, so the Connections tab can show a Father who names an earlier
 * one as replying to him. Only names that point to one man are used: a bare "Gregory", "Cyril" or
 * "Clement" could be several, "Ephraim" and "Barnabas" are also names in the Bible, and "Socrates" is
 * also the philosopher, so those need their fuller forms or are left out. So is "Eusebius": in the
 * Arian controversy it is usually Eusebius of Nicomedia, not the historian of Caesarea.
 */
const NAMES: [string, string[]][] = [
  ["augustine", ["Augustine", "Augustin"]],
  ["ambrose", ["Ambrose"]],
  ["athanasius", ["Athanasius"]],
  ["basil", ["Basil"]],
  ["cassian", ["Cassian"]],
  ["chrysostom", ["Chrysostom"]],
  ["clement_alexandria", ["Clement of Alexandria"]],
  ["clement_rome", ["Clement of Rome"]],
  ["cyprian", ["Cyprian"]],
  ["cyril_jerusalem", ["Cyril of Jerusalem"]],
  ["ephraim", ["Ephraim the Syrian", "Ephrem the Syrian"]],
  ["gregory", ["Gregory the Great"]],
  ["gregory_nazianzen", ["Nazianzen", "Gregory the Theologian"]],
  ["gregory_nyssa", ["Gregory of Nyssa", "Nyssen"]],
  ["gregory_thaumaturgus", ["Thaumaturgus"]],
  ["hilary", ["Hilary"]],
  ["hippolytus", ["Hippolytus"]],
  ["ignatius", ["Ignatius"]],
  ["irenaeus", ["Irenaeus"]],
  ["jerome", ["Jerome"]],
  ["justin", ["Justin Martyr", "Justin the Martyr"]],
  ["lactantius", ["Lactantius"]],
  ["leo", ["Leo the Great", "Pope Leo"]],
  ["methodius", ["Methodius"]],
  ["novatian", ["Novatian"]],
  ["origen", ["Origen"]],
  ["papias", ["Papias"]],
  ["polycarp", ["Polycarp"]],
  ["rufinus", ["Rufinus"]],
  ["tertullian", ["Tertullian"]],
  ["theodoret", ["Theodoret"]]
];
const NAMED = NAMES.map(([id, names]) => [id, new RegExp(String.raw`\b(?:` + names.join("|") + String.raw`)\b`)] as const);
const namedIn = (text: string) => NAMED.filter(([, re]) => re.test(text)).map(([id]) => id);
/** Per Bible book: "chapter:verse" -> the chapters citing it, most citations first. */
export type BookCitations = Record<string, VerseCite[]>;
export type KjvText = { books: { id: string; name: string; c: string[][] }[] };

/** A range like "Gen. i. 1-31" counts for at most this many verses. */
const MAX_RANGE = 12;
const EXCERPT = 240;

function excerpt(text: string, start = 0, end = 0): string {
  const clean = (s: string) => s.replace(/\s+/g, " ").trim();
  if (text.length <= EXCERPT) return clean(text);
  const from = Math.max(0, Math.min(start - 110, text.length - EXCERPT));
  const cut = text.slice(from, Math.max(from + EXCERPT, end + 40));
  return (from > 0 ? "…" : "") + clean(cut.replace(/^\S*\s/, from > 0 ? "" : "$&")) + "…";
}

/** Citations of the verse, plus a share of the chapter's focus on the passage around it. */
export const rank = (c: VerseCite) => c[3] + Math.min(c[5], 12) / 2;

/** The words of a verse worth matching: four letters or more. */
function verseWords(kjv: KjvText, book: string, chapter: number, verse: number): Set<string> {
  const t = kjv.books.find((b) => b.id === book)?.c[chapter - 1]?.[verse - 1] ?? "";
  return new Set(t.replace(/\s\S+\.\.\.:.*$/, "").toLowerCase().match(/[a-z]{4,}/g) ?? []);
}

/** The sentence of a paragraph that shares the most words with the verse: usually where it is quoted. */
function bestSentence(para: string, words: Set<string>): string | null {
  if (!words.size) return null;
  let best = "";
  let score = 1; // at least two shared words
  for (const sent of para.match(/[^.!?]+[.!?]+["”’)]*|[^.!?]+$/g) ?? []) {
    const n = new Set(sent.toLowerCase().match(/[a-z]{4,}/g) ?? []);
    let hit = 0;
    for (const w of n) if (words.has(w)) hit++;
    if (hit > score) {
      score = hit;
      best = sent;
    }
  }
  if (!best) return null;
  const t = best.replace(/\s+/g, " ").trim();
  return t.length > EXCERPT ? t.slice(0, EXCERPT).replace(/\s\S*$/, "") + "…" : t;
}

let cached: Map<string, BookCitations> | null = null;
/** Per Bible book, per verse: every chapter of the Fathers citing it, best first. */
let cachedCounts: Record<string, number> = {};

export function scriptureCitations(catalog: Catalog): Map<string, BookCitations> {
  if (cached) return cached;
  const kjv = kjvText(repoRoot());
  const wordsOf = new Map<string, Set<string>>();
  const words = (book: string, chapter: number, verse: number) => {
    const k = book + chapter + ":" + verse;
    if (!wordsOf.has(k)) wordsOf.set(k, verseWords(kjv, book, chapter, verse));
    return wordsOf.get(k)!;
  };
  // book -> "c:v" -> url -> cite
  const index = new Map<string, Map<string, Map<string, VerseCite>>>();
  for (const w of catalog.works) {
    const payload = getWork(w.id);
    if (!payload) continue;
    const author = payload.author;
    const slugs = assignChapterSlugs(payload.chapters);
    const split = payload.chapters.length > 1;
    for (const ch of payload.chapters) {
      const paras = englishParagraphs(ch.versions);
      if (!paras.length) continue;
      const slug = slugs.get(ch.chapter);
      const url = split && slug ? chapterPublicPath(author.id, w.id, slug) : readPath(w.id);
      const title = split ? w.title + " — " + ch.heading : w.title;
      const counted = new Set<string>();
      // The other Fathers each paragraph names (never the author himself), worked out once per paragraph.
      const namedBy = new Map<number, string[]>();
      const named = (i: number) => {
        if (!namedBy.has(i)) namedBy.set(i, namedIn(paras[i] ?? "").filter((id) => id !== author.id));
        return namedBy.get(i)!;
      };
      const touched: VerseCite[] = [];
      const versesIn = new Map<string, Set<number>>(); // "book chapter" -> verses cited
      const touchedChapter = new Map<VerseCite, string>();
      const add = (book: string, chapter: number, verse: number, endVerse: number | undefined, para: number, text: string) => {
        const last = Math.min(endVerse ?? verse, verse + MAX_RANGE - 1);
        for (let v = verse; v <= last; v++) {
          const key = chapter + ":" + v;
          if (counted.has(para + "|" + book + key)) continue;
          counted.add(para + "|" + book + key);
          let verses = index.get(book);
          if (!verses) index.set(book, (verses = new Map()));
          let chapters = verses.get(key);
          if (!chapters) verses.set(key, (chapters = new Map()));
          const hit = chapters.get(url);
          if (hit) {
            hit[3]++;
            if (!hit[8].includes(para)) hit[8].push(para);
            for (const id of named(para)) if (!hit[9].includes(id)) hit[9].push(id);
          } else {
            const cite: VerseCite = [url, title, author.name, 1, text, 1, w.id, ch.chapter, [para], named(para)];
            chapters.set(url, cite);
            touched.push(cite);
            touchedChapter.set(cite, book + " " + chapter);
          }
          const bc = book + " " + chapter;
          if (!versesIn.has(bc)) versesIn.set(bc, new Set());
          versesIn.get(bc)!.add(v);
        }
      };
      paras.forEach((p, i) => {
        for (const r of findScriptureRefs(p))
          add(r.book, r.chapter, r.verse, r.endVerse, i, bestSentence(p, words(r.book, r.chapter, r.verse)) ?? excerpt(p, r.start, r.end));
      });
      for (const f of ch.footnotes ?? []) {
        const p = paras[f.para] ?? "";
        for (const r of findScriptureRefs(f.text))
          add(r.book, r.chapter, r.verse, r.endVerse, f.para, bestSentence(p, words(r.book, r.chapter, r.verse)) ?? excerpt(p));
      }
      for (const cite of touched) cite[5] = versesIn.get(touchedChapter.get(cite)!)?.size ?? 1;
    }
  }
  const out = new Map<string, BookCitations>();
  cachedCounts = {};
  for (const [book, verses] of index) {
    const b: BookCitations = {};
    for (const [key, chapters] of verses) cachedCounts[book + " " + key] = chapters.size;
    for (const [key, chapters] of verses)
      b[key] = [...chapters.values()].sort((x, y) => rank(y) - rank(x) || x[1].localeCompare(y[1]));
    out.set(book, b);
  }
  cached = out;
  return out;
}

/** Per verse ("gn 1:1"): how many chapters of the Fathers cite it. Orders the verses a search finds. */
export function citationCounts(catalog: Catalog): Record<string, number> {
  scriptureCitations(catalog);
  return cachedCounts;
}

/** The verses of one Bible chapter out of a book's citations. */
export function chapterCitations(cites: BookCitations | undefined, chapter: number): BookCitations {
  const out: BookCitations = {};
  for (const [key, list] of Object.entries(cites ?? {})) if (key.startsWith(chapter + ":")) out[key] = list;
  return out;
}

/** The KJV, every book, for finding the verse behind a phrase. */
export function kjvText(root: string): KjvText {
  const dir = join(root, "Bibles", "KJV");
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf-8")) as { id: string; name: string }[];
  return {
    books: manifest.map((b) => {
      const book = JSON.parse(readFileSync(join(dir, b.id + ".json"), "utf-8")) as { chapters: string[][] };
      return { id: b.id, name: b.name, c: book.chapters };
    })
  };
}

/** Write /api/scripture/ for the static site. Returns how many verses the Fathers cite. */
export function writeScriptureIndex(dist: string, catalog: Catalog, root: string): number {
  const dir = join(dist, "api", "scripture");
  mkdirSync(dir, { recursive: true });
  let verses = 0;
  for (const [book, cites] of scriptureCitations(catalog)) {
    mkdirSync(join(dir, book), { recursive: true });
    const chapters = new Set(Object.keys(cites).map((k) => Number(k.split(":")[0])));
    for (const ch of chapters) writeFileSync(join(dir, book, ch + ".json"), JSON.stringify(chapterCitations(cites, ch)));
    verses += Object.keys(cites).length;
  }
  writeFileSync(join(dir, "kjv.json"), JSON.stringify(kjvText(root)));
  writeFileSync(join(dir, "counts.json"), JSON.stringify(citationCounts(catalog)));
  return verses;
}
