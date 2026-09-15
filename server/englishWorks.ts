import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import type { Author, Footnote, Passage, Work } from "./types";

export type ChunkMode = "book" | "chapter" | "sermon" | "letter" | "homily";

export type EnglishWorkSpec = {
  id: string;
  author: string;
  title: string;
  short: string;
  series: string;
  path: string;
  chunk: ChunkMode | "auto" | "blob";
  expectUnits?: number;
  authorshipDisputed?: boolean;
  /** Slice the extract before this heading (Word-Check: drop glued-on works / elucidations). */
  endAt?: RegExp;
};

/** Hand overrides for works that need a fixed chunk mode / unit count. */
const SPEC_OVERRIDES: Record<string, Partial<EnglishWorkSpec>> = {
  "city-of-god": { chunk: "book", expectUnits: 22 },
  "concerning-virgins": { chunk: "chapter" },
  "teaching-of-the-twelve-apostles": {
    chunk: "chapter",
    expectUnits: 16,
    endAt: /^\s*Elucidations\.?\s*$/im
  },
  "pastor-of-hermas": { chunk: "book", expectUnits: 3 },
  "clementine-homilies": { chunk: "homily" },
  "martyrdom-of-justin": {
    chunk: "chapter",
    expectUnits: 5,
    endAt: /Introductory Note to Iren/i
  },
  "fragments-on-the-resurrection": {
    chunk: "chapter",
    endAt: /Introductory Note to the Martyrdom/i
  },
  "epistle-of-barnabas": { chunk: "chapter", endAt: /^\s*Papias\s*$/im },
  "first-epistle-of-clement": { chunk: "chapter", endAt: /^\s*Mathetes\s*$/im },
  "epistle-to-diognetus": { chunk: "chapter", endAt: /^\s*Polycarp\s*$/im },
  "epistle-to-the-philippians": {
    chunk: "chapter",
    endAt: /Introductory Note to the Epistle Concerning the Martyrdom of Polycarp/i
  },
  "martyrdom-of-polycarp": { chunk: "chapter", endAt: /^\s*Ignatius\s*$/im },
  "fragments-of-papias": { chunk: "chapter", endAt: /^\s*Justin Martyr\s*$/im },
  "first-apology": { chunk: "chapter", endAt: /^\s*justin_martyr second_apology/im },
  "second-apology": { chunk: "chapter", endAt: /^\s*justin_martyr dialog_with_trypho/im },
  "dialogue-with-trypho": { chunk: "chapter", endAt: /^\s*justin_martyr discourse_to_the_greeks/im },
  "martyrdom-of-ignatius": { chunk: "chapter", endAt: /^\s*Barnabas\s*$/im },
  "epistles-of-ignatius": {
    endAt: /^\s*Introductory Note to the Syriac Version of the Ignatian Epistles\s*$/im
  },
  // Column-0 "Appendix I." only — indented "See / Appendix I." mid-notes must not cut early.
  commonitory: { chunk: "chapter", endAt: /^Appendix I\.\s*$/m },
  "institutes-and-conferences": { endAt: /^\s*THE SEVEN BOOKS OF JOHN CASSIAN\s*$/im },
  "book-of-pastoral-rule": { endAt: /^\s*Register of the Epistles of Saint Gregory/im },
  sermons: { chunk: "sermon", endAt: /^\s*Prolegomena\.?\s*$/im },
  "ecclesiastical-history": { chunk: "book", expectUnits: 7, endAt: /^\s*Memoir of Sozomen\.?\s*$/im },
  "ecclesiastical-history-and-dialogues": { endAt: /^\s*Jerome and Gennadius\.?\s*$/im },
  // Josephus (Whiston): single-blob for now; book/chapter polish later.
  "antiquities-of-the-jews": { chunk: "blob" },
  "wars-of-the-jews": { chunk: "blob" },
  "against-apion": { chunk: "blob" },
  "life-of-flavius-josephus": { chunk: "blob" },
  "discourse-to-the-greeks-concerning-hades": { chunk: "blob", authorshipDisputed: true }
};

/** Skip these under *_English (already shipped elsewhere, or non-Schaff). */
const SKIP_FILES = new Set([
  "The Confessions of St. Augustine. Augustine.txt", // Pusey → confessions work
  "The Confessions (NPNF Pilkington).txt" // duplicate of Confessions for MVP
]);

type AuthorMeta = { name: string; dates: string; era: string; region: string; deathYear: number; bio: string };

const AUTHOR_META: Record<string, AuthorMeta> = {
  ambrose: { name: "Ambrose of Milan", dates: "c. 340–397", era: "post-nicene", region: "Italy", deathYear: 397, bio: "" },
  arnobius: { name: "Arnobius of Sicca", dates: "fl. c. 300", era: "ante-nicene", region: "North Africa", deathYear: 303, bio: "" },
  augustine: { name: "Augustine of Hippo", dates: "354–430", era: "post-nicene", region: "North Africa", deathYear: 430, bio: "" },
  commodianus: { name: "Commodianus", dates: "fl. 3rd–5th c.", era: "ante-nicene", region: "West", deathYear: 260, bio: "" },
  gregory: { name: "Gregory the Great", dates: "c. 540–604", era: "post-nicene", region: "Italy", deathYear: 604, bio: "" },
  gregory_thaumaturgus: { name: "Gregory Thaumaturgus", dates: "c. 213–c. 270", era: "ante-nicene", region: "Pontus", deathYear: 270, bio: "" },
  methodius: { name: "Methodius of Olympus", dates: "d. c. 311", era: "ante-nicene", region: "Olympus", deathYear: 311, bio: "" },
  jerome: { name: "Jerome", dates: "c. 347–420", era: "post-nicene", region: "Rome / Palestine", deathYear: 420, bio: "" },
  lactantius: { name: "Lactantius", dates: "c. 250–325", era: "ante-nicene", region: "North Africa / Gaul", deathYear: 325, bio: "" },
  leo: { name: "Leo the Great", dates: "c. 400–461", era: "post-nicene", region: "Italy", deathYear: 461, bio: "" },
  minucius_felix: { name: "Minucius Felix", dates: "fl. 2nd–3rd c.", era: "ante-nicene", region: "Rome", deathYear: 220, bio: "" },
  novatian: { name: "Novatian", dates: "fl. mid-3rd c.", era: "ante-nicene", region: "Rome", deathYear: 250, bio: "" },
  sulpicius_severus: { name: "Sulpicius Severus", dates: "c. 363–c. 425", era: "post-nicene", region: "Gaul", deathYear: 425, bio: "" },
  tertullian: { name: "Tertullian", dates: "c. 155–c. 240", era: "ante-nicene", region: "North Africa", deathYear: 240, bio: "" },
  vincent: { name: "Vincent of Lérins", dates: "d. c. 450", era: "post-nicene", region: "Gaul", deathYear: 450, bio: "" },
  justin: { name: "Justin Martyr", dates: "c. 100–165", era: "ante-nicene", region: "Rome", deathYear: 165, bio: "" },
  irenaeus: { name: "Irenaeus of Lyons", dates: "c. 130–c. 202", era: "ante-nicene", region: "Gaul", deathYear: 202, bio: "" },
  clement_rome: { name: "Clement of Rome", dates: "fl. c. 96", era: "ante-nicene", region: "Rome", deathYear: 99, bio: "" },
  ignatius: { name: "Ignatius of Antioch", dates: "d. c. 110", era: "ante-nicene", region: "Syria", deathYear: 110, bio: "" },
  polycarp: { name: "Polycarp of Smyrna", dates: "c. 69–155", era: "ante-nicene", region: "Asia Minor", deathYear: 155, bio: "" },
  hermas: { name: "Hermas", dates: "fl. 2nd c.", era: "ante-nicene", region: "Rome", deathYear: 140, bio: "" },
  barnabas: { name: "Barnabas (Epistle)", dates: "fl. 1st–2nd c.", era: "ante-nicene", region: "Unknown", deathYear: 100, bio: "" },
  didache: { name: "Didache", dates: "fl. 1st–2nd c.", era: "ante-nicene", region: "Syria?", deathYear: 100, bio: "" },
  papias: { name: "Papias of Hierapolis", dates: "fl. early 2nd c.", era: "ante-nicene", region: "Asia Minor", deathYear: 120, bio: "" },
  mathetes: { name: "Mathetes (to Diognetus)", dates: "fl. 2nd c.", era: "ante-nicene", region: "Unknown", deathYear: 150, bio: "" },
  tatian: { name: "Tatian", dates: "fl. mid-2nd c.", era: "ante-nicene", region: "Syria", deathYear: 170, bio: "" },
  theophilus: { name: "Theophilus of Antioch", dates: "fl. late 2nd c.", era: "ante-nicene", region: "Syria", deathYear: 185, bio: "" },
  athenagoras: { name: "Athenagoras", dates: "fl. late 2nd c.", era: "ante-nicene", region: "Athens", deathYear: 180, bio: "" },
  clement_alexandria: { name: "Clement of Alexandria", dates: "c. 150–c. 215", era: "ante-nicene", region: "Egypt", deathYear: 215, bio: "" },
  origen: { name: "Origen", dates: "c. 185–c. 254", era: "ante-nicene", region: "Egypt / Palestine", deathYear: 254, bio: "" },
  hippolytus: { name: "Hippolytus", dates: "c. 170–c. 235", era: "ante-nicene", region: "Rome", deathYear: 235, bio: "" },
  cyprian: { name: "Cyprian of Carthage", dates: "d. 258", era: "ante-nicene", region: "North Africa", deathYear: 258, bio: "" },
  dionysius: { name: "Dionysius", dates: "fl. 3rd c.", era: "ante-nicene", region: "Various", deathYear: 260, bio: "" },
  eusebius: { name: "Eusebius of Caesarea", dates: "c. 260–c. 339", era: "post-nicene", region: "Palestine", deathYear: 339, bio: "" },
  athanasius: { name: "Athanasius of Alexandria", dates: "c. 296–373", era: "post-nicene", region: "Egypt", deathYear: 373, bio: "" },
  basil: { name: "Basil the Great", dates: "c. 330–379", era: "post-nicene", region: "Cappadocia", deathYear: 379, bio: "" },
  gregory_nazianzen: { name: "Gregory Nazianzen", dates: "c. 329–390", era: "post-nicene", region: "Cappadocia", deathYear: 390, bio: "" },
  gregory_nyssa: { name: "Gregory of Nyssa", dates: "c. 335–c. 395", era: "post-nicene", region: "Cappadocia", deathYear: 395, bio: "" },
  chrysostom: { name: "John Chrysostom", dates: "c. 347–407", era: "post-nicene", region: "Antioch / Constantinople", deathYear: 407, bio: "" },
  cyril_jerusalem: { name: "Cyril of Jerusalem", dates: "c. 313–386", era: "post-nicene", region: "Palestine", deathYear: 386, bio: "" },
  hilary: { name: "Hilary of Poitiers", dates: "c. 310–c. 367", era: "post-nicene", region: "Gaul", deathYear: 367, bio: "" },
  john_damascus: { name: "John of Damascus", dates: "c. 675–749", era: "post-nicene", region: "Syria", deathYear: 749, bio: "" },
  socrates: { name: "Socrates Scholasticus", dates: "c. 380–c. 439", era: "post-nicene", region: "Constantinople", deathYear: 439, bio: "" },
  sozomen: { name: "Sozomen", dates: "c. 400–c. 450", era: "post-nicene", region: "Constantinople", deathYear: 450, bio: "" },
  theodoret: { name: "Theodoret of Cyrus", dates: "c. 393–c. 458", era: "post-nicene", region: "Syria", deathYear: 458, bio: "" },
  rufinus: { name: "Rufinus of Aquileia", dates: "c. 345–411", era: "post-nicene", region: "Italy", deathYear: 411, bio: "" },
  cassian: { name: "John Cassian", dates: "c. 360–c. 435", era: "post-nicene", region: "Gaul", deathYear: 435, bio: "" },
  ephraim: { name: "Ephraim the Syrian", dates: "c. 306–373", era: "post-nicene", region: "Syria", deathYear: 373, bio: "" },
  aphrahat: { name: "Aphrahat", dates: "fl. 4th c.", era: "post-nicene", region: "Persia", deathYear: 350, bio: "" },
  councils: { name: "Ecumenical Councils", dates: "325–787", era: "post-nicene", region: "Various", deathYear: 451, bio: "" },
  apostolic: { name: "Apostolic Fathers (misc.)", dates: "1st–2nd c.", era: "ante-nicene", region: "Various", deathYear: 120, bio: "" },
  josephus: {
    name: "Flavius Josephus",
    dates: "c. 37–c. 100",
    era: "ante-nicene",
    region: "Judea / Rome",
    deathYear: 100,
    bio: "Jewish historian of the first century. His Antiquities and Wars are primary sources for Second Temple Judaism and the Jewish War against Rome."
  },
  unknown: { name: "Unknown / Collected", dates: "", era: "ante-nicene", region: "Various", deathYear: 150, bio: "" }
};

const BOOK_NUM = "([IVXLCDM]+|\\d+|First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth)";
const BOOK_RE = new RegExp("^\\s*Book\\s+" + BOOK_NUM + "\\s*[\\.\\—\\-.]", "im");
const CHAPTER_RE = /^\s*Chapter\s+([IVXLCDM]+|\d+)\s*[\.—\-.]/im;
const SERMON_RE = /^\s*Sermon\s+([IVXLCDM]+|\d+)\s*\./im;
const LETTER_RE = /^\s*Letter\s+([IVXLCDM]+|\d+)\s*[\.\:\-]/im;
const HOMILY_RE = /^\s*Homily\s+([IVXLCDM]+|\d+)\s*[\.\:\-]/im;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^(the|a|an)-/, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function shortTitle(title: string): string {
  const t = title.replace(/\s*\(.*?\)\s*/g, " ").replace(/\s+/g, " ").trim();
  if (t.length <= 28) return t;
  return t.slice(0, 26).replace(/\s+\S*$/, "") + "…";
}

function fatherIdFromFolder(folder: string): string {
  return folder.replace(/_English$/i, "").toLowerCase();
}

function parseMetaHeaders(src: string): Record<string, string> {
  const meta: Record<string, string> = {};
  for (const line of src.split(/\r?\n/)) {
    if (!/^\s*#/.test(line)) break;
    const m = line.match(/^\s*#\s*([a-z_]+)\s*:\s*(.*)$/i);
    if (m) meta[m[1].toLowerCase()] = m[2].trim();
  }
  return meta;
}

function stripMetaHeaders(src: string): string {
  const lines = src.split(/\r?\n/);
  let i = 0;
  while (i < lines.length && /^\s*#/.test(lines[i])) i++;
  return lines.slice(i).join("\n");
}

const RULE_LINE_RE = /^\s*[_\-]{5,}\s*$/;
const STRUCTURAL_HEADING_RE =
  /^\s*(Book|Chapter|Sermon|Letter|Homily)\s+([IVXLCDM]+|\d+|First|Second|Third|Fourth|Fifth)\b/i;
const EDITORIAL_HEADING_RE =
  /^\s*(?:(?:The\s+following\s+is\s+(?:Dr\.?\s+\w+(?:'s)?\s+)?(?:the\s+)?(?:original\s+)?)?Introductory\s+Not(?:ice|e)s?\b.*|Translator'?s?\s+Introductory\s+Not(?:ice|e)\.?|Translator'?s?\s+Preface\.?|Prefatory\s+Note\.?|Prolegomena\.?|Elucidations?\.?|General\s+Note\.?)\s*$/i;
const TERMINAL_EDITORIAL_RE = /^\s*(Elucidations?|General\s+Note)\b/i;
const FOOTNOTE_BODY_RE = /^\[(\d+)\]\s+(?!--|—)(.+)$/;
const FOOTNOTE_MARK_RE = /\[(\d+)\]/g;

/** Drop Schaff/editor sections and decorative rules from a raw unit block. */
export function stripEditorialSections(block: string): string {
  const lines = block.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let skipping: false | "until" | "end" = false;
  for (const line of lines) {
    if (RULE_LINE_RE.test(line)) continue;
    if (/ccel\.org/i.test(line)) continue;
    if (/^\s*[a-z0-9_]+(?:[ _-][a-z0-9_]+)+\s+anf\d+\b/i.test(line)) continue;
    if (EDITORIAL_HEADING_RE.test(line)) {
      skipping = TERMINAL_EDITORIAL_RE.test(line) ? "end" : "until";
      continue;
    }
    if (skipping === "end") continue;
    if (skipping === "until") {
      if (STRUCTURAL_HEADING_RE.test(line)) {
        skipping = false;
        out.push(line);
      }
      continue;
    }
    out.push(line);
  }
  return out.join("\n");
}

function parasFromBlock(block: string): string[] {
  return block
    .split(/\n\s*\n/)
    .map((p) => p.replace(/[ \t]+\n/g, "\n").replace(/\s+\n/g, "\n").replace(/\n+/g, " ").replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 0 && !/^_{5,}$/.test(p) && !/^-+$/.test(p));
}

/**
 * Pull matched Schaff [n] footnote bodies into Footnote[]; strip markers from body.
 * Orphan bodies and unmatched markers are discarded / stripped (no footnote entry).
 */
export function extractSchaffNotes(paras: string[]): { paras: string[]; footnotes: Footnote[] } {
  const bodies = new Map<string, string>();
  const bodyIndexes = new Set<number>();

  paras.forEach((p, i) => {
    const m = p.match(FOOTNOTE_BODY_RE);
    if (!m) return;
    const n = m[1];
    const text = m[2].trim();
    if (!text) return;
    bodyIndexes.add(i);
    if (!bodies.has(n)) bodies.set(n, text);
    else bodies.set(n, bodies.get(n) + " " + text);
  });

  const footnotes: Footnote[] = [];
  const usedBodies = new Set<string>();
  const cleaned: string[] = [];

  paras.forEach((p, i) => {
    if (bodyIndexes.has(i)) return;
    let text = p;
    const marks: string[] = [];
    text = text.replace(FOOTNOTE_MARK_RE, (_whole, n: string) => {
      marks.push(n);
      return "";
    });
    text = text.replace(/[ \t]{2,}/g, " ").replace(/\s+([,.;:!?])/g, "$1").replace(/\s+/g, " ").trim();
    if (!text) return;
    const paraIndex = cleaned.length;
    cleaned.push(text);
    for (const n of marks) {
      if (!bodies.has(n) || usedBodies.has(n)) continue;
      usedBodies.add(n);
      footnotes.push({ n, text: bodies.get(n)!, para: paraIndex });
    }
  });

  return { paras: cleaned, footnotes };
}

/** Drop Schaff chapter-title leftovers left after the unit regex consumes "Chapter N." */
function dropLeadingTitleRemnant(paras: string[]): string[] {
  if (!paras.length) return paras;
  const first = paras[0];
  // e.g. "--Justice demanded." or "[2389] --The Second Commandment…"
  if (/^(?:\[\d+\]\s*)?(?:[\.\-–—]){1,3}\S/.test(first) && first.length <= 160) {
    return paras.slice(1);
  }
  return paras;
}

/** Strip editorial apparatus, paragraphize, then extract matched footnotes. */
export function parasAndNotesFromBlock(block: string): { paras: string[]; footnotes: Footnote[] } {
  const stripped = stripEditorialSections(block);
  const { paras, footnotes } = extractSchaffNotes(dropLeadingTitleRemnant(parasFromBlock(stripped)));
  return { paras, footnotes };
}

function findMarks(src: string, re: RegExp): { label: string; index: number; end: number }[] {
  const flags = re.flags.includes("g") ? re.flags : re.flags + "g";
  const global = new RegExp(re.source, flags);
  const marks: { label: string; index: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = global.exec(src))) {
    marks.push({ label: m[1], index: m.index, end: m.index + m[0].length });
  }
  return marks;
}

function romanOrNum(label: string): string {
  return label.toUpperCase();
}

function unitRegex(mode: ChunkMode): RegExp {
  if (mode === "book") return BOOK_RE;
  if (mode === "sermon") return SERMON_RE;
  if (mode === "letter") return LETTER_RE;
  if (mode === "homily") return HOMILY_RE;
  return CHAPTER_RE;
}

function unitLabel(mode: ChunkMode, label: string): string {
  if (mode === "book") return "Book " + romanOrNum(label);
  if (mode === "sermon") return "Sermon " + romanOrNum(label);
  if (mode === "letter") return "Letter " + romanOrNum(label);
  if (mode === "homily") return "Homily " + romanOrNum(label);
  return "Chapter " + romanOrNum(label);
}

function detectChunk(raw: string): ChunkMode | "blob" {
  const books = findMarks(raw, BOOK_RE).length;
  const chapters = findMarks(raw, CHAPTER_RE).length;
  const sermons = findMarks(raw, SERMON_RE).length;
  const letters = findMarks(raw, LETTER_RE).length;
  const homilies = findMarks(raw, HOMILY_RE).length;

  // Prefer distinctive sermon/letter/homily collections when dense.
  if (sermons >= 5 && sermons >= chapters && sermons >= books) return "sermon";
  if (letters >= 5 && letters >= chapters && letters >= books) return "letter";
  if (homilies >= 5 && homilies >= chapters && homilies >= books) return "homily";

  // Many chapters per book → navigate by book (City of God, Trinity, etc.)
  if (books >= 2 && (chapters < 2 || chapters / books >= 10)) return "book";
  if (chapters >= 2) return "chapter";
  if (books >= 2) return "book";
  if (sermons >= 2) return "sermon";
  if (letters >= 2) return "letter";
  if (homilies >= 2) return "homily";
  return "blob";
}

/** Discover every Fathers/English/*_English/*.txt extract as an app work. */
export function discoverEnglishWorkSpecs(root: string): EnglishWorkSpec[] {
  const englishRoot = join(root, "Fathers", "English");
  if (!existsSync(englishRoot)) return [];
  const specs: EnglishWorkSpec[] = [];
  const usedIds = new Set<string>();

  for (const folder of readdirSync(englishRoot).sort()) {
    if (!folder.endsWith("_English")) continue;
    const fatherFolder = join(englishRoot, folder);
    const author = fatherIdFromFolder(folder);
    for (const file of readdirSync(fatherFolder).sort()) {
      if (!file.endsWith(".txt")) continue;
      if (SKIP_FILES.has(file)) continue;
      const abs = join(fatherFolder, file);
      const raw = readFileSync(abs, "utf8");
      const meta = parseMetaHeaders(raw);
      const title = (meta.work || file.replace(/\.txt$/i, "")).trim();
      let id = slugify(title);
      if (!id) id = slugify(file.replace(/\.txt$/i, "")) || "work";
      // Disambiguate collisions (e.g. Letters.txt under multiple fathers)
      if (usedIds.has(id)) id = slugify(author + "-" + title) || id + "-" + author;
      if (usedIds.has(id)) id = id + "-" + usedIds.size;
      usedIds.add(id);

      const series = meta.series || "Schaff";
      const path = ["Fathers", "English", folder, file].join("/");
      const base: EnglishWorkSpec = {
        id,
        author,
        title,
        short: shortTitle(title),
        series,
        path,
        chunk: "auto"
      };
      const over = SPEC_OVERRIDES[id];
      specs.push(over ? { ...base, ...over, id, path, author, title: over.title || title } : base);
    }
  }
  return specs;
}

/** @deprecated Prefer discoverEnglishWorkSpecs — kept for tests / explicit pin of Virgins + City. */
export const ENGLISH_APP_WORKS: EnglishWorkSpec[] = [
  {
    id: "concerning-virgins",
    author: "ambrose",
    title: "Concerning Virgins",
    short: "Virgins",
    series: "NPNF2",
    path: "Fathers/English/Ambrose_English/Concerning Virgins.txt",
    chunk: "chapter"
  },
  {
    id: "city-of-god",
    author: "augustine",
    title: "The City of God",
    short: "Civ. Dei",
    series: "NPNF1",
    path: "Fathers/English/Augustine_English/The City of God.txt",
    chunk: "book",
    expectUnits: 22
  }
];

export function authorMeta(id: string): Author {
  const m = AUTHOR_META[id] || {
    name: id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    dates: "",
    era: "post-nicene",
    region: "",
    deathYear: 400,
    bio: ""
  };
  return { id, ...m };
}

export function wordCountFromPassages(passages: Passage[]): number {
  let n = 0;
  for (const p of passages) {
    for (const [id, paras] of Object.entries(p.versions)) {
      if (id === "lat" || id === "grk") continue;
      for (const para of paras) {
        const parts = para.trim().split(/\s+/);
        if (parts[0]) n += parts.length;
      }
    }
  }
  return n;
}

function workFromSpec(spec: EnglishWorkSpec, passages: Passage[]): Work {
  return {
    id: spec.id,
    author: spec.author,
    title: spec.title,
    short: spec.short,
    chapters: passages.length,
    series: spec.series,
    wordCount: Math.max(1, wordCountFromPassages(passages)),
    ...(spec.authorshipDisputed ? { authorshipDisputed: true } : {})
  };
}

export function authorsFromSpecs(specs: EnglishWorkSpec[]): Author[] {
  const seen = new Set<string>();
  const out: Author[] = [];
  for (const s of specs) {
    if (seen.has(s.author)) continue;
    seen.add(s.author);
    out.push(authorMeta(s.author));
  }
  return out;
}

/** Allow trailing note markers e.g. "Book IV. [160]" — see unit regexes above. */

/** Split English Schaff extract into Passage units (translation id: schaff). */
export function parseEnglishWork(spec: EnglishWorkSpec, root: string): { work: Work; passages: Passage[] } {
  const file = join(root, spec.path);
  if (!existsSync(file)) throw new Error("Missing English work file: " + spec.path);
  let raw = stripMetaHeaders(readFileSync(file, "utf8"));
  if (spec.endAt) {
    const cut = raw.search(spec.endAt);
    if (cut >= 0) raw = raw.slice(0, cut);
  }

  let mode: ChunkMode | "blob" = spec.chunk === "auto" ? detectChunk(raw) : spec.chunk;

  // Soft-cap ultra-dense chapter scans (e.g. verse/psalm dumps) for MVP memory.
  if (mode !== "blob" && mode !== "book") {
    const previewMarks = findMarks(raw, unitRegex(mode));
    if (previewMarks.length > 400) {
      const books = findMarks(raw, BOOK_RE).length;
      mode = books >= 2 ? "book" : "blob";
    }
  }

  if (mode === "blob") {
    const { paras, footnotes } = parasAndNotesFromBlock(raw);
    // Split giant blobs into navigable chunks (~40 paras) so the reader/API stay usable.
    // Footnotes are remapped to the chunk-local para index; notes whose para falls outside a chunk are dropped.
    if (paras.length > 80) {
      const chunkSize = 40;
      const passages: Passage[] = [];
      for (let i = 0; i < paras.length; i += chunkSize) {
        const slice = paras.slice(i, i + chunkSize);
        const n = passages.length + 1;
        const chunkNotes = footnotes
          .filter((f) => f.para >= i && f.para < i + chunkSize)
          .map((f) => ({ ...f, para: f.para - i }));
        passages.push({
          work: spec.id,
          chapter: n,
          heading: spec.title + " · Part " + n,
          versions: { schaff: slice },
          footnotes: chunkNotes
        });
      }
      return { work: workFromSpec(spec, passages), passages };
    }
    const blobPassages: Passage[] = [
      {
        work: spec.id,
        chapter: 1,
        heading: spec.title,
        versions: { schaff: paras.length ? paras : [raw.trim() || spec.title] },
        footnotes
      }
    ];
    return { work: workFromSpec(spec, blobPassages), passages: blobPassages };
  }

  const unitRe = unitRegex(mode);
  const marks = findMarks(raw, unitRe);
  if (!marks.length) {
    const { paras, footnotes } = parasAndNotesFromBlock(raw);
    const blobPassages: Passage[] = [
      {
        work: spec.id,
        chapter: 1,
        heading: spec.title,
        versions: { schaff: paras.length ? paras : [raw.trim() || spec.title] },
        footnotes
      }
    ];
    return { work: workFromSpec(spec, blobPassages), passages: blobPassages };
  }

  const bookMarks = mode === "chapter" ? findMarks(raw, BOOK_RE) : [];

  const passages: Passage[] = [];
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i].end;
    const stop = i + 1 < marks.length ? marks[i + 1].index : raw.length;
    const block = raw.slice(start, stop);
    const { paras, footnotes } = parasAndNotesFromBlock(block);
    let heading = unitLabel(mode, marks[i].label);
    if (mode === "chapter") {
      let bookLabel = "";
      for (let b = bookMarks.length - 1; b >= 0; b--) {
        if (bookMarks[b].index <= marks[i].index) {
          bookLabel = romanOrNum(bookMarks[b].label);
          break;
        }
      }
      const firstLine = stripEditorialSections(block)
        .split(/\r?\n/)
        .map((l) => l.trim())
        .find((l) => l.length > 0 && !RULE_LINE_RE.test(l) && !FOOTNOTE_BODY_RE.test(l)) || "";
      const titleBit = firstLine.replace(/^\[(\d+)\]\s*/, "").replace(/^[\.—\-\s]+/, "").slice(0, 120);
      heading = (bookLabel ? "Book " + bookLabel + " · " : "") + heading + (titleBit ? " — " + titleBit : "");
    }
    passages.push({
      work: spec.id,
      chapter: i + 1,
      heading,
      versions: { schaff: paras.length ? paras : [stripEditorialSections(block).replace(/\s+/g, " ").trim() || spec.title] },
      footnotes
    });
  }

  if (spec.expectUnits != null && passages.length !== spec.expectUnits) {
    throw new Error(
      spec.id + ": expected " + spec.expectUnits + " " + mode + " units, found " + passages.length
    );
  }

  return { work: workFromSpec(spec, passages), passages };
}

export function loadEnglishAppWorks(root: string): { works: Work[]; passages: Passage[]; authors: Author[] } {
  const specs = discoverEnglishWorkSpecs(root);
  const works: Work[] = [];
  const passages: Passage[] = [];
  for (const spec of specs) {
    try {
      const parsed = parseEnglishWork(spec, root);
      works.push(parsed.work);
      passages.push(...parsed.passages);
    } catch (err) {
      // MVP: never block the whole library on one bad extract — ship as one blob.
      console.warn("[englishWorks] fallback blob for", spec.id, err);
      const file = join(root, spec.path);
      const raw = existsSync(file) ? stripMetaHeaders(readFileSync(file, "utf8")) : "";
      const { paras, footnotes } = parasAndNotesFromBlock(raw);
      const fallback: Passage[] = [
        {
          work: spec.id,
          chapter: 1,
          heading: spec.title,
          versions: { schaff: paras.length ? paras : [raw.trim() || spec.title] },
          footnotes
        }
      ];
      works.push(workFromSpec(spec, fallback));
      passages.push(...fallback);
    }
  }
  return { works, passages, authors: authorsFromSpecs(specs) };
}
