/** Static-page <title> and meta description rules (SEO desk spec, Oct 2026). */

import { COLLECTION_SHELVES, workMeta, type WorkMeta } from "../../server/workMeta";

export const TITLE_TARGET = 60;
export const TITLE_MAX = 60;
export const DESCRIPTION_MIN = 100;
/** Descriptions aim for 140–155 chars and never exceed 155; the build audit fails over 160. */
export const DESCRIPTION_TARGET = 140;
export const DESCRIPTION_MAX = 155;
export const DESCRIPTION_HARD_MAX = 160;

/** Short author names for titles ("Confessions by Augustine"). Keyed by catalog author name. */
const AUTHOR_SHORT: Record<string, string> = {
  "Augustine of Hippo": "Augustine",
  "Ambrose of Milan": "Ambrose",
  "Arnobius of Sicca": "Arnobius",
  "Athanasius of Alexandria": "Athanasius",
  "Basil the Great": "Basil",
  "John Cassian": "Cassian",
  "John Chrysostom": "Chrysostom",
  "Cyprian of Carthage": "Cyprian",
  "Dionysius of Alexandria": "Dionysius",
  "Ephraim the Syrian": "Ephraim",
  "Eusebius of Caesarea": "Eusebius",
  "Hilary of Poitiers": "Hilary",
  "Ignatius of Antioch": "Ignatius",
  "Irenaeus of Lyons": "Irenaeus",
  "Flavius Josephus": "Josephus",
  "Methodius of Olympus": "Methodius",
  "Papias of Hierapolis": "Papias",
  "Polycarp of Smyrna": "Polycarp",
  "Rufinus of Aquileia": "Rufinus",
  "Socrates Scholasticus": "Socrates",
  "Theodoret of Cyrrhus": "Theodoret",
  "Theodoret of Cyrus": "Theodoret",
  "Theophilus of Antioch": "Theophilus"
};

/**
 * Catalog "authors" that are really collections (anonymous or miscellaneous works, council acts) or
 * anonymous documents shelved under their own title. Their works get the plain title with no "by"
 * clause, in titles and descriptions. Matched by author id where the caller passes one, else by name.
 */
const NO_AUTHOR_IDS = new Set([...COLLECTION_SHELVES, "didache", "barnabas", "mathetes"]);
const NO_AUTHOR_NAMES = new Set([
  "Apostolic Fathers (misc.)",
  "Ecumenical Councils",
  "Didache",
  "Barnabas (Epistle)",
  "Mathetes (to Diognetus)"
]);

/** The shelf a work sits on: its catalog author, by name or as { id, name }. */
export type AuthorRef = string | { id: string; name: string };

function nameOf(author: AuthorRef): string {
  return typeof author === "string" ? author : author.name;
}

export function hasAuthorLine(author: AuthorRef): boolean {
  if (typeof author !== "string" && NO_AUTHOR_IDS.has(author.id)) return false;
  return !NO_AUTHOR_NAMES.has(nameOf(author));
}

export function authorShortName(author: AuthorRef): string {
  const name = nameOf(author);
  return AUTHOR_SHORT[name] ?? name;
}

/** The work's attribution entry, when the shelf Father did not (certainly) write it. */
function metaFor(workId: string | undefined): WorkMeta | null {
  if (!workId) return null;
  const m = workMeta(workId);
  return m.authorship || m.attribution ? m : null;
}

/** True when the title already names `who` ("Fragments of Caius", "Letter of Eusebius …"). */
function titleNames(workTitle: string, who: string): boolean {
  const key = who.replace(/^Pseudo-/, "").replace(/^the\s+/i, "").toLowerCase();
  return workTitle.toLowerCase().includes(key);
}

/** "Epistles of Cyprian", "Life of Flavius Josephus": the title already says whose it is. */
function titleOwns(workTitle: string, author: AuthorRef): boolean {
  const short = authorShortName(author);
  const first = short.split(" ")[0]!;
  const names = (first.length > 3 && first !== short ? [short, first] : [short]).map((n) =>
    n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  return new RegExp("\\bof\\s+(?:\\w+\\s+)?(?:" + names.join("|") + ")\\b", "i").test(workTitle);
}

/**
 * Author clauses for a title, best first; the last is the fallback when the title runs long.
 * An attributed work never gets "by <Father>": it names its real author, says "attributed to", or names no one.
 */
function byClauses(workTitle: string, author: AuthorRef, workId?: string): string[] {
  const meta = metaFor(workId);
  if (!meta) return [hasAuthorLine(author) && !titleOwns(workTitle, author) ? " by " + authorShortName(author) : ""];
  if (meta.by && !titleNames(workTitle, meta.by)) return [" by " + meta.by, ""];
  if (meta.authorship === "disputed" && !meta.by && hasAuthorLine(author)) {
    return [", attributed to " + authorShortName(author), ""];
  }
  return [""];
}

/**
 * Hand-written short titles (SEO desk, Oct 2026), keyed by the catalog work title.
 * One short form per work, used on its work page and every chapter title.
 * `chapter` is only set where the desk gave a separate, shorter chapter-title form.
 */
/**
 * `prose` is the form used inside a description sentence ("Read the … free online"): true for the
 * short form, or its own words where the short form reads badly in a sentence.
 */
const WORK_SHORT: Record<string, { short: string; chapter?: string; prose?: boolean | string }> = {
  "Encyclical Letter to Bishops Throughout the World": { short: "Encyclical Letter to the Bishops" },
  "On Luke X. 22 (In Illud: Omnia Mihi Tradita Sunt)": { short: "On Luke 10:22" },
  "Tome or Synodal Letter to the People of Antioch": { short: "Tome to the People of Antioch" },
  "Against the Epistle of Manichaeus Called Fundamental": {
    short: "Against the Fundamental Epistle of Manichaeus",
    chapter: "Against the Fundamental Epistle"
  },
  "Sermons on Selected Lessons of the New Testament": { short: "Sermons on New Testament Lessons" },
  "Against Those Who Calumniate Us as Saying Three Gods (Letter 189 to Eustathius)": { short: "Against the Charge of Three Gods" },
  "Letter to His Brother Peter on the Difference Between Ousia and Hypostasis (Letter 38)": {
    short: "Letter to Peter on Ousia and Hypostasis"
  },
  // The file holds only Letter 360 (on the Trinity and images), not the Julian correspondence.
  "Letters Between Emperor Julian and Basil (Letter 360)": { short: "Letter 360 on the Trinity and Images", prose: true },
  "Homily Against Publishing the Errors of the Brethren": { short: "Against Publishing the Errors of the Brethren" },
  "Homily on the Paralytic Let Down Through the Roof": { short: "On the Paralytic Let Down Through the Roof" },
  "Homily on the Passage 'Father if it be possible'": { short: "On 'Father, If It Be Possible'" },
  "Homily on the Passage 'If Thine Enemy Hunger Feed Him'": { short: "On 'If Thine Enemy Hunger, Feed Him'" },
  "Treatise That No One Can Harm the Man Who Does Not Injure Himself": { short: "None Can Harm Him Who Harms Not Himself" },
  "Who is the Rich Man that Shall Be Saved": { short: "The Rich Man's Salvation" },
  "The Last Farewell in the Presence of the One Hundred and Fifty Bishops (Oration XLII)": { short: "The Last Farewell (Oration 42)" },
  "On the Holy Trinity, and of the Godhead of the Holy Spirit (To Eustathius)": { short: "On the Holy Trinity (To Eustathius)" },
  "Constitutions of the Holy Apostles": { short: "Apostolic Constitutions" },
  "Testaments of the Twelve Patriarchs": { short: "Twelve Patriarchs" },
  "The Apocalypse of the Virgin": { short: "Apocalypse of the Virgin" },
  "Four Discourses Against the Arians": { short: "Discourses Against the Arians" },
  "Against Two Letters of the Pelagians": { short: "Two Letters of the Pelagians" },
  "Homilies on the First Epistle of John": { short: "Homilies on 1 John" },
  "Of the Morals of the Catholic Church": { short: "Morals of the Catholic Church" },
  "On the Catechising of the Uninstructed": { short: "Catechising the Uninstructed" },
  "On the Grace of Christ and Original Sin": { short: "Grace of Christ and Original Sin" },
  "On the Merits and Forgiveness of Sins": { short: "Merits and Forgiveness of Sins" },
  "On the Perfection of Man's Righteousness": { short: "Perfection of Man's Righteousness" },
  "Oration of Constantine to the Assembly of the Saints": { short: "Constantine's Oration to the Saints" },
  "On the Predestination of the Saints": { short: "Predestination of the Saints" },
  "Address to Young Men on Reading Greek Literature (De legendis gentilium libris)": { short: "Address to Young Men" },
  "On the Incarnation of the Lord, Against Nestorius": { short: "Against Nestorius" },
  "An Exhortation to Theodore After His Fall": { short: "Exhortation to Theodore" },
  "Homilies on First and Second Corinthians": { short: "Homilies on 1 and 2 Corinthians" },
  "Homilies on Galatians to Philemon": { short: "Homilies on Galatians–Philemon" },
  "Three Homilies Concerning the Power of Demons": { short: "On the Power of Demons" },
  "Exhortation to the Heathen": { short: "Protrepticus" },
  "Fifth Ecumenical Council - Constantinople II (553)": { short: "Constantinople II (553)", prose: "Second Council of Constantinople (553)" },
  "First Ecumenical Council - Nicaea I (325)": { short: "First Council of Nicaea" },
  "Fourth Ecumenical Council - Chalcedon (451)": { short: "Council of Chalcedon" },
  "Second Ecumenical Council - Constantinople I (381)": { short: "Constantinople I (381)", prose: "First Council of Constantinople (381)" },
  "Seventh Ecumenical Council - Nicaea II (787)": { short: "Second Council of Nicaea" },
  "Third Ecumenical Council - Ephesus (431)": { short: "Council of Ephesus" },
  "Three Books of Testimonies Against the Jews": { short: "Testimonies Against the Jews" },
  "Funeral Oration on the Great St. Basil (Oration XLIII)": { short: "Funeral Oration on Basil" },
  "Answer to Eunomius' Second Book": { short: "Reply to Eunomius, Book II" },
  "On the Soul and the Resurrection": { short: "Soul and Resurrection" },
  "Metaphrase of Ecclesiastes": { short: "On Ecclesiastes" },
  "Exposition of the Orthodox Faith": { short: "On the Orthodox Faith" },
  "Hortatory Address to the Greeks": { short: "Exhortation to the Greeks" },
  "Of the Manner in Which the Persecutors Died": { short: "Deaths of the Persecutors" },
  // Not on the desk's list, but still over TITLE_MAX on chapter pages without a hand-written form.
  "On the Councils of Ariminum and Seleucia (De Synodis)": { short: "Councils of Ariminum and Seleucia" },
  "In Defence of His Flight to Pontus (Oration II)": { short: "On His Flight to Pontus" },
  "Discourse on the End of the World and Antichrist": { short: "End of the World and Antichrist" },
  "Against Eunomius (Books I-XII)": { short: "Against Eunomius" },
  "Discourse to the Greeks Concerning Hades": { short: "Discourse on Hades" },
  // 2 Clement; the bare catalog title "The Homily" read as just "Homily".
  "The Homily": { short: "Second Clement (An Ancient Homily)", chapter: "Second Clement", prose: "homily known as Second Clement" }
};

/** Catalog titles that have a hand-written short form (for audits and tests). */
export const SHORT_TITLE_KEYS: readonly string[] = Object.keys(WORK_SHORT);

/**
 * Lookup key for WORK_SHORT: the raw catalog title with whitespace collapsed only. clean() is not
 * used here because it strips "(553)"-style numbers, which broke the council lookups.
 */
export function shortTitleKey(title: string): string {
  return String(title).replace(/\s+/g, " ").trim();
}

/** The hand-written short form for a catalog title, if the desk gave one. */
export function handShortTitle(title: string): string | undefined {
  return WORK_SHORT[shortTitleKey(title)]?.short;
}

/** Possessive for descriptions: "Augustine's", "the Apostles'". */
export function possessive(name: string): string {
  return /s$/.test(name) ? name + "'" : name + "'s";
}

/** Strip markup, footnote markers, pilcrows and control characters; collapse whitespace. */
function clean(text: string): string {
  return text
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\[\d+\]|\(\d+\)(?=\s|$)/g, "")
    .replace(/[¶§†‡*_^~|<>{}\\]/g, " ")
    .replace(/[\u00b9\u00b2\u00b3\u2070-\u2079]+/g, "")
    // Schaff's "--" is an em dash.
    .replace(/\s*-{2,3}\s*/g, "—")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** Opening-text cleanup on top of clean(): drop bracketed editorial text and leading verse/section numbers. */
function cleanProse(text: string, keepBrackets = false): string {
  let t = clean(text);
  t = keepBrackets ? t.replace(/[\[\]]/g, "") : t.replace(/\s*\[[^\]]*\]/g, "");
  // Editorial lead-ins such as Cyprian's "Argument.—" (from "Argument.--").
  t = t.replace(/^[\s,.;:—–-]+/, "");
  t = t.replace(/^\s*(?:Argument|Argt|Summary|Analysis)(?:\s+[IVXL]+)?(?:\.\s*[—:]?|\s*[—:])\s*/, "");
  // Footnote digits glued to a word ("dihelthen6").
  t = t.replace(/([a-z])\d{1,3}(?=[\s,.;:!?]|$)/g, "$1");
  // Dialogue paragraphs that open with a detached quote mark ('" These philosophers').
  t = t.replace(/^(["“'‘])\s+/, "$1");
  // Verse-numbered text ("1 And when the sabbath was past ... 2 And very early"): drop the verse numbers.
  if (/^\d{1,3}\s/.test(t)) t = t.replace(/(^|\s)\d{1,3}(?=\s+[A-Z"'“‘])/g, "$1");
  return clean(t)
    .replace(/^(?:\d+\.|[ivxlc]+\.)\s+/i, "")
    .replace(/^[\s,.;:—–-]+/, "")
    .trim();
}

/** Cut at a word boundary to at most `max` chars; no ellipsis, no trailing punctuation. */
export function cutAtWord(text: string, max: number): string {
  const s = clean(text);
  if (s.length <= max) return s.replace(/[\s,;:—–-]+$/, "");
  const cut = s.slice(0, max + 1);
  const space = cut.lastIndexOf(" ");
  return (space > 0 ? cut.slice(0, space) : "").replace(/[\s,;:.—–(-]+$/, "");
}

/** The one short form of a work title: hand-written where the desk gave one, else the title without a leading "The". */
export function workShortTitle(workTitle: string): string {
  const t = clean(workTitle);
  const hand = WORK_SHORT[shortTitleKey(workTitle)];
  if (hand) return hand.short;
  let short = t.replace(/^The\s+/, "");
  // No hand-written form: drop a trailing parenthetical (e.g. a Latin title) when the longest
  // chapter title would run over TITLE_MAX. Never cut inside the title itself.
  if (CHAPTER_WORST.length + short.length + LONGEST_BY > TITLE_MAX) short = short.replace(/\s*\([^)]*\)$/, "").trim();
  return short;
}

/** Worst-case chapter-title prefix and author clause used to pick a title's one short form. */
const CHAPTER_WORST = "Chapter 999 - ";
const LONGEST_BY = " by Gregory Nazianzen".length;

function chapterShortTitle(workTitle: string): string {
  const hand = WORK_SHORT[shortTitleKey(workTitle)];
  return hand?.chapter ?? workShortTitle(workTitle);
}

function withBy(head: string, workTitle: string, author: AuthorRef, workId?: string): string {
  const clauses = byClauses(workTitle, author, workId);
  return head + (clauses.find((c) => head.length + c.length <= TITLE_MAX) ?? clauses[clauses.length - 1]!);
}

export function workSeoTitle(workTitle: string, author: AuthorRef, workId?: string): string {
  return withBy(workShortTitle(workTitle), workTitle, author, workId);
}

export function chapterSeoTitle(n: number, workTitle: string, author: AuthorRef, workId?: string): string {
  return withBy("Chapter " + n + " - " + chapterShortTitle(workTitle), workTitle, author, workId);
}

/**
 * "Augustine's Confessions"; for anonymous works and collections "the Gospel of Peter"; for attributed
 * works "the Life and Passion of Cyprian by Pontius the Deacon" or "the Mystagogical Lectures attributed to …".
 */
function workInProse(workTitle: string, author: AuthorRef, short = false, workId?: string): string {
  // Council titles ("First Ecumenical Council - Nicaea I (325)") read badly in a sentence: use the short form.
  const hand = WORK_SHORT[shortTitleKey(workTitle)];
  const t =
    typeof hand?.prose === "string"
      ? hand.prose
      : short || hand?.prose || / - /.test(workTitle)
        ? workShortTitle(workTitle)
        : clean(workTitle);
  // "Tertullian's Treatise on the Soul", not "Tertullian's A Treatise on the Soul".
  const bare = t.replace(/^(?:The|An?)\s+/, "");
  // "Read Against All Heresies", not "Read the Against All Heresies".
  const the = /^(?:On|Of|Against|To|Concerning|Ad|De|In|Letters? \d+)\b/.test(bare) ? "" : "the ";
  const meta = metaFor(workId);
  if (meta) {
    if (meta.by && !titleNames(workTitle, meta.by)) return the + bare + " by " + meta.by;
    if (meta.authorship === "disputed" && !meta.by && hasAuthorLine(author)) {
      return the + bare + " attributed to " + authorShortName(author);
    }
    return the + bare;
  }
  // Council acts are not a Father's own work: "the Seventh Council of Carthage", not "Cyprian's …".
  if (!hasAuthorLine(author) || titleOwns(workTitle, author) || /\bCouncil\b/.test(bare)) return the + bare;
  return possessive(authorShortName(author)) + " " + bare;
}

const JUNK_START =
  /^(?:translated|translation|edited|introduction|introductory|note\b|notes\b|preface|prolegomena|footnotes?\b|sources?\b|from the retractations|the following is|p\.\s*\d|pp?\.\s|cf\.|see\s+(?:note|also|above|below|vol|pp?\.|chap|c\.|cap|letter|book|introduction|the note)\b|chap\.|c\.\s|vol\.|ibid|and note|addressed to|(?:chapter|book|letter|homily|sermon|lecture|oration|epistle)\s+[ivxlcdm\d]+\b)/i;
const JUNK_ANY =
  /translated by|translated,? with|with introduction|\bM\.\s?A\.,|\/ccel\/|\.html\b|prebendary|\bvol\.\s*[ivx]+\b|\bp\.\s*\d+|\bpp\.\s*\d|\bcap\.\s*\d|\bmss\b|the translator|\bed\.\s|(?:--|—)R\.\]?/i;

/** True for a paragraph that reads as prose: not a credit, note, heading echo, or OCR noise. */
function isProse(p: string, avoid: string[][]): boolean {
  if (p.length < 60) return false;
  if (!/^["'“‘(]?[A-Z]/.test(p)) return false;
  // Only the part that can reach a description is checked for credits and notes.
  if (JUNK_START.test(p) || JUNK_ANY.test(p.slice(0, 220))) return false;
  const letters = p.replace(/[^A-Za-z]/g, "");
  if (letters.length < p.length * 0.7) return false;
  const caps = p.replace(/[^A-Z]/g, "").length;
  if (caps > letters.length * 0.3) return false;
  // OCR case noise like "fIVE" or "saME".
  if (/\b[a-z]+[A-Z]{2,}/.test(p)) return false;
  // Digits glued to words that survive cleanup are OCR debris.
  if (/[a-z]\d|\d[a-z]{2,}/.test(p.replace(/\b\d+(?:st|nd|rd|th)\b/g, ""))) return false;
  if (opensWith(p, avoid)) return false;
  return true;
}

/** Lower-case words for prefix comparison: letters only, parentheticals and a leading "the"/"a" dropped. */
function words(text: string): string[] {
  return text
    .replace(/\([^)]*\)/g, " ")
    .toLowerCase()
    .replace(/\bst\b\.?|\bs\.(?=\s)/g, "saint")
    .replace(/[^a-z ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((w, i) => !(i === 0 && (w === "the" || w === "a" || w === "an")));
}

/** True when `p` opens by repeating one of the `avoid` titles (its first four words, or all of a shorter one). */
function opensWith(p: string, avoid: string[][]): boolean {
  const pw = words(p);
  return avoid.some((a) => {
    const k = Math.min(4, a.length);
    if (k === 0 || (k === 1 && pw.length > 3)) return false;
    return a.slice(0, k).every((w, i) => pw[i] === w);
  });
}

/** Credits and editor sign-offs; the fallback tolerates page references but never these. */
const JUNK_CREDIT = /translated by|translated,? with|with introduction|\bM\.\s?A\.,|\/ccel\/|\.html\b|prebendary|the translator|(?:--|—)R\.\]?/i;

const TITLE_LIKE = /^(?:a\s+)?(?:selection|selections|extracts?)\s+from\b/i;

/** Weaker test for the fallback: short addresses or summaries ("To Maximus.") still count, junk does not. */
function isFallbackText(p: string, avoid: string[][]): boolean {
  if (p.length < 8 || !/^["'“‘(]?[A-Z]/.test(p)) return false;
  if (JUNK_START.test(p) || JUNK_CREDIT.test(p.slice(0, 220)) || TITLE_LIKE.test(p)) return false;
  const letters = p.replace(/[^A-Za-z]/g, "");
  if (letters.length < p.length * 0.6) return false;
  if (/\b[a-z]+[A-Z]{2,}/.test(p) || /[a-z]\d|\d[a-z]{2,}/.test(p)) return false;
  return !opensWith(p, avoid);
}

/**
 * Opening text for a description: the first real prose paragraph, with notes, translator credits,
 * footnote markers, pilcrows, bracketed text and OCR junk skipped. Empty when nothing qualifies.
 * `avoid` lists strings (work title, heading) the opening must not just repeat.
 */
export function pickOpening(paras: string[], avoid: string[] = []): string {
  const av = avoid.map(words).filter((a) => a.length > 0);
  for (const raw of paras.slice(0, 60)) {
    const p = cleanProse(raw);
    if (isProse(p, av) && !TITLE_LIKE.test(p)) return p;
  }
  // No full prose paragraph: join the chapter's short real text (an address, a one-line summary,
  // verse lines), keeping the words inside editorial brackets but not the brackets.
  const bits: string[] = [];
  for (const raw of paras.slice(0, 12)) {
    const p = cleanProse(raw, true);
    if (!isFallbackText(p, av)) continue;
    bits.push(/[.!?;:,"”’)]$/.test(p) ? p : p + ".");
    if (bits.join(" ").length >= 100) break;
  }
  return bits.join(" ");
}

const NO_STOP = /\b(?:St|Mt|Dr|Mr|Mrs|cf|ch|chap|vol|ver|viz|i\.e|e\.g|p|pp|A\.D|B\.C|[A-Z])$/i;
const DANGLING =
  /[\s,;:—–-]+(?:and|or|nor|but|the|a|an|of|to|in|on|for|with|by|as|at|that|which|who|whom|from|his|her|its|their|our|my|your|is|was|be|so|not|than|this|these|those|into|unto|upon|St|Mt|O)$/i;

/**
 * Fit `text` into `room` characters. A whole sentence (or the whole text) ends with ".";
 * a mid-sentence cut ends at a word with "…" (never "." after a cut). `min` is the shortest acceptable lede.
 */
export function fitLede(text: string, room: number, min = 0): { lede: string; cut: boolean } {
  const s = text.trim();
  if (!s || room < 12) return { lede: "", cut: false };
  if (s.length <= room) return { lede: s.replace(/[\s.!?;:,—–-]+$/, ""), cut: false };
  // Prefer a whole sentence that still reaches the minimum length.
  const window = s.slice(0, room + 1);
  let best = -1;
  for (const m of window.matchAll(/[.!?](?=["'”’)]?\s)/g)) {
    const i = m.index!;
    if (i >= Math.max(min, 40) && i <= room && !NO_STOP.test(window.slice(0, i))) best = i;
  }
  if (best > 0) return { lede: window.slice(0, best), cut: false };
  // Otherwise cut at a word, leaving one character for the ellipsis.
  const body = s.slice(0, room);
  const space = s[room] === " " ? room : body.lastIndexOf(" ");
  let cut = (space > 0 ? body.slice(0, space) : body).replace(/[\s,;:.—–(-]+$/, "");
  for (let k = 0; k < 4 && DANGLING.test(cut); k++) {
    const next = cut.replace(DANGLING, "");
    if (next.length < min) break;
    cut = next;
  }
  cut = cut.replace(/[\s,;:.—–(-]+$/, "");
  // Drop an unmatched opening quote or bracket.
  const opens = (cut.match(/[“(]/g) || []).length - (cut.match(/[”)]/g) || []).length;
  if (opens > 0 && /^[“(]/.test(cut)) cut = cut.slice(1);
  return { lede: cut, cut: true };
}

function finish(lede: { lede: string; cut: boolean }): string {
  return lede.lede + (lede.cut ? "…" : ".");
}

/** Generic closers, longest first; the longest that fits is used to bring short descriptions up to target. */
const CHAPTER_TAILS = [
  " Free, full English text, with links to the previous and next chapter.",
  " Free, full English text with previous and next links.",
  " Free, full English text.",
  " Free, full text."
];

export function chapterSeoDescription(
  n: number,
  author: AuthorRef,
  workTitle: string,
  opening: string,
  workId?: string
): string {
  let head = "Read Chapter " + n + " of " + workInProse(workTitle, author, false, workId) + ": ";
  if (DESCRIPTION_MAX - head.length - 18 < 70) head = "Read Chapter " + n + " of " + workInProse(workTitle, author, true, workId) + ": ";
  const shortTail = CHAPTER_TAILS[CHAPTER_TAILS.length - 1]!;
  const room = DESCRIPTION_MAX - head.length - shortTail.length - 1;
  const min = DESCRIPTION_TARGET - head.length - shortTail.length - 1;
  let lede = fitLede(opening, room, min);
  if (!lede.lede) lede = fitLede("the complete chapter in English, in a clean reading layout", room);
  const body = head + finish(lede);
  for (const tail of CHAPTER_TAILS) {
    if (body.length + tail.length <= DESCRIPTION_MAX) return body + tail;
  }
  return body + shortTail;
}

export type UnitNoun = "books" | "chapters" | "homilies" | "letters" | "sermons" | "parts";

export function unitNoun(headings: string[]): UnitNoun {
  const counts: Record<string, number> = {};
  for (const h of headings) {
    const m = h.match(/^(Book|Homily|Letter|Sermon)\b/);
    const k = m ? m[1]! : "Chapter";
    counts[k] = (counts[k] || 0) + 1;
  }
  const [top, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? ["Chapter", 0];
  if (n < headings.length * 0.8) return "chapters";
  return ({ Book: "books", Homily: "homilies", Letter: "letters", Sermon: "sermons" } as Record<string, UnitNoun>)[top] ?? "chapters";
}

export function workSeoDescription(opts: {
  authorName: AuthorRef;
  workTitle: string;
  /** Catalog work id: an attributed work names its real author, not the shelf Father. */
  workId?: string;
  units: number;
  noun: UnitNoun;
  series?: string;
  opening?: string;
}): string {
  const build = (who: string, nav: boolean) =>
    opts.units > 1
      ? "Read " + who + " free online. Full text, all " + opts.units + " " + opts.noun + (nav ? ", with chapter-by-chapter navigation." : ".")
      : "Read " + who + " free online, the full text on one page.";
  let s = build(workInProse(opts.workTitle, opts.authorName, false, opts.workId), true);
  if (s.length > DESCRIPTION_MAX) s = build(workInProse(opts.workTitle, opts.authorName, true, opts.workId), true);
  if (s.length > DESCRIPTION_MAX) s = build(workInProse(opts.workTitle, opts.authorName, true, opts.workId), false);
  const fixed: string[] = [];
  if (opts.series) fixed.push("Public-domain " + opts.series + " translation.");
  fixed.push("English translation, public domain.", "Public-domain translation.", "Public domain.", "Clean, searchable reading layout.", "Clean reading layout.", "Searchable text.");
  // Single-page works: fill with the opening words. Multi-chapter works: a fixed closer first.
  if (opts.units > 1) {
    for (const e of fixed) {
      if (s.length >= DESCRIPTION_TARGET) break;
      if (/public.domain/i.test(s) && /public.domain/i.test(e)) continue;
      if (s.length + 1 + e.length <= DESCRIPTION_MAX) s += " " + e;
    }
  }
  if (s.length < DESCRIPTION_TARGET && opts.opening) {
    const lead = " It opens: ";
    const room = DESCRIPTION_MAX - s.length - lead.length - 1;
    const lede = fitLede(opts.opening, room, DESCRIPTION_TARGET - s.length - lead.length - 1);
    if (lede.lede.length > 20) s += lead + finish(lede);
  }
  for (const e of fixed) {
    if (s.length >= DESCRIPTION_TARGET) break;
    if (/public.domain/i.test(s) && /public.domain/i.test(e)) continue;
    if (s.length + 1 + e.length <= DESCRIPTION_MAX) s += " " + e;
  }
  return s;
}
