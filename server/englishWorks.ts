import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import type { Author, Footnote, Passage, SubChapter, Work } from "./types";
import { workMeta } from "./workMeta";
import { clavisForPath } from "./workClavis";

export type ChunkMode = "book" | "chapter" | "sermon" | "letter" | "homily";

export type EnglishWorkSpec = {
  id: string;
  author: string;
  title: string;
  short: string;
  series: string;
  path: string;
  chunk: ChunkMode | "auto" | "blob" | "section";
  expectUnits?: number;
  authorshipDisputed?: boolean;
  /** Slice the extract before this heading (Word-Check: drop glued-on works / elucidations). */
  endAt?: RegExp;
  /**
   * Two-level works: inside each book, paragraphs matching this pattern are chapter headings.
   * `true` uses SUBCHAPTER_RE ("Chapter IV.--Title."). Group 1 = number, group 2 = title.
   */
  subChapters?: true | RegExp;
  /** Override the unit heading pattern for this work (group 1 = number, or group 2 = a word like PREFACE). */
  unitRe?: RegExp;
  /** Slice the extract from this heading (drop Gutenberg headers, contents, intro matter). */
  startAt?: RegExp;
  /** Drop raw line blocks: from a line matching `start` up to (not including) a line matching `until`. */
  dropBlocks?: { start: RegExp; until: RegExp }[];
  /** Drop paragraphs matching this (e.g. book "Containing the interval..." summaries). */
  dropParas?: RegExp;
  /** Remove note markers from the text (e.g. glued superscripts "earth,3"). */
  stripNoteMarks?: RegExp;
  /** Do not show footnotes for this work. */
  dropFootnotes?: boolean;
  /** Chapter markers start a body paragraph ("1. I suppose…"): keep the paragraph, add a "Chapter N" heading before it. */
  subChapterInline?: boolean;
  /** Label chapters by their order ("Chapter 5") instead of the source numeral (fixes stray "CHAPTER V."). */
  subChapterSequence?: boolean;
  /** Chapter-mode headings are just "Chapter N" (no first-line title), for numbered-paragraph works. */
  bareHeadings?: boolean;
  /** Use the unitRe match itself as the heading (e.g. an epistle title) instead of "Book N". */
  keepUnitLabel?: boolean;
  /** Fixed headings for the units in order (e.g. two recensions marked only by a title line). */
  unitTitles?: string[];
  /**
   * Units are "Sec. N.--Title" sections that restart at Sec. I in each book: headings become
   * "Book II · Sec. 3 — Title" (unitRe group 1 = section numeral, group 2 = title).
   */
  bookSections?: boolean;
  /** Sub-chapters are navigation anchors only: no heading is added to the reader text. */
  subChapterHidden?: boolean;
  /** Chapter titles from a numbered list in the text ("1. Simon Peter.") that starts at this heading. */
  titleListAt?: RegExp;
  /**
   * The file holds several works whose numbering restarts at I (Chrysostom's Homilies on Acts, then on
   * Romans): each unit's heading is prefixed with its work, "Homilies on Romans · Homily I".
   */
  unitGroups?: string[];
  /** Prefix each unit's heading with the last match of this pattern before it (group 1), e.g. the epistle. */
  groupRe?: RegExp;
  /**
   * ANF I prints the Ignatian epistles in two columns: each passage of the shorter (Greek) recension
   * followed by the same passage in the longer, interpolated recension. Keep only the shorter.
   */
  shorterRecensionOnly?: boolean;
  /** Translator named by the source (see translatorFrom), or set by hand where the source names one elsewhere. */
  translator?: string;
  /** Printed edition the text comes from, e.g. "Ante-Nicene Fathers, vol. III" (see editionFrom). */
  edition?: string;
  /** Units (by 1-based number) that NPNF prints only as an editor's summary. */
  summaryOnly?: number[];
  /** Mark units NPNF abridges to a summary or leaves untranslated (see abridgement()). */
  markAbridged?: boolean;
  /** Add Augustine's Retractations note on this work as a last unit: "II.67", from `path` (default: own file). */
  retractations?: { chap: string; path?: string };
  /** Keep a unit whose label repeats the next one (a misprinted numeral), instead of taking it for a contents entry. */
  keepRepeatedLabels?: boolean;
  /** Units (by their heading label, e.g. "Oration II") left out because another work holds the same text. */
  dropUnitLabels?: string[];
  /** Drop units with almost no text (entries of a contents list that repeat the headings). */
  dropEmptyUnits?: boolean;
};

/** A chapter numeral opening an indented paragraph: "   IV.  And she saw…". */
const ROMAN_PARA_RE = /^ {3,4}([IVXL]+)\.\s{1,3}(?=\S)/m;

/**
 * NPNF2 XIV councils: each council's file opens with an "Elenchus" (contents) and then gives its
 * introduction, creeds, letters, sessions, canons and the editor's excursuses under heading lines. Only a
 * heading alone on its line (three-space indent) starts a unit, so "Chapter LX" in a footnote no longer does.
 */
const COUNCIL_HEAD =
  "(?:Historical |General )?Introduction|Introductory Note|The (?:Nicene )?Creed|Excursus |The (?:XX\\. )?Canons|The (?:Synodal |Synodical )?Letter|Proposed Action|Extracts from the Acts|Session [IVXL]+|Continuation of Session|Historical Note|Note on |The (?:Tome|Sentence|Definition|Decree|Sacra|Emperor's Letter|Capitula|Anathematisms|Canonical Epistle|Statement|Allocution|Prosphoneticus)";
const COUNCIL_UNIT_RE = new RegExp(
  // "Extracts from the Acts." + "Session I." is one heading; a title that wraps (no full stop) takes its next line.
  // A line with a sentence break in it ("Introduction to the Third Edition… He says:") is body text.
  "^ {3}(?![^\\n]*\\.[ \\t]+[A-Z][a-z])((?:Extracts from the Acts\\.?[ \\t]*\\n[ \\t]*\\n {3}(?=Session))?(?:" +
    COUNCIL_HEAD +
    ")(?:[^\\n]*[^\\n.\\]\\s][ \\t]*\\n {3}(?![\\[(])\\S)?[^\\n]*)$",
  "m"
);
const COUNCIL_SPEC: Partial<EnglishWorkSpec> = {
  chunk: "chapter",
  startAt: /(?<=^\s*Elenchus\.[\s\S]*?\n\s*_{10,}[ \t]*\n)/m,
  unitRe: COUNCIL_UNIT_RE,
  keepUnitLabel: true,
  bareHeadings: true,
  dropEmptyUnits: true
};

/** Hand overrides for works that need a fixed chunk mode / unit count. */
const SPEC_OVERRIDES: Record<string, Partial<EnglishWorkSpec>> = {
  "first-ecumenical-council-nicea-i-325": { ...COUNCIL_SPEC, title: "First Ecumenical Council - Nicaea I (325)" },
  "second-ecumenical-council-constantinople-i-381": COUNCIL_SPEC,
  "third-ecumenical-council-ephesus-431": COUNCIL_SPEC,
  "fourth-ecumenical-council-chalcedon-451": COUNCIL_SPEC,
  "fifth-ecumenical-council-constantinople-ii-553": COUNCIL_SPEC,
  "sixth-ecumenical-council-and-trullo-680-692": COUNCIL_SPEC,
  "seventh-ecumenical-council-nicea-ii-787": { ...COUNCIL_SPEC, title: "Seventh Ecumenical Council - Nicaea II (787)" },
  // Percival's Preface and General Introduction (the T&T Clark title page is dropped).
  "seven-ecumenical-councils": {
    chunk: "chapter",
    startAt: /^ {3}Preface\.\s*$/m,
    unitRe: /^ {3}(Preface\.|[IVX]+\. {2}[^\n]+)$/m,
    keepUnitLabel: true
  },
  // The file holds all of NPNF1 VII: the 124 Tractates on John, then the Homilies on 1 John and the Soliloquies
  // (each also has its own file). Without this the split found only the Soliloquies' "Book I/II".
  "homilies-on-the-gospel-of-john": {
    chunk: "chapter",
    unitRe: /^\s*(Tractate\s+[IVXLC]+)\.\s*$/m,
    keepUnitLabel: true,
    endAt: /^\s*St\. AUGUSTIN:\s*\n\s*ten homilies\s*$/im
  },
  // The file holds all of Sulpicius (NPNF2 XI): the Life, then his Letters, Dialogues and Sacred History (EXTRA_SPECS).
  "on-the-life-of-st-martin": { chunk: "chapter", endAt: /^The Letters of Sulpitius Severus\.\s*$/m },
  "city-of-god": { chunk: "book", expectUnits: 22 },
  "concerning-virgins": { chunk: "chapter" },
  didache: {
    chunk: "chapter",
    expectUnits: 16,
    endAt: /^\s*Elucidations\.?\s*$/im
  },
  // ANF II: "Book First.--Visions.", "Book Second.--Commandments." (the Mandates), "Book Third.--Similitudes."
  "pastor-of-hermas": { chunk: "book", expectUnits: 3, unitTitles: ["Visions", "Mandates", "Similitudes"] },
  // Column-start "Homily IV." only; wrapped footnotes like "Homily XVIII. chap. 20" are not units.
  "clementine-homilies": {
    chunk: "homily",
    unitRe: /^\s*Homily\s+([IVXLC]+)\.\s*$/m,
    subChapters: true,
    endAt: /^\s*Apocrypha of the New Testament\s*$/m
  },
  // 2 Clement (ANF VII): lower-case "Chap. iv.--title" headings.
  homily: { chunk: "chapter", unitRe: /^\s*Chap\.\s+([ivxlc]+)\.\s*--/im },
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
  // The seven epistles, chapter by chapter, in the shorter (genuine Greek) recension only; headings name the epistle.
  "epistles-of-ignatius": {
    endAt: /^\s*Introductory Note to the Syriac Version of the Ignatian Epistles\s*$/im,
    groupRe: /^The Epistle of Ignatius to (?:the )?([A-Z][a-zæ]+)/m,
    shorterRecensionOnly: true
  },
  // Column-0 "Appendix I." only — indented "See / Appendix I." mid-notes must not cut early.
  commonitory: { chunk: "chapter", endAt: /^Appendix I\.\s*$/m },
  // Three Parts, each a preface and its Conferences. The automatic split caught "Book VI. c. xxxvii." in the
  // footnotes and made three chunks starting mid-note; here each Part's preface and each Conference is a unit
  // (Conference headings sit at a two-space indent), with the Conference's own chapters inside it.
  // No chapter headings, so it had been cut into four 40-paragraph "Parts", the first a table of contents
  // (the 3D book opened on it). Its own contents group the 94 numbered sections under titles: each group is a
  // chapter, after the Prologue. One footnote line in the Prologue also starts "63. ", so it is skipped.
  "life-of-antony": {
    chunk: "chapter",
    startAt: /^\s*The life and conversation of our holy Father, Antony/m,
    unitRe: /^(\s*The life and conversation of our holy Father, Antony[\s\S]*?Athanasius, Bishop of Alexandria\.| {3}(?!63\. The preface)(?:1|3|5|7|8|11|12|14|16|44|45|46|47|48|49|51|54|55|57|58|59|60|61|63|65|66|67|68|69|70|72|80|81|82|83|85|86|87|88|89|91|92|93|94)\. (?=\S))/m,
    unitTitles: [
      "Prologue",
      "§§1–2 — Birth and beginnings of Antony",
      "§§3–4 — His early ascetic life",
      "§§5–6 — Early conflicts with the devil",
      "§7 — Details of his life at this time (271–285?)",
      "§§8–10 — His life in the tombs, and combats with demons there",
      "§11 — He goes to the desert and overcomes temptations on the way",
      "§§12–13 — How Antony took up his abode in a ruined fort across the Nile, and how he defeated the demons",
      "§§14–15 — How he left the fort, and how monasticism began to flourish in Egypt",
      "§§16–43 — His address to monks, exhorting them to perseverance against the wiles of Satan",
      "§44 — The growth of the monastic life at this time (about A.D. 305)",
      "§45 — How Antony renewed his ascetic endeavours at this time",
      "§46 — How he sought martyrdom at Alexandria during the Persecution (311)",
      "§47 — How he lived at this time",
      "§48 — How he delivered a woman from an evil spirit",
      "§§49–50 — How at this time he betook himself to his inner mountain",
      "§§51–53 — How he there combated the demons",
      "§54 — Of the miraculous spring, and of Antony's sister",
      "§§55–56 — How humanely he counselled those who resorted to him",
      "§57 — Of the case of Fronto, healed by faith and prayer",
      "§58 — Of a certain virgin, and of Paphnutius the confessor",
      "§59 — Of the two brethren, and how one perished of thirst",
      "§60 — Of the death of Amun, and Antony's vision thereof",
      "§§61–62 — Of Count Archelaus and the virgin Polycration",
      "§§63–64 — Strange tales of the casting out of demons",
      "§65 — Of Antony's vision concerning the forgiveness of his sins",
      "§66 — Of the passage of souls, and how some were hindered of Satan",
      "§67 — How Antony reverenced all ordained persons",
      "§68 — How he rejected the schism of Meletius and the heresies of Manes and Arius",
      "§69 — How he confuted the Arians",
      "§§70–71 — How he visited Alexandria, and how Athanasius escorted him from the city",
      "§§72–79 — How he reasoned with divers Greeks and philosophers",
      "§80 — How he confuted the philosophers by healing certain vexed with demons",
      "§81 — How the Emperors wrote to Antony, and of his answer",
      "§82 — How he saw in a vision the present doings of the Arians",
      "§§83–84 — That his healings were done by Christ alone, through prayer",
      "§85 — How wisely he answered a certain duke",
      "§86 — Of the Duke Balacius, and how, warned by Antony, he met with a miserable end",
      "§87 — How he bore the infirmities of the weak, and of his great benefits to all Egypt",
      "§88 — Of his discernment, and how he was a counsellor to all",
      "§§89–90 — How, when now 105 years old, he counselled the monks, and gave advice concerning burial",
      "§91 — Of his sickness and his last will",
      "§92 — Of Antony's death",
      "§93 — How Antony remained hale until his death, and how his fame filled all the world",
      "§94 — The end"
    ]
  },
  // The Preface, then Books I–XII. Only a "Book N." alone on its line is a book: footnotes such as
  // "Book IV. c. xxi.)" had been read as two extra books, and the Preface was dropped.
  "institutes-of-the-coenobia": {
    markAbridged: true,
    chunk: "chapter",
    unitRe: /^(Preface\.|\s{1,4}Book [IVXL]+\.)\s*$/m,
    unitTitles: [
      "Preface",
      "Book I — Of the Dress of the Monks",
      "Book II — Of the Canonical System of the Nocturnal Prayers and Psalms",
      "Book III — Of the Canonical System of the Daily Prayers and Psalms",
      "Book IV — Of the Institutes of the Renunciants",
      "Book V — Of the Spirit of Gluttony",
      "Book VI — On the Spirit of Fornication",
      "Book VII — Of the Spirit of Covetousness",
      "Book VIII — Of the Spirit of Anger",
      "Book IX — Of the Spirit of Dejection",
      "Book X — Of the Spirit of Accidie",
      "Book XI — Of the Spirit of Vainglory",
      "Book XII — Of the Spirit of Pride"
    ],
    subChapters: true
  },
  conferences: {
    markAbridged: true,
    chunk: "chapter",
    // One capture group: the splitter drops a unit whose label repeats the next one's, so each needs its own.
    unitRe: /^(Part [IVX]+\.|  [IVXL]+\. (?:The )?(?:First |Second |Third )?Conference of Abbot [^\n]*)\s*$/m,
    unitTitles: [
      "Preface to Part I (Conferences I–X)",
      "Conference I — Abbot Moses (1)",
      "Conference II — Abbot Moses (2)",
      "Conference III — Abbot Paphnutius",
      "Conference IV — Abbot Daniel",
      "Conference V — Abbot Serapion",
      "Conference VI — Abbot Theodore",
      "Conference VII — Abbot Serenus (1)",
      "Conference VIII — Abbot Serenus (2)",
      "Conference IX — Abbot Isaac (1)",
      "Conference X — Abbot Isaac (2)",
      "Preface to Part II (Conferences XI–XVII)",
      "Conference XI — Abbot Chaeremon (1)",
      "Conference XII — Abbot Chaeremon (2)",
      "Conference XIII — Abbot Chaeremon (3)",
      "Conference XIV — Abbot Nesteros (1)",
      "Conference XV — Abbot Nesteros (2)",
      "Conference XVI — Abbot Joseph (1)",
      "Conference XVII — Abbot Joseph (2)",
      "Preface to Part III (Conferences XVIII–XXIV)",
      "Conference XVIII — Abbot Piamun",
      "Conference XIX — Abbot John",
      "Conference XX — Abbot Pinufius",
      "Conference XXI — Abbot Theonas (1)",
      "Conference XXII — Abbot Theonas (2)",
      "Conference XXIII — Abbot Theonas (3)",
      "Conference XXIV — Abbot Abraham"
    ],
    subChapters: true
  },
  "institutes-and-conferences": { endAt: /^\s*THE SEVEN BOOKS OF JOHN CASSIAN\s*$/im },
  "book-of-pastoral-rule": {
    unitRe: /^\s*(?:Chapter\s+([IVXL]+)\.|(Introduction)\.)\s*$/m,
    endAt: /^\s*Register of the Epistles of Saint Gregory/im
  },
  // 150 Psalms (Coxe's editor's preface and the T&T Clark title page are dropped). NPNF misprints Psalm XIII
  // as a second "Psalm XII.", so headings follow the order.
  "expositions-on-the-psalms": {
    chunk: "chapter",
    unitRe: /^ {2,4}Psalm ([IVXLC]+)\.(?:\s*\[\d+\])?\s*$/m,
    keepRepeatedLabels: true,
    unitTitles: Array.from({ length: 150 }, (_, i) => "Psalm " + toRoman(i + 1)),
    expectUnits: 150
  },
  // Leo: only a heading alone on its line is a sermon ("Sermon LVIII. chaps. 3 and 4, …" is a footnote).
  sermons: { chunk: "sermon", unitRe: /^\s*Sermon\s+([IVXLC]+)\.(?:\s*\[\d+\])?\s*$/m, endAt: /^\s*Prolegomena\.?\s*$/im },
  "ecclesiastical-history": { chunk: "book", expectUnits: 7, endAt: /^\s*Memoir of Sozomen\.?\s*$/im },
  "ecclesiastical-history-and-dialogues": { endAt: /^\s*Jerome and Gennadius\.?\s*$/im },
  // Josephus (Whiston, Gutenberg). Antiquities: Preface + 20 books, "CHAPTER N." nested; no footnotes or summaries.
  "antiquities-of-the-jews": {
    chunk: "book",
    startAt: /^PREFACE\.1\s*$/m,
    unitRe: /^(?:BOOK\s+([IVXL]+)\.|(PREFACE))/m,
    dropBlocks: [{ start: /^\d+ \(return\)/, until: /^(?:CHAPTER\s+\d+\.|BOOK\s+[IVXL]+\.)/ }],
    endAt: /^\s*End of (?:the )?Project Gutenberg/im,
    dropParas: /^(?:\W*|BOOK\s+[IVXL]+\.\s*)Containing The Interval|^FOOTNOTES:?$/i,
    stripNoteMarks: /(?<=[A-Za-z\]\)\.,;:'"])\d{1,3}(?=[\s,.;:'"\]]|$)|(?<=[A-Za-z,;])\s\d{1,3}(?=\s[a-z])/g,
    dropFootnotes: true,
    subChapters: /^CHAPTER\s+(\d+)\b/
  },
  // Wars: Preface + Books I–VII with "CHAPTER N." nested; numbered sections stay body text.
  // Indented lines are book/chapter descriptions; "N (return) [ … ]" blocks are Whiston's notes.
  "wars-of-the-jews": {
    chunk: "book",
    startAt: /^\s*PREFACE\s*$(?=\s*^1\. )/m,
    unitRe: /^\s*(?:BOOK\s+([IVX]+)\.|(PREFACE))\s*$/m,
    dropBlocks: [
      { start: /^(?:.*FOOTNOTES\s+)?\d+ \(return\)/, until: /^\s*(?:CHAPTER\s+\w+\.?|BOOK\s+[IVX]+\.)\s*$/ },
      { start: /^ {5}\S/, until: /^\s*$/ }
    ],
    endAt: /^\s*End of (?:the )?Project Gutenberg/im,
    dropParas: /^(?:WAR\b.*)?FOOTNOTES:?$/i,
    stripNoteMarks: /(?<=[A-Za-z\]\)\.,;:'"])\d{1,3}(?=[\s,.;:'"\]]|$)|(?<=[A-Za-z,;:.\]])\s\d{1,3}(?=\s[A-Za-z\[])/g,
    dropFootnotes: true,
    subChapters: /^CHAPTER\s+([IVXL]+|\d+)\b/,
    subChapterSequence: true
  },
  // Against Apion: 2 books; chapters are the numbered paragraphs ("1. I suppose…").
  "against-apion": {
    chunk: "book",
    startAt: /^BOOK 1\.\s*$/m,
    unitRe: /^BOOK\s+([0-9IVX]+)\.\s*$/m,
    endAt: /^\s*End of (?:the )?Project Gutenberg/im,
    dropParas: /^FOOTNOTES:?$/i,
    subChapters: /^(\d+)\.\s/,
    subChapterInline: true
  },
  // Life: single level, one chapter per numbered section; Whiston's footnotes (from "[Footnote 1:") removed.
  "life-of-flavius-josephus": {
    chunk: "chapter",
    startAt: /^1\. The family from which I am derived/m,
    unitRe: /^(\d+)\.\s/m,
    bareHeadings: true,
    dropParas: /^Footnotes:?$/i,
    endAt: /^\[Footnote 1:|^\s*End of (?:the )?Project Gutenberg/m,
    dropFootnotes: true
  },
  "discourse-to-the-greeks-concerning-hades": {
    chunk: "chapter",
    authorshipDisputed: true,
    startAt: /^1\. Now as to Hades/m,
    unitRe: /^(\d+)\.\s/m,
    bareHeadings: true,
    endAt: /^\s*End of (?:the )?Project Gutenberg/im
  },
  // ANF VII–VIII collections with no "Chapter N" marks: one section per titled block between rules.
  "early-liturgies": { chunk: "section", endAt: /^\s*Indexes\s*$/m },
  // Column-start "Book IV. [3480]" only: footnote lines "book iv. …" had made two stray units.
  "five-books-against-marcion": { chunk: "book", unitRe: /^ {3}Book ([IVX]+)\.(?:\s*\[\d+\])?\s*$/m, expectUnits: 5 },
  "memoirs-of-edessa": { chunk: "section", endAt: /^\s*Remains of the Second and Third Centuries\s*$/m },
  "testaments-of-the-twelve-patriarchs": { chunk: "section" },
  // Two-level (Book > Chapter). For a "Chapter bug" work, add `subChapters: true` (or a custom RegExp).
  // Column-start "Book IV." (optionally "[674]") only, so a wrapped "Book V." mid-text is not a unit.
  "spurious-epistles-of-ignatius": {
    chunk: "book",
    startAt: /^The Epistle of Ignatius to the Tarsians/m,
    unitRe: /^((?:The|A Second) Epistle of [^\n]+|Reply of the Blessed Virgin[^\n]*)$/m,
    keepUnitLabel: true,
    subChapters: true
  },
  // ANF IX apocrypha: each piece is its own work; chapters are the Roman-numeral paragraphs.
  "apocalypse-of-peter": {
    chunk: "chapter",
    startAt: /^\s*The Apocalypse of Peter\.\s*\n\s*\n\s*-{6,}/m,
    unitRe: /^\s*(The Apocalypse of Peter)\.\s*$/m,
    keepUnitLabel: true,
    bareHeadings: true,
    endAt: /^\s*Fragments of the Apocalypse of Peter\.?\s*$/m
  },
  "apocalypse-of-the-virgin": {
    chunk: "chapter",
    startAt: /^\s*The Apocalypse of the Holy Mother of God Concerning the Chastisements/m,
    unitRe: ROMAN_PARA_RE,
    bareHeadings: true
  },
  "apocalypse-of-sedrach": {
    chunk: "chapter",
    startAt: /^\s*The Word of the holy and blessed Sedrach/m,
    unitRe: ROMAN_PARA_RE,
    bareHeadings: true
  },
  "testament-of-abraham": {
    chunk: "book",
    // The title line repeats (intro, then text); the later one starts Version I.
    unitRe: /^\s*(?:The Testament of (Abraham)|Version (II))\.\s*$/m,
    unitTitles: ["Version I", "Version II"],
    dropParas: /^Version I\.$/,
    subChapters: /^([IVXL]+)\.\s/,
    subChapterHidden: true
  },
  "acts-of-xanthippe-and-polyxena": {
    chunk: "chapter",
    startAt: /^\s*Life and Conduct of the Holy Women/m,
    unitRe: ROMAN_PARA_RE,
    bareHeadings: true
  },
  "narrative-of-zosimus": {
    chunk: "chapter",
    startAt: /^\s*The Narrative of Zosimus Concerning the Life of the Blessed/m,
    unitRe: ROMAN_PARA_RE,
    bareHeadings: true
  },
  "apology-of-aristides": {
    chunk: "book",
    unitRe: /^\s*Translated from the (Greek|Syriac)\.\s*$/m,
    unitTitles: ["Greek (Barlaam and Josaphat)", "Syriac"],
    subChapters: /^([IVXL]+)\.\s/,
    subChapterHidden: true
  },
  "passion-of-the-scillitan-martyrs": {
    chunk: "chapter",
    // Title repeats (part title, intro, text); the last one opens the Acts.
    unitRe: /^\s*(The Passion of the Scillitan Martyrs)\.\s*$/m,
    keepUnitLabel: true,
    bareHeadings: true
  },
  "constitutions-of-the-holy-apostles": {
    chunk: "chapter",
    startAt: /^ {4,6}Sec\. I\.--/m,
    // Book VIII closes with the Apostolic Canons, a unit of their own (no Sec. number).
    unitRe: /^ {4,6}Sec\. ([IVX]+)\.--([^\n]*(?:\n {4,8}\S[^\n]*)*)|^ {4}(The Ecclesiastical Canons of the Same Holy Apostles)\./m,
    bookSections: true,
    dropBlocks: [{ start: /^constitutions of the holy apostles/i, until: /^ {4,6}Sec\. I\.--/ }],
    endAt: /^\s*Elucidations\.\s*$|^\s*AN ANCIENT HOMILY,?\s*$/m,
    subChapters: /^([IVXLC]+)\.(?:\s+\S|\d)/,
    subChapterHidden: true
  },
  "recognitions-of-clement": { chunk: "book", unitRe: /^\s*Book\s+([IVX]+)\.(?:\s*\[\d+\])?\s*$/m, subChapters: true },
  decretals: { chunk: "section", endAt: /^\s*Memoirs of Edessa And Other Ancient Syriac Documents\s*$/m },
  // The default unit patterns are case-insensitive and also match wrapped footnote lines
  // ("Homily LXXXVIII.--R.]", "Letter xli. (ha anegnon...)", "book iv. ..."), which created stray,
  // duplicated or out-of-order units. These works take only real, case-sensitive heading lines.
  "homilies-on-matthew": { chunk: "homily", expectUnits: 90, unitRe: /^\s*Homily\s+([IVXLC]+)\.(?:\s*\[\d+\])?\s*$/m },
  // Chrysostom's NPNF1 XI–XIV volumes: several series of homilies in one file, each numbered from I.
  "homilies-on-acts-and-romans": {
    chunk: "homily",
    unitGroups: ["Homilies on Acts", "Homilies on Romans"],
    expectUnits: 87
  },
  "homilies-on-first-and-second-corinthians": {
    chunk: "homily",
    unitGroups: ["Homilies on First Corinthians", "Homilies on Second Corinthians"],
    expectUnits: 74
  },
  // The Commentary on Galatians, which opens the volume, is its own work (EXTRA_SPECS).
  "homilies-on-galatians-to-philemon": {
    chunk: "homily",
    unitGroups: [
      "Homilies on Ephesians",
      "Homilies on Philippians",
      "Homilies on Colossians",
      "Homilies on First Thessalonians",
      "Homilies on Second Thessalonians",
      "Homilies on First Timothy",
      "Homilies on Second Timothy",
      "Homilies on Titus",
      "Homilies on Philemon"
    ],
    expectUnits: 104
  },
  "homilies-on-john-and-hebrews": {
    chunk: "homily",
    unitGroups: ["Homilies on John", "Homilies on Hebrews"],
    expectUnits: 122
  },
  // Each chapter's title is the writer's name from the work's own numbered list ("1. Simon Peter.").
  // Two headings lack the full stop ("Chapter LXVIII"); they had been run into the chapter before.
  "jerome-lives-of-illustrious-men": {
    chunk: "chapter",
    unitRe: /^ {3}Chapter ([IVXLC]+)\.?\s*$/m,
    titleListAt: /^\s*List of Writers\.\s*$/m,
    expectUnits: 135
  },
  "lives-of-illustrious-men": {
    chunk: "chapter",
    unitRe: /^ {3}Chapter ([IVXLC]+)\.?\s*$/m,
    titleListAt: /^\s*List of the Authors whom Gennadius added/m,
    expectUnits: 99
  },
  "augustine-letters": { markAbridged: true, chunk: "letter", unitRe: /^\s*Letter\s+([IVXLCDM]+)\.(?:\s*\[\d+\])?\s*$/m },
  "basil-letters": { markAbridged: true, chunk: "letter", unitRe: /^\s*Letter\s+([IVXLCDM]+)\.(?:\s*\[\d+\])?\s*$/m },
  // Jerome's headings carry the addressee ("Letter XXXIII. To Paula."); footnote lines follow with "§", ")" or nothing.
  "jerome-letters": { markAbridged: true, chunk: "letter", unitRe: /^\s*Letter\s+([IVXLCDM]+)\.[ \t]+(?!§|is\b)[A-Z][a-z][^\n]*$/m },
  // Books II and III are lost in the original; only the column-start "Book N." lines are units.
  "refutation-of-all-heresies": { chunk: "book", unitRe: /^\s*Book\s+([IVX]+)\.(?:\s*\[\d+\])?\s*$/m },
  // ── Nov 2026 audit: works re-extracted from their volumes (scripts/english-by-father/reextract-2026-11.mjs) ──
  // Commodian's 80 acrostic poems, "I.--Preface." … "LXXX.--The Name of the Man of Gaza."
  "instructions-of-commodianus": {
    chunk: "chapter",
    unitRe: /^ {3}([IVXL]+\.--[^\n]*)$/m,
    keepUnitLabel: true,
    endAt: /^\s*Elucidation\.?\s*$/m
  },
  // Fourteen numbered sections ("1.  My brother Fabius…"); the Elucidations' numbered tables are cut off.
  "de-fuga-in-persecutione": {
    title: "On Flight in Persecution",
    chunk: "chapter",
    unitRe: /^ {3}(\d{1,2})\. {2}(?=\S)/m,
    bareHeadings: true,
    endAt: /^\s*Elucidations\.?\s*$/m,
    expectUnits: 14
  },
  // ANF IV Appendix, "Author Uncertain": once shown in place of De Fuga. Not Tertullian's.
  "five-books-in-reply-to-marcion-poem": {
    title: "Five Books in Reply to Marcion (poem)",
    chunk: "book",
    unitRe: /^ {3}(Book [IVX]+\.--[^\n]*)$/m,
    keepUnitLabel: true,
    authorshipDisputed: true,
    // The Appendix's own credit line stands above the first poem, outside this extract.
    translator: "S. Thelwall",
    expectUnits: 5
  },
  "ad-martyras": { title: "To the Martyrs", chunk: "chapter", expectUnits: 6 },
  // Cut out of the Ad Martyras file: the anonymous redactor's preface and Perpetua's and Saturus' own narrative.
  "passion-of-the-holy-martyrs-perpetua-and-felicitas": {
    title: "The Passion of Perpetua and Felicitas",
    chunk: "chapter",
    startAt: /^ {3}The Passion of the Holy Martyrs Perpetua and Felicitas\.\s*$/m,
    unitRe: /^ {3}(?:(Preface)\.(?:\s*\[\d+\])?\s*$|Chapter ([IVX]+)\.--)/m,
    bareHeadings: true,
    expectUnits: 7
  },
  // ANF IX: Books I, II, VI and X with the fragments of IV and V. Books X–XIV of the Commentary on
  // Matthew, which followed in the same file, are now their own work.
  "commentary-on-john": {
    chunk: "book",
    unitRe: /^ {3}(Book [IVX]+\.|Fragments of the Fourth Book\.|From the Fifth Book\.|Sixth Book\.|Tenth Book\.)/m,
    unitTitles: ["Book I", "Book II", "Book IV (fragments)", "Book V (fragments)", "Book VI", "Book X"],
    // ANF IX title page: "Origen's Commentary on the Gospel of John. by Allan Menzies, D.D."
    translator: "Allan Menzies",
    expectUnits: 6
  },
  "commentary-on-matthew": {
    chunk: "book",
    unitRe:
      /^ {3}(From the First Book of the Commentary on Matthew\.|From the Second Book of the Commentary on the Gospel According to|Book X\.|Book XI\.|Book XII\.|Book XIII\.|Book XIV\.)/m,
    unitTitles: ["Book I (fragment)", "Book II (fragment)", "Book X", "Book XI", "Book XII", "Book XIII", "Book XIV"],
    // ANF IX title page: "Origen's Commentary on the Gospel of Matthew. by John Patrick, D.D."
    translator: "John Patrick",
    expectUnits: 7
  },
  // NPNF2 I after the Church History: the Life (four books), Constantine's Oration, Eusebius' Oration.
  "life-of-constantine": {
    chunk: "book",
    unitRe: /^ {3}Book ([IV]+)\.\s*$/m,
    subChapters: true,
    expectUnits: 4
  },
  "oration-of-constantine-to-the-assembly-of-the-saints": {
    title: "Oration of Constantine to the Assembly of the Saints",
    chunk: "chapter",
    expectUnits: 26
  },
  "oration-of-eusebius": {
    title: "Oration in Praise of Constantine",
    chunk: "chapter",
    unitRe: /^ {3}(?:(Prologue) to the Oration\.|Chapter ([IVXL]+)\.)/m,
    expectUnits: 19
  },
  // ANF IX: Robinson's translation in fourteen sections (Rutherfurd's introduction and the synoptical table dropped).
  "gospel-of-peter": {
    chunk: "chapter",
    startAt: /^ {3}The Gospel According to Peter\./m,
    unitRe: /^ {3}(\d{1,2}) {2}(?=\S)/m,
    unitTitles: Array.from({ length: 14 }, (_, i) => "Section " + (i + 1)),
    // ANF IX: "The Gospel of Peter. by Professor J. Armitage Robinson" ("Mr. J. Armitage Robinson's translation here follows").
    translator: "J. Armitage Robinson",
    expectUnits: 14
  },
  // ANF VII: all seven books, chapter by chapter ("Book I · Chapter II — That there is a providence…").
  "divine-institutes": {
    chunk: "chapter",
    unitRe: /^\s*(?:Chap\.\s+([ivxlc]+)\.|(preface)\.)\s*--/im,
    // ANF VII, Introductory Notice: "the reverend translator [9]", note 9 "William Fletcher, D.D."
    translator: "William Fletcher"
  },
  "epitome-of-the-divine-institutes": {
    chunk: "chapter",
    unitRe: /^\s*(?:Chap\.\s+([IVXLC]+)\.|The (Preface)\.)\s*--/m,
    translator: "William Fletcher"
  },
  // ANF VI: Part I (sections of the works), Part II (epistles), then the Exegetical Fragments.
  "extant-fragments-of-dionysius": {
    chunk: "chapter",
    // A title that wraps (its first line ends without "." or "]") takes its second line too.
    unitRe: /^ {3,4}((?:Epistle )?[IVX]+\.--(?:[^\n]*[^\n.\]\s][ \t]*\n {3,4}(?!-)\S)?[^\n]*)/m,
    keepUnitLabel: true,
    groupRe: /^ {2,4}(?:(Part I{1,2})\.--|(Exegetical Fragments)\s*$)/m
  },
  // NPNF1 III–V anti-Pelagian and other Augustine treatises. Each Retractations extract that NPNF prints
  // before a treatise ends the file before it (cutTrailingRetractations); it is shown as the treatise's last unit.
  "on-nature-and-grace": {
    chunk: "chapter",
    // The file runs on into On Man's Perfection in Righteousness (its own work).
    endAt: /^\s*A Treatise concerning man's perfection in righteousness/im,
    retractations: { chap: "II.42", path: "Fathers/English/Augustine_English/On the Spirit and the Letter.txt" }
  },
  "on-marriage-and-concupiscence": {
    chunk: "book",
    unitRe: /^\s*Book ([IV]+)\.(?:\s*\[\d+\])?\s*$/m,
    subChapters: true,
    retractations: { chap: "II.53" },
    expectUnits: 2
  },
  "on-the-proceedings-of-pelagius": { chunk: "chapter", retractations: { chap: "II.45" } },
  "on-the-grace-of-christ-and-original-sin": {
    chunk: "chapter",
    retractations: { chap: "II.50", path: "Fathers/English/Augustine_English/On Nature and Grace.txt" }
  },
  "on-the-soul-and-its-origin": {
    chunk: "chapter",
    retractations: { chap: "II.56", path: "Fathers/English/Augustine_English/On the Grace of Christ and Original Sin.txt" }
  },
  "on-the-spirit-and-the-letter": {
    retractations: { chap: "II.37", path: "Fathers/English/Augustine_English/On the Merits and Forgiveness of Sins.txt" }
  },
  "on-grace-and-free-will": {
    retractations: { chap: "II.66", path: "Fathers/English/Augustine_English/Against Two Letters of the Pelagians.txt" }
  },
  "on-rebuke-and-grace": {
    retractations: { chap: "II.67", path: "Fathers/English/Augustine_English/On Grace and Free Will.txt" }
  },
  "against-two-letters-of-the-pelagians": {
    retractations: { chap: "II.61", path: "Fathers/English/Augustine_English/On the Soul and its Origin.txt" }
  },
  // Arabic chapter numbers only: a wrapped note "Chapter III.--A.H.N.]" had made a stray chapter 20.
  "on-the-morals-of-the-manichaeans": { chunk: "chapter", unitRe: /^\s*Chapter\s+(\d+)\.--/m },
  // "Book First." in the introduction is not a book; the three books are column-start "Book I." lines.
  "answer-to-letters-of-petilian": { chunk: "book", unitRe: /^\s*Book ([IVX]+)\.(?:\s*\[\d+\])?\s*$/m, expectUnits: 3 },
  "on-the-perfection-of-mans-righteousness": { title: "On the Perfection of Man's Righteousness" },
  // ── Duplicates (Nov 2026 audit) ──
  // NPNF2 IV "Personal Letters" XLVI–LXIV: XLVIII–LXIV are each also their own work (Letter to Amun, to
  // Dracontius, to Lucifer, … to Diodorus), which journeys and manuscripts link to. Only XLVI–XLVII are unique.
  "personal-letters": { chunk: "letter", unitRe: /^\s*Letter\s+([IVXLC]+)\.--/m, endAt: /^\s*Letter XLVIII\.--/m, expectUnits: 2 },
  // "Letter 62. Of Palladius…" is the editor's note on this letter, not a letter of its own.
  "letter-to-palladius": { chunk: "letter", unitRe: /^\s*Letter\s+([IVXLC]+)\.--/m, expectUnits: 1 },
  // The file holds Discourses I–III only; Discourse IV is "fourth-discourse-against-the-arians" (no overlap,
  // so nothing to merge). The title stays: the SEO short-title table is keyed on it.
  // NPNF2 VII: the orations not printed elsewhere in this library. II (Flight), XXI (Athanasius), XXVII–XXXI
  // (the Five Theological Orations), XLII (Farewell) and XLIII (Basil) are works of their own.
  "select-orations": {
    chunk: "chapter",
    unitRe: /^ {3}(Oration [IVXL]+)\.\s*$/m,
    keepUnitLabel: true,
    dropUnitLabels: ["Oration II", "Oration XXI", "Oration XXVII", "Oration XXVIII", "Oration XXIX", "Oration XXX", "Oration XXXI", "Oration XLII", "Oration XLIII"],
    expectUnits: 15
  },
  // Aphrahat's eight Demonstrations in NPNF2 XIII, with the inquirer's letter that occasioned them.
  "select-demonstrations": {
    chunk: "chapter",
    unitRe: /^ {3}(Letter of an Inquirer\.|Demonstration [IVX]+\.--[^\n]*)$/m,
    keepUnitLabel: true,
    expectUnits: 9
  },
  // 2 Clement (ANF VII "An Ancient Homily"): twenty chapters, as the duplicate "homily" work had them.
  "clement-rome-the-homily": {
    chunk: "chapter",
    unitRe: /^\s*Chap\.\s+([ivxlc]+)\.\s*--/im,
    expectUnits: 20
  },
  // Display titles only; ids (and URLs) stay.
  "festal-letters-and-index": { title: "Festal Letters" },
  "letters-letters-i-xviii": { title: "Letters" },
  // Chapter I has no heading in ANF IV: it begins straight after the translator's line.
  "on-modesty": {
    chunk: "chapter",
    unitRe: /^ {3}(?:(?=(Modesty), the flower of manners)|Chapter ([IVXL]+)\.--)/m,
    unitTitles: ["Chapter I"]
  },
  // NPNF2 IV prints the Introduction and the Egyptian bishops' letter (its Chapter I) without "Chapter" headings.
  "defense-against-the-arians-apologia-contra-arianos": {
    chunk: "chapter",
    unitRe: /^ {3}(?:(Introduction)\.\s*$|(Encyclical Letter of the Council of Egypt)\.\s*$|Chapter ([IVX]+)\.--)/m,
    unitTitles: ["Introduction", "Chapter I — Encyclical Letter of the Council of Egypt"]
  },
  // The file opens with the editor's chapter summary ("Summary." … "Chapter XL.--He alone…"); the treatise
  // itself is the Prologue and Chapters I–XL.
  "great-catechism": {
    chunk: "chapter",
    startAt: /^ {3}Prologue\.\s*$/m,
    unitRe: /^ {3}(?:(Prologue)\.|Chapter ([IVXL]+)\.)\s*$/m,
    expectUnits: 41
  },
  // The Introduction's summaries ("Book II. is …") had been read as twelve extra books before the real ones.
  "on-the-trinity": { chunk: "book", unitRe: /^ {3}Book ([IVX]+)\.\s*$/m, expectUnits: 12 },
  // "  Book I" has no full stop; Book VI was split at a footnote line "cap. 32. Elucidation II.]".
  stromata: { chunk: "book", unitRe: /^ {2,4}Book ([IVX]+)\b\.?(?:\s*\[\d+\])?\s*$/m, expectUnits: 8 },
  // 48 numbered chapters; the file continues with the Donatist volume's "Introductory Essay", whose
  // "Book II." summaries were being read as the work's units.
  "concerning-the-nature-of-good": {
    chunk: "chapter",
    unitRe: /^\s*Chapter\s+(\d+)\.--/m,
    endAt: /^\s*Introductory Essay\.\s*$/m,
    expectUnits: 48
  }
};

/**
 * Work ids that must not change when another Father's file with the same title is added or removed.
 * Without this, ids depend on folder order: the first file with a title gets the plain slug.
 * Key: "<Folder>_English/<file>.txt".
 */
const PINNED_IDS: Record<string, string> = {
  // Jerome's misfiled copy of this Apology was removed in Oct 2026. Rufinus keeps the id his URLs use.
  "Rufinus_English/Apology in Defence of Himself.txt": "rufinus-apology-in-defence-of-himself",
  // Now holds only the Oration in Praise of Constantine (the Life and Constantine's Oration have their own files).
  "Eusebius_English/Oration of Eusebius.txt": "oration-of-eusebius",
  // 2 Clement: its id came from a clash with the duplicate Apostolic_English copy (now skipped); keep it.
  "Clement_Rome_English/The Second Epistle of Clement.txt": "clement-rome-the-homily"
};

/** Skip these under *_English (already shipped elsewhere, or non-Schaff). */
const SKIP_FILES = new Set([
  "The Confessions of St. Augustine. Augustine.txt", // Pusey → confessions work
  "The Confessions (NPNF Pilkington).txt", // duplicate of Confessions for MVP
  // Nov 2026 audit: duplicates of works that stay (old URLs need redirects, see the audit report).
  "The Homily.txt", // Apostolic_English: 2 Clement again → clement-rome-the-homily (same 20 chapters)
  "Demonstrations.txt", // Aphrahat_English: Ephrem's hymns (in Ephraim_English) + the 8 Demonstrations → select-demonstrations
  // Basil_English: single letters cut out of NPNF2 VIII that basil-letters (the full numbered collection) holds
  // unchanged. Letters XXXVIII, CLXXXIX and CCCLX stay as works of their own: server/workMeta.ts marks them as
  // disputed or spurious, which a chapter of the collection cannot show.
  "Canonical Letters to Amphilochius.txt", // Letters CLXXXVIII, CXCIX–CCIV, CCXVII
  "Letter to Bishop Optimus.txt", // Letter CCLX
  "Letter to the Italians and Gauls.txt" // Letter XCII
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
  lactantius: { name: "Lactantius", dates: "c. 250–c. 325", era: "ante-nicene", region: "North Africa / Gaul", deathYear: 325, bio: "" },
  leo: { name: "Leo the Great", dates: "c. 400–461", era: "post-nicene", region: "Italy", deathYear: 461, bio: "" },
  minucius_felix: { name: "Minucius Felix", dates: "fl. 2nd–3rd c.", era: "ante-nicene", region: "Rome", deathYear: 220, bio: "" },
  novatian: { name: "Novatian", dates: "fl. mid-3rd c.", era: "ante-nicene", region: "Rome", deathYear: 250, bio: "" },
  sulpicius_severus: { name: "Sulpicius Severus", dates: "c. 363–c. 425", era: "post-nicene", region: "Gaul", deathYear: 425, bio: "" },
  tertullian: { name: "Tertullian", dates: "c. 155–c. 240", era: "ante-nicene", region: "North Africa", deathYear: 240, bio: "" },
  vincent: { name: "Vincent of Lérins", dates: "d. c. 450", era: "post-nicene", region: "Gaul", deathYear: 450, bio: "" },
  justin: { name: "Justin Martyr", dates: "c. 100–c. 165", era: "ante-nicene", region: "Rome", deathYear: 165, bio: "" },
  irenaeus: { name: "Irenaeus of Lyons", dates: "c. 130–c. 202", era: "ante-nicene", region: "Gaul", deathYear: 202, bio: "" },
  clement_rome: { name: "Clement of Rome", dates: "fl. c. 96", era: "ante-nicene", region: "Rome", deathYear: 99, bio: "" },
  ignatius: { name: "Ignatius of Antioch", dates: "d. c. 110", era: "ante-nicene", region: "Syria", deathYear: 110, bio: "" },
  polycarp: { name: "Polycarp of Smyrna", dates: "c. 69–c. 155", era: "ante-nicene", region: "Asia Minor", deathYear: 155, bio: "" },
  hermas: { name: "Hermas", dates: "fl. 2nd c.", era: "ante-nicene", region: "Rome", deathYear: 140, bio: "" },
  barnabas: { name: "Barnabas (Epistle)", dates: "c. 96–135", era: "ante-nicene", region: "Unknown", deathYear: 100, bio: "" },
  didache: { name: "Didache", dates: "late 1st–early 2nd c.", era: "ante-nicene", region: "Syria?", deathYear: 100, bio: "" },
  papias: { name: "Papias of Hierapolis", dates: "fl. early 2nd c.", era: "ante-nicene", region: "Asia Minor", deathYear: 120, bio: "" },
  mathetes: { name: "Mathetes (to Diognetus)", dates: "fl. 2nd c.", era: "ante-nicene", region: "Unknown", deathYear: 150, bio: "" },
  tatian: { name: "Tatian", dates: "fl. mid-2nd c.", era: "ante-nicene", region: "Syria", deathYear: 170, bio: "" },
  theophilus: { name: "Theophilus of Antioch", dates: "fl. late 2nd c.", era: "ante-nicene", region: "Syria", deathYear: 185, bio: "" },
  athenagoras: { name: "Athenagoras", dates: "fl. late 2nd c.", era: "ante-nicene", region: "Athens", deathYear: 180, bio: "" },
  clement_alexandria: { name: "Clement of Alexandria", dates: "c. 150–c. 215", era: "ante-nicene", region: "Egypt", deathYear: 215, bio: "" },
  origen: { name: "Origen", dates: "c. 185–c. 254", era: "ante-nicene", region: "Egypt / Palestine", deathYear: 254, bio: "" },
  hippolytus: { name: "Hippolytus", dates: "c. 170–c. 235", era: "ante-nicene", region: "Rome", deathYear: 235, bio: "" },
  cyprian: { name: "Cyprian of Carthage", dates: "d. 258", era: "ante-nicene", region: "North Africa", deathYear: 258, bio: "" },
  dionysius: { name: "Dionysius of Alexandria", dates: "d. c. 264", era: "ante-nicene", region: "Egypt", deathYear: 264, bio: "" },
  eusebius: { name: "Eusebius of Caesarea", dates: "c. 260–c. 339", era: "post-nicene", region: "Palestine", deathYear: 339, bio: "" },
  athanasius: { name: "Athanasius of Alexandria", dates: "c. 296–373", era: "post-nicene", region: "Egypt", deathYear: 373, bio: "" },
  basil: { name: "Basil the Great", dates: "c. 330–379", era: "post-nicene", region: "Cappadocia", deathYear: 379, bio: "" },
  gregory_nazianzen: { name: "Gregory Nazianzen", dates: "c. 329–c. 390", era: "post-nicene", region: "Cappadocia", deathYear: 390, bio: "" },
  gregory_nyssa: { name: "Gregory of Nyssa", dates: "c. 335–c. 395", era: "post-nicene", region: "Cappadocia", deathYear: 395, bio: "" },
  chrysostom: { name: "John Chrysostom", dates: "c. 347–407", era: "post-nicene", region: "Antioch / Constantinople", deathYear: 407, bio: "" },
  cyril_jerusalem: { name: "Cyril of Jerusalem", dates: "c. 313–386", era: "post-nicene", region: "Palestine", deathYear: 386, bio: "" },
  hilary: { name: "Hilary of Poitiers", dates: "c. 310–c. 367", era: "post-nicene", region: "Gaul", deathYear: 367, bio: "" },
  john_damascus: { name: "John of Damascus", dates: "c. 675–c. 749", era: "post-nicene", region: "Syria", deathYear: 749, bio: "" },
  socrates: { name: "Socrates Scholasticus", dates: "c. 380–c. 439", era: "post-nicene", region: "Constantinople", deathYear: 439, bio: "" },
  sozomen: { name: "Sozomen", dates: "c. 400–c. 450", era: "post-nicene", region: "Constantinople", deathYear: 450, bio: "" },
  theodoret: { name: "Theodoret of Cyrrhus", dates: "c. 393–c. 458", era: "post-nicene", region: "Syria", deathYear: 458, bio: "" },
  rufinus: { name: "Rufinus of Aquileia", dates: "c. 345–411", era: "post-nicene", region: "Italy", deathYear: 411, bio: "" },
  cassian: { name: "John Cassian", dates: "c. 360–c. 435", era: "post-nicene", region: "Gaul", deathYear: 435, bio: "" },
  ephraim: { name: "Ephraim the Syrian", dates: "c. 306–373", era: "post-nicene", region: "Syria", deathYear: 373, bio: "" },
  aphrahat: { name: "Aphrahat", dates: "fl. 4th c.", era: "post-nicene", region: "Persia", deathYear: 350, bio: "" },
  // Gennadius of Marseilles (Massilia) continued Jerome's Lives of Illustrious Men; he died c. 496.
  gennadius: { name: "Gennadius", dates: "d. c. 496", era: "post-nicene", region: "Gaul", deathYear: 496, bio: "" },
  // Seven councils, 325–787. The shelf files them in their own period (shelf.ts); the year places them with
  // Nicaea, the first, rather than at an arbitrary mid-point.
  councils: { name: "Ecumenical Councils", dates: "325–787", era: "post-nicene", region: "Various", deathYear: 325, bio: "" },
  // Id kept for URLs. Holds anonymous and pseudonymous pieces from the Didache era to the 9th-century
  // Pseudo-Isidorian Decretals: the Apostolic Constitutions, apocalypses, Testaments, liturgies, martyr acts.
  apostolic: { name: "Anonymous Early Writings", dates: "1st–9th c.", era: "ante-nicene", region: "Various", deathYear: 120, bio: "" },
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
/**
 * "Chapter IV.--Title", "Chapter 4. Title", and NPNF's double numbering "Chapter 1 [I.]--Introductory."
 * (the bracket gives the older Benedictine numeral; without it the opening chapters of many
 * anti-Pelagian treatises were skipped).
 */
const CHAPTER_RE = /^\s*Chapter\s+([IVXLCDM]+|\d+)(?:\s*\[[IVXLCDM]+\.?\])?\s*[\.—\-.]/im;
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

const SERIES_NAMES: Record<string, string> = {
  ANF: "Ante-Nicene Fathers",
  NPNF1: "Nicene and Post-Nicene Fathers, Series I",
  NPNF2: "Nicene and Post-Nicene Fathers, Series II"
};

/** "Fathers/English/NPNF2/Volume IV. ..." → "Nicene and Post-Nicene Fathers, Series II, vol. IV". */
export function editionFrom(source: string | undefined): string {
  const m = (source || "").match(/Fathers\/English\/(ANF|NPNF1|NPNF2)\/Volume ([IVXL]+)\./);
  if (m) return SERIES_NAMES[m[1]] + ", vol. " + m[2];
  // A non-Schaff printed source named in full ("..., tr. T. Thompson, ed. J.H. Srawley (London: SPCK, 1919)").
  if (source && !/^Fathers\//.test(source) && /\(\D*\d{4}\)/.test(source)) return source.trim();
  return "";
}

const NAME_TITLES_RE = /\b(?:the\s+)?(?:late\s+)?(?:Rev(?:erend|\.)?\s+|Professor\s+|Prof\.\s+|Archdeacon\s+)/gi;

/**
 * The translator the extract itself names on its title lines: "[Translated by the Rev. S. Thelwall.]",
 * "Translated by Rev. H. Browne, M.A.", "translated by | r. blackburn, m.a.,". Only a statement that opens
 * a line near the top counts, so a passing remark ("translated by Rufinus, but…") is never taken for a credit.
 * Returns "" when the source does not say.
 */
export function translatorFrom(raw: string): string {
  const lines = raw.replace(/\r\n/g, "\n").split("\n").filter((l) => !/^\s*#/.test(l)).slice(0, 160);
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*(\[?)\s*Translated(?:\s+and\s+annotated|\s+with\s+introduction,?\s+and\s+notes)?\s+by\b\s*(.*)$/i);
    if (!m) continue;
    // A credit opens its own paragraph ("[Translated by…]" or a title-page line), not the middle of one.
    if (!m[1] && i > 0 && lines[i - 1].trim() && !/^\s*[_\-]{5,}\s*$/.test(lines[i - 1])) continue;
    let text = m[2];
    // The name may sit on the next line(s) of a title page: "translated by" | "r. blackburn, m.a.,".
    for (let j = i + 1; j < lines.length && j < i + 4 && !/\]\s*$/.test(text) && text.trim().length < 4; j++) {
      if (lines[j].trim()) text += " " + lines[j].trim();
    }
    text = text.replace(/\].*$/, "").replace(/\s+/g, " ").trim();
    if (!text) continue;
    // Several translators: keep the statement as printed.
    let name = /;/.test(text)
      ? text
      : text.split(/[,.]\s*(?=M\.A|B\.A|D\.D|LL\.D|Ph\.D|B\.D|A\.M|Esq|of\s|Fellow|Professor|Trinity|Exeter|F\.R)/i)[0];
    name = name.replace(NAME_TITLES_RE, "").replace(/[\s.,;:]+$/, "").trim();
    if (/^[a-z .,'-]+$/.test(name)) name = name.replace(/(^|[\s.'-])([a-z])/g, (_w, a: string, b: string) => a + b.toUpperCase());
    if (name.length < 3 || name.length > 160) continue;
    return name;
  }
  return "";
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

/** CCEL volume matter that belongs to no work: the volume's indexes and the "generated from ThML" trailer. */
const VOLUME_END_RE = /^[ \t]{12,}Indexes[ \t]*$|^[ \t]*This document is from the Christian Classics Ethereal/m;
/** A CCEL navigation link left in the plain-text dump, e.g. "/ccel/schaff/anf03.iv.vi.html". */
const NAV_URL_RE = /(?:\/ccel\/schaff\/|www\.ccel\.org\/ccel\/)\S*?\.html?\b/;
/** The label line above such a link: "tertullian corona anf03 tertullian-corona The Chaplet, or De Corona". */
const NAV_CODE_RE = /^\s*[a-z0-9_]+(?:[ _-][a-z0-9_]+)*\s+(?:anf|npnf)\d+\b/i;

/**
 * Remove CCEL navigation from an extract: the volume indexes at the end of a volume's last work, and
 * the "next work" link blocks between works. A link block near the end of the file is followed only by
 * the next work's title, which is dropped with it.
 */
export function stripCcelNavigation(raw: string): string {
  const end = raw.search(VOLUME_END_RE);
  if (end >= 0) raw = raw.slice(0, end);
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (!NAV_URL_RE.test(lines[i])) {
      out.push(lines[i]);
      continue;
    }
    let seen = 0;
    for (let j = out.length - 1; j >= 0 && seen < 2; j--) {
      if (!out[j].trim()) continue;
      seen++;
      if (NAV_CODE_RE.test(out[j])) {
        out.length = j;
        break;
      }
    }
    const rest = lines.slice(i + 1).join("\n");
    if (rest.replace(/[\s_\-]/g, "").length < 400) break;
  }
  return out.join("\n");
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

/**
 * A unit's title: the heading paragraph after the unit mark ("--Of Faith." in "Chapter IV.--Of Faith."),
 * joined across its wrapped lines, without note numbers. Body text (a long first paragraph) is no title.
 */
export function unitTitleFrom(block: string): string {
  const lines = stripEditorialSections(block).replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  while (i < lines.length && (!lines[i].trim() || RULE_LINE_RE.test(lines[i]) || FOOTNOTE_BODY_RE.test(lines[i].trim()))) i++;
  const para: string[] = [];
  for (; i < lines.length && lines[i].trim() && !RULE_LINE_RE.test(lines[i]); i++) para.push(lines[i].trim());
  const title = para
    .join(" ")
    .replace(/\s*\[\d+\]/g, "")
    .replace(/^[\.—\-–:\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (title.length > 240) return "";
  // ANF VII prints some titles in lower case ("of religion and wisdom.").
  return title.charAt(0).toUpperCase() + title.slice(1);
}

/** A numbered list of unit titles ("1. Simon Peter.") after `at`, keyed by number. */
function titleListFrom(raw: string, at: RegExp): Map<number, string> {
  const out = new Map<number, string>();
  const start = raw.search(at);
  if (start < 0) return out;
  const re = /^\s*(\d{1,3})\.\s+(.+?)\.?\s*$/gm;
  re.lastIndex = start;
  let m: RegExpExecArray | null;
  let expect = 1;
  while ((m = re.exec(raw))) {
    // Entries are taken by position: Jerome's list misprints its 28th entry as a second "27.".
    const n = Number(m[1]);
    if (Math.abs(n - expect) > 1) break;
    out.set(expect, m[2].replace(/\s*\[\d+\]/g, "").trim());
    expect++;
  }
  return out;
}

function findMarks(src: string, re: RegExp): { label: string; index: number; end: number }[] {
  const flags = re.flags.includes("g") ? re.flags : re.flags + "g";
  const global = new RegExp(re.source, flags);
  const marks: { label: string; index: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = global.exec(src))) {
    marks.push({ label: m.slice(1).find((g) => g !== undefined) ?? "", index: m.index, end: m.index + m[0].length });
  }
  return marks;
}

/** A heading taken from the text itself: one line, no note numbers, "I.--Title." as "I — Title". */
function cleanUnitLabel(label: string): string {
  return label
    .replace(/\s*\[\d+\]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\.?\s*--\s*/g, " — ")
    .trim()
    .replace(/[.,:]$/, "");
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

function toRoman(n: number): string {
  const table: [number, string][] = [[100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let out = "";
  for (const [v, r] of table) while (n >= v) { out += r; n -= v; }
  return out;
}

function romanToInt(r: string): number {
  const v: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let n = 0;
  const s = r.toUpperCase();
  for (let i = 0; i < s.length; i++) {
    const a = v[s[i]] ?? 0;
    const b = v[s[i + 1]] ?? 0;
    n += a < b ? -a : a;
  }
  return n;
}

const ORDINALS = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"];

function unitLabel(mode: ChunkMode, label: string): string {
  // "Book First" (Answer to Petilian) reads as "Book I".
  const ordinal = ORDINALS.indexOf(label.toLowerCase());
  if (ordinal >= 0 && mode === "book") return "Book " + toRoman(ordinal + 1);
  if (label && /\s/.test(label.trim())) return cleanUnitLabel(label);
  if (label && !/^([IVXLCDM]+|\d+)$/i.test(label)) return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
  if (mode === "book") return "Book " + (/^\d+$/.test(label) ? toRoman(Number(label)) : romanOrNum(label));
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

const specsByRoot = new Map<string, EnglishWorkSpec[]>();

export function clearEnglishWorkSpecCache(): void {
  specsByRoot.clear();
}

/** Discover every Fathers/English/*_English/*.txt extract as an app work. */
export function discoverEnglishWorkSpecs(root: string): EnglishWorkSpec[] {
  const hit = specsByRoot.get(root);
  if (hit) return hit;
  const englishRoot = join(root, "Fathers", "English");
  if (!existsSync(englishRoot)) {
    const empty: EnglishWorkSpec[] = [];
    specsByRoot.set(root, empty);
    return empty;
  }
  const specs: EnglishWorkSpec[] = [];
  const usedIds = new Set<string>(Object.values(PINNED_IDS));

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
      const pinned = PINNED_IDS[folder + "/" + file];
      let id = pinned || slugify(title);
      if (!id) id = slugify(file.replace(/\.txt$/i, "")) || "work";
      // Disambiguate collisions (e.g. Letters.txt under multiple fathers)
      if (!pinned && usedIds.has(id)) id = slugify(author + "-" + title) || id + "-" + author;
      if (!pinned && usedIds.has(id)) id = id + "-" + usedIds.size;
      usedIds.add(id);

      const series = meta.series || "Schaff";
      const path = ["Fathers", "English", folder, file].join("/");
      const translator = translatorFrom(raw);
      const edition = editionFrom(meta.source);
      const base: EnglishWorkSpec = {
        id,
        author,
        title,
        short: shortTitle(title),
        series,
        path,
        chunk: "auto",
        ...(translator ? { translator } : {}),
        ...(edition ? { edition } : {})
      };
      const over = SPEC_OVERRIDES[id];
      specs.push(
        over
          ? { ...base, ...over, id, path, author, title: over.title || title, short: over.short || (over.title ? shortTitle(over.title) : base.short) }
          : base
      );
    }
  }
  for (const extra of EXTRA_SPECS) if (specs.some((x) => x.path === extra.path)) specs.push(extra);
  specsByRoot.set(root, specs);
  return specs;
}

/** Further works that share a source file with another: the same path, cut at their own headings. */
const SULPICIUS = "Fathers/English/Sulpicius_Severus_English/On the Life of St. Martin.txt";
const CHRYSOSTOM_NPNF1_XIII = "Fathers/English/Chrysostom_English/Homilies on Galatians to Philemon.txt";
const EXTRA_SPECS: EnglishWorkSpec[] = [
  {
    // NPNF1 XIII opens with this commentary (six chapters on the six chapters of the Epistle), before the
    // homilies on Ephesians; the homily split had left it out.
    id: "commentary-on-galatians",
    author: "chrysostom",
    title: "Commentary on Galatians",
    short: "Comm. Galatians",
    series: "NPNF1",
    path: CHRYSOSTOM_NPNF1_XIII,
    chunk: "chapter",
    unitRe: /^ {3}Chapter ([IVX]+)\.\s*$/m,
    startAt: /^ {3}commentary \[\d+\] of St\. John Chrysostom,/m,
    endAt: /^ {3}Homilies of St\. John Chrysostom,\s*$/m,
    edition: "Nicene and Post-Nicene Fathers, Series I, vol. XIII",
    expectUnits: 6
  },
  {
    id: "letters-of-sulpicius-severus",
    author: "sulpicius_severus",
    title: "Letters",
    short: "Letters",
    series: "NPNF2",
    path: SULPICIUS,
    chunk: "letter",
    startAt: /^The Letters of Sulpitius Severus\.\s*$/m,
    endAt: /^Dialogues of Sulpitius Severus\.\s*$/m,
    edition: "Nicene and Post-Nicene Fathers, Series II, vol. XI"
  },
  {
    id: "dialogues-of-sulpicius-severus",
    author: "sulpicius_severus",
    title: "Dialogues",
    short: "Dialogues",
    series: "NPNF2",
    path: SULPICIUS,
    // Three dialogues, each with its own Chapter I, II…: Dialogue > Chapter, like a book of chapters.
    chunk: "book",
    unitRe: /^\s*(Dialogue\s+[IVX]+)\.\s*$/m,
    keepUnitLabel: true,
    subChapters: true,
    startAt: /^Dialogues of Sulpitius Severus\.\s*$/m,
    // NPNF2 XI follows the Dialogues with the seven letters of doubtful authorship (their own work, below).
    endAt: /^The Doubtful Letters Of Sulpitius Severus\.\s*$/m,
    edition: "Nicene and Post-Nicene Fathers, Series II, vol. XI"
  },
  {
    id: "doubtful-letters-of-sulpicius-severus",
    author: "sulpicius_severus",
    title: "Doubtful Letters",
    short: "Doubtful Letters",
    series: "NPNF2",
    path: SULPICIUS,
    chunk: "letter",
    unitRe: /^ {2}Letter ([IVX]+)\.\s*$/m,
    authorshipDisputed: true,
    startAt: /^The Doubtful Letters Of Sulpitius Severus\.\s*$/m,
    endAt: /^The Sacred History Of Sulpitius Severus\.\s*$/m,
    edition: "Nicene and Post-Nicene Fathers, Series II, vol. XI",
    expectUnits: 7
  },
  {
    id: "sacred-history",
    author: "sulpicius_severus",
    title: "Sacred History",
    short: "Sacred History",
    series: "NPNF2",
    path: SULPICIUS,
    chunk: "book",
    startAt: /^The Sacred History Of Sulpitius Severus\.\s*$/m,
    edition: "Nicene and Post-Nicene Fathers, Series II, vol. XI"
  }
];

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
  const meta = workMeta(spec.id);
  const clavis = clavisForPath(spec.path);
  const disputed = spec.authorshipDisputed || Boolean(meta.authorship);
  return {
    id: spec.id,
    author: spec.author,
    title: spec.title,
    short: spec.short,
    chapters: passages.length,
    series: spec.series,
    wordCount: Math.max(1, wordCountFromPassages(passages)),
    ...(disputed ? { authorshipDisputed: true } : {}),
    ...(meta.authorship ? { authorship: meta.authorship } : {}),
    ...(meta.attribution ? { attribution: meta.attribution } : {}),
    ...(spec.translator ? { translator: spec.translator } : {}),
    ...(spec.edition ? { edition: spec.edition } : {}),
    ...(clavis ? { clavis } : {})
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
/**
 * Split a CCEL extract on its horizontal rules. Each titled block is a section; blocks that are only
 * footnote bodies ("[123] ...") belong to the section before them.
 */
export function ruleSections(raw: string): { heading: string; body: string }[] {
  const parts = raw.replace(/\r\n/g, "\n").split(/^\s*_{10,}\s*$/m);
  const out: { heading: string; body: string }[] = [];
  for (const part of parts) {
    const text = part.trim();
    if (!text) continue;
    if (/^\[\d+\]/.test(text) && out.length) {
      out[out.length - 1].body += "\n\n" + part;
      continue;
    }
    const first = text
      .split(/\n\s*\n/)[0]
      .replace(/\s*\[\d+\]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\.$/, "");
    out.push({ heading: first.length <= 120 ? first : "", body: part });
  }
  return out;
}

type Section = { heading: string; paras: string[]; footnotes: Footnote[] };

const NUMERAL_HEADING_RE = /^[IVXLC]+$/;
const SUB_EPISTLE_RE = /^The (?:Second|Third|Fourth|Fifth) Epistle$/;
const EDITOR_NOTE_RE = /^Notes? by the American Editor$/i;

/**
 * Real headings for the titled blocks of a CCEL collection (ANF VII–VIII):
 * - a title-page block (only the collection's title and the translator's line) is dropped;
 * - a running header repeated over many blocks ("Ancient Syriac Documents") gives way to the block's own
 *   title, its next short paragraph ("Martyrdom of Habib the Deacon."), or else its closing formula
 *   ("Here endeth the teaching of Simon Cephas.");
 * - a bare numeral ("II") or "The Second Epistle" is a part of the piece before it, and says so:
 *   "The Epistles of Pope Callistus · The Second Epistle · III".
 */
export function sectionHeadings(sections: Section[], workTitle: string): Section[] {
  const norm = (h: string) => h.toLowerCase().replace(/^the\s+/, "").replace(/[.\s]+$/, "");
  const counts = new Map<string, number>();
  for (const s of sections) counts.set(norm(s.heading), (counts.get(norm(s.heading)) || 0) + 1);
  const part = (h: string) => NUMERAL_HEADING_RE.test(h.replace(/\.$/, "")) || SUB_EPISTLE_RE.test(h) || EDITOR_NOTE_RE.test(h);
  const running = (h: string) => !!h && !part(h) && ((counts.get(norm(h)) || 0) >= 3 || norm(h) === norm(workTitle));
  const out: Section[] = [];
  let major = "";
  let minor = "";
  for (const s of sections) {
    const body = s.paras.filter((t, i) => !(i === 0 && norm(t) === norm(s.heading)) && !/^\[?Translated by\b/i.test(t));
    if (body.join(" ").split(/\s+/).filter(Boolean).length < 8) continue;
    // A block whose title wraps past the first line had no heading at all; its first paragraph is the title.
    let heading = cleanUnitLabel(s.heading || (s.paras[0].length <= 200 ? s.paras[0] : ""));
    if (running(s.heading)) {
      const next = s.paras[1]?.replace(/\s*\[\d+\]/g, "").trim() ?? "";
      const end = s.paras[s.paras.length - 1]?.match(/^Here end(?:eth|s)?\s+(?:the\s+)?(.{3,100}?)\.?$/i);
      if (next && next.length <= 160 && !/[:;]$/.test(next)) heading = cleanUnitLabel(next);
      else if (end) heading = end[1].charAt(0).toUpperCase() + end[1].slice(1);
    }
    if (NUMERAL_HEADING_RE.test(heading)) {
      // The Decretals give each numbered part a subtitle in brackets: "(Of the seasons for fasting.)".
      const sub = s.paras[1]?.match(/^\(((?:Of|On|That|As|Concerning|To|Whether)\b.{3,160}?)\.?\)$/);
      heading = [major, minor, heading + (sub ? " — " + sub[1] : "")].filter(Boolean).join(" · ");
    }
    else if (SUB_EPISTLE_RE.test(heading)) {
      minor = heading;
      heading = [major, heading].filter(Boolean).join(" · ");
    } else if (!EDITOR_NOTE_RE.test(heading)) {
      major = heading;
      minor = "";
    }
    out.push({ ...s, heading });
  }
  return out;
}

function cleanPassage(spec: EnglishWorkSpec, p: Passage): Passage {
  const versions: Record<string, string[]> = {};
  for (const [v, paras] of Object.entries(p.versions)) {
    versions[v] = paras
      .filter((t) => !(spec.dropParas && spec.dropParas.test(t.trim())))
      .map((t) => (spec.stripNoteMarks ? t.replace(spec.stripNoteMarks, "") : t))
      .map((t) => (spec.dropFootnotes ? t.replace(/\s*\[\d+\]/g, "") : t));
  }
  return { ...p, versions, footnotes: spec.dropFootnotes ? [] : p.footnotes };
}

function dropLineBlocks(raw: string, blocks: { start: RegExp; until: RegExp }[]): string {
  const out: string[] = [];
  let until: RegExp | null = null;
  for (const line of raw.split("\n")) {
    if (until) {
      if (!until.test(line)) continue;
      until = null;
    }
    const hit: { start: RegExp; until: RegExp } | undefined = blocks.find((b) => b.start.test(line));
    if (hit) {
      until = hit.until;
      continue;
    }
    out.push(line);
  }
  return out.join("\n");
}

/** Default chapter-heading paragraph: "Chapter IV.--Title." / "Chapter 4. Title" / "Chapter IV" */
export const SUBCHAPTER_RE = /^Chapter\s+([IVXLCDM]+|\d+)\b(?:\.?\s*\[[IVXLCDM]+\.?\])?\.?\s*(?:--|—|-|\.|:)?\s*(.*?)\.?$/;

/** Mark chapter-heading paragraphs inside each book passage (headings stay in the text). */
/** A short, mostly Title-Case paragraph (e.g. "Concerning a Person Falsely Accused."). */
function isTitleLine(t: string): boolean {
  if (t.length > 260) return false;
  const words = t.replace(/[^A-Za-z\s]/g, " ").split(/\s+/).filter((w) => w.length > 3);
  if (!words.length) return false;
  return words.filter((w) => /^[A-Z]/.test(w)).length / words.length >= 0.6;
}

/** Hidden sub-chapters: a paragraph starting "IV. …" marks a chapter; its preceding title line (if any) is the anchor and box title. */
function addHiddenSubChapters(passages: Passage[], re: RegExp): Passage[] {
  return passages.map((p) => {
    const paras = Object.values(p.versions)[0] ?? [];
    const sections: SubChapter[] = [];
    paras.forEach((text, i) => {
      const m = text.trim().match(re);
      if (!m) return;
      const prev = i > 0 ? paras[i - 1].trim() : "";
      const titled = prev && !re.test(prev) && isTitleLine(prev);
      sections.push({
        n: sections.length + 1,
        label: "Chapter " + m[1].toUpperCase(),
        title: titled ? prev.replace(/\s*\[\d+\]/g, "").replace(/\.$/, "") : "",
        para: titled ? i - 1 : i,
        hidden: true
      });
    });
    return sections.length ? { ...p, sections } : p;
  });
}

export function addSubChapters(passages: Passage[], re: RegExp = SUBCHAPTER_RE, inline = false, sequence = false): Passage[] {
  return passages.map((p) => {
    let paras = Object.values(p.versions)[0] ?? [];
    if (!inline) {
      // A heading with no text before the next heading is a contents-list entry, not a chapter.
      const isHead = paras.map((t) => t.length <= 600 && re.test(t.trim()));
      const toc = new Set(paras.map((_, i) => i).filter((i) => isHead[i] && (i + 1 >= paras.length || isHead[i + 1])));
      if (toc.size) {
        paras = paras.filter((_, i) => !toc.has(i));
        const key = Object.keys(p.versions)[0];
        p = { ...p, versions: { ...p.versions, [key]: paras } };
      }
    }
    const sections: SubChapter[] = [];
    paras.forEach((text, i) => {
      if (!inline && text.length > 600) return;
      const m = text.trim().match(re);
      if (!m) return;
      const n = sections.length + 1;
      const sub: SubChapter = { n, label: "Chapter " + (sequence ? n : m[1]), title: (m[2] || "").trim(), para: i };
      if (inline) sub.inline = true;
      sections.push(sub);
    });
    return sections.length ? { ...p, sections } : p;
  });
}

/** An Ignatian epistle's title line, which sits inside the last chapter of the epistle before it. */
const IGNATIUS_TITLE_RE = /^The Epistle of Ignatius to\b/;

/**
 * ANF I sets each passage of the shorter recension beside the same passage of the longer one; in the
 * dump the two columns follow each other, short first. Keep the first paragraph of each pair, so the
 * shorter text keeps its paragraph numbers. A chapter found only in the longer recension (Ephesians XX
 * "Exhortations to stedfastness and unity") is kept in its place, so chapter numbers do not shift, and
 * labelled as such.
 */
export function shorterRecension(passages: Passage[]): Passage[] {
  return passages.map((p, i) => {
    const key = Object.keys(p.versions)[0];
    const paras = p.versions[key];
    const keep: boolean[] = paras.map(() => true);
    let run: number[] = [];
    const flush = () => {
      if (run.length % 2 === 0) for (let k = run.length / 2; k < run.length; k++) keep[run[k]] = false;
      run = [];
    };
    paras.forEach((t, k) => {
      if (IGNATIUS_TITLE_RE.test(t)) flush();
      else run.push(k);
    });
    flush();
    const index = new Map<number, number>();
    paras.forEach((_, k) => {
      if (keep[k]) index.set(k, index.size);
    });
    const label = (h: string) => h.replace(/^(?:[^·]+ · )?(Chapter [IVXL]+)\b.*$/, "$1");
    const longerOnly = i > 0 && label(passages[i - 1].heading) === label(p.heading);
    return {
      ...p,
      heading: longerOnly ? p.heading.replace(/(Chapter [IVXL]+)/, "$1 (longer recension only)") : p.heading,
      versions: {
        ...p.versions,
        [key]: paras.filter((_, k) => keep[k]).map((t) => (IGNATIUS_TITLE_RE.test(t) ? t.replace(/\s*Shorter and Longer Versions\.?\s*$/, "") : t))
      },
      footnotes: p.footnotes.filter((f) => index.has(f.para)).map((f) => ({ ...f, para: index.get(f.para)! }))
    };
  });
}

const SUMMARY_OPENING_RE =
  /^(?:\(a\.d\.[^)]*\)\s*)?(?:This letter\b|A short letter\b|A letter\b|In this letter\b|An explanation\b|A translation by Jerome\b|The theme of this letter\b|Augustine asks\b|A letter of introduction\b|A letter from\b)/i;
const NOT_TRANSLATED_RE = /\b(?:Not translated|is omitted|Omitted, as\b|omit altogether the translation)/i;

/**
 * How NPNF prints a unit when it abridges: "" (in full), "summary" (an editor's précis such as Basil's
 * "To a widow. [A short letter of introduction.]" or Jerome's "An explanation of the ten names…"), or
 * "omitted" (only the address, or a note that the piece is not translated).
 */
export function abridgement(paras: string[]): "" | "summary" | "omitted" {
  const text = paras.join(" ").replace(/\s+/g, " ").trim();
  const words = text.split(" ").filter(Boolean).length;
  if (words < 45 && NOT_TRANSLATED_RE.test(text)) return "omitted";
  const unbracketed = text.replace(/\[[^\]]*\]?/g, " ").replace(/Letters? [CDLXVI]+\.,?(?:\s*[CDLXVI]+\.,?)*/g, " ");
  const plain = unbracketed.split(/\s+/).filter(Boolean).length;
  if (/\[/.test(text) && plain <= 12 && words < 80) return "summary";
  if (words <= 8) return "omitted";
  if (words < 60 && SUMMARY_OPENING_RE.test(text)) return "summary";
  return "";
}

const TITLE_PAGE_LINE_RE = [
  /^\[?translated(?:\s+(?:and annotated|with introduction,?\s+and notes|into english))?\s+by\b[^.]{0,120}\]?$/i,
  /^(?:by|of|and|on the|to the|with|edited|assisted by)$/i,
  /\b(?:M\.A|D\.D|B\.A|LL\.D|Ph\.D|B\.D|A\.M)\b/i,
  /\b(?:rector of|vicar of|fellow of|professor (?:of|in)|college, (?:oxford|cambridge))\b/i,
  /^(?:T\s*&\s*T\s*CLARK|EDINBURGH|WM\. B\. EERDMANS|GRAND RAPIDS)/i,
  /\b[a-z][A-Z]/, // CCEL small caps run together: "fIVE Catechetical Lectures", "THE saME aUTHOR"
  /^[,.;:]/, // a heading's tail left behind (", Ch. i. 1-iii. 9.")
  /^\[[A-Z][a-z]+(?: [A-Za-z]+)*\.?\]$/ // the Latin title in brackets: "[De Mendacio.]"
];

/**
 * Title-page lines that lead a work's first unit ("Translated by" | "Rev. H. Browne, M.A.,", "fIVE
 * Catechetical Lectures | of | THE saME aUTHOR") are not text. They are dropped only when such a credit
 * line is among them, so an ordinary opening is never touched.
 */
export function stripTitlePage(p: Passage, title: string): Passage {
  const key = Object.keys(p.versions)[0];
  const paras = p.versions[key] ?? [];
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, " ").trim();
  const t = norm(title);
  let n = 0;
  let credit = false;
  while (n < Math.min(paras.length - 1, 8)) {
    const s = paras[n].trim();
    if (s.length > 160) break;
    const isTitle = !!t && (norm(s) === t || norm(s).startsWith(t) || t.startsWith(norm(s)) || /^homily$/i.test(s));
    const hit = TITLE_PAGE_LINE_RE.some((re) => re.test(s));
    if (!isTitle && !hit) break;
    if (hit) credit = true;
    n++;
  }
  if (!n || !credit) return p;
  return {
    ...p,
    versions: { ...p.versions, [key]: paras.slice(n) },
    footnotes: p.footnotes.filter((f) => f.para >= n).map((f) => ({ ...f, para: f.para - n }))
  };
}

/** NPNF abridgements: a unit printed only as the editor's summary says so in its heading. */
function markSummaries(spec: EnglishWorkSpec, passages: Passage[]): Passage[] {
  const only = new Set(spec.summaryOnly ?? []);
  return passages.map((p) => {
    if (/in this edition\)/.test(p.heading)) return p;
    const kind = only.has(p.chapter) ? "summary" : spec.markAbridged ? abridgement(Object.values(p.versions)[0] ?? []) : "";
    if (!kind) return p;
    return { ...p, heading: p.heading + (kind === "summary" ? " (summary only in this edition)" : " (not translated in this edition)") };
  });
}

export function parseEnglishWork(spec: EnglishWorkSpec, root: string): { work: Work; passages: Passage[] } {
  let parsed = parseEnglishWorkFlat(spec, root);
  if (parsed.passages.length) {
    const first = stripTitlePage(parsed.passages[0], spec.title);
    if (first !== parsed.passages[0]) {
      const passages = [first, ...parsed.passages.slice(1)];
      parsed = { work: workFromSpec(spec, passages), passages };
    }
  }
  if (spec.shorterRecensionOnly || spec.summaryOnly || spec.markAbridged) {
    const passages = markSummaries(spec, spec.shorterRecensionOnly ? shorterRecension(parsed.passages) : parsed.passages);
    parsed = { work: workFromSpec(spec, passages), passages };
  }
  if (!spec.subChapters && !spec.dropParas && !spec.stripNoteMarks && !spec.dropFootnotes) return parsed;
  let passages = parsed.passages.map((p) => cleanPassage(spec, p));
  if (spec.subChapters && spec.subChapterHidden && spec.subChapters !== true) {
    passages = addHiddenSubChapters(passages, spec.subChapters);
  } else if (spec.subChapters) {
    passages = addSubChapters(
      passages,
      spec.subChapters === true ? SUBCHAPTER_RE : spec.subChapters,
      spec.subChapterInline,
      spec.subChapterSequence
    );
  }
  return { work: workFromSpec(spec, passages), passages };
}

function parseEnglishWorkFlat(spec: EnglishWorkSpec, root: string): { work: Work; passages: Passage[] } {
  const file = join(root, spec.path);
  if (!existsSync(file)) throw new Error("Missing English work file: " + spec.path);
  let raw = stripCcelNavigation(stripMetaHeaders(readFileSync(file, "utf8")));
  if (spec.startAt) {
    const at = raw.search(spec.startAt);
    if (at >= 0) raw = raw.slice(at);
  }
  if (spec.dropBlocks) raw = dropLineBlocks(raw.replace(/\r\n/g, "\n"), spec.dropBlocks);
  if (spec.endAt) {
    const cut = raw.search(spec.endAt);
    if (cut >= 0) raw = raw.slice(0, cut);
  }
  raw = cutTrailingRetractations(raw);

  if (spec.chunk === "section") {
    const passages = sectionHeadings(
      ruleSections(raw)
        .map((sec) => ({ heading: sec.heading, ...parasAndNotesFromBlock(sec.body) }))
        .filter((sec) => sec.paras.length > 0),
      spec.title
    )
      .map((sec, i) => ({
        work: spec.id,
        chapter: i + 1,
        heading: sec.heading,
        versions: { schaff: sec.paras },
        footnotes: sec.footnotes
      }));
    if (passages.length) return { work: workFromSpec(spec, passages), passages };
  }

  let mode: ChunkMode | "blob" = spec.chunk === "auto" || spec.chunk === "section" ? detectChunk(raw) : spec.chunk;

  // Soft-cap ultra-dense chapter scans (e.g. verse/psalm dumps) for MVP memory.
  if (mode !== "blob" && mode !== "book") {
    const previewMarks = findMarks(raw, spec.unitRe ?? unitRegex(mode));
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

  const unitRe = spec.unitRe ?? unitRegex(mode);
  // A heading repeated with the same label (e.g. a per-book contents list before the real book) keeps the later one.
  const marks = findMarks(raw, unitRe).filter((m, i, all) => !(spec.unitRe && !spec.keepRepeatedLabels && all[i + 1] && all[i + 1].label === m.label));
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

  // "Book II. Chap. 45," heads a Retractations extract, not a book of this work.
  const bookMarks = mode === "chapter" ? findMarks(raw, BOOK_RE).filter((b) => !/^\s*Book\s+\w+\.\s*Chap\./i.test(raw.slice(b.index, b.index + 40))) : [];
  const titleList = spec.titleListAt ? titleListFrom(raw, spec.titleListAt) : null;
  const groupMarks = spec.groupRe ? findMarks(raw, spec.groupRe) : [];
  let group = -1;

  const passages: Passage[] = [];
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i].end;
    const stop = i + 1 < marks.length ? marks[i + 1].index : raw.length;
    const block = raw.slice(start, stop);
    // A unit that another work already holds whole (see dropUnitLabels) is left out; its text goes with it.
    if (spec.dropUnitLabels?.includes(cleanUnitLabel(marks[i].label))) continue;
    const { paras, footnotes } = parasAndNotesFromBlock(block);
    let heading = spec.unitTitles?.[i] ?? (spec.keepUnitLabel ? cleanUnitLabel(marks[i].label) : unitLabel(mode, marks[i].label));
    // Collections of several works (Chrysostom's volumes): numbering restarts at I for each work.
    let groupLabel = "";
    if (spec.unitGroups) {
      if (i === 0 || /^(?:I|1)$/i.test(marks[i].label.trim())) group++;
      groupLabel = spec.unitGroups[group] ?? "";
    } else if (groupMarks.length) {
      const g = groupMarks.filter((m) => m.index <= marks[i].index).pop();
      groupLabel = g ? cleanUnitLabel(g.label) : "";
    }
    if (mode === "chapter" && spec.unitTitles?.[i] == null) {
    if (spec.bookSections) {
      const book = marks.slice(0, i + 1).filter((m) => m.label.toUpperCase() === "I").length;
      const g = new RegExp(unitRe.source, unitRe.flags.replace("g", "")).exec(raw.slice(marks[i].index));
      const title = (g?.[2] ?? g?.[3] ?? "").replace(/\s*\[\d+\]\s*/g, " ").replace(/\s+/g, " ").trim().replace(/\.$/, "");
      passages.push({
        work: spec.id,
        chapter: i + 1,
        heading: "Book " + toRoman(book) + (marks[i].label ? " · Sec. " + romanToInt(marks[i].label) + (title ? " — " + title : "") : " · " + title),
        versions: { schaff: paras.length ? paras : [spec.title] },
        footnotes
      });
      continue;
    }
      let bookLabel = "";
      // A heading taken whole from the text needs no "Book N ·" (council volumes cite "Book XLIV." in notes).
      for (let b = spec.keepUnitLabel ? -1 : bookMarks.length - 1; b >= 0; b--) {
        if (bookMarks[b].index <= marks[i].index) {
          bookLabel = romanOrNum(bookMarks[b].label);
          break;
        }
      }
      const listed = titleList?.get(romanToInt(marks[i].label) || Number(marks[i].label));
      // A unit label taken from the text (keepUnitLabel) already carries its title.
      const titleBit = spec.bareHeadings || (spec.keepUnitLabel && /--|—/.test(marks[i].label)) ? "" : listed ?? unitTitleFrom(block);
      heading = (bookLabel ? "Book " + bookLabel + " · " : "") + heading + (titleBit ? " — " + titleBit : "");
    }
    if (groupLabel) heading = groupLabel + " · " + heading;
    passages.push({
      work: spec.id,
      chapter: passages.length + 1,
      heading,
      versions: { schaff: paras.length ? paras : [stripEditorialSections(block).replace(/\s+/g, " ").trim() || spec.title] },
      footnotes
    });
  }

  if (spec.dropEmptyUnits) {
    const kept = passages.filter((p) => p.versions.schaff.join(" ").split(/\s+/).length >= 15);
    passages.length = 0;
    kept.forEach((p, k) => passages.push({ ...p, chapter: k + 1 }));
  }

  if (spec.expectUnits != null && passages.length !== spec.expectUnits) {
    throw new Error(
      spec.id + ": expected " + spec.expectUnits + " " + mode + " units, found " + passages.length
    );
  }

  if (spec.retractations) {
    const note = retractationsNote(spec, root);
    if (note) passages.push({ work: spec.id, chapter: passages.length + 1, ...note });
  }

  return { work: workFromSpec(spec, passages), passages };
}

/** Augustine's own later review of a treatise, printed by NPNF before it: 'Extract from Augustin's "Retractations,"'. */
const RETRACTATIONS_RE = /^[ \t]*Extract from Augustin's "Retractations,"[ \t]*$/m;

/**
 * NPNF prints each anti-Pelagian treatise's Retractations extract just before it, so the extract that ends
 * a file belongs to the next treatise (with that treatise's title line above it). Cut it off; the treatise
 * it describes shows it as its last unit (`retractations`).
 */
export function cutTrailingRetractations(raw: string): string {
  const re = new RegExp(RETRACTATIONS_RE.source, "gm");
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    if (m.index < 3000) continue;
    const before = raw.slice(0, m.index);
    // Back over the next treatise's title block ("a treatise on rebuke and grace.") to the rules above it.
    const title = before.match(/(?:\n[ \t]*_{10,}[ \t]*)+\n(?:[ \t]*\n|[^\n_]{1,160}\n){0,8}(?:[ \t]*_{10,}[ \t]*\n)?[ \t\n]*$/);
    return title ? before.slice(0, title.index) : before;
  }
  return raw;
}

/** The Retractations extract on this work ("Book II. Chap. 67"), from its own file or the one before it. */
function retractationsNote(spec: EnglishWorkSpec, root: string): Pick<Passage, "heading" | "versions" | "footnotes"> | null {
  const r = spec.retractations!;
  const file = join(root, r.path ?? spec.path);
  if (!existsSync(file)) return null;
  const raw = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const re = new RegExp(RETRACTATIONS_RE.source, "gm");
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    const head = raw.slice(m.index, m.index + 400);
    const chap = head.match(/Book\s+([IVX]+)\.\s*Chap\.\s*(\d+)/);
    if (!chap || chap[1] + "." + chap[2] !== r.chap) continue;
    // The note runs to the rule after its text; its footnote bodies follow up to the next rule.
    const body = raw.slice(m.index).replace(/^[\s\S]*?^[ \t]*-{6,}[ \t]*$/m, "");
    const parts = body.split(/^[ \t]*_{10,}[ \t]*$/m);
    const block = parts[0] + (parts[1] && /^\s*\[\d+\]/.test(parts[1]) ? "\n\n" + parts[1] : "");
    const { paras, footnotes } = parasAndNotesFromBlock(block);
    if (!paras.length) return null;
    return {
      heading: "Retractations, Book " + chap[1] + ", Chapter " + chap[2] + " (Augustine's later note on this work)",
      versions: { schaff: paras },
      footnotes
    };
  }
  return null;
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
