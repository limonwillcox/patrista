/**
 * Word study data for the King James Version, built by scripts/build-strongs.py into public/strongs.
 * Each English word of a verse carries the Strong's number of the Hebrew or Greek word behind it.
 */

/** [English word, code]: "G4073" / "H6697", "+" for a word the translators added, "" for none. */
export type Tagged = [string, string];

export type StrongsEntry = {
  lemma: string;
  /** Hebrew only: the word without vowel points, as it was first written. */
  plain?: string;
  xlit: string;
  pron: string;
  def: string;
  /** Hebrew only: the numbered senses. */
  senses?: string[];
  /** Where the word comes from; other entries appear as {G4074} / {H6696}. */
  deriv: string;
  /** Strong's list of the King James renderings. */
  kjv: string;
  /**
   * Hebrew only: Greek words the Open Scriptures file links to it. Unranked and mixed (it lists Μεσσίας for
   * mashiach, never χριστός), so not shown as "the Septuagint's rendering"; the connections build uses it.
   */
  lxx?: string[];
  /** Hebrew only: New Testament Greek words whose Strong's derivation names this word ("of Hebrew origin (4899)"). */
  greek?: string[];
  /** How often the KJV renders it each way, counted from the tagged text. */
  uses?: [string, number][];
  count?: number;
};

const BUCKET = 250;
const chapters = new Map<string, Promise<Record<string, Tagged[]> | null>>();
const buckets = new Map<string, Promise<Record<string, StrongsEntry>>>();

export function fetchTaggedChapter(book: string, chapter: number): Promise<Record<string, Tagged[]> | null> {
  const key = book + "/" + chapter;
  let p = chapters.get(key);
  if (!p) {
    p = fetch("/strongs/kjv/" + encodeURIComponent(book) + "/" + chapter + ".json")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => (j ? (j.v as Record<string, Tagged[]>) : null))
      .catch(() => null);
    chapters.set(key, p);
  }
  return p;
}

export function fetchStrongs(code: string): Promise<StrongsEntry | null> {
  const m = code.match(/^([GH])(\d+)$/);
  if (!m) return Promise.resolve(null);
  const file = m[1] + Math.floor(Number(m[2]) / BUCKET);
  let p = buckets.get(file);
  if (!p) {
    p = fetch("/strongs/lex/" + file + ".json")
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}));
    buckets.set(file, p);
  }
  return p.then((all) => all[code] ?? null);
}

/** A word as the tagged text and our verse text can both spell it: "Cæsar's" / "Caesar’s" -> "caesars". */
const fold = (w: string) => w.toLowerCase().replace(/['’]/g, "").replace(/æ/g, "ae");

/** A word of the verse text, æ included ("Cæsar", "Judæa"), so it is not cut in two at the æ. */
export const WORD_RE = /[A-Za-zÆæ][A-Za-zÆæ'’]*/g;

/**
 * The code behind the `occurrence`-th appearance (0-based) of `word` in a verse. Undefined when the
 * word is not in the tagged verse at all (for example a translator's marginal note in our text).
 */
export function codeFor(tokens: Tagged[], word: string, occurrence: number): string | undefined {
  const hits = tokens.filter((t) => fold(t[0]) === fold(word));
  return (hits[occurrence] ?? hits[hits.length - 1])?.[1];
}

/** How many times `word` appears in `text` before character `offset`: which occurrence was clicked. */
export function occurrenceAt(text: string, word: string, offset: number): number {
  const re = new RegExp(WORD_RE.source, "g");
  let n = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index + m[0].length > offset) break;
    if (fold(m[0]) === fold(word)) n++;
  }
  return n;
}

/** Greek as the early scribes wrote it: capitals, no accents or breathings, a lunate sigma. */
export function uncial(greek: string): string {
  return greek
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/Σ/g, "Ϲ");
}

/** Hebrew letters in the older Paleo-Hebrew script, used before the Babylonian exile. */
const PALEO: Record<string, string> = {
  א: "𐤀", ב: "𐤁", ג: "𐤂", ד: "𐤃", ה: "𐤄", ו: "𐤅", ז: "𐤆", ח: "𐤇", ט: "𐤈", י: "𐤉",
  כ: "𐤊", ך: "𐤊", ל: "𐤋", מ: "𐤌", ם: "𐤌", נ: "𐤍", ן: "𐤍", ס: "𐤎", ע: "𐤏", פ: "𐤐",
  ף: "𐤐", צ: "𐤑", ץ: "𐤑", ק: "𐤒", ר: "𐤓", ש: "𐤔", ת: "𐤕"
};

export function consonants(hebrew: string): string {
  return hebrew.replace(/[֑-ׇ]/g, "");
}

export function paleoHebrew(hebrew: string): string {
  return [...consonants(hebrew)].map((c) => PALEO[c] ?? c).join("");
}
