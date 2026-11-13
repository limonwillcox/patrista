/**
 * Finds Bible references in footnote text, in the forms the Schaff editions use:
 * "John i. 3", "Matt. xix. 4", "1 Cor. xv. 22", "Ps. cxix. 105", "Rom. 5:12".
 * Book ids are the ones the Bible page uses (/bible?book=<id>).
 */

type BookDef = { id: string; name: string; chapters: number; names: string[] };

const BOOKS: BookDef[] = [
  { id: "gn", name: "Genesis", chapters: 50, names: ["Gen", "Genesis"] },
  { id: "ex", name: "Exodus", chapters: 40, names: ["Ex", "Exod", "Exodus"] },
  { id: "lv", name: "Leviticus", chapters: 27, names: ["Lev", "Levit", "Leviticus"] },
  { id: "nm", name: "Numbers", chapters: 36, names: ["Num", "Numb", "Numbers"] },
  { id: "dt", name: "Deuteronomy", chapters: 34, names: ["Deut", "Deuteronomy"] },
  { id: "js", name: "Joshua", chapters: 24, names: ["Josh", "Joshua"] },
  { id: "jud", name: "Judges", chapters: 21, names: ["Judg", "Judges"] },
  { id: "rt", name: "Ruth", chapters: 4, names: ["Ruth"] },
  { id: "1sm", name: "1 Samuel", chapters: 31, names: ["1 Sam", "1 Samuel"] },
  { id: "2sm", name: "2 Samuel", chapters: 24, names: ["2 Sam", "2 Samuel"] },
  { id: "1kgs", name: "1 Kings", chapters: 22, names: ["1 Kings", "1 Kgs"] },
  { id: "2kgs", name: "2 Kings", chapters: 25, names: ["2 Kings", "2 Kgs"] },
  { id: "1ch", name: "1 Chronicles", chapters: 29, names: ["1 Chron", "1 Chr", "1 Chronicles"] },
  { id: "2ch", name: "2 Chronicles", chapters: 36, names: ["2 Chron", "2 Chr", "2 Chronicles"] },
  { id: "ezr", name: "Ezra", chapters: 10, names: ["Ezra"] },
  { id: "ne", name: "Nehemiah", chapters: 13, names: ["Neh", "Nehemiah"] },
  { id: "et", name: "Esther", chapters: 10, names: ["Esth", "Esther"] },
  { id: "job", name: "Job", chapters: 42, names: ["Job"] },
  { id: "ps", name: "Psalms", chapters: 150, names: ["Ps", "Psa", "Psalm", "Psalms"] },
  { id: "prv", name: "Proverbs", chapters: 31, names: ["Prov", "Proverbs"] },
  { id: "ec", name: "Ecclesiastes", chapters: 12, names: ["Eccl", "Eccles", "Ecclesiastes"] },
  { id: "so", name: "Song of Solomon", chapters: 8, names: ["Cant", "Canticles", "Song"] },
  { id: "is", name: "Isaiah", chapters: 66, names: ["Is", "Isa", "Isaiah"] },
  { id: "jr", name: "Jeremiah", chapters: 52, names: ["Jer", "Jerem", "Jeremiah"] },
  { id: "lm", name: "Lamentations", chapters: 5, names: ["Lam", "Lamentations"] },
  { id: "ez", name: "Ezekiel", chapters: 48, names: ["Ezek", "Ezekiel"] },
  { id: "dn", name: "Daniel", chapters: 12, names: ["Dan", "Daniel"] },
  { id: "ho", name: "Hosea", chapters: 14, names: ["Hos", "Hosea"] },
  { id: "jl", name: "Joel", chapters: 3, names: ["Joel"] },
  { id: "am", name: "Amos", chapters: 9, names: ["Amos"] },
  { id: "ob", name: "Obadiah", chapters: 1, names: ["Obad", "Obadiah"] },
  { id: "jn", name: "Jonah", chapters: 4, names: ["Jon", "Jonah"] },
  { id: "mi", name: "Micah", chapters: 7, names: ["Mic", "Micah"] },
  { id: "na", name: "Nahum", chapters: 3, names: ["Nah", "Nahum"] },
  { id: "hk", name: "Habakkuk", chapters: 3, names: ["Hab", "Habakkuk"] },
  { id: "zp", name: "Zephaniah", chapters: 3, names: ["Zeph", "Zephaniah"] },
  { id: "hg", name: "Haggai", chapters: 2, names: ["Hag", "Haggai"] },
  { id: "zc", name: "Zechariah", chapters: 14, names: ["Zech", "Zechariah"] },
  { id: "ml", name: "Malachi", chapters: 4, names: ["Mal", "Malachi"] },
  { id: "mt", name: "Matthew", chapters: 28, names: ["Matt", "Mat", "Matthew"] },
  { id: "mk", name: "Mark", chapters: 16, names: ["Mark", "Mk"] },
  { id: "lk", name: "Luke", chapters: 24, names: ["Luke", "Lk"] },
  { id: "jo", name: "John", chapters: 21, names: ["John", "Joh", "Jn"] },
  { id: "act", name: "Acts", chapters: 28, names: ["Acts"] },
  { id: "rm", name: "Romans", chapters: 16, names: ["Rom", "Romans"] },
  { id: "1co", name: "1 Corinthians", chapters: 16, names: ["1 Cor", "1 Corinthians"] },
  { id: "2co", name: "2 Corinthians", chapters: 13, names: ["2 Cor", "2 Corinthians"] },
  { id: "gl", name: "Galatians", chapters: 6, names: ["Gal", "Galatians"] },
  { id: "eph", name: "Ephesians", chapters: 6, names: ["Eph", "Ephesians"] },
  { id: "ph", name: "Philippians", chapters: 4, names: ["Phil", "Philip", "Philippians"] },
  { id: "cl", name: "Colossians", chapters: 4, names: ["Col", "Colossians"] },
  { id: "1ts", name: "1 Thessalonians", chapters: 5, names: ["1 Thess", "1 Th", "1 Thessalonians"] },
  { id: "2ts", name: "2 Thessalonians", chapters: 3, names: ["2 Thess", "2 Th", "2 Thessalonians"] },
  { id: "1tm", name: "1 Timothy", chapters: 6, names: ["1 Tim", "1 Timothy"] },
  { id: "2tm", name: "2 Timothy", chapters: 4, names: ["2 Tim", "2 Timothy"] },
  { id: "tt", name: "Titus", chapters: 3, names: ["Tit", "Titus"] },
  { id: "phm", name: "Philemon", chapters: 1, names: ["Philem", "Philemon"] },
  { id: "hb", name: "Hebrews", chapters: 13, names: ["Heb", "Hebrews"] },
  { id: "jm", name: "James", chapters: 5, names: ["Jas", "James"] },
  { id: "1pe", name: "1 Peter", chapters: 5, names: ["1 Pet", "1 Peter"] },
  { id: "2pe", name: "2 Peter", chapters: 3, names: ["2 Pet", "2 Peter"] },
  { id: "1jo", name: "1 John", chapters: 5, names: ["1 John", "1 Joh", "1 Jn"] },
  { id: "2jo", name: "2 John", chapters: 1, names: ["2 John", "2 Joh"] },
  { id: "3jo", name: "3 John", chapters: 1, names: ["3 John", "3 Joh"] },
  { id: "jd", name: "Jude", chapters: 1, names: ["Jude"] },
  { id: "re", name: "Revelation", chapters: 22, names: ["Rev", "Apoc", "Revelation"] }
];

export type ScriptureRef = {
  book: string;
  bookName: string;
  chapter: number;
  verse: number;
  endVerse?: number;
  /** Where the reference sits in the source text. */
  start: number;
  end: number;
};

const BY_NAME = new Map<string, BookDef>();
for (const b of BOOKS) for (const n of b.names) BY_NAME.set(n.toLowerCase().replace(/\s+/g, " "), b);

const ROMAN: Record<string, number> = { i: 1, v: 5, x: 10, l: 50, c: 100 };

export function romanToInt(s: string): number | null {
  const t = s.toLowerCase();
  if (!/^[ivxlc]+$/.test(t)) return null;
  let total = 0;
  for (let i = 0; i < t.length; i++) {
    const v = ROMAN[t[i]];
    const next = ROMAN[t[i + 1]] ?? 0;
    total += v < next ? -v : v;
  }
  return total > 0 ? total : null;
}

// Longest names first so "1 Cor" wins over "Cor" and "Philem" over "Phil". Case-sensitive, so the
// word "is" never reads as Isaiah.
const NAME_ALT = BOOKS.flatMap((b) => b.names)
  .sort((a, b) => b.length - a.length)
  .map((n) => n.replace(/ /g, "\\s?"))
  .join("|");

const REF_RE = new RegExp(
  "(?<![A-Za-z0-9])(" +
    NAME_ALT +
    ")\\.?\\s+([ivxlcIVXLC]+|\\d{1,3})(?:(?:\\.|:|,)\\s?(\\d{1,3}))?(?:\\s?[-–]\\s?(\\d{1,3}))?",
  "g"
);

/** "I Cor." and "II Tim." are common in older editions: read the roman prefix as a digit. */
function normaliseNumberedPrefix(text: string): string {
  // Same length in and out, so match offsets still point into the original text.
  return text.replace(/\b(III|II|I) (?=[A-Z][a-z])/g, (m, roman: string) => {
    const n = roman === "I" ? "1" : roman === "II" ? "2" : "3";
    return n + " ".repeat(m.length - 1);
  });
}

export function findScriptureRefs(text: string): ScriptureRef[] {
  const out: ScriptureRef[] = [];
  const src = normaliseNumberedPrefix(text);
  for (const m of src.matchAll(REF_RE)) {
    const key = m[1].toLowerCase().replace(/\s+/g, " ").replace(/^([123])(?=[a-z])/, "$1 ");
    const book = BY_NAME.get(key);
    if (!book) continue;
    let chapter = /^\d+$/.test(m[2]) ? Number(m[2]) : romanToInt(m[2]);
    let verse = Number(m[3]);
    // A one-chapter book is cited by verse alone: "Jude 8", "2 John 10", "Philem. 9, 10".
    if (book.chapters === 1 && /^\d+$/.test(m[2]) && (!m[3] || chapter !== 1)) {
      verse = Number(m[2]);
      chapter = 1;
    }
    if (!chapter || chapter > book.chapters || !verse || verse > 176) continue;
    const endVerse = m[4] ? Number(m[4]) : undefined;
    out.push({
      book: book.id,
      bookName: book.name,
      chapter,
      verse,
      endVerse: endVerse && endVerse > verse ? endVerse : undefined,
      start: m.index ?? 0,
      end: (m.index ?? 0) + m[0].length
    });
  }
  return out;
}

export function scriptureLabel(ref: Pick<ScriptureRef, "bookName" | "chapter" | "verse" | "endVerse">): string {
  return ref.bookName + " " + ref.chapter + ":" + ref.verse + (ref.endVerse ? "–" + ref.endVerse : "");
}

export function scriptureHref(ref: Pick<ScriptureRef, "book" | "chapter" | "verse">): string {
  return "/bible?book=" + ref.book + "&chapter=" + ref.chapter + "&verse=" + ref.verse;
}
