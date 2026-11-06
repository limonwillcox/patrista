export interface BibleTranslation {
  id: string;
  name: string;
  abbreviation: string;
  isLocal: boolean;
  description?: string;
  /** The copyright or licence line the reader shows under the text, as the publisher requires it. */
  credit: string;
  /** A short note shown above the text when this translation is chosen: what differs from the KJV layout. */
  notice?: string;
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
    description: "Public domain local translation",
    credit:
      "King James Version, 1769 standard text (eBible.org). Public domain, except in the United Kingdom, where it is under Crown copyright."
  },
  // Public-domain texts kept in the repo as Bibles/<ID>/ (scripts/import-bibles.ts), one chapter fetched at a time.
  {
    id: "bsb",
    name: "Berean Standard Bible",
    abbreviation: "BSB",
    isLocal: true,
    description: "Public domain (2023), from eBible.org engbsb",
    credit: "Berean Standard Bible. Dedicated to the public domain by its publishers in 2023 (eBible.org)."
  },
  {
    id: "web",
    name: "World English Bible",
    abbreviation: "WEB",
    isLocal: true,
    description: "Public domain, from eBible.org eng-web",
    credit: "World English Bible. Public domain (eBible.org). “World English Bible” is a trademark of eBible.org."
  },
  {
    id: "asv",
    name: "American Standard Version (1901)",
    abbreviation: "ASV",
    isLocal: true,
    description: "Public domain, from eBible.org eng-asv",
    credit: "American Standard Version, 1901. Public domain (eBible.org)."
  },
  {
    id: "dra",
    name: "Douay-Rheims (Challoner), 1899 American Edition",
    abbreviation: "DRA",
    isLocal: true,
    description: "Public domain, from eBible.org engDRA, verses laid on the KJV's numbering",
    credit: "Douay-Rheims Bible, Challoner revision, 1899 American edition. Public domain (eBible.org).",
    notice:
      "Shown on the King James Version's books, book names and verse numbers, so the Fathers' citations line up. " +
      "The deuterocanonical books (Tobit, Judith, Wisdom, Sirach, Baruch, 1–2 Maccabees) and the additions to Esther are " +
      "not included; Daniel 3:24–90 of the Douay (the Prayer of Azarias and the Song of the Three Children) is printed " +
      "within verse 23. The Psalms follow the Hebrew numbering (the Douay's Psalm 22 is shown as Psalm 23), and where " +
      "the Vulgate divides verses differently, a verse may be empty here and its words in the verse beside it."
  },
  {
    id: "esv",
    name: "English Standard Version",
    abbreviation: "ESV",
    isLocal: false,
    description: "English Standard Version via ESV API",
    credit:
      "Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, " +
      "a publishing ministry of Good News Publishers. Used by permission. All rights reserved."
  },
  {
    id: "a556c5305ee15c3f-01",
    name: "Christian Standard Bible",
    abbreviation: "CSB",
    isLocal: false,
    description: "Christian Standard Bible via API.Bible",
    credit:
      "Scripture quotations marked CSB have been taken from the Christian Standard Bible®, Copyright © 2017 by Holman " +
      "Bible Publishers. Used by permission. Christian Standard Bible® and CSB® are federally registered trademarks of " +
      "Holman Bible Publishers."
  },
  {
    id: "78a9f6124f344018-01",
    name: "New International Version",
    abbreviation: "NIV",
    isLocal: false,
    description: "New International Version via API.Bible",
    credit:
      "Scripture quotations taken from The Holy Bible, New International Version® NIV®. Copyright © 1973, 1978, 1984, " +
      "2011 by Biblica, Inc.™ Used by permission. All rights reserved worldwide."
  },
  {
    id: "b8ee27bcd1cae43a-01",
    name: "New American Standard Bible (1995)",
    abbreviation: "NASB",
    isLocal: false,
    description: "New American Standard Bible 1995 via API.Bible",
    credit:
      "Scripture taken from the NEW AMERICAN STANDARD BIBLE®, Copyright © 1960, 1962, 1963, 1968, 1971, 1972, 1973, " +
      "1975, 1977, 1995 by The Lockman Foundation. Used by permission."
  }
];

/**
 * Why a verse is empty in a translation laid on the KJV's numbering, for the reader's tooltip. Undefined
 * when there is nothing to explain (the KJV, or a verse that has text).
 */
export function missingVerseReason(translation: string, book: string, chapter: number, verse: number): string {
  const t = BIBLE_TRANSLATIONS.find((x) => x.id === translation);
  const abbr = t?.abbreviation ?? translation.toUpperCase();
  if (translation === "web" && book === "rm" && chapter === 16 && verse >= 25 && verse <= 27) {
    return "The WEB prints these words at Romans 14:24–26, where some Greek manuscripts have them.";
  }
  if (translation === "dra") {
    return (
      "No verse of its own in the Douay-Rheims: the Latin Vulgate it translates divides this passage differently, " +
      "so these words are in a verse beside it, or not in its text."
    );
  }
  if (translation === "bsb" || translation === "asv" || translation === "web") {
    return "Not in the " + abbr + ": the verse is missing from the oldest Greek manuscripts, so this translation leaves it out of the text.";
  }
  return "This verse is not in the " + abbr + " text.";
}

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
