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
