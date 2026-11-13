import type { TypeEntry } from "../api/connections";

/** A verse id's book, chapter and verse (as in src/api/connections.ts, kept here so Node scripts can run this). */
const splitVid = (vid: number) => ({ bookNumber: Math.floor(vid / 1_000_000), chapter: Math.floor(vid / 1000) % 1000, verse: vid % 1000 });

/*
 * The themes of the types map, computed from the data alone. Nobody tags a type.
 *
 * A theme is a word of Scripture: one or more Hebrew words (Strong's numbers), chosen by the editor in
 * data/connections/themes.json, with the Greek words the Septuagint uses for them when the KJV renders the
 * two alike (the same rule as the Connections word layer). Its name is how the KJV renders it; its
 * description is Strong's definition.
 *
 * A type is in a theme when two records agree on one English word:
 *   1. a verse of the type's passages has the theme's word (the KJV tagged with Strong's numbers,
 *      public/strongs/kjv), rendered there by that English word;
 *   2. one of the type's own Father quotations uses the same English word.
 * The Hebrew joins the Testaments and English renderings of one word ("tree", "wood"), but a verse and a Father
 * must use the same rendering, so a word is never matched in another of its senses ("wind" for "Spirit").
 * Each membership keeps its evidence: the verse, the word there, and the quotation. A type may be in several
 * themes, or none. scripts/connections/build_themes.ts writes public/connections/themes.json from this, and
 * tests/typeThemes.test.ts recomputes it, so the file cannot be edited by hand.
 */

/** A lexicon entry (public/strongs/lex): how the KJV renders the word, its definition, its Septuagint words. */
export type LexEntry = { xlit?: string; lemma?: string; def?: string; uses?: [string, number][]; lxx?: string[] | null; count?: number };
/** Per verse of a chapter: the KJV's words with their Strong's numbers ("" for none). */
export type TaggedChapter = Record<string, [string, string][]>;

export type ThemeMember = {
  /** The type's id ("04:ark"). */
  type: string;
  /** The first verse of its passages that has the word, and the KJV's word there. */
  verse: number;
  word: string;
  /** The quotation (index into the type's `where`) that uses the word, and a short stretch of it around the word. */
  quote: number;
  at: string;
};

export type Theme = {
  id: string;
  /** "tree · wood": the KJV's main renderings. */
  name: string;
  /** The Hebrew word(s), then the Greek. */
  codes: string[];
  /** The first Hebrew word, transliterated ("ʻêts"), and its Greek counterparts ("xýlon"). */
  xlit: string;
  greek: string[];
  /** Strong's definition of the first Hebrew word. */
  def: string;
  members: ThemeMember[];
};

/** The KJV's word, lower case, without a plural "s" or a possessive: "Trees" → "tree", "Egypt's" → "egypt". */
export function norm(word: string): string {
  const w = word.toLowerCase().replace(/’/g, "'").split("'")[0].replace(/[^a-z]/g, "");
  return w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w;
}

/** How the KJV renders a word, as a count per rendering. */
function renderings(e: LexEntry | undefined): Map<string, number> {
  const v = new Map<string, number>();
  for (const [w, n] of e?.uses ?? []) v.set(norm(w), (v.get(norm(w)) ?? 0) + n);
  return v;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  for (const [k, x] of a) dot += x * (b.get(k) ?? 0);
  const len = (m: Map<string, number>) => Math.sqrt([...m.values()].reduce((s, x) => s + x * x, 0));
  const d = len(a) * len(b);
  return d ? dot / d : 0;
}

/** A Hebrew and a Greek word the KJV renders at least this alike are the same theme (the word layer's EN_MIN). */
export const GREEK_ALIKE = 0.6;
/** A rendering counts for matching a Father's words when it is at least this share of the word's uses. */
export const RENDERING_SHARE = 0.08;
/** The name shows the renderings that are at least this share of the first word's uses (at most two). */
const NAME_SHARE = 0.2;

/** The Hebrew words of a theme and the Greek words paired with them. */
export function themeCodes(hebrew: string[], lex: Record<string, LexEntry>): { codes: string[]; greek: string[] } {
  const greek: string[] = [];
  for (const h of hebrew) {
    const rh = renderings(lex[h]);
    for (const g of lex[h]?.lxx ?? []) {
      if (!greek.includes(g) && lex[g] && cosine(rh, renderings(lex[g])) >= GREEK_ALIKE) greek.push(g);
    }
  }
  return { codes: [...hebrew, ...greek], greek };
}

/** The renderings by which a Father's quotation can name the theme. */
export function themeWords(codes: string[], lex: Record<string, LexEntry>): Set<string> {
  const out = new Set<string>();
  for (const c of codes) {
    const r = renderings(lex[c]);
    const total = [...r.values()].reduce((s, x) => s + x, 0);
    for (const [w, n] of r) if (w.length >= 3 && total && n / total >= RENDERING_SHARE) out.add(w);
  }
  return out;
}

/** "tree · wood": the first Hebrew word's main renderings. */
function themeName(code: string, lex: Record<string, LexEntry>): string {
  const r = [...renderings(lex[code])].sort((a, b) => b[1] - a[1]);
  const total = r.reduce((s, [, n]) => s + n, 0);
  const main = r.filter(([, n]) => total && n / total >= NAME_SHARE).slice(0, 2).map(([w]) => w);
  return (main.length ? main : r.slice(0, 1).map(([w]) => w)).join(" · ");
}

/** Strong's definition, to its first full stop or semicolon. */
function shortDef(def: string | undefined): string {
  const d = (def ?? "").replace(/\s+/g, " ").trim();
  const cut = d.search(/[;.](\s|$)/);
  return cut > 0 ? d.slice(0, cut) : d;
}

/** The verses of a passage, in order, with the KJV's tagged words. */
function* passageVerses(r: [number, number], chapter: (book: number, ch: number) => TaggedChapter | null) {
  const a = splitVid(r[0]);
  let b = splitVid(r[1]);
  if (b.bookNumber !== a.bookNumber) b = { bookNumber: a.bookNumber, chapter: a.chapter, verse: 999 };
  for (let c = a.chapter; c <= b.chapter; c++) {
    const verses = chapter(a.bookNumber, c);
    if (!verses) continue;
    const ns = Object.keys(verses)
      .map(Number)
      .sort((x, y) => x - y);
    for (const n of ns) {
      if ((c === a.chapter && n < a.verse) || (c === b.chapter && n > b.verse)) continue;
      yield { vid: a.bookNumber * 1_000_000 + c * 1000 + n, tokens: verses[String(n)] };
    }
  }
}

/** The quotation itself, after "Father, *Work* n — ". */
const quoteText = (where: string) => (where.includes(" — ") ? where.slice(where.indexOf(" — ") + 3) : "");

/** A short stretch of a quotation around its first use of one of `words`. */
function around(text: string, words: Set<string>): { at: string; found: boolean } {
  const re = /[A-Za-z’']+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (!words.has(norm(m[0]))) continue;
    const from = Math.max(0, m.index - 70);
    const to = Math.min(text.length, m.index + m[0].length + 70);
    const at = (from > 0 ? "…" : "") + text.slice(from, to).replace(/^\S*\s/, from > 0 ? "" : "$&").trim() + (to < text.length ? "…" : "");
    return { at, found: true };
  }
  return { at: "", found: false };
}

/** Every theme, with its members in the order of the types. */
export function computeThemes(
  chosen: { id: string; hebrew: string[] }[],
  types: TypeEntry[],
  lex: Record<string, LexEntry>,
  chapter: (book: number, ch: number) => TaggedChapter | null
): Theme[] {
  return chosen.map(({ id, hebrew }) => {
    const { codes, greek } = themeCodes(hebrew, lex);
    const inText = new Set(codes);
    const words = themeWords(codes, lex);
    const members: ThemeMember[] = [];
    for (const t of types) {
      // The English words of each of the type's own quotations.
      const quoteWords = t.where.map((w) => new Set((quoteText(w).match(/[A-Za-z’']+/g) ?? []).map(norm)));
      // A verse of its passages (the first, in canonical order) where the KJV renders the word with an English
      // word that a Father's quotation also uses. Same word on both sides, so "wind" in a verse never counts
      // for a Father's "Spirit", though both are rûwach.
      let hit: { verse: number; word: string; quote: number } | null = null;
      for (const r of [...t.ranges].sort((x, y) => x[0] - y[0])) {
        for (const v of passageVerses(r, chapter)) {
          for (const [eng, code] of v.tokens) {
            const w = norm(eng);
            if (!words.has(w) || !code.split(/\s+/).some((c) => inText.has(c))) continue;
            const q = quoteWords.findIndex((set) => set.has(w));
            if (q >= 0) {
              hit = { verse: v.vid, word: eng, quote: q };
              break;
            }
          }
          if (hit) break;
        }
        if (hit) break;
      }
      const quote = hit?.quote ?? -1;
      const at = hit ? around(quoteText(t.where[quote]), new Set([norm(hit.word)])).at : "";
      if (hit) members.push({ type: t.id, verse: hit.verse, word: hit.word, quote, at });
    }
    return {
      id,
      name: themeName(hebrew[0], lex),
      codes,
      xlit: lex[hebrew[0]]?.xlit ?? "",
      greek: greek.map((g) => lex[g]?.xlit ?? g),
      def: shortDef(lex[hebrew[0]]?.def),
      members
    };
  });
}
