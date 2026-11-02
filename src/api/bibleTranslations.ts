export interface BibleTranslation {
  id: string;
  name: string;
  abbreviation: string;
  isLocal: boolean;
  description?: string;
}

/**
 * Common available translations.
 * 'kjv' is stored locally in the repo (0 API calls, works offline).
 * API.Bible IDs can be chosen from any active Bible in the user's API.Bible account.
 */
export const BIBLE_TRANSLATIONS: BibleTranslation[] = [
  {
    id: "kjv",
    name: "King James Version",
    abbreviation: "KJV",
    isLocal: true,
    description: "Public domain local translation"
  },
  // Public-domain texts kept in the repo as Bibles/<ID>/ (scripts/import-bibles.ts), one chapter fetched at a time.
  {
    id: "bsb",
    name: "Berean Standard Bible",
    abbreviation: "BSB",
    isLocal: true,
    description: "Public domain (2023), from eBible.org engbsb"
  },
  {
    id: "web",
    name: "World English Bible",
    abbreviation: "WEB",
    isLocal: true,
    description: "Public domain, from eBible.org eng-web"
  },
  {
    id: "asv",
    name: "American Standard Version (1901)",
    abbreviation: "ASV",
    isLocal: true,
    description: "Public domain, from eBible.org eng-asv"
  },
  {
    id: "dra",
    name: "Douay-Rheims (Challoner), 1899 American Edition",
    abbreviation: "DRA",
    isLocal: true,
    description: "Public domain, from eBible.org engDRA, verses laid on the KJV's numbering"
  },
  {
    id: "esv",
    name: "English Standard Version",
    abbreviation: "ESV",
    isLocal: false,
    description: "English Standard Version via ESV API"
  },
  {
    id: "a556c5305ee15c3f-01",
    name: "Christian Standard Bible",
    abbreviation: "CSB",
    isLocal: false,
    description: "Christian Standard Bible via API.Bible"
  },
  {
    id: "78a9f6124f344018-01",
    name: "New International Version",
    abbreviation: "NIV",
    isLocal: false,
    description: "New International Version via API.Bible"
  },
  {
    id: "b8ee27bcd1cae43a-01",
    name: "New American Standard Bible (1995)",
    abbreviation: "NASB",
    isLocal: false,
    description: "New American Standard Bible 1995 via API.Bible"
  }
];

/** A translation other than the KJV whose text is in the repo, read per chapter from Bibles/<ID>/. */
export function isLocalTextTranslation(id: string): boolean {
  return id !== "kjv" && BIBLE_TRANSLATIONS.some((t) => t.id === id && t.isLocal);
}

/** The chapter text of a local translation: the dev API and the static file share this path. */
export function bibleTextPath(translation: string, book: string, chapter: number): string {
  return "/api/bible/text/" + encodeURIComponent(translation) + "/" + encodeURIComponent(book) + "/" + chapter;
}

/**
 * Maps 2-4 character internal IDs from Bibles/KJV/manifest.json to USFM 3-letter book codes.
 */
export const BOOK_ID_TO_USFM: Record<string, string> = {
  gn: "GEN",
  ex: "EXO",
  lv: "LEV",
  nm: "NUM",
  dt: "DEU",
  js: "JOS",
  jud: "JDG",
  rt: "RUT",
  "1sm": "1SA",
  "2sm": "2SA",
  "1kgs": "1KI",
  "2kgs": "2KI",
  "1ch": "1CH",
  "2ch": "2CH",
  ezr: "EZR",
  ne: "NEH",
  et: "EST",
  job: "JOB",
  ps: "PSA",
  prv: "PRO",
  ec: "ECC",
  so: "SNG",
  is: "ISA",
  jr: "JER",
  lm: "LAM",
  ez: "EZK",
  dn: "DAN",
  ho: "HOS",
  jl: "JOL",
  am: "AMO",
  ob: "OBA",
  jn: "JON",
  mi: "MIC",
  na: "NAM",
  hk: "HAB",
  zp: "ZEP",
  hg: "HAG",
  zc: "ZEC",
  ml: "MAL",
  mt: "MAT",
  mk: "MRK",
  lk: "LUK",
  jo: "JHN",
  act: "ACT",
  rm: "ROM",
  "1co": "1CO",
  "2co": "2CO",
  gl: "GAL",
  eph: "EPH",
  ph: "PHP",
  cl: "COL",
  "1ts": "1TH",
  "2ts": "2TH",
  "1tm": "1TI",
  "2tm": "2TI",
  tt: "TIT",
  phm: "PHM",
  hb: "HEB",
  jm: "JAS",
  "1pe": "1PE",
  "2pe": "2PE",
  "1jo": "1JN",
  "2jo": "2JN",
  "3jo": "3JN",
  jd: "JUD",
  re: "REV"
};

export function bookIdToUsfm(bookId: string): string {
  return BOOK_ID_TO_USFM[bookId.toLowerCase()] || bookId.toUpperCase();
}

/** USFM book codes as the ESV API reads a reference: "SNG" -> "Song of Solomon". */
const USFM_NAMES: Record<string, string> = {
  GEN: "Genesis", EXO: "Exodus", LEV: "Leviticus", NUM: "Numbers", DEU: "Deuteronomy", JOS: "Joshua",
  JDG: "Judges", RUT: "Ruth", "1SA": "1 Samuel", "2SA": "2 Samuel", "1KI": "1 Kings", "2KI": "2 Kings",
  "1CH": "1 Chronicles", "2CH": "2 Chronicles", EZR: "Ezra", NEH: "Nehemiah", EST: "Esther", JOB: "Job",
  PSA: "Psalms", PRO: "Proverbs", ECC: "Ecclesiastes", SNG: "Song of Solomon", ISA: "Isaiah",
  JER: "Jeremiah", LAM: "Lamentations", EZK: "Ezekiel", DAN: "Daniel", HOS: "Hosea", JOL: "Joel",
  AMO: "Amos", OBA: "Obadiah", JON: "Jonah", MIC: "Micah", NAM: "Nahum", HAB: "Habakkuk",
  ZEP: "Zephaniah", HAG: "Haggai", ZEC: "Zechariah", MAL: "Malachi", MAT: "Matthew", MRK: "Mark",
  LUK: "Luke", JHN: "John", ACT: "Acts", ROM: "Romans", "1CO": "1 Corinthians", "2CO": "2 Corinthians",
  GAL: "Galatians", EPH: "Ephesians", PHP: "Philippians", COL: "Colossians", "1TH": "1 Thessalonians",
  "2TH": "2 Thessalonians", "1TI": "1 Timothy", "2TI": "2 Timothy", TIT: "Titus", PHM: "Philemon",
  HEB: "Hebrews", JAS: "James", "1PE": "1 Peter", "2PE": "2 Peter", "1JN": "1 John", "2JN": "2 John",
  "3JN": "3 John", JUD: "Jude", REV: "Revelation"
};

/** The ESV API reference for a chapter: the book's English name, not its USFM code. */
export function esvQuery(usfm: string, chapter: number | string): string {
  return (USFM_NAMES[usfm.toUpperCase()] ?? usfm) + " " + chapter;
}

/**
 * The verses of an ESV passage text, by the numbers it carries: "[1] In the beginning… [2] …".
 * The ESV leaves some verses out of its text (Matthew 17:21, Acts 8:37), so a verse is placed by its
 * number, never by counting; a verse it leaves out is an empty string.
 */
export function parseEsvPassage(text: string): string[] {
  const verses: string[] = [];
  const parts = text.replace(/\s*\(ESV\)\s*$/, "").split(/\[(\d+)\]/);
  // parts: [before, n, text, n, text, ...]
  for (let i = 1; i + 1 < parts.length; i += 2) {
    const n = Number(parts[i]);
    if (n > 0) verses[n - 1] = parts[i + 1].replace(/\s+/g, " ").trim();
  }
  return Array.from(verses, (v) => v ?? "");
}
