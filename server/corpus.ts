import { existsSync, readdirSync, readFileSync } from "fs";
import { dirname, join, relative } from "path";
import { fileURLToPath } from "url";
import { authorMeta, loadEnglishAppWorks, wordCountFromPassages } from "./englishWorks";
import type { Catalog, Footnote, Passage } from "./types";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII"];
const ROMAN_SET = ROMAN.join("|");

export const VERSIONS = [
  { id: "pusey", label: "Pusey (1838)", short: "Pusey", group: "translation" as const },
  { id: "schaff", label: "Schaff / NPNF", short: "Schaff", group: "translation" as const },
  { id: "lat", label: "Latin", short: "Latin", group: "original" as const }
];

export const AUTHORS = [authorMeta("augustine")];

export const ERAS = [
  { id: "ante-nicene", label: "Ante-Nicene" },
  { id: "post-nicene", label: "Post-Nicene" }
];

export type ParsedConfessions = {
  title: string;
  author: string;
  translator: string;
  year: number;
  source: string;
  englishSource: string;
  latinSource: string;
  books: {
    n: number;
    roman: string;
    heading: string;
    paras: string[];
    latin: string[];
    notes: Footnote[];
  }[];
};

export type Library = {
  catalog: Catalog;
  passages: Passage[];
  parsed: ParsedConfessions;
  sources: { english: string; latin: string };
};

export function repoRoot(): string {
  const fromMeta = join(dirname(fileURLToPath(import.meta.url)), "..");
  if (existsSync(join(fromMeta, "Fathers"))) return fromMeta;
  return process.cwd();
}

/** Prefer the Pusey English + Augustine Latin Confessions sources. */
export function findSources(root = repoRoot()): { english: string; latin: string } {
  const preferredEnglish = join(
    root,
    "Fathers",
    "English",
    "Augustine_English",
    "The Confessions of St. Augustine. Augustine.txt"
  );
  const preferredLatin = join(
    root,
    "Fathers",
    "Latin",
    "Augustine_Latin",
    "The Confessions of St. Augustine Latin.txt"
  );
  if (existsSync(preferredEnglish) && existsSync(preferredLatin)) {
    return { english: preferredEnglish, latin: preferredLatin };
  }

  const english: string[] = [];
  const latin: string[] = [];
  function walk(dir: string) {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(p);
        continue;
      }
      if (!/\.txt$/i.test(ent.name)) continue;
      if (/latin/i.test(ent.name) && /confessions/i.test(ent.name)) latin.push(p);
      else if (/confessions/i.test(ent.name) && !/pilkington/i.test(ent.name)) english.push(p);
    }
  }
  walk(join(root, "Fathers"));
  if (!english.length) throw new Error("Could not find English Confessions .txt under Fathers/");
  if (!latin.length) throw new Error("Could not find Latin Confessions .txt under Fathers/");
  return { english: english[0], latin: latin[0] };
}

function parseLatin(latinSrc: string): string[][] {
  const bookRe = new RegExp("^Liber (" + ROMAN_SET + ")\\s*$", "gm");
  const marks: { roman: string; index: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = bookRe.exec(latinSrc))) {
    marks.push({ roman: m[1], index: m.index, end: m.index + m[0].length });
  }
  if (marks.length !== 13) {
    throw new Error("Expected 13 Latin books, found " + marks.length);
  }
  return marks.map((mark, i) => {
    const from = mark.end;
    const to = i + 1 < marks.length ? marks[i + 1].index : latinSrc.length;
    const chunk = latinSrc.slice(from, to);
    const capRe = /^CAPUT\s+(\d+)\s*$/gm;
    const caps: { index: number; end: number }[] = [];
    let c: RegExpExecArray | null;
    while ((c = capRe.exec(chunk))) {
      caps.push({ index: c.index, end: c.index + c[0].length });
    }
    const slices = caps.length ? caps : [{ index: 0, end: 0 }];
    return slices
      .map((cap, j) => {
        const start = cap.end;
        const end = j + 1 < slices.length ? slices[j + 1].index : chunk.length;
        return chunk
          .slice(start, end)
          .replace(/\r\n/g, "\n")
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l && !/^CAPUT\s+\d+$/.test(l) && !/^Liber\s+[IVX]+$/.test(l))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
      })
      .filter(Boolean);
  });
}

function unwrapParagraphs(text: string): string[] {
  const raw = text.replace(/\r\n/g, "\n").trim();
  const blocks = raw.split(/\n\s*\n+/);
  const paras: string[] = [];
  for (const block of blocks) {
    const joined = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (!joined) continue;
    if (/^BOOK [IVX]+$/.test(joined)) continue;
    paras.push(joined);
  }
  return paras;
}

function notesFromPara(para: string, paraIndex: number): Footnote[] {
  const notes: Footnote[] = [];
  const quoteRe = /["“]([^"”]{12,200})["”]/g;
  let q: RegExpExecArray | null;
  while ((q = quoteRe.exec(para))) {
    const snippet = q[1].replace(/\s+/g, " ").trim();
    const around = para.slice(Math.max(0, q.index - 48), q.index).toLowerCase();
    const scriptural =
      /\b(saidst|saith|said|written|scripture|word|psalm|gospel|book|commandment|thy law|thou hast said)\b/.test(around) ||
      /\b(lord|god|thou|thee|heaven|israel|christ|father)\b/i.test(snippet);
    if (!scriptural) continue;
    notes.push({
      n: String(paraIndex + 1) + String.fromCharCode(97 + notes.length),
      para: paraIndex,
      text: snippet
    });
  }
  return notes;
}

export function parseConfessions(englishSrc: string, latinSrc: string, sourcePaths?: { english: string; latin: string; root: string }): ParsedConfessions {
  const start = englishSrc.search(/^BOOK I\s*$/m);
  const endMatch = englishSrc.search(/^ {0,}GRATIAS TIBI DOMINE\s*$/m);
  if (start < 0 || endMatch < 0) {
    throw new Error("Could not find BOOK I or GRATIAS TIBI DOMINE");
  }
  const body = englishSrc.slice(start, endMatch) + "GRATIAS TIBI DOMINE\n";
  const bookRe = /^BOOK (I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII)\s*$/gm;
  const marks: { roman: string; index: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = bookRe.exec(body))) {
    marks.push({ roman: m[1], index: m.index, end: m.index + m[0].length });
  }
  if (marks.length !== 13) {
    throw new Error("Expected 13 books, found " + marks.length);
  }
  const latinBooks = parseLatin(latinSrc);
  const books = marks.map((mark, i) => {
    const from = mark.end;
    const to = i + 1 < marks.length ? marks[i + 1].index : body.length;
    const paras = unwrapParagraphs(body.slice(from, to));
    const notes: Footnote[] = [];
    paras.forEach((p, pi) => {
      notes.push(...notesFromPara(p, pi));
    });
    return {
      n: i + 1,
      roman: ROMAN[i],
      heading: "Book " + ROMAN[i],
      paras,
      latin: latinBooks[i] || [],
      notes
    };
  });
  const rel = (p: string) =>
    sourcePaths ? relative(sourcePaths.root, p).replace(/\\/g, "/") : p;
  return {
    title: "The Confessions",
    author: "Augustine of Hippo",
    translator: "E. B. Pusey",
    year: 1838,
    source: "Project Gutenberg eBook #3296",
    englishSource: sourcePaths ? rel(sourcePaths.english) : "",
    latinSource: sourcePaths ? rel(sourcePaths.latin) : "",
    books
  };
}

function truncateQuote(text: string, max = 420): string {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

export function passagesFromParsed(parsed: ParsedConfessions): Passage[] {
  return parsed.books.map((b) => ({
    work: "confessions",
    chapter: b.n,
    heading: b.heading,
    versions: { pusey: b.paras, lat: b.latin || [] },
    footnotes: (b.notes || []).map((n) => ({ n: n.n, text: n.text, para: n.para }))
  }));
}

export function catalogFromParsed(parsed: ParsedConfessions): Catalog {
  const book1 = parsed.books[0];
  const quote = book1?.paras[0] || "";
  const latin = book1?.latin[0] || "";
  return {
    versions: VERSIONS,
    authors: AUTHORS,
    eras: ERAS,
    works: [
      {
        id: "confessions",
        author: "augustine",
        title: parsed.title,
        short: "Conf.",
        chapters: parsed.books.length,
        series: "Pusey",
        wordCount: 1
      }
    ],
    votd: {
      work: "confessions",
      chapter: 1,
      quote: truncateQuote(quote),
      latin: truncateQuote(latin)
    }
  };
}

export function loadLibrary(root = repoRoot()): Library {
  const sources = findSources(root);
  const englishSrc = readFileSync(sources.english, "utf8");
  const latinSrc = readFileSync(sources.latin, "utf8");
  const parsed = parseConfessions(englishSrc, latinSrc, { ...sources, root });
  const confessionsPassages = passagesFromParsed(parsed);
  const catalog = catalogFromParsed(parsed);
  const confessionsWork = catalog.works.find((w) => w.id === "confessions");
  if (confessionsWork) confessionsWork.wordCount = Math.max(1, wordCountFromPassages(confessionsPassages));
  const english = loadEnglishAppWorks(root);

  const authors = [...catalog.authors];
  for (const a of english.authors) {
    if (!authors.some((x) => x.id === a.id)) authors.push(a);
  }

  return {
    parsed,
    sources,
    catalog: {
      ...catalog,
      authors,
      works: [...catalog.works, ...english.works]
    },
    passages: [...confessionsPassages, ...english.passages]
  };
}

let cached: Library | null = null;

export function getLibrary(): Library {
  if (!cached) cached = loadLibrary();
  return cached;
}

export function resetLibraryCache(): void {
  cached = null;
}
