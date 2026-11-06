import { workMeta } from "../../server/workMeta";

/** The physical form a work is shown in: what it would have been written on in its own time. */
export type ManuscriptForm = "roll" | "papyrus-codex" | "parchment-codex";

/** A work as the shelf knows it. `id` unlocks the per-work dates and forms below. */
export type FormWork = { id?: string; title: string };

/**
 * Approximate year of writing, for works whose date is far from their shelf Father's death year:
 * books by other hands, later pseudepigrapha, and Josephus's first-century histories. Rough by design;
 * it only picks a century and a writing material.
 */
export const WORK_YEAR: Readonly<Record<string, number>> = {
  // Josephus wrote in Rome in the last decades of the first century.
  "wars-of-the-jews": 75,
  "antiquities-of-the-jews": 94,
  "against-apion": 96,
  "life-of-flavius-josephus": 95,
  // Apostolic Fathers and other early documents.
  "first-epistle-of-clement": 96,
  "epistles-of-ignatius": 110,
  "epistle-to-the-philippians": 120,
  "epistle-of-barnabas": 130,
  "martyrdom-of-polycarp": 157,
  "martyrdom-of-justin": 170,
  "clement-rome-the-homily": 150,
  homily: 150,
  // The miscellaneous Apostolic shelf runs from the first century to the ninth.
  "apology-of-aristides": 140,
  "apocalypse-of-peter": 135,
  "gospel-of-peter": 150,
  "testament-of-abraham": 120,
  "passion-of-the-scillitan-martyrs": 180,
  "passion-of-the-holy-martyrs-perpetua-and-felicitas": 203,
  "testaments-of-the-twelve-patriarchs": 200,
  "acts-of-xanthippe-and-polyxena": 250,
  "constitutions-of-the-holy-apostles": 380,
  "vision-of-paul": 390,
  "early-liturgies": 400,
  "memoirs-of-edessa": 400,
  "apocalypse-of-the-virgin": 850,
  decretals: 850,
  // Works on a Father's shelf that are by another hand or from another time.
  "recognitions-of-clement": 330,
  "clementine-homilies": 330,
  "spurious-epistles-of-ignatius": 370,
  "martyrdom-of-ignatius": 400,
  "canons-of-hippolytus": 350,
  "sectional-confession-of-faith": 370,
  "treatise-on-re-baptism": 256,
  "treatise-against-the-heretic-novatian": 255,
  "life-and-passion-of-cyprian": 259,
  "fragments-of-caius": 210,
  "deposition-of-arius": 320,
  "letter-of-eusebius-on-the-council-of-nicaea": 325,
  "oration-of-constantine-to-the-assembly-of-the-saints": 325,
  "historia-acephala": 390,
  "letters-between-emperor-julian-and-basil-letter-360": 750
};

/**
 * Forms that the title rule below gets wrong. Josephus's histories were book rolls, the ordinary
 * form of a Greek book in his day. Later homilies under an early Father's name, whose dates are
 * too uncertain for WORK_YEAR, were copied as parchment books.
 */
const FORM_OVERRIDE: Readonly<Record<string, ManuscriptForm>> = {
  "wars-of-the-jews": "roll",
  "antiquities-of-the-jews": "roll",
  "against-apion": "roll",
  "life-of-flavius-josephus": "roll",
  "four-homilies": "parchment-codex",
  "oration-concerning-simeon-and-anna": "parchment-codex",
  "oration-on-the-palms": "parchment-codex",
  "discourse-on-the-end-of-the-world-and-antichrist": "parchment-codex"
};

/** Before about 330 a Christian codex was usually papyrus; after, large books moved to parchment. */
const PARCHMENT_FROM = 330;

/** Year a work was written, as near as the shelf needs it: WORK_YEAR, else the author's death year. */
export function workYear(work: FormWork, author: { deathYear: number }): number {
  return (work.id && WORK_YEAR[work.id]) || author.deathYear;
}

/**
 * The century to print beside a work, or null when it is not known: a work by another hand or a
 * later pseudepigraphon without a date in WORK_YEAR does not inherit its shelf Father's century.
 */
export function workCentury(work: FormWork, author: { deathYear: number }): number | null {
  if (work.id && !WORK_YEAR[work.id]) {
    const meta = workMeta(work.id);
    if (meta.authorship === "spurious" || meta.authorship === "anonymous" || (meta.attribution && !meta.authorship)) {
      return null;
    }
  }
  const year = workYear(work, author);
  return year <= 0 ? 1 : Math.ceil(year / 100);
}

/**
 * A single letter: the title opens with "Letter" or "Epistle" (after "The", "First", "Canonical"…),
 * or names a synodal or encyclical letter. Collections ("Letters", "Epistles of Cyprian") and books
 * about letters ("Against Two Letters of the Pelagians", "On the Spirit and the Letter") are books.
 */
export function isSingleLetter(title: string): boolean {
  const t = title.trim().replace(/^(?:The|An?)\s+/i, "");
  if (/^(?:(?:First|Second|Third|Fourth|Canonical|Encyclical|Synodal)\s+)?(?:Letter|Epistle)\b(?!s)/i.test(t)) return true;
  return /\b(?:Synodal|Encyclical)\s+Letter\b(?!s)/i.test(t);
}

/**
 * A single letter is shown as a roll. Books are codices, which Christians took up early: papyrus
 * before about 330, parchment after, when large books moved to skin.
 */
export function manuscriptForm(work: FormWork, author: { deathYear: number }): ManuscriptForm {
  const override = work.id ? FORM_OVERRIDE[work.id] : undefined;
  if (override) return override;
  if (isSingleLetter(work.title)) return "roll";
  return workYear(work, author) < PARCHMENT_FROM ? "papyrus-codex" : "parchment-codex";
}

export const FORM_NOTES: Record<ManuscriptForm, { label: string; note: string; hint: string }> = {
  roll: {
    label: "Papyrus roll",
    note: "A single letter was written on a papyrus sheet, rolled or folded, and carried by hand. In the first century the roll was also the ordinary form of a book.",
    hint: "Drag or scroll to unroll"
  },
  "papyrus-codex": {
    label: "Papyrus codex",
    note: "Christians took up the codex, a book of folded leaves, earlier than most of their neighbours. Before the fourth century most were papyrus.",
    hint: "Tap a page to turn it"
  },
  "parchment-codex": {
    label: "Parchment codex",
    note: "From the fourth century large books were increasingly copied onto parchment, the material of the great Bibles of that age.",
    hint: "Tap a page to turn it"
  }
};
